/**
 * services/payment.js
 * منطق کاری پرداخت‌ها
 * نسخه ۳.۰ — با ۴ بسته (weekly, monthly, yearly, reply)
 */

const db = require('../db');
const dbPayments = require('../db/payments');
const dbUsers = require('../db/users');
const config = require('../config');

// ============================================================
//  ایجاد پرداخت
// ============================================================

function createPending(data) {
  // ===== اعتبارسنجی =====
  if (!data.user_id) throw new Error('USER_REQUIRED');
  if (!data.telegram_payment_id) throw new Error('PAYMENT_ID_REQUIRED');
  if (!data.type) throw new Error('PAYMENT_TYPE_REQUIRED');
  if (!data.amount || data.amount <= 0) throw new Error('INVALID_AMOUNT');

  // ===== چک نوع پرداخت =====
  const validTypes = [
    'package_weekly',
    'package_monthly',
    'package_yearly',
    'package_reply',
  ];

  if (!validTypes.includes(data.type)) {
    throw new Error('INVALID_PAYMENT_TYPE');
  }

  // ===== چک قیمت =====
  const expectedPrice = getExpectedPrice(data.type);
  if (data.amount !== expectedPrice) {
    throw new Error('INVALID_AMOUNT');
  }

  return dbPayments.createPending(data);
}

// ============================================================
//  تکمیل پرداخت
// ============================================================

function markCompleted(data) {
  const payment = dbPayments.markCompleted(data);

  // آپدیت آمار کاربر
  if (data.user_id) {
    dbUsers.addStarsSpent(data.user_id, data.amount);
  }

  return payment;
}

function markFailed(telegramPaymentId) {
  return dbPayments.markFailed(telegramPaymentId);
}

function markRefunded(telegramPaymentId) {
  return dbPayments.markRefunded(telegramPaymentId);
}

// ============================================================
//  قیمت‌ها
// ============================================================

/**
 * قیمت مورد انتظار برای یه نوع پرداخت
 */
function getExpectedPrice(type) {
  // type = package_weekly → weekly
  const packageId = type.replace('package_', '');
  const pkg = config.packages[packageId];
  return pkg ? pkg.price : 0;
}

/**
 * قیمت یه بسته
 */
function getPackagePrice(packageId) {
  const pkg = config.packages[packageId];
  return pkg ? pkg.price : 0;
}

/**
 * مدت یه بسته
 */
function getPackageDuration(packageId) {
  const pkg = config.packages[packageId];
  return pkg ? pkg.days : 0;
}

// ============================================================
//  خواندن
// ============================================================

function getById(id) {
  return dbPayments.getById(id);
}

function getByTelegramPaymentId(telegramPaymentId) {
  return dbPayments.getByTelegramPaymentId(telegramPaymentId);
}

function getForUser(userId, limit = 20) {
  return dbPayments.getForUser(userId, limit);
}

function getCompletedForUser(userId) {
  return dbPayments.getCompletedForUser(userId);
}

function getPendingByUserId(userId) {
  return dbPayments.getPendingByUserId(userId);
}

// ============================================================
//  آمار
// ============================================================

function getTotalRevenue() {
  return dbPayments.getTotalRevenue();
}

function getTotalCount() {
  return dbPayments.getTotalCount();
}

function getRevenueByType() {
  return dbPayments.getRevenueByType();
}

function getTodayRevenue() {
  return dbPayments.getTodayRevenue();
}

function getWeekRevenue() {
  return dbPayments.getWeekRevenue();
}

function getMonthRevenue() {
  return dbPayments.getMonthRevenue();
}

function getUserTotalSpent(userId) {
  return dbPayments.getUserTotalSpent(userId);
}

function getRecentPayments(limit = 10) {
  return dbPayments.getRecentPayments(limit);
}

function getRevenueChart(days = 7) {
  return dbPayments.getRevenueChart(days);
}

// ============================================================
//  ساخت payload
// ============================================================

/**
 * ساخت payload برای فاکتور
 */
function buildPayload(type, userId, extra = null) {
  if (extra) {
    return `${type}:${userId}:${extra}`;
  }
  return `${type}:${userId}`;
}

/**
 * پارس payload
 */
function parsePayload(payload) {
  if (!payload || typeof payload !== 'string') return null;

  const parts = payload.split(':');
  if (parts.length < 2) return null;

  return {
    type: parts[0],
    userId: parseInt(parts[1], 10),
    extra: parts[2] || null,
  };
}

// ============================================================
//  ساخت فاکتور
// ============================================================

/**
 * ساخت فاکتور Stars
 */
function buildInvoice(packageId, userId, lang = 'fa') {
  const pkg = config.packages[packageId];
  if (!pkg) throw new Error('INVALID_PACKAGE');

  const type = `package_${packageId}`;
  const payload = `${type}:${userId}`;

  // اسم بسته به زبان
  const pkgName = pkg.name[lang] || pkg.name.fa;

  return {
    title: pkgName,
    description: `${pkg.days} روز`,
    payload,
    currency: 'XTR',
    prices: [{ label: pkgName, amount: pkg.price }],
  };
}

// ============================================================
//  آمار کامل
// ============================================================

/**
 * آمار خریدهای یه کاربر
 */
function getUserPurchaseStats(userId) {
  const payments = dbPayments.getCompletedForUser(userId);

  const byType = {};
  let total = 0;

  payments.forEach((p) => {
    if (!byType[p.type]) {
      byType[p.type] = { count: 0, total: 0 };
    }
    byType[p.type].count++;
    byType[p.type].total += p.amount;
    total += p.amount;
  });

  return {
    total_payments: payments.length,
    total_spent: total,
    by_type: byType,
    last_payment_at: payments[0]?.completed_at || null,
  };
}

/**
 * آمار کامل درآمد (برای ادمین)
 */
function getFullRevenueStats() {
  return {
    total: getTotalRevenue(),
    today: getTodayRevenue(),
    week: getWeekRevenue(),
    month: getMonthRevenue(),
    currency: 'XTR',
    by_type: getRevenueByType(),
    total_count: getTotalCount(),
  };
}

// ============================================================
//  خروجی
// ============================================================

module.exports = {
  // ایجاد و تکمیل
  createPending,
  markCompleted,
  markFailed,
  markRefunded,

  // قیمت
  getExpectedPrice,
  getPackagePrice,
  getPackageDuration,

  // خواندن
  getById,
  getByTelegramPaymentId,
  getForUser,
  getCompletedForUser,
  getPendingByUserId,

  // آمار
  getTotalRevenue,
  getTotalCount,
  getRevenueByType,
  getTodayRevenue,
  getWeekRevenue,
  getMonthRevenue,
  getUserTotalSpent,
  getRecentPayments,
  getRevenueChart,

  // Payload
  buildPayload,
  parsePayload,

  // فاکتور
  buildInvoice,

  // آمار کامل
  getUserPurchaseStats,
  getFullRevenueStats,
};