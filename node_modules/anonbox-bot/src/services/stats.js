/**
 * services/stats.js
 * منطق کاری آمار
 * نسخه ۳.۰ — آمار کامل برای ادمین و کاربر
 *
 * شامل:
 *   - آمار کلی (overview)
 *   - کاربران آنلاین
 *   - آمار امروز/هفته/ماه
 *   - نمودارها (بازدید، کاربران، درآمد، پیام‌ها)
 *   - توزیع زبان/بسته
 *   - گزارش تبلیغاتی
 *   - رایگان روزانه
 *   - وضعیت بسته
 */

const db = require('../db');
const dbUsers = require('../db/users');
const dbMessages = require('../db/messages');
const dbPayments = require('../db/payments');
const dbVisits = require('../db/visits');
const dbPackages = require('../db/packages');
const config = require('../config');

// ============================================================
//  آمار کلی (ادمین)
// ============================================================

/**
 * آمار کلی سیستم
 */
function getOverview() {
  const userStats = dbUsers.getGlobalStats();
  const totalMessages = dbMessages.getTotalCount();
  const todayMessages = dbMessages.getTodayCount();
  const totalPayments = dbPayments.getTotalCount();
  const totalRevenue = dbPayments.getTotalRevenue();
  const pendingReports = dbMessages.getPendingReports(1000).length;
  const totalVisits = dbVisits.getTotalCount();

  return {
    // کاربران
    totalUsers: userStats.totalUsers || 0,
    activePackages: userStats.activePackages || 0,
    bannedUsers: userStats.bannedUsers || 0,
    newUsersToday: userStats.newUsersToday || 0,
    activeToday: userStats.activeToday || 0,

    // پیام‌ها
    totalMessages,
    todayMessages,

    // پرداخت‌ها
    totalPayments,
    totalRevenue,

    // گزارش‌ها
    pendingReports,

    // بازدیدها
    totalVisits,
  };
}

/**
 * تعداد کاربران آنلاین
 */
function getOnlineCount() {
  return dbUsers.getOnlineCount();
}

/**
 * چک آنلاین بودن یه کاربر
 * (۵ دقیقه اخیر)
 */
function isUserOnline(telegramId) {
  const user = dbUsers.getByTelegramId(telegramId);

  if (!user || !user.last_seen) return false;

  const now = Math.floor(Date.now() / 1000);
  return now - user.last_seen < 300;
}

// ============================================================
//  آمار امروز / هفته / ماه
// ============================================================

function getTodayStats() {
  return {
    newUsers: dbUsers.getGlobalStats().newUsersToday || 0,
    messages: dbMessages.getTodayCount(),
    visits: dbVisits.getTodayCount(),
    uniqueVisits: dbVisits.getUniqueUsersToday(),
    revenue: dbPayments.getTodayRevenue(),
    activations: dbPackages.getTodayActivations(),
    replies: db
      .prepare(`
        SELECT COUNT(*) as count FROM messages
        WHERE is_reply = 1 AND created_at >= strftime('%s', 'now', 'start of day')
      `)
      .get().count || 0,
  };
}

function getWeekStats() {
  const now = Math.floor(Date.now() / 1000);
  const weekAgo = now - 7 * 24 * 60 * 60;

  const newUsers = db
    .prepare('SELECT COUNT(*) as count FROM users WHERE created_at >= ?')
    .get(weekAgo).count;

  return {
    newUsers: newUsers || 0,
    messages: dbMessages.getMessagesChart(7).reduce((s, d) => s + d.value, 0),
    visits: dbVisits.getWeekCount(),
    uniqueVisits: dbVisits.getUniqueUsersThisWeek(),
    revenue: dbPayments.getWeekRevenue(),
  };
}

function getMonthStats() {
  const now = Math.floor(Date.now() / 1000);
  const monthAgo = now - 30 * 24 * 60 * 60;

  const newUsers = db
    .prepare('SELECT COUNT(*) as count FROM users WHERE created_at >= ?')
    .get(monthAgo).count;

  return {
    newUsers: newUsers || 0,
    messages: dbMessages.getMessagesChart(30).reduce((s, d) => s + d.value, 0),
    visits: dbVisits.getMonthCount(),
    uniqueVisits: dbVisits.getUniqueUsersThisMonth(),
    revenue: dbPayments.getMonthRevenue(),
  };
}

// ============================================================
//  رایگان روزانه (v3)
// ============================================================

/**
 * آمار رایگان امروز کاربر
 */
function getDailyFreeStats(userId) {
  const user = dbUsers.getByTelegramId(userId);

  const limit = config.free.dailyMessages;

  if (!user) {
    return { limit, used: 0, remaining: limit };
  }

  const used = user.daily_free_used || 0;
  const remaining = Math.max(0, limit - used);

  return { limit, used, remaining };
}

/**
 * مصرف یه پیام رایگان
 */
function useDailyFree(userId) {
  return dbUsers.incrementDailyFree(userId);
}

// ============================================================
//  وضعیت بسته (v3)
// ============================================================

/**
 * وضعیت بسته فعال کاربر
 */
function getActivePackageStatus(userId) {
  const user = dbUsers.getByTelegramId(userId);

  if (!user) {
    return { hasPackage: false, daysLeft: 0 };
  }

  const now = Math.floor(Date.now() / 1000);
  const hasPackage = user.is_vip && user.vip_expires_at > now;

  if (!hasPackage) {
    return { hasPackage: false, daysLeft: 0 };
  }

  const daysLeft = Math.ceil((user.vip_expires_at - now) / (24 * 60 * 60));

  return {
    hasPackage: true,
    packageId: user.package_type,
    name: user.package_type || 'VIP',
    expiresAt: user.vip_expires_at,
    daysLeft,
    description: `${daysLeft} روز باقی‌مونده`,
  };
}

// ============================================================
//  نمودارها
// ============================================================

function getVisitsChart(days = 7) {
  return dbVisits.getVisitsChart(days);
}

function getNewUsersChart(days = 7) {
  const now = Math.floor(Date.now() / 1000);
  const from = now - days * 24 * 60 * 60;

  const rows = db
    .prepare(`
      SELECT 
        date(created_at, 'unixepoch') as date,
        COUNT(*) as count
      FROM users
      WHERE created_at >= ?
      GROUP BY date(created_at, 'unixepoch')
      ORDER BY date ASC
    `)
    .all(from);

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
    });
  }

  return result;
}

function getRevenueChart(days = 7) {
  return dbPayments.getRevenueChart(days);
}

function getMessagesChart(days = 7) {
  return dbMessages.getMessagesChart(days);
}

// ============================================================
//  توزیع‌ها
// ============================================================

function getLanguageDistribution() {
  const rows = dbUsers.getLanguageDistribution();

  const names = {
    fa: 'فارسی',
    en: 'English',
    ar: 'العربية',
  };

  return rows.map((r) => ({
    code: r.language || 'fa',
    name: names[r.language] || r.language || 'نامشخص',
    count: r.count,
  }));
}

function getPackageDistribution() {
  const rows = dbUsers.getPackageDistribution();

  const names = {
    weekly: 'هفتگی',
    monthly: 'ماهانه',
    yearly: 'سالانه',
    reply: 'پاسخ',
  };

  return rows.map((r) => ({
    code: r.package_type || 'unknown',
    name: names[r.package_type] || r.package_type || 'نامشخص',
    count: r.count,
  }));
}

// ============================================================
//  لیست کاربران (ادمین)
// ============================================================

function getUsersList(options = {}) {
  const {
    limit = 50,
    offset = 0,
    filter = 'all',
  } = options;

  return dbUsers.listFiltered(limit, offset, filter);
}

function getUsersCount(filter = 'all') {
  return dbUsers.countFiltered(filter);
}

// ============================================================
//  برترین‌ها
// ============================================================

function getTopUsers(type = 'referrals', limit = 10) {
  if (type === 'referrals') {
    return dbUsers.getTopReferrers(limit);
  }
  if (type === 'messages') {
    return dbUsers.getTopByMessages(limit);
  }
  if (type === 'spent') {
    return dbUsers.getTopBySpent(limit);
  }
  if (type === 'visits') {
    return dbUsers.getTopByVisits(limit);
  }
  return [];
}

// ============================================================
//  گزارش‌ها
// ============================================================

function getReportsList(options = {}) {
  const { limit = 50, status = 'pending' } = options;

  if (status === 'pending') {
    return dbMessages.getPendingReports(limit);
  }

  if (status === 'all') {
    return dbMessages.getAllReports(limit);
  }

  return [];
}

function getRecentMessages(limit = 50, offset = 0) {
  return dbMessages.getRecent(limit, offset);
}

// ============================================================
//  گزارش تبلیغاتی (v3)
// ============================================================

/**
 * گزارش کامل برای ارائه به تبلیغ‌دهنده
 */
function getAdvertisingReport(days = 30) {
  const visitsChart = dbVisits.getVisitsChart(days);
  const usersChart = getNewUsersChart(days);
  const messagesChart = getMessagesChart(days);

  const totalVisits = visitsChart.reduce((s, d) => s + d.value, 0);
  const uniqueVisits = visitsChart.reduce((s, d) => s + (d.unique_users || 0), 0);
  const totalNewUsers = usersChart.reduce((s, d) => s + d.value, 0);
  const totalMessages = messagesChart.reduce((s, d) => s + d.value, 0);

  const avgDailyVisits = Math.round(totalVisits / days);
  const avgDailyUsers = Math.round(totalNewUsers / days);

  const growthRate = dbVisits.getGrowthRate(7);
  const bestHours = dbVisits.getBestHours(days, 5);
  const platformDist = dbVisits.getByPlatform(days);
  const pageDist = dbVisits.getByPage(days);

  return {
    period_days: days,

    summary: {
      total_visits: totalVisits,
      unique_visits: uniqueVisits,
      total_new_users: totalNewUsers,
      total_messages: totalMessages,
      avg_daily_visits: avgDailyVisits,
      avg_daily_users: avgDailyUsers,
      growth_rate_percent: growthRate,
    },

    charts: {
      visits: visitsChart,
      users: usersChart,
      messages: messagesChart,
    },

    best_hours: bestHours,
    platforms: platformDist,
    pages: pageDist,

    generated_at: Math.floor(Date.now() / 1000),
  };
}

// ============================================================
//  آمار کاربر (v3)
// ============================================================

/**
 * آمار کامل یه کاربر (برای صفحه profile / settings)
 */
function getUserStats(userId) {
  const user = dbUsers.getByTelegramId(userId);

  if (!user) {
    return null;
  }

  const messageStats = dbMessages.getStatsForUser(userId);
  const packageStatus = getActivePackageStatus(userId);
  const dailyFree = getDailyFreeStats(userId);

  const now = Math.floor(Date.now() / 1000);

  return {
    // پیام‌ها
    total_received: user.total_received || 0,
    total_sent: user.total_sent || 0,
    unread: messageStats.unread || 0,
    revealed: messageStats.revealed || 0,

    // دعوت
    referrals: user.referral_count || 0,

    // Stars
    stars_spent: user.stars_spent || 0,

    // بازدید
    visit_count: user.visit_count || 0,

    // بسته
    package: packageStatus.hasPackage
      ? {
          id: packageStatus.packageId,
          name: packageStatus.name,
          days_left: packageStatus.daysLeft,
        }
      : null,

    // رایگان روزانه
    daily_free: dailyFree,

    // روزهای از عضویت
    joined_days_ago: Math.floor((now - user.created_at) / (24 * 60 * 60)),

    // آنلاین؟
    is_online: isUserOnline(userId),
  };
}

// ============================================================
//  خروجی
// ============================================================

module.exports = {
  // کلی
  getOverview,
  getOnlineCount,
  isUserOnline,

  // امروز/هفته/ماه
  getTodayStats,
  getWeekStats,
  getMonthStats,

  // رایگان روزانه
  getDailyFreeStats,
  useDailyFree,

  // بسته
  getActivePackageStatus,

  // نمودارها
  getVisitsChart,
  getNewUsersChart,
  getRevenueChart,
  getMessagesChart,

  // توزیع
  getLanguageDistribution,
  getPackageDistribution,

  // لیست‌ها
  getUsersList,
  getUsersCount,
  getTopUsers,
  getReportsList,
  getRecentMessages,

  // گزارش تبلیغاتی
  getAdvertisingReport,

  // آمار کاربر
  getUserStats,
};