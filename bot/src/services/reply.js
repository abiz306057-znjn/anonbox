/**
 * services/reply.js
 * منطق کاری پاسخ ناشناس
 * نسخه ۳.۰ — گفتگوی ناشناس بین گیرنده و فرستنده
 *
 * مفهوم:
 *   کاربر A پیام ناشناس از B دریافت می‌کنه
 *   A می‌خواد به B پاسخ بده (بدون اینکه B رو بشناسه)
 *   A نیاز به بسته «reply» داره
 *   A پاسخ می‌فرسته → B اون رو دریافت می‌کنه
 */

const db = require('../db');
const dbMessages = require('../db/messages');
const dbUsers = require('../db/users');
const dbAliases = require('../db/aliases');
const packageService = require('./package');
const config = require('../config');

// ============================================================
//  ارسال پاسخ
// ============================================================

/**
 * ارسال پاسخ ناشناس به یه پیام
 *
 * @param {object} data
 * @param {number} data.originalMessageId - آیدی پیام اصلی
 * @param {number} data.senderId - کسی که پاسخ می‌ده (گیرنده پیام اصلی)
 * @param {number} data.targetId - فرستنده اصلی (که پاسخ بهش می‌ره)
 * @param {number} data.aliasId - شناسه ناشناس (alias)
 * @param {string} data.content - متن پاسخ
 * @returns {object} { success, messageId, message } یا { success: false, error }
 */
function sendReply(data) {
  const { originalMessageId, senderId, targetId, aliasId, content } = data;

  // ===== اعتبارسنجی =====
  if (!originalMessageId || !senderId || !targetId || !content) {
    return { success: false, error: 'INVALID_INPUT' };
  }

  // ===== چک بسته پاسخ =====
  if (!packageService.hasReplyPackage(senderId)) {
    return { success: false, error: 'NO_REPLY_PACKAGE' };
  }

  // ===== چک پیام اصلی =====
  const originalMessage = dbMessages.getById(originalMessageId);

  if (!originalMessage) {
    return { success: false, error: 'MESSAGE_NOT_FOUND' };
  }

  if (originalMessage.receiver_id !== senderId) {
    return { success: false, error: 'NOT_YOUR_MESSAGE' };
  }

  if (originalMessage.is_deleted) {
    return { success: false, error: 'MESSAGE_DELETED' };
  }

  if (!originalMessage.sender_telegram_id) {
    return { success: false, error: 'NO_SENDER' };
  }

  // ===== چک محتوا =====
  const trimmedContent = String(content).trim();

  if (trimmedContent.length < 1) {
    return { success: false, error: 'EMPTY_CONTENT' };
  }

  if (trimmedContent.length > config.limits.maxMessageLength) {
    return { success: false, error: 'TOO_LONG' };
  }

  // ===== چک بلاک =====
  if (dbMessages.isBlocked(targetId, senderId)) {
    return { success: false, error: 'BLOCKED' };
  }

  // ===== ساخت پیام پاسخ =====
  // نکته مهم:
  //   - receiver_id = targetId (فرستنده اصلی)
  //   - sender_id = senderId (گیرنده اصلی که پاسخ می‌ده)
  //   - alias_id = alias اصلی (تا فرستنده بفهمه کی جواب داده)
  //   - is_reply = 1
  //   - original_message_id = پیام اصلی
  const replyMessage = dbMessages.createMessage({
    receiver_id: targetId,
    sender_id: senderId,
    sender_telegram_id: senderId,
    content_type: 'text',
    content: trimmedContent,
    alias_id: aliasId || null,
    is_reply: 1,
    original_message_id: originalMessageId,
  });

  // ===== افزایش شمارنده alias =====
  if (aliasId) {
    try {
      dbAliases.incrementMessageCount(aliasId);
    } catch (err) {
      // ignore
    }
  }

  return {
    success: true,
    messageId: replyMessage.id,
    message: replyMessage,
  };
}

// ============================================================
//  دریافت پاسخ‌ها
// ============================================================

/**
 * پاسخ‌های یه پیام خاص
 */
function getRepliesForMessage(messageId) {
  return dbMessages.getRepliesForMessage(messageId);
}

/**
 * چک امکان پاسخ توسط کاربر
 */
function canUserReply(userId, messageId) {
  // چک بسته پاسخ
  if (!packageService.hasReplyPackage(userId)) {
    return { canReply: false, reason: 'NO_PACKAGE' };
  }

  // چک پیام
  const message = dbMessages.getById(messageId);

  if (!message) {
    return { canReply: false, reason: 'MESSAGE_NOT_FOUND' };
  }

  if (message.receiver_id !== userId) {
    return { canReply: false, reason: 'NOT_YOUR_MESSAGE' };
  }

  if (message.is_deleted) {
    return { canReply: false, reason: 'MESSAGE_DELETED' };
  }

  if (!message.sender_telegram_id) {
    return { canReply: false, reason: 'NO_SENDER' };
  }

  return { canReply: true };
}

// ============================================================
//  آمار
// ============================================================

/**
 * تعداد پاسخ‌های ارسالی کاربر
 */
function getReplyCount(userId) {
  const result = db
    .prepare(`
      SELECT COUNT(*) as count FROM messages
      WHERE sender_telegram_id = ? AND is_reply = 1 AND is_deleted = 0
    `)
    .get(userId);

  return result?.count || 0;
}

/**
 * آمار کلی پاسخ‌ها (ادمین)
 */
function getGlobalReplyStats() {
  const total = db
    .prepare('SELECT COUNT(*) as count FROM messages WHERE is_reply = 1')
    .get().count;

  const today = db
    .prepare(`
      SELECT COUNT(*) as count FROM messages
      WHERE is_reply = 1 AND created_at >= strftime('%s', 'now', 'start of day')
    `)
    .get().count;

  return {
    total_replies: total || 0,
    today_replies: today || 0,
  };
}

// ============================================================
//  خروجی
// ============================================================

module.exports = {
  sendReply,
  getRepliesForMessage,
  canUserReply,
  getReplyCount,
  getGlobalReplyStats,
};