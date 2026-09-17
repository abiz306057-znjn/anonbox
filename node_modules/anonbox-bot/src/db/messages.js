/**
 * db/messages.js
 * کوئری‌های جدول messages, blocks, reports
 * نسخه ۳.۰ — با alias، فیلتر، پاسخ
 */

const db = require('./index');
const config = require('../config');

// ============================================================
//  Prepared Statements — messages
// ============================================================

const statements = {
  // ---- ساخت ----
  createMessage: db.prepare(`
    INSERT INTO messages (
      receiver_id, sender_id, sender_telegram_id, alias_id,
      content_type, content, file_id, file_url, caption,
      is_reply, original_message_id
    ) VALUES (
      @receiver_id, @sender_id, @sender_telegram_id, @alias_id,
      @content_type, @content, @file_id, @file_url, @caption,
      @is_reply, @original_message_id
    )
  `),

  // ---- خواندن ----
  getById: db.prepare('SELECT * FROM messages WHERE id = ?'),

  getForUser: db.prepare(`
    SELECT * FROM messages
    WHERE receiver_id = ? AND is_deleted = 0
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `),

  getForUserWithFilter: db.prepare(`
    SELECT * FROM messages
    WHERE receiver_id = ? AND is_deleted = 0
      AND (@filter = 'all' 
           OR (@filter = 'unread' AND is_read = 0)
           OR (@filter = 'revealed' AND is_revealed = 1))
    ORDER BY created_at DESC
    LIMIT @limit OFFSET @offset
  `),

  getUnreadForUser: db.prepare(`
    SELECT * FROM messages
    WHERE receiver_id = ? AND is_read = 0 AND is_deleted = 0
    ORDER BY created_at DESC
  `),

  getByAlias: db.prepare(`
    SELECT * FROM messages
    WHERE alias_id = ? AND is_deleted = 0
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `),

  getRepliesForMessage: db.prepare(`
    SELECT * FROM messages
    WHERE original_message_id = ? AND is_reply = 1 AND is_deleted = 0
    ORDER BY created_at ASC
  `),

  getRecent: db.prepare(`
    SELECT * FROM messages
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `),

  // ---- آمار ----
  statsForUser: db.prepare(`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN is_read = 0 AND is_deleted = 0 THEN 1 ELSE 0 END) AS unread,
      SUM(CASE WHEN is_revealed = 1 THEN 1 ELSE 0 END) AS revealed
    FROM messages
    WHERE receiver_id = ? AND is_deleted = 0
  `),

  countForUserWithFilter: db.prepare(`
    SELECT COUNT(*) AS count
    FROM messages
    WHERE receiver_id = ? AND is_deleted = 0
      AND (@filter = 'all' 
           OR (@filter = 'unread' AND is_read = 0)
           OR (@filter = 'revealed' AND is_revealed = 1))
  `),

  countTodayBySender: db.prepare(`
    SELECT COUNT(*) AS count FROM messages
    WHERE sender_telegram_id = ?
      AND created_at >= strftime('%s', 'now', 'start of day')
  `),

  countLastHourBySender: db.prepare(`
    SELECT COUNT(*) AS count FROM messages
    WHERE sender_telegram_id = ?
      AND created_at >= strftime('%s', 'now', '-1 hour')
  `),

  // ---- آپدیت ----
  markRead: db.prepare(`
    UPDATE messages
    SET is_read = 1, read_at = strftime('%s', 'now')
    WHERE id = ?
  `),

  markRevealed: db.prepare('UPDATE messages SET is_revealed = 1 WHERE id = ?'),
  markReported: db.prepare('UPDATE messages SET is_reported = 1 WHERE id = ?'),
  markDeleted: db.prepare('UPDATE messages SET is_deleted = 1 WHERE id = ?'),

  markAllReadForUser: db.prepare(`
    UPDATE messages
    SET is_read = 1, read_at = strftime('%s', 'now')
    WHERE receiver_id = ? AND is_read = 0
  `),

  // ---- حذف ----
  deleteById: db.prepare('DELETE FROM messages WHERE id = ?'),
  deleteAllForUser: db.prepare('DELETE FROM messages WHERE receiver_id = ?'),

  // ---- آمار کلی ----
  totalCount: db.prepare('SELECT COUNT(*) AS count FROM messages'),

  todayCount: db.prepare(`
    SELECT COUNT(*) AS count FROM messages
    WHERE created_at >= strftime('%s', 'now', 'start of day')
  `),

  // ---- نمودار ----
  countByDay: db.prepare(`
    SELECT 
      date(created_at, 'unixepoch') as date,
      COUNT(*) as count
    FROM messages
    WHERE created_at >= ?
    GROUP BY date(created_at, 'unixepoch')
    ORDER BY date ASC
  `),
};

// ============================================================
//  Prepared Statements — blocks
// ============================================================

const blockStatements = {
  block: db.prepare(`
    INSERT OR IGNORE INTO blocks (blocker_id, blocked_id) VALUES (?, ?)
  `),

  unblock: db.prepare('DELETE FROM blocks WHERE blocker_id = ? AND blocked_id = ?'),

  isBlocked: db.prepare('SELECT 1 FROM blocks WHERE blocker_id = ? AND blocked_id = ? LIMIT 1'),

  getBlockList: db.prepare(`
    SELECT blocked_id, created_at FROM blocks
    WHERE blocker_id = ?
    ORDER BY created_at DESC
  `),
};

// ============================================================
//  Prepared Statements — reports
// ============================================================

const reportStatements = {
  create: db.prepare(`
    INSERT INTO reports (reporter_id, message_id, reason) VALUES (?, ?, ?)
  `),

  getPending: db.prepare(`
    SELECT * FROM reports
    WHERE is_reviewed = 0
    ORDER BY created_at DESC
    LIMIT ?
  `),

  getAll: db.prepare(`
    SELECT * FROM reports
    ORDER BY created_at DESC
    LIMIT ?
  `),

  markReviewed: db.prepare(`
    UPDATE reports 
    SET is_reviewed = 1, reviewed_at = strftime('%s', 'now')
    WHERE id = ?
  `),
};

// ============================================================
//  توابع — messages
// ============================================================

function createMessage(data) {
  const result = statements.createMessage.run({
    receiver_id: data.receiver_id,
    sender_id: data.sender_id || null,
    sender_telegram_id: data.sender_telegram_id || null,
    alias_id: data.alias_id || null,
    content_type: data.content_type || 'text',
    content: data.content || null,
    file_id: data.file_id || null,
    file_url: data.file_url || null,
    caption: data.caption || null,
    is_reply: data.is_reply ? 1 : 0,
    original_message_id: data.original_message_id || null,
  });

  return statements.getById.get(result.lastInsertRowid);
}

function getById(id) {
  return statements.getById.get(id);
}

function getForUser(userId, limit = 50, offset = 0) {
  return statements.getForUser.all(userId, limit, offset);
}

function getForUserWithFilter(userId, filter = 'all', limit = 50, offset = 0) {
  return statements.getForUserWithFilter.all({ userId, filter, limit, offset });
}

function getUnreadForUser(userId) {
  return statements.getUnreadForUser.all(userId);
}

function getByAlias(aliasId, limit = 50, offset = 0) {
  return statements.getByAlias.all(aliasId, limit, offset);
}

function getRepliesForMessage(messageId) {
  return statements.getRepliesForMessage.all(messageId);
}

function getRecent(limit = 50, offset = 0) {
  return statements.getRecent.all(limit, offset);
}

function getStatsForUser(userId) {
  const stats = statements.statsForUser.get(userId);
  return {
    total: stats.total || 0,
    unread: stats.unread || 0,
    revealed: stats.revealed || 0,
  };
}

function getTotalCountForUser(userId, filter = 'all') {
  const result = statements.countForUserWithFilter.get({ userId, filter });
  return result.count || 0;
}

function countTodayBySender(senderId) {
  return statements.countTodayBySender.get(senderId).count || 0;
}

function countLastHourBySender(senderId) {
  return statements.countLastHourBySender.get(senderId).count || 0;
}

function markRead(id) {
  return statements.markRead.run(id);
}

function markRevealed(id) {
  return statements.markRevealed.run(id);
}

function markReported(id, reporterId, reason = null) {
  const tx = db.transaction(() => {
    statements.markReported.run(id);
    reportStatements.create.run(reporterId, id, reason);
  });
  return tx();
}

function markDeleted(id) {
  return statements.markDeleted.run(id);
}

function markAllReadForUser(userId) {
  return statements.markAllReadForUser.run(userId);
}

function deleteById(id) {
  return statements.deleteById.run(id);
}

function deleteAllForUser(userId) {
  return statements.deleteAllForUser.run(userId);
}

function getTotalCount() {
  return statements.totalCount.get().count || 0;
}

function getTodayCount() {
  return statements.todayCount.get().count || 0;
}

function getMessagesChart(days = 7) {
  const now = Math.floor(Date.now() / 1000);
  const from = now - days * 24 * 60 * 60;

  const rows = statements.countByDay.all(from);

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

// ============================================================
//  توابع — blocks
// ============================================================

function blockUser(blockerId, blockedId) {
  return blockStatements.block.run(blockerId, blockedId);
}

function unblockUser(blockerId, blockedId) {
  return blockStatements.unblock.run(blockerId, blockedId);
}

function isBlocked(blockerId, blockedId) {
  return !!blockStatements.isBlocked.get(blockerId, blockedId);
}

function getBlockList(blockerId) {
  return blockStatements.getBlockList.all(blockerId);
}

// ============================================================
//  توابع — reports
// ============================================================

function getPendingReports(limit = 20) {
  return reportStatements.getPending.all(limit);
}

function getAllReports(limit = 100) {
  return reportStatements.getAll.all(limit);
}

function markReportReviewed(reportId) {
  return reportStatements.markReviewed.run(reportId);
}

// ============================================================
//  خروجی
// ============================================================

module.exports = {
  // messages
  createMessage,
  getById,
  getForUser,
  getForUserWithFilter,
  getUnreadForUser,
  getByAlias,
  getRepliesForMessage,
  getRecent,
  getStatsForUser,
  getTotalCountForUser,
  countTodayBySender,
  countLastHourBySender,
  markRead,
  markRevealed,
  markReported,
  markDeleted,
  markAllReadForUser,
  deleteById,
  deleteAllForUser,
  getTotalCount,
  getTodayCount,
  getMessagesChart,

  // blocks
  blockUser,
  unblockUser,
  isBlocked,
  getBlockList,

  // reports
  getPendingReports,
  getAllReports,
  markReportReviewed,
};