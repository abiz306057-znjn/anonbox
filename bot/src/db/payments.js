/**
 * db/payments.js
 * کوئری‌های جدول payments
 * نسخه ۳.۰ — با ۴ بسته (weekly, monthly, yearly, reply)
 */

const db = require('./index');
const config = require('../config');

// ============================================================
//  Prepared Statements
// ============================================================

const statements = {
  // ---- ساخت ----
  createPending: db.prepare(`
    INSERT INTO payments (
      user_id, telegram_payment_id, type, amount, currency, payload, status
    ) VALUES (
      @user_id, @telegram_payment_id, @type, @amount, @currency, @payload, 'pending'
    )
  `),

  // ---- آپدیت ----
  markCompleted: db.prepare(`
    UPDATE payments
    SET status = 'completed',
        completed_at = strftime('%s', 'now')
    WHERE telegram_payment_id = ?
  `),

  markFailed: db.prepare(`
    UPDATE payments SET status = 'failed' WHERE telegram_payment_id = ?
  `),

  markRefunded: db.prepare(`
    UPDATE payments SET status = 'refunded' WHERE telegram_payment_id = ?
  `),

  // ---- خواندن ----
  getById: db.prepare('SELECT * FROM payments WHERE id = ?'),

  getByTelegramPaymentId: db.prepare(
    'SELECT * FROM payments WHERE telegram_payment_id = ?'
  ),

  getForUser: db.prepare(`
    SELECT * FROM payments
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT ?
  `),

  getCompletedForUser: db.prepare(`
    SELECT * FROM payments
    WHERE user_id = ? AND status = 'completed'
    ORDER BY completed_at DESC
  `),

  getPendingByUserId: db.prepare(`
    SELECT * FROM payments
    WHERE user_id = ? AND status = 'pending'
    ORDER BY created_at DESC
    LIMIT 1
  `),

  // ---- آمار ----
  totalRevenue: db.prepare(`
    SELECT COALESCE(SUM(amount), 0) AS total
    FROM payments
    WHERE status = 'completed'
  `),

  totalCount: db.prepare(`
    SELECT COUNT(*) AS count
    FROM payments
    WHERE status = 'completed'
  `),

  revenueByType: db.prepare(`
    SELECT type, COUNT(*) AS count, COALESCE(SUM(amount), 0) AS total
    FROM payments
    WHERE status = 'completed'
    GROUP BY type
  `),

  todayRevenue: db.prepare(`
    SELECT COALESCE(SUM(amount), 0) AS total
    FROM payments
    WHERE status = 'completed'
      AND completed_at >= strftime('%s', 'now', 'start of day')
  `),

  weekRevenue: db.prepare(`
    SELECT COALESCE(SUM(amount), 0) AS total
    FROM payments
    WHERE status = 'completed'
      AND completed_at >= strftime('%s', 'now', '-7 days')
  `),

  monthRevenue: db.prepare(`
    SELECT COALESCE(SUM(amount), 0) AS total
    FROM payments
    WHERE status = 'completed'
      AND completed_at >= strftime('%s', 'now', '-30 days')
  `),

  userTotalSpent: db.prepare(`
    SELECT COALESCE(SUM(amount), 0) AS total
    FROM payments
    WHERE user_id = ? AND status = 'completed'
  `),

  recentPayments: db.prepare(`
    SELECT * FROM payments
    WHERE status = 'completed'
    ORDER BY completed_at DESC
    LIMIT ?
  `),

  // ---- نمودار ----
  revenueByDay: db.prepare(`
    SELECT 
      date(completed_at, 'unixepoch') as date,
      COUNT(*) as count,
      COALESCE(SUM(amount), 0) as total
    FROM payments
    WHERE status = 'completed' AND completed_at >= ?
    GROUP BY date(completed_at, 'unixepoch')
    ORDER BY date ASC
  `),
};

// ============================================================
//  ساخت
// ============================================================

function createPending(data) {
  try {
    const result = statements.createPending.run({
      user_id: data.user_id,
      telegram_payment_id: data.telegram_payment_id,
      type: data.type,
      amount: data.amount,
      currency: data.currency || 'XTR',
      payload: data.payload || null,
    });

    return statements.getById.get(result.lastInsertRowid);
  } catch (error) {
    // اگه telegram_payment_id تکراری بود
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return statements.getByTelegramPaymentId.get(data.telegram_payment_id);
    }
    throw error;
  }
}

// ============================================================
//  تکمیل
// ============================================================

function markCompleted(data) {
  const existing = statements.getByTelegramPaymentId.get(
    data.telegram_payment_id
  );

  if (existing) {
    statements.markCompleted.run(data.telegram_payment_id);
    return statements.getByTelegramPaymentId.get(data.telegram_payment_id);
  }

  // اگه پیدا نشد، رکورد کامل بساز
  statements.createPending.run({
    user_id: data.user_id,
    telegram_payment_id: data.telegram_payment_id,
    type: data.type,
    amount: data.amount,
    currency: 'XTR',
    payload: null,
  });

  statements.markCompleted.run(data.telegram_payment_id);

  return statements.getByTelegramPaymentId.get(data.telegram_payment_id);
}

function markFailed(telegramPaymentId) {
  return statements.markFailed.run(telegramPaymentId);
}

function markRefunded(telegramPaymentId) {
  return statements.markRefunded.run(telegramPaymentId);
}

// ============================================================
//  خواندن
// ============================================================

function getById(id) {
  return statements.getById.get(id);
}

function getByTelegramPaymentId(telegramPaymentId) {
  return statements.getByTelegramPaymentId.get(telegramPaymentId);
}

function getForUser(userId, limit = 20) {
  return statements.getForUser.all(userId, limit);
}

function getCompletedForUser(userId) {
  return statements.getCompletedForUser.all(userId);
}

function getPendingByUserId(userId) {
  return statements.getPendingByUserId.get(userId);
}

// ============================================================
//  آمار
// ============================================================

function getTotalRevenue() {
  return statements.totalRevenue.get().total || 0;
}

function getTotalCount() {
  return statements.totalCount.get().count || 0;
}

function getRevenueByType() {
  return statements.revenueByType.all();
}

function getTodayRevenue() {
  return statements.todayRevenue.get().total || 0;
}

function getWeekRevenue() {
  return statements.weekRevenue.get().total || 0;
}

function getMonthRevenue() {
  return statements.monthRevenue.get().total || 0;
}

function getUserTotalSpent(userId) {
  return statements.userTotalSpent.get(userId).total || 0;
}

function getRecentPayments(limit = 10) {
  return statements.recentPayments.all(limit);
}

// ============================================================
//  نمودار
// ============================================================

function getRevenueChart(days = 7) {
  const now = Math.floor(Date.now() / 1000);
  const from = now - days * 24 * 60 * 60;

  const rows = statements.revenueByDay.all(from);

  const result = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date((now - i * 24 * 60 * 60) * 1000);
    const dateStr = date.toISOString().split('T')[0];
    const found = rows.find((r) => r.date === dateStr);

    result.push({
      date: dateStr,
      label: new Intl.DateTimeFormat('fa-IR', {
        month: 'short',
        day: 'numeric',
      }).format(date),
      value: found ? found.total : 0,
      count: found ? found.count : 0,
    });
  }

  return result;
}

// ============================================================
//  خروجی
// ============================================================

module.exports = {
  createPending,
  markCompleted,
  markFailed,
  markRefunded,
  getById,
  getByTelegramPaymentId,
  getForUser,
  getCompletedForUser,
  getPendingByUserId,
  getTotalRevenue,
  getTotalCount,
  getRevenueByType,
  getTodayRevenue,
  getWeekRevenue,
  getMonthRevenue,
  getUserTotalSpent,
  getRecentPayments,
  getRevenueChart,
};