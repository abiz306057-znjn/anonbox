/**
 * services/message.js
 * منطق کاری پیام‌ها
 * نسخه ۳.۰ — با اعتبارسنجی، دسترسی، پاسخ، رایگان
 */

const dbMessages = require('../db/messages');
const dbUsers = require('../db/users');
const config = require('../config');

// ============================================================
//  ساخت پیام
// ============================================================

function createMessage(data) {
  // ===== اعتبارسنجی =====
  if (!data.receiver_id) {
    throw new Error('RECEIVER_REQUIRED');
  }

  if (!data.sender_telegram_id) {
    throw new Error('SENDER_REQUIRED');
  }

  if (data.receiver_id === data.sender_telegram_id) {
    throw new Error('SELF_SEND');
  }

  // ===== چک بلاک =====
  if (isBlocked(data.receiver_id, data.sender_telegram_id)) {
    throw new Error('BLOCKED');
  }

  // ===== چک گیرنده =====
  const receiver = dbUsers.getByTelegramId(data.receiver_id);
  if (!receiver) {
    throw new Error('RECEIVER_NOT_FOUND');
  }

  if (receiver.is_banned) {
    throw new Error('RECEIVER_BANNED');
  }

  // ===== چک فرستنده =====
  const sender = dbUsers.getByTelegramId(data.sender_telegram_id);
  if (!sender) {
    throw new Error('SENDER_NOT_FOUND');
  }

  if (sender.is_banned) {
    throw new Error('SENDER_BANNED');
  }

  // ===== چک محدودیت ساعتی =====
  const hourCount = dbMessages.countLastHourBySender(data.sender_telegram_id);
  if (hourCount >= config.limits.maxMessagesPerHour) {
    throw new Error('HOURLY_LIMIT');
  }

  // ===== چک محدودیت روزانه =====
  const todayCount = dbMessages.countTodayBySender(data.sender_telegram_id);
  if (todayCount >= config.limits.maxMessagesPerDay) {
    throw new Error('DAILY_LIMIT');
  }

  // ===== اعتبارسنجی محتوا =====
  if (!data.content_type) {
    throw new Error('CONTENT_TYPE_REQUIRED');
  }

  if (data.content_type === 'text') {
    if (!data.content || !data.content.trim()) {
      throw new Error('EMPTY_CONTENT');
    }

    if (data.content.length > config.limits.maxMessageLength) {
      throw new Error('TOO_LONG');
    }
  }

  return dbMessages.createMessage(data);
}

// ============================================================
//  خواندن
// ============================================================

function getById(id) {
  return dbMessages.getById(id);
}

function getForUser(userId, limit = 50, offset = 0) {
  return dbMessages.getForUser(userId, limit, offset);
}

function getForUserWithFilter(userId, filter = 'all', limit = 50, offset = 0) {
  return dbMessages.getForUserWithFilter(userId, filter, limit, offset);
}

function getUnreadForUser(userId) {
  return dbMessages.getUnreadForUser(userId);
}

function getByAlias(aliasId, limit = 50, offset = 0) {
  return dbMessages.getByAlias(aliasId, limit, offset);
}

function getStatsForUser(userId) {
  return dbMessages.getStatsForUser(userId);
}

function getTotalCountForUser(userId, filter = 'all') {
  return dbMessages.getTotalCountForUser(userId, filter);
}

// ============================================================
//  محدودیت‌ها
// ============================================================

function countTodayBySender(senderId) {
  return dbMessages.countTodayBySender(senderId);
}

function countLastHourBySender(senderId) {
  return dbMessages.countLastHourBySender(senderId);
}

/**
 * بررسی امکان ارسال
 */
function canSend(senderId) {
  const today = countTodayBySender(senderId);
  const hour = countLastHourBySender(senderId);

  const allowed =
    today < config.limits.maxMessagesPerDay &&
    hour < config.limits.maxMessagesPerHour;

  return {
    allowed,
    todayCount: today,
    hourCount: hour,
    todayLimit: config.limits.maxMessagesPerDay,
    hourLimit: config.limits.maxMessagesPerHour,
    remainingToday: Math.max(0, config.limits.maxMessagesPerDay - today),
    remainingHour: Math.max(0, config.limits.maxMessagesPerHour - hour),
  };
}

// ============================================================
//  وضعیت‌ها
// ============================================================

function markRead(id) {
  return dbMessages.markRead(id);
}

function markRevealed(id) {
  return dbMessages.markRevealed(id);
}

function markDeleted(id) {
  return dbMessages.markDeleted(id);
}

function markAllReadForUser(userId) {
  return dbMessages.markAllReadForUser(userId);
}

// ============================================================
//  گزارش
// ============================================================

function markReported(messageId, reporterId, reason = null) {
  const message = dbMessages.getById(messageId);

  if (!message) {
    throw new Error('MESSAGE_NOT_FOUND');
  }

  if (message.is_reported) {
    throw new Error('ALREADY_REPORTED');
  }

  if (message.receiver_id !== reporterId) {
    throw new Error('NOT_YOUR_MESSAGE');
  }

  return dbMessages.markReported(messageId, reporterId, reason);
}

function getPendingReports(limit = 20) {
  return dbMessages.getPendingReports(limit);
}

function getAllReports(limit = 100) {
  return dbMessages.getAllReports(limit);
}

function markReportReviewed(reportId) {
  return dbMessages.markReportReviewed(reportId);
}

// ============================================================
//  بلاک
// ============================================================

function blockUser(blockerId, blockedId) {
  if (blockerId === blockedId) {
    throw new Error('SELF_BLOCK');
  }

  return dbMessages.blockUser(blockerId, blockedId);
}

function unblockUser(blockerId, blockedId) {
  return dbMessages.unblockUser(blockerId, blockedId);
}

function isBlocked(blockerId, blockedId) {
  return dbMessages.isBlocked(blockerId, blockedId);
}

function getBlockList(blockerId) {
  return dbMessages.getBlockList(blockerId);
}

// ============================================================
//  رایگان روزانه
// ============================================================

function logDailyFreeUsage(userId, messageId) {
  return dbMessages.logDailyFreeUsage(userId, messageId);
}

// ============================================================
//  پاسخ ناشناس
// ============================================================

function getRepliesForMessage(messageId) {
  return dbMessages.getRepliesForMessage(messageId);
}

/**
 * بررسی امکان پاسخ
 */
function canReplyToMessage(messageId, userId) {
  const message = dbMessages.getById(messageId);

  if (!message) return false;
  if (message.receiver_id !== userId) return false;
  if (!message.sender_telegram_id) return false;
  if (message.is_deleted) return false;

  return true;
}

// ============================================================
//  حذف
// ============================================================

function deleteById(id) {
  return dbMessages.deleteById(id);
}

function deleteAllForUser(userId) {
  return dbMessages.deleteAllForUser(userId);
}

// ============================================================
//  آمار کلی
// ============================================================

function getTotalCount() {
  return dbMessages.getTotalCount();
}

function getTodayCount() {
  return dbMessages.getTodayCount();
}

function getRecent(limit = 50, offset = 0) {
  return dbMessages.getRecent(limit, offset);
}

function getMessagesChart(days = 7) {
  return dbMessages.getMessagesChart(days);
}

// ============================================================
//  بررسی دسترسی (قلب سیستم)
// ============================================================

/**
 * بررسی دسترسی کاربر به یه پیام خاص
 * با توجه به بسته فعال و رایگان روزانه
 */
function checkMessageAccess(userId, messageId) {
  const message = dbMessages.getById(messageId);

  if (!message) {
    return { allowed: false, reason: 'MESSAGE_NOT_FOUND' };
  }

  if (message.receiver_id !== userId) {
    return { allowed: false, reason: 'NOT_YOUR_MESSAGE' };
  }

  const user = dbUsers.getByTelegramId(userId);

  if (!user) {
    return { allowed: false, reason: 'USER_NOT_FOUND' };
  }

  // ---- چک بسته فعال ----
  const now = Math.floor(Date.now() / 1000);
  const hasPackage = user.is_vip && user.vip_expires_at > now;

  if (hasPackage) {
    return { allowed: true, reason: 'PACKAGE' };
  }

  // ---- چک پیام خوانده‌شده یا باز شده ----
  if (message.is_read || message.is_revealed) {
    return { allowed: true, reason: 'ALREADY_READ' };
  }

  // ---- چک رایگان روزانه ----
  const dailyUsed = user.daily_free_used || 0;
  const dailyLimit = config.free.dailyMessages;
  const dailyRemaining = Math.max(0, dailyLimit - dailyUsed);

  if (dailyRemaining > 0) {
    return {
      allowed: true,
      reason: 'FREE_QUOTA',
      remaining: dailyRemaining,
    };
  }

  return { allowed: false, reason: 'NEED_PACKAGE' };
}

/**
 * لیست پیام‌ها با بررسی دسترسی هر پیام
 */
function getMessagesWithAccess(userId, filter = 'all', limit = 20, offset = 0) {
  const messages = dbMessages.getForUserWithFilter(userId, filter, limit, offset);

  const user = dbUsers.getByTelegramId(userId);

  if (!user) {
    return [];
  }

  const now = Math.floor(Date.now() / 1000);
  const hasPackage = user.is_vip && user.vip_expires_at > now;

  const dailyUsed = user.daily_free_used || 0;
  const dailyRemaining = Math.max(0, config.free.dailyMessages - dailyUsed);

  let freeUsedInBatch = 0;

  return messages.map((m) => {
    let canView = false;
    let requiresPayment = false;

    if (hasPackage) {
      canView = true;
    } else if (m.is_read || m.is_revealed) {
      canView = true;
    } else if (freeUsedInBatch < dailyRemaining) {
      canView = true;
      freeUsedInBatch++;
    } else {
      requiresPayment = true;
    }

    return {
      ...m,
      can_view: canView,
      requires_payment: requiresPayment,
    };
  });
}

// ============================================================
//  خروجی
// ============================================================

module.exports = {
  // ساخت
  createMessage,

  // خواندن
  getById,
  getForUser,
  getForUserWithFilter,
  getUnreadForUser,
  getByAlias,
  getStatsForUser,
  getTotalCountForUser,

  // محدودیت
  countTodayBySender,
  countLastHourBySender,
  canSend,

  // وضعیت
  markRead,
  markRevealed,
  markDeleted,
  markAllReadForUser,

  // گزارش
  markReported,
  getPendingReports,
  getAllReports,
  markReportReviewed,

  // بلاک
  blockUser,
  unblockUser,
  isBlocked,
  getBlockList,

  // رایگان
  logDailyFreeUsage,

  // پاسخ
  getRepliesForMessage,
  canReplyToMessage,

  // حذف
  deleteById,
  deleteAllForUser,

  // آمار
  getTotalCount,
  getTodayCount,
  getRecent,
  getMessagesChart,

  // دسترسی
  checkMessageAccess,
  getMessagesWithAccess,
};