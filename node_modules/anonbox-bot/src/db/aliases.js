/**
 * db/aliases.js
 * کوئری‌های جدول sender_aliases
 * نسخه ۳.۰ — شناسه‌های ناشناس (ایموجی + شماره)
 */

const db = require('./index');
const config = require('../config');

// ============================================================
//  Prepared Statements
// ============================================================

const statements = {
  // ---- خواندن ----
  getById: db.prepare('SELECT * FROM sender_aliases WHERE id = ?'),

  getBySenderReceiver: db.prepare(`
    SELECT * FROM sender_aliases
    WHERE sender_id = ? AND receiver_id = ?
  `),

  getReceiverAliases: db.prepare(`
    SELECT * FROM sender_aliases
    WHERE receiver_id = ?
    ORDER BY last_message_at DESC NULLS LAST, created_at DESC
  `),

  getSenderAliases: db.prepare(`
    SELECT * FROM sender_aliases
    WHERE sender_id = ?
    ORDER BY created_at DESC
  `),

  // ---- آخرین شماره برای گیرنده ----
  getLastNumberForReceiver: db.prepare(`
    SELECT MAX(alias_number) as max_number
    FROM sender_aliases
    WHERE receiver_id = ?
  `),

  // ---- شمارش ----
  countForReceiver: db.prepare(`
    SELECT COUNT(*) as count FROM sender_aliases WHERE receiver_id = ?
  `),

  countForSender: db.prepare(`
    SELECT COUNT(*) as count FROM sender_aliases WHERE sender_id = ?
  `),

  totalCount: db.prepare('SELECT COUNT(*) as count FROM sender_aliases'),

  // ---- ساخت ----
  create: db.prepare(`
    INSERT INTO sender_aliases (
      sender_id, receiver_id, emoji, alias_number, alias_label, 
      message_count, last_message_at
    ) VALUES (
      @sender_id, @receiver_id, @emoji, @alias_number, @alias_label, 
      0, strftime('%s', 'now')
    )
  `),

  // ---- آپدیت ----
  incrementMessageCount: db.prepare(`
    UPDATE sender_aliases
    SET message_count = message_count + 1,
        last_message_at = strftime('%s', 'now')
    WHERE id = ?
  `),

  updateLastMessageAt: db.prepare(`
    UPDATE sender_aliases
    SET last_message_at = strftime('%s', 'now')
    WHERE id = ?
  `),

  // ---- آمار ----
  statsForReceiver: db.prepare(`
    SELECT 
      COUNT(*) as total_aliases,
      COALESCE(SUM(message_count), 0) as total_messages,
      COALESCE(AVG(message_count), 0) as average_per_alias
    FROM sender_aliases
    WHERE receiver_id = ?
  `),

  mostActiveForReceiver: db.prepare(`
    SELECT * FROM sender_aliases
    WHERE receiver_id = ?
    ORDER BY message_count DESC
    LIMIT 1
  `),

  // ---- برترین فرستنده‌ها ----
  topSendersForReceiver: db.prepare(`
    SELECT * FROM sender_aliases
    WHERE receiver_id = ?
    ORDER BY message_count DESC
    LIMIT ?
  `),

  // ---- حذف ----
  deleteById: db.prepare('DELETE FROM sender_aliases WHERE id = ?'),

  deleteForUser: db.prepare(`
    DELETE FROM sender_aliases
    WHERE sender_id = ? OR receiver_id = ?
  `),

  deleteForSender: db.prepare('DELETE FROM sender_aliases WHERE sender_id = ?'),

  deleteForReceiver: db.prepare('DELETE FROM sender_aliases WHERE receiver_id = ?'),

  // ---- میانگین کلی ----
  globalAverage: db.prepare(`
    SELECT COALESCE(AVG(message_count), 0) as avg
    FROM sender_aliases
    WHERE message_count > 0
  `),
};

// ============================================================
//  خواندن
// ============================================================

function getById(id) {
  return statements.getById.get(id);
}

function getBySenderReceiver(senderId, receiverId) {
  return statements.getBySenderReceiver.get(senderId, receiverId);
}

function getReceiverAliases(receiverId) {
  return statements.getReceiverAliases.all(receiverId);
}

function getSenderAliases(senderId) {
  return statements.getSenderAliases.all(senderId);
}

function getLastNumberForReceiver(receiverId) {
  const result = statements.getLastNumberForReceiver.get(receiverId);
  return result?.max_number || 0;
}

// ============================================================
//  شمارش
// ============================================================

function countForReceiver(receiverId) {
  return statements.countForReceiver.get(receiverId).count || 0;
}

function countForSender(senderId) {
  return statements.countForSender.get(senderId).count || 0;
}

function getTotalCount() {
  return statements.totalCount.get().count || 0;
}

// ============================================================
//  ساخت
// ============================================================

function create(data) {
  const result = statements.create.run({
    sender_id: data.sender_id,
    receiver_id: data.receiver_id,
    emoji: data.emoji,
    alias_number: data.alias_number,
    alias_label: data.alias_label,
  });

  return statements.getById.get(result.lastInsertRowid);
}

// ============================================================
//  آپدیت
// ============================================================

function incrementMessageCount(aliasId) {
  return statements.incrementMessageCount.run(aliasId);
}

function updateLastMessageAt(aliasId) {
  return statements.updateLastMessageAt.run(aliasId);
}

// ============================================================
//  آمار
// ============================================================

function getStatsForReceiver(receiverId) {
  const stats = statements.statsForReceiver.get(receiverId);

  return {
    totalAliases: stats.total_aliases || 0,
    totalMessages: stats.total_messages || 0,
    averagePerAlias: Math.round(stats.average_per_alias || 0),
  };
}

function getMostActiveForReceiver(receiverId) {
  return statements.mostActiveForReceiver.get(receiverId);
}

function getTopSendersForReceiver(receiverId, limit = 10) {
  return statements.topSendersForReceiver.all(receiverId, limit);
}

function getGlobalAverage() {
  return Math.round(statements.globalAverage.get().avg || 0);
}

// ============================================================
//  حذف
// ============================================================

function deleteById(id) {
  return statements.deleteById.run(id);
}

function deleteForUser(userId) {
  return statements.deleteForUser.run(userId, userId);
}

function deleteForSender(senderId) {
  return statements.deleteForSender.run(senderId);
}

function deleteForReceiver(receiverId) {
  return statements.deleteForReceiver.run(receiverId);
}

// ============================================================
//  خروجی
// ============================================================

module.exports = {
  // خواندن
  getById,
  getBySenderReceiver,
  getReceiverAliases,
  getSenderAliases,
  getLastNumberForReceiver,

  // شمارش
  countForReceiver,
  countForSender,
  getTotalCount,

  // ساخت
  create,

  // آپدیت
  incrementMessageCount,
  updateLastMessageAt,

  // آمار
  getStatsForReceiver,
  getMostActiveForReceiver,
  getTopSendersForReceiver,
  getGlobalAverage,

  // حذف
  deleteById,
  deleteForUser,
  deleteForSender,
  deleteForReceiver,
};