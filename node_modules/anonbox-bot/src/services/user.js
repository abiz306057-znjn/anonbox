/**
 * services/user.js
 * منطق کاری کاربران
 * نسخه ۳.۰ — با اعتبارسنجی، بسته‌ها و مدیریت کامل
 *
 * این لایه بین handler و db قرار می‌گیره
 */

const db = require('../db');
const dbUsers = require('../db/users');
const config = require('../config');

// ============================================================
//  خواندن
// ============================================================

function getByTelegramId(telegramId) {
  return dbUsers.getByTelegramId(telegramId);
}

function getBySlug(slug) {
  if (!slug) return null;
  return dbUsers.getBySlug(slug);
}

function getById(id) {
  return dbUsers.getById(id);
}

function exists(telegramId) {
  return !!dbUsers.getByTelegramId(telegramId);
}

// ============================================================
//  ساخت
// ============================================================

function create(data) {
  // اعتبارسنجی
  if (!data.telegram_id) {
    throw new Error('telegram_id الزامی است');
  }

  if (!data.link_slug) {
    throw new Error('link_slug الزامی است');
  }

  // چک تکراری نبودن
  if (exists(data.telegram_id)) {
    throw new Error('کاربر قبلاً ثبت‌شده است');
  }

  if (getBySlug(data.link_slug)) {
    throw new Error('این اسلاگ قبلاً گرفته شده');
  }

  return dbUsers.create(data);
}

// ============================================================
//  آپدیت پروفایل
// ============================================================

function updateProfile(telegramId, data) {
  if (!telegramId) return null;

  return dbUsers.updateProfile(telegramId, data);
}

function updateFields(telegramId, data) {
  if (!telegramId) return null;

  return dbUsers.updateFields(telegramId, data);
}

function updateBio(telegramId, bio) {
  if (bio === undefined || bio === null) return null;

  const trimmed = String(bio).trim().substring(0, config.limits.maxBioLength);

  return dbUsers.updateBio(telegramId, trimmed);
}

function updateFirstName(telegramId, firstName) {
  if (!firstName) return null;

  const trimmed = String(firstName).trim().substring(0, config.limits.maxNameLength);

  return dbUsers.updateFirstName(telegramId, trimmed);
}

function updateSlug(telegramId, slug) {
  if (!slug) return null;

  const cleanSlug = String(slug).trim().toLowerCase();

  // اعتبارسنجی
  if (
    cleanSlug.length < config.limits.minSlugLength ||
    cleanSlug.length > config.limits.maxSlugLength
  ) {
    throw new Error('طول اسلاگ نامعتبر است');
  }

  if (!/^[a-z0-9_]+$/.test(cleanSlug)) {
    throw new Error('اسلاگ نامعتبر است');
  }

  // چک تکراری
  const existing = getBySlug(cleanSlug);
  if (existing && existing.telegram_id !== telegramId) {
    throw new Error('این اسلاگ قبلاً گرفته شده');
  }

  return dbUsers.updateSlug(telegramId, cleanSlug);
}

function updateLanguage(telegramId, language) {
  if (!language) return null;

  if (!config.languages.supported.includes(language)) {
    throw new Error('زبان پشتیبانی نمی‌شود');
  }

  return dbUsers.updateLanguage(telegramId, language);
}

// ============================================================
//  آمار
// ============================================================

function touchLastActive(telegramId) {
  return dbUsers.touchLastActive(telegramId);
}

function touchLastSeen(telegramId) {
  return dbUsers.touchLastSeen(telegramId);
}

function incrementVisitCount(telegramId) {
  return dbUsers.incrementVisitCount(telegramId);
}

function incrementReceived(telegramId) {
  return dbUsers.incrementReceived(telegramId);
}

function incrementSent(telegramId) {
  return dbUsers.incrementSent(telegramId);
}

function incrementRevealed(telegramId) {
  return dbUsers.incrementRevealed(telegramId);
}

function addStarsSpent(telegramId, amount) {
  if (!amount || amount <= 0) return null;
  return dbUsers.addStarsSpent(telegramId, amount);
}

// ============================================================
//  بسته‌ها
// ============================================================

/**
 * فعال‌سازی بسته VIP (weekly, monthly, yearly)
 * با تمدید خودکار
 */
function activatePackage(telegramId, expiresAt, packageType = null) {
  if (!expiresAt || expiresAt <= Math.floor(Date.now() / 1000)) {
    throw new Error('تاریخ انقضا نامعتبر است');
  }

  return dbUsers.activatePackage(telegramId, expiresAt, packageType);
}

/**
 * فعال‌سازی بسته پاسخ ناشناس
 * با تمدید خودکار
 */
function activateReplyPackage(telegramId, expiresAt) {
  if (!expiresAt || expiresAt <= Math.floor(Date.now() / 1000)) {
    throw new Error('تاریخ انقضای بسته پاسخ نامعتبر است');
  }

  return dbUsers.activateReplyPackage(telegramId, expiresAt);
}

function deactivatePackage(telegramId) {
  return dbUsers.deactivatePackage(telegramId);
}

function deactivateReplyPackage(telegramId) {
  return dbUsers.deactivateReplyPackage(telegramId);
}

/**
 * چک بسته VIP فعال
 */
function hasActivePackage(telegramId) {
  const user = dbUsers.getByTelegramId(telegramId);
  if (!user || !user.is_vip) return false;

  const now = Math.floor(Date.now() / 1000);
  return user.vip_expires_at > now;
}

/**
 * چک بسته پاسخ فعال
 */
function hasActiveReplyPackage(telegramId) {
  const user = dbUsers.getByTelegramId(telegramId);
  if (!user || !user.reply_package_expires_at) return false;

  const now = Math.floor(Date.now() / 1000);
  return user.reply_package_expires_at > now;
}

/**
 * تعداد روز باقی‌مونده بسته VIP
 */
function getPackageDaysRemaining(telegramId) {
  const user = dbUsers.getByTelegramId(telegramId);
  if (!user || !user.is_vip || !user.vip_expires_at) return 0;

  const now = Math.floor(Date.now() / 1000);
  const remaining = user.vip_expires_at - now;

  if (remaining <= 0) return 0;
  return Math.ceil(remaining / (24 * 60 * 60));
}

/**
 * تعداد روز باقی‌مونده بسته پاسخ
 */
function getReplyPackageDaysRemaining(telegramId) {
  const user = dbUsers.getByTelegramId(telegramId);
  if (!user || !user.reply_package_expires_at) return 0;

  const now = Math.floor(Date.now() / 1000);
  const remaining = user.reply_package_expires_at - now;

  if (remaining <= 0) return 0;
  return Math.ceil(remaining / (24 * 60 * 60));
}

/**
 * وضعیت کامل بسته کاربر
 */
function getPackageStatus(telegramId) {
  const user = dbUsers.getByTelegramId(telegramId);

  if (!user) {
    return {
      hasPackage: false,
      hasReplyPackage: false,
      daysLeft: 0,
      replyDaysLeft: 0,
    };
  }

  const now = Math.floor(Date.now() / 1000);

  const hasVip = user.is_vip && user.vip_expires_at > now;
  const hasReply = user.reply_package_expires_at > now;

  const daysLeft = hasVip
    ? Math.ceil((user.vip_expires_at - now) / (24 * 60 * 60))
    : 0;

  const replyDaysLeft = hasReply
    ? Math.ceil((user.reply_package_expires_at - now) / (24 * 60 * 60))
    : 0;

  return {
    hasPackage: hasVip,
    packageId: user.package_type || null,
    expiresAt: user.vip_expires_at || null,
    daysLeft,

    hasReplyPackage: hasReply,
    replyExpiresAt: user.reply_package_expires_at || null,
    replyDaysLeft,
  };
}

// ============================================================
//  رایگان روزانه
// ============================================================

function incrementDailyFree(telegramId) {
  return dbUsers.incrementDailyFree(telegramId);
}

function resetDailyFree(telegramId) {
  const now = Math.floor(Date.now() / 1000);
  return dbUsers.resetDailyFree(telegramId, now);
}

/**
 * وضعیت رایگان روزانه
 */
function getDailyFreeStatus(telegramId) {
  const user = dbUsers.getByTelegramId(telegramId);

  const limit = config.free.dailyMessages;

  if (!user) {
    return { limit, used: 0, remaining: limit };
  }

  const used = user.daily_free_used || 0;
  const remaining = Math.max(0, limit - used);

  return { limit, used, remaining };
}

/**
 * چک دسترسی رایگان
 */
function canUseFreeMessage(telegramId) {
  const status = getDailyFreeStatus(telegramId);
  return status.remaining > 0;
}

/**
 * مصرف یه پیام رایگان
 */
function consumeFreeMessage(telegramId) {
  const status = getDailyFreeStatus(telegramId);

  if (status.remaining <= 0) {
    throw new Error('FREE_LIMIT_REACHED');
  }

  return dbUsers.incrementDailyFree(telegramId);
}

// ============================================================
//  بن
// ============================================================

function ban(telegramId, reason = null) {
  if (telegramId === config.admin.id) {
    throw new Error('ادمین قابل بن نیست');
  }

  return dbUsers.ban(telegramId, reason);
}

function unban(telegramId) {
  return dbUsers.unban(telegramId);
}

function isBanned(telegramId) {
  const user = dbUsers.getByTelegramId(telegramId);
  return user ? !!user.is_banned : false;
}

// ============================================================
//  حذف حساب
// ============================================================

function deleteAccount(telegramId) {
  if (telegramId === config.admin.id) {
    throw new Error('ادمین قابل حذف نیست');
  }

  const dbMessages = require('../db/messages');
  const dbAliases = require('../db/aliases');
  const dbVisits = require('../db/visits');

  const tx = db.transaction(() => {
    // حذف پیام‌های دریافتی
    dbMessages.deleteAllForUser(telegramId);

    // حذف aliasها (هم به عنوان فرستنده، هم گیرنده)
    dbAliases.deleteForUser(telegramId);

    // حذف بازدیدها
    dbVisits.deleteForUser(telegramId);

    // حذف خود کاربر (cascade بقیه رو پاک می‌کنه)
    dbUsers.delete(telegramId);
  });

  return tx();
}

// ============================================================
//  آمار کلی (ادمین)
// ============================================================

function getGlobalStats() {
  return dbUsers.getGlobalStats();
}

function listUsers(limit = 100) {
  return dbUsers.list(limit);
}

function listUsersFiltered(limit = 50, offset = 0, filter = 'all') {
  return dbUsers.listFiltered(limit, offset, filter);
}

function countUsersFiltered(filter = 'all') {
  return dbUsers.countFiltered(filter);
}

function getOnlineCount() {
  return dbUsers.getOnlineCount();
}

function getLanguageDistribution() {
  return dbUsers.getLanguageDistribution();
}

function getPackageDistribution() {
  return dbUsers.getPackageDistribution();
}

function getTopReferrers(limit = 10) {
  return dbUsers.getTopReferrers(limit);
}

function getTopByMessages(limit = 10) {
  return dbUsers.getTopByMessages(limit);
}

function getTopBySpent(limit = 10) {
  return dbUsers.getTopBySpent(limit);
}

function getTopByVisits(limit = 10) {
  return dbUsers.getTopByVisits(limit);
}

// ============================================================
//  زمان‌بندی‌شده
// ============================================================

/**
 * بررسی و غیرفعال کردن بسته‌های منقضی
 */
function checkExpiredPackages() {
  const expiredVips = dbUsers.getExpiredPackages();
  const expiredReplies = dbUsers.getExpiredReplyPackages();

  let deactivated = 0;

  const tx = db.transaction(() => {
    expiredVips.forEach((u) => {
      dbUsers.deactivatePackage(u.telegram_id);
      deactivated++;
    });

    expiredReplies.forEach((u) => {
      dbUsers.deactivateReplyPackage(u.telegram_id);
      deactivated++;
    });
  });

  tx();

  return deactivated;
}

// ============================================================
//  خروجی
// ============================================================

module.exports = {
  // خواندن
  getByTelegramId,
  getBySlug,
  getById,
  exists,

  // ساخت
  create,

  // آپدیت
  updateProfile,
  updateFields,
  updateBio,
  updateFirstName,
  updateSlug,
  updateLanguage,

  // آمار
  touchLastActive,
  touchLastSeen,
  incrementVisitCount,
  incrementReceived,
  incrementSent,
  incrementRevealed,
  addStarsSpent,

  // بسته‌ها
  activatePackage,
  activateReplyPackage,
  deactivatePackage,
  deactivateReplyPackage,
  hasActivePackage,
  hasActiveReplyPackage,
  getPackageDaysRemaining,
  getReplyPackageDaysRemaining,
  getPackageStatus,

  // رایگان روزانه
  incrementDailyFree,
  resetDailyFree,
  getDailyFreeStatus,
  canUseFreeMessage,
  consumeFreeMessage,

  // بن
  ban,
  unban,
  isBanned,

  // حذف
  deleteAccount,

  // آمار کلی
  getGlobalStats,
  listUsers,
  listUsersFiltered,
  countUsersFiltered,
  getOnlineCount,
  getLanguageDistribution,
  getPackageDistribution,
  getTopReferrers,
  getTopByMessages,
  getTopBySpent,
  getTopByVisits,

  // زمان‌بندی
  checkExpiredPackages,
};