/**
 * services/alias.js
 * منطق کاری شناسه‌های ناشناس
 * نسخه ۳.۰ — ایموجی تصادفی + شماره یکتا برای هر فرستنده-گیرنده
 *
 * مفهوم:
 *   هر فرستنده (sender) به هر گیرنده (receiver) یه شناسه یکتا داره
 *   این شناسه از یه ایموجی تصادفی + شماره ترتیبی ساخته می‌شه
 *   مثال: "🦊 ناشناس #۱"
 *
 *   اگه همون فرستنده دوباره به همون گیرنده پیام بفرسته،
 *   همون شناسه قبلی استفاده می‌شه (نه جدید)
 */

const db = require('../db');
const dbAliases = require('../db/aliases');
const dbMessages = require('../db/messages');
const config = require('../config');

// ============================================================
//  لیست ایموجی‌ها
// ============================================================

const EMOJI_POOL = [
  // حیوانات
  '🦊', '🐼', '🦁', '🐯', '🐸', '🐧', '🦉', '🦅', '🐺', '🐻',
  '🐨', '🐵', '🦄', '🐲', '🦖', '🦕', '🐙', '🦑', '🦋', '🐝',

  // طبیعت
  '🌸', '🌺', '🌻', '🌹', '🍀', '🌿', '🍁', '🌲', '🌳', '🌵',

  // اجرام
  '⭐️', '🌟', '✨', '💫', '☄️', '🌙', '🌞', '🌈', '🔥', '❄️',

  // اشیاء رمزی
  '💎', '🎭', '🎩', '🕶', '👻', '🤖', '🎃', '🎯', '🎲', '🎪',
];

// ============================================================
//  ایموجی
// ============================================================

/**
 * ایموجی تصادفی
 */
function getRandomEmoji() {
  return EMOJI_POOL[Math.floor(Math.random() * EMOJI_POOL.length)];
}

/**
 * ایموجی از لیست ایموجی‌های استفاده‌نشده
 * (اگه همه استفاده شدن، از کل لیست انتخاب می‌کنه)
 */
function getEmojiNotIn(usedEmojis = []) {
  const usedSet = new Set(usedEmojis);
  const available = EMOJI_POOL.filter((e) => !usedSet.has(e));

  const pool = available.length > 0 ? available : EMOJI_POOL;
  return pool[Math.floor(Math.random() * pool.length)];
}

// ============================================================
//  ساخت / دریافت alias
// ============================================================

/**
 * دریافت یا ساخت alias برای یه فرستنده-گیرنده
 *
 * @param {number} senderId - آیدی تلگرام فرستنده
 * @param {number} receiverId - آیدی تلگرام گیرنده
 * @returns {object} - alias object
 */
function getOrCreateAlias(senderId, receiverId) {
  // چک وجود alias قبلی
  let alias = dbAliases.getBySenderReceiver(senderId, receiverId);
  if (alias) {
    return alias;
  }

  // ساخت جدید
  return createAlias(senderId, receiverId);
}

/**
 * ساخت alias جدید
 */
function createAlias(senderId, receiverId) {
  // شماره بعدی برای این گیرنده
  const lastNumber = dbAliases.getLastNumberForReceiver(receiverId);
  const nextNumber = lastNumber + 1;

  // ایموجی از ایموجی‌های استفاده‌نشده برای این گیرنده
  const existingAliases = dbAliases.getReceiverAliases(receiverId);
  const usedEmojis = existingAliases.map((a) => a.emoji);
  const emoji = getEmojiNotIn(usedEmojis);

  // برچسب
  const label = formatAliasLabel(emoji, nextNumber);

  // ذخیره
  const alias = dbAliases.create({
    sender_id: senderId,
    receiver_id: receiverId,
    emoji,
    alias_number: nextNumber,
    alias_label: label,
  });

  return alias;
}

// ============================================================
//  فرمت‌دهی
// ============================================================

/**
 * ساخت برچسب alias
 * مثال: "🦊 ناشناس #۱"
 */
function formatAliasLabel(emoji, number) {
  return `${emoji} ناشناس #${number}`;
}

/**
 * فرمت کردن alias برای نمایش
 */
function formatAlias(alias) {
  if (!alias) return 'ناشناس';
  return alias.alias_label || formatAliasLabel(alias.emoji, alias.alias_number);
}

/**
 * فرمت کوتاه
 * مثال: "🦊#۱"
 */
function formatAliasShort(alias) {
  if (!alias) return 'ناشناس';
  return `${alias.emoji}#${alias.alias_number}`;
}

// ============================================================
//  خواندن
// ============================================================

function getById(id) {
  return dbAliases.getById(id);
}

function getBySenderReceiver(senderId, receiverId) {
  return dbAliases.getBySenderReceiver(senderId, receiverId);
}

function getReceiverAliases(receiverId) {
  return dbAliases.getReceiverAliases(receiverId);
}

function getSenderAliases(senderId) {
  return dbAliases.getSenderAliases(senderId);
}

// ============================================================
//  پیام‌ها
// ============================================================

/**
 * افزایش شمارنده پیام‌های alias
 * وقتی پیام جدیدی از این فرستنده به گیرنده میاد
 */
function incrementMessageCount(aliasId) {
  return dbAliases.incrementMessageCount(aliasId);
}

/**
 * پیام‌های یه alias
 */
function getMessagesForAlias(aliasId, limit = 50, offset = 0) {
  return dbMessages.getByAlias(aliasId, limit, offset);
}

/**
 * تعداد پیام‌های یه alias
 */
function getMessagesCountForAlias(aliasId) {
  const result = db
    .prepare('SELECT COUNT(*) as count FROM messages WHERE alias_id = ? AND is_deleted = 0')
    .get(aliasId);

  return result?.count || 0;
}

// ============================================================
//  آمار
// ============================================================

/**
 * آمار کامل aliasهای یه گیرنده
 */
function getAliasesStats(receiverId) {
  const stats = dbAliases.getStatsForReceiver(receiverId);
  const mostActive = dbAliases.getMostActiveForReceiver(receiverId);

  return {
    totalAliases: stats.totalAliases,
    totalMessages: stats.totalMessages,
    averagePerAlias: stats.averagePerAlias,
    mostActive: mostActive || null,
  };
}

function countForReceiver(receiverId) {
  return dbAliases.countForReceiver(receiverId);
}

function countForSender(senderId) {
  return dbAliases.countForSender(senderId);
}

/**
 * برترین فرستنده‌ها برای یه گیرنده
 */
function getTopSendersForReceiver(receiverId, limit = 10) {
  return dbAliases.getTopSendersForReceiver(receiverId, limit);
}

// ============================================================
//  حذف
// ============================================================

function deleteById(id) {
  return dbAliases.deleteById(id);
}

function deleteForUser(userId) {
  return dbAliases.deleteForUser(userId);
}

// ============================================================
//  آمار کلی (ادمین)
// ============================================================

function getGlobalStats() {
  const totalAliases = dbAliases.getTotalCount();
  const averageMessages = dbAliases.getGlobalAverage();

  return {
    total_aliases: totalAliases,
    average_messages_per_alias: averageMessages,
  };
}

// ============================================================
//  خروجی
// ============================================================

module.exports = {
  // ایموجی
  getRandomEmoji,
  getEmojiNotIn,
  EMOJI_POOL,

  // ساخت / دریافت
  getOrCreateAlias,
  createAlias,

  // فرمت
  formatAliasLabel,
  formatAlias,
  formatAliasShort,

  // خواندن
  getById,
  getBySenderReceiver,
  getReceiverAliases,
  getSenderAliases,

  // پیام‌ها
  incrementMessageCount,
  getMessagesForAlias,
  getMessagesCountForAlias,

  // آمار
  getAliasesStats,
  countForReceiver,
  countForSender,
  getTopSendersForReceiver,
  getGlobalStats,

  // حذف
  deleteById,
  deleteForUser,
};