/**
 * db/visits.js
 * کوئری‌های جدول visits
 * نسخه ۳.۰ — آمار بازدید WebApp + نمودار + تحلیل
 */

const db = require('./index');
const config = require('../config');

// ============================================================
//  Prepared Statements
// ============================================================

const statements = {
  // ---- ساخت ----
  create: db.prepare(`
    INSERT INTO visits (user_id, ip_hash, user_agent, page, platform)
    VALUES (@user_id, @ip_hash, @user_agent, @page, @platform)
  `),

  // ---- خواندن ----
  getById: db.prepare('SELECT * FROM visits WHERE id = ?'),

  getForUser: db.prepare(`
    SELECT * FROM visits
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT ?
  `),

  getRecent: db.prepare(`
    SELECT * FROM visits
    ORDER BY created_at DESC
    LIMIT ?
  `),

  // ---- شمارش ----
  countTotal: db.prepare('SELECT COUNT(*) as count FROM visits'),

  countToday: db.prepare(`
    SELECT COUNT(*) as count FROM visits
    WHERE created_at >= strftime('%s', 'now', 'start of day')
  `),

  countThisWeek: db.prepare(`
    SELECT COUNT(*) as count FROM visits
    WHERE created_at >= strftime('%s', 'now', '-7 days')
  `),

  countThisMonth: db.prepare(`
    SELECT COUNT(*) as count FROM visits
    WHERE created_at >= strftime('%s', 'now', '-30 days')
  `),

  // ---- کاربران یکتا ----
  uniqueUsersTotal: db.prepare(`
    SELECT COUNT(DISTINCT user_id) as count FROM visits
  `),

  uniqueUsersToday: db.prepare(`
    SELECT COUNT(DISTINCT user_id) as count FROM visits
    WHERE created_at >= strftime('%s', 'now', 'start of day')
  `),

  uniqueUsersThisWeek: db.prepare(`
    SELECT COUNT(DISTINCT user_id) as count FROM visits
    WHERE created_at >= strftime('%s', 'now', '-7 days')
  `),

  uniqueUsersThisMonth: db.prepare(`
    SELECT COUNT(DISTINCT user_id) as count FROM visits
    WHERE created_at >= strftime('%s', 'now', '-30 days')
  `),

  // ---- به تفکیک صفحه ----
  byPage: db.prepare(`
    SELECT page, COUNT(*) as count
    FROM visits
    WHERE created_at >= ?
    GROUP BY page
    ORDER BY count DESC
  `),

  // ---- به تفکیک پلتفرم ----
  byPlatform: db.prepare(`
    SELECT platform, COUNT(*) as count
    FROM visits
    WHERE created_at >= ?
    GROUP BY platform
    ORDER BY count DESC
  `),

  // ---- نمودار روزانه ----
  byDay: db.prepare(`
    SELECT 
      date(created_at, 'unixepoch') as date,
      COUNT(*) as count,
      COUNT(DISTINCT user_id) as unique_users
    FROM visits
    WHERE created_at >= ?
    GROUP BY date(created_at, 'unixepoch')
    ORDER BY date ASC
  `),

  // ---- نمودار ساعتی (بهترین ساعت‌ها) ----
  byHour: db.prepare(`
    SELECT 
      strftime('%H', created_at, 'unixepoch') as hour,
      COUNT(*) as count
    FROM visits
    WHERE created_at >= ?
    GROUP BY hour
    ORDER BY count DESC
  `),

  // ---- حذف ----
  deleteOld: db.prepare('DELETE FROM visits WHERE created_at < ?'),
  deleteForUser: db.prepare('DELETE FROM visits WHERE user_id = ?'),
};

// ============================================================
//  ساخت
// ============================================================

function create(data) {
  const result = statements.create.run({
    user_id: data.user_id,
    ip_hash: data.ip_hash || null,
    user_agent: data.user_agent || null,
    page: data.page || 'unknown',
    platform: data.platform || 'web',
  });

  return statements.getById.get(result.lastInsertRowid);
}

// ============================================================
//  خواندن
// ============================================================

function getById(id) {
  return statements.getById.get(id);
}

function getForUser(userId, limit = 20) {
  return statements.getForUser.all(userId, limit);
}

function getRecent(limit = 50) {
  return statements.getRecent.all(limit);
}

// ============================================================
//  شمارش
// ============================================================

function getTotalCount() {
  return statements.countTotal.get().count || 0;
}

function getTodayCount() {
  return statements.countToday.get().count || 0;
}

function getWeekCount() {
  return statements.countThisWeek.get().count || 0;
}

function getMonthCount() {
  return statements.countThisMonth.get().count || 0;
}

// ============================================================
//  کاربران یکتا
// ============================================================

function getUniqueUsersTotal() {
  return statements.uniqueUsersTotal.get().count || 0;
}

function getUniqueUsersToday() {
  return statements.uniqueUsersToday.get().count || 0;
}

function getUniqueUsersThisWeek() {
  return statements.uniqueUsersThisWeek.get().count || 0;
}

function getUniqueUsersThisMonth() {
  return statements.uniqueUsersThisMonth.get().count || 0;
}

// ============================================================
//  تفکیک
// ============================================================

function getByPage(days = 7) {
  const now = Math.floor(Date.now() / 1000);
  const from = now - days * 24 * 60 * 60;
  return statements.byPage.all(from);
}

function getByPlatform(days = 7) {
  const now = Math.floor(Date.now() / 1000);
  const from = now - days * 24 * 60 * 60;
  return statements.byPlatform.all(from);
}

// ============================================================
//  نمودار بازدیدها
// ============================================================

function getVisitsChart(days = 7) {
  const now = Math.floor(Date.now() / 1000);
  const from = now - days * 24 * 60 * 60;

  const rows = statements.byDay.all(from);

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
      value: found ? found.count : 0,
      unique_users: found ? found.unique_users : 0,
    });
  }

  return result;
}

// ============================================================
//  بهترین ساعت‌ها
// ============================================================

function getBestHours(days = 30, limit = 5) {
  const now = Math.floor(Date.now() / 1000);
  const from = now - days * 24 * 60 * 60;

  const rows = statements.byHour.all(from);

  return rows.slice(0, limit).map((r) => ({
    hour: parseInt(r.hour, 10),
    label: `${String(r.hour).padStart(2, '0')}:00`,
    count: r.count,
  }));
}

// ============================================================
//  آمار کامل
// ============================================================

function getFullStats() {
  return {
    total: getTotalCount(),
    today: getTodayCount(),
    week: getWeekCount(),
    month: getMonthCount(),
    unique_total: getUniqueUsersTotal(),
    unique_today: getUniqueUsersToday(),
    unique_week: getUniqueUsersThisWeek(),
    unique_month: getUniqueUsersThisMonth(),
  };
}

// ============================================================
//  تحلیل
// ============================================================

/**
 * میانگین بازدید روزانه
 */
function getAverageDailyVisits(days = 30) {
  const chart = getVisitsChart(days);
  if (chart.length === 0) return 0;

  const total = chart.reduce((sum, d) => sum + d.value, 0);
  return Math.round(total / chart.length);
}

/**
 * نرخ رشد نسبت به بازه قبل
 */
function getGrowthRate(days = 7) {
  const now = Math.floor(Date.now() / 1000);

  const currentFrom = now - days * 24 * 60 * 60;
  const previousFrom = now - 2 * days * 24 * 60 * 60;

  const current = db
    .prepare('SELECT COUNT(*) as count FROM visits WHERE created_at >= ?')
    .get(currentFrom).count;

  const previous = db
    .prepare(
      'SELECT COUNT(*) as count FROM visits WHERE created_at >= ? AND created_at < ?'
    )
    .get(previousFrom, currentFrom).count;

  if (previous === 0) return current > 0 ? 100 : 0;

  const growth = ((current - previous) / previous) * 100;
  return Math.round(growth);
}

// ============================================================
//  حذف
// ============================================================

function deleteOld(days = 90) {
  const now = Math.floor(Date.now() / 1000);
  const threshold = now - days * 24 * 60 * 60;
  return statements.deleteOld.run(threshold);
}

function deleteForUser(userId) {
  return statements.deleteForUser.run(userId);
}

// ============================================================
//  خروجی
// ============================================================

module.exports = {
  create,
  getById,
  getForUser,
  getRecent,
  getTotalCount,
  getTodayCount,
  getWeekCount,
  getMonthCount,
  getUniqueUsersTotal,
  getUniqueUsersToday,
  getUniqueUsersThisWeek,
  getUniqueUsersThisMonth,
  getByPage,
  getByPlatform,
  getVisitsChart,
  getBestHours,
  getFullStats,
  getAverageDailyVisits,
  getGrowthRate,
  deleteOld,
  deleteForUser,
};