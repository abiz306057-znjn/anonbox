/**
 * db/users.js
 * کوئری‌های جدول users
 * نسخه ۳.۰ — با زبان، بسته، رایگان روزانه
 */

const db = require('./index');
const config = require('../config');

// ============================================================
//  Prepared Statements
// ============================================================

const statements = {
  // ---- خواندن ----
  getByTelegramId: db.prepare('SELECT * FROM users WHERE telegram_id = ?'),
  getBySlug: db.prepare('SELECT * FROM users WHERE link_slug = ?'),
  getById: db.prepare('SELECT * FROM users WHERE id = ?'),

  // ---- ساخت ----
  create: db.prepare(`
    INSERT INTO users (
      telegram_id, username, first_name, last_name, language_code,
      language, link_slug, referred_by
    ) VALUES (
      @telegram_id, @username, @first_name, @last_name, @language_code,
      @language, @link_slug, @referred_by
    )
  `),

  // ---- آپدیت ----
  updateProfile: db.prepare(`
    UPDATE users
    SET username = @username,
        first_name = @first_name,
        last_name = @last_name,
        last_active_at = strftime('%s', 'now'),
        last_seen = strftime('%s', 'now')
    WHERE telegram_id = @telegram_id
  `),

  updateFields: db.prepare(`
    UPDATE users
    SET first_name = COALESCE(@first_name, first_name),
        bio = COALESCE(@bio, bio),
        link_slug = COALESCE(@link_slug, link_slug),
        language = COALESCE(@language, language),
        last_active_at = strftime('%s', 'now')
    WHERE telegram_id = @telegram_id
  `),

  updateBio: db.prepare('UPDATE users SET bio = ? WHERE telegram_id = ?'),
  updateFirstName: db.prepare('UPDATE users SET first_name = ? WHERE telegram_id = ?'),
  updateSlug: db.prepare('UPDATE users SET link_slug = ? WHERE telegram_id = ?'),
  updateLanguage: db.prepare('UPDATE users SET language = ? WHERE telegram_id = ?'),

  touchLastActive: db.prepare(`
    UPDATE users 
    SET last_active_at = strftime('%s', 'now'),
        last_seen = strftime('%s', 'now')
    WHERE telegram_id = ?
  `),

  touchLastSeen: db.prepare(`
    UPDATE users SET last_seen = strftime('%s', 'now') WHERE telegram_id = ?
  `),

  incrementVisitCount: db.prepare(`
    UPDATE users SET visit_count = visit_count + 1 WHERE telegram_id = ?
  `),

  // ---- آمار ----
  incrementReceived: db.prepare('UPDATE users SET total_received = total_received + 1 WHERE telegram_id = ?'),
  incrementSent: db.prepare('UPDATE users SET total_sent = total_sent + 1 WHERE telegram_id = ?'),
  incrementRevealed: db.prepare('UPDATE users SET total_revealed = total_revealed + 1 WHERE telegram_id = ?'),
  incrementReferralCount: db.prepare('UPDATE users SET referral_count = referral_count + 1 WHERE telegram_id = ?'),
  addStarsSpent: db.prepare('UPDATE users SET stars_spent = stars_spent + ? WHERE telegram_id = ?'),

  // ---- بسته‌ها ----
  activatePackage: db.prepare(`
    UPDATE users 
    SET is_vip = 1, 
        vip_expires_at = ?, 
        package_type = ?
    WHERE telegram_id = ?
  `),

  activateReplyPackage: db.prepare(`
    UPDATE users SET reply_package_expires_at = ? WHERE telegram_id = ?
  `),

  deactivatePackage: db.prepare(`
    UPDATE users 
    SET is_vip = 0, vip_expires_at = NULL, package_type = NULL 
    WHERE telegram_id = ?
  `),

  deactivateReplyPackage: db.prepare(`
    UPDATE users SET reply_package_expires_at = NULL WHERE telegram_id = ?
  `),

  // ---- رایگان روزانه ----
  incrementDailyFree: db.prepare(`
    UPDATE users 
    SET daily_free_used = daily_free_used + 1 
    WHERE telegram_id = ?
  `),

  resetDailyFree: db.prepare(`
    UPDATE users 
    SET daily_free_used = 0, daily_free_reset_at = ? 
    WHERE telegram_id = ?
  `),

  // ---- بن ----
  ban: db.prepare('UPDATE users SET is_banned = 1, ban_reason = ? WHERE telegram_id = ?'),
  unban: db.prepare('UPDATE users SET is_banned = 0, ban_reason = NULL WHERE telegram_id = ?'),

  // ---- حذف ----
  delete: db.prepare('DELETE FROM users WHERE telegram_id = ?'),

  // ---- آمار کلی ----
  globalStats: db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM users) AS totalUsers,
      (SELECT COUNT(*) FROM users 
       WHERE is_vip = 1 AND vip_expires_at > strftime('%s', 'now')) AS activePackages,
      (SELECT COUNT(*) FROM users WHERE is_banned = 1) AS bannedUsers,
      (SELECT COUNT(*) FROM users 
       WHERE created_at >= strftime('%s', 'now', 'start of day')) AS newUsersToday,
      (SELECT COUNT(*) FROM users 
       WHERE last_seen > strftime('%s', 'now', '-1 day')) AS activeToday
  `),

  // ---- لیست ----
  list: db.prepare(`
    SELECT telegram_id, username, first_name, language, is_vip, is_banned,
           created_at, last_active_at, last_seen, package_type
    FROM users
    ORDER BY created_at DESC
    LIMIT ?
  `),

  listFiltered: db.prepare(`
    SELECT * FROM users
    WHERE (@filter = 'all' 
           OR (@filter = 'vip' AND is_vip = 1 AND vip_expires_at > strftime('%s', 'now'))
           OR (@filter = 'banned' AND is_banned = 1)
           OR (@filter = 'active' AND last_seen > strftime('%s', 'now', '-1 day')))
    ORDER BY created_at DESC
    LIMIT @limit OFFSET @offset
  `),

  countFiltered: db.prepare(`
    SELECT COUNT(*) as count FROM users
    WHERE (@filter = 'all' 
           OR (@filter = 'vip' AND is_vip = 1 AND vip_expires_at > strftime('%s', 'now'))
           OR (@filter = 'banned' AND is_banned = 1)
           OR (@filter = 'active' AND last_seen > strftime('%s', 'now', '-1 day')))
  `),

  // ---- بسته‌های منقضی ----
  expiredPackages: db.prepare(`
    SELECT telegram_id FROM users
    WHERE is_vip = 1 AND vip_expires_at <= strftime('%s', 'now')
  `),

  expiredReplyPackages: db.prepare(`
    SELECT telegram_id FROM users
    WHERE reply_package_expires_at IS NOT NULL 
      AND reply_package_expires_at <= strftime('%s', 'now')
  `),

  // ---- آنلاین ----
  onlineCount: db.prepare(`
    SELECT COUNT(*) AS count FROM users
    WHERE last_seen > strftime('%s', 'now', '-5 minutes')
  `),

  // ---- توزیع زبان ----
  languageDistribution: db.prepare(`
    SELECT language, COUNT(*) as count
    FROM users
    GROUP BY language
    ORDER BY count DESC
  `),

  // ---- توزیع بسته ----
  packageDistribution: db.prepare(`
    SELECT package_type, COUNT(*) as count
    FROM users
    WHERE is_vip = 1 AND vip_expires_at > strftime('%s', 'now')
    GROUP BY package_type
    ORDER BY count DESC
  `),

  // ---- برترین‌ها ----
  topReferrers: db.prepare(`
    SELECT telegram_id, first_name, username, referral_count, is_vip
    FROM users
    WHERE referral_count > 0
    ORDER BY referral_count DESC
    LIMIT ?
  `),

  topByMessages: db.prepare(`
    SELECT telegram_id, first_name, username, total_received, total_sent
    FROM users
    ORDER BY total_received DESC
    LIMIT ?
  `),

  topBySpent: db.prepare(`
    SELECT telegram_id, first_name, username, stars_spent
    FROM users
    WHERE stars_spent > 0
    ORDER BY stars_spent DESC
    LIMIT ?
  `),

  // ---- بازدیدها (v3) ----
  topByVisits: db.prepare(`
    SELECT telegram_id, first_name, username, visit_count
    FROM users
    WHERE visit_count > 0
    ORDER BY visit_count DESC
    LIMIT ?
  `),
};

// ============================================================
//  خواندن
// ============================================================

function getByTelegramId(telegramId) {
  return statements.getByTelegramId.get(telegramId);
}

function getBySlug(slug) {
  return statements.getBySlug.get(slug);
}

function getById(id) {
  return statements.getById.get(id);
}

// ============================================================
//  ساخت
// ============================================================

function create(data) {
  statements.create.run({
    telegram_id: data.telegram_id,
    username: data.username || null,
    first_name: data.first_name || null,
    last_name: data.last_name || null,
    language_code: data.language_code || 'fa',
    language: data.language || 'fa',
    link_slug: data.link_slug,
    referred_by: data.referred_by || null,
  });

  return getByTelegramId(data.telegram_id);
}

// ============================================================
//  آپدیت
// ============================================================

function updateProfile(telegramId, data) {
  return statements.updateProfile.run({
    telegram_id: telegramId,
    username: data.username ?? null,
    first_name: data.first_name ?? null,
    last_name: data.last_name ?? null,
  });
}

function updateFields(telegramId, data) {
  return statements.updateFields.run({
    telegram_id: telegramId,
    first_name: data.first_name ?? null,
    bio: data.bio ?? null,
    link_slug: data.link_slug ?? null,
    language: data.language ?? null,
  });
}

function updateBio(telegramId, bio) {
  return statements.updateBio.run(bio, telegramId);
}

function updateFirstName(telegramId, firstName) {
  return statements.updateFirstName.run(firstName, telegramId);
}

function updateSlug(telegramId, slug) {
  return statements.updateSlug.run(slug, telegramId);
}

function updateLanguage(telegramId, language) {
  return statements.updateLanguage.run(language, telegramId);
}

function touchLastActive(telegramId) {
  return statements.touchLastActive.run(telegramId);
}

function touchLastSeen(telegramId) {
  return statements.touchLastSeen.run(telegramId);
}

function incrementVisitCount(telegramId) {
  return statements.incrementVisitCount.run(telegramId);
}

// ============================================================
//  آمار
// ============================================================

function incrementReceived(telegramId) {
  return statements.incrementReceived.run(telegramId);
}

function incrementSent(telegramId) {
  return statements.incrementSent.run(telegramId);
}

function incrementRevealed(telegramId) {
  return statements.incrementRevealed.run(telegramId);
}

function incrementReferralCount(telegramId) {
  return statements.incrementReferralCount.run(telegramId);
}

function addStarsSpent(telegramId, amount) {
  return statements.addStarsSpent.run(amount, telegramId);
}

// ============================================================
//  بسته‌ها
// ============================================================

function activatePackage(telegramId, expiresAt, packageType = null) {
  return statements.activatePackage.run(expiresAt, packageType, telegramId);
}

function activateReplyPackage(telegramId, expiresAt) {
  return statements.activateReplyPackage.run(expiresAt, telegramId);
}

function deactivatePackage(telegramId) {
  return statements.deactivatePackage.run(telegramId);
}

function deactivateReplyPackage(telegramId) {
  return statements.deactivateReplyPackage.run(telegramId);
}

// ============================================================
//  رایگان روزانه
// ============================================================

function incrementDailyFree(telegramId) {
  return statements.incrementDailyFree.run(telegramId);
}

function resetDailyFree(telegramId, resetAt) {
  return statements.resetDailyFree.run(resetAt, telegramId);
}

// ============================================================
//  بن
// ============================================================

function ban(telegramId, reason = null) {
  return statements.ban.run(reason, telegramId);
}

function unban(telegramId) {
  return statements.unban.run(telegramId);
}

function deleteUser(telegramId) {
  return statements.delete.run(telegramId);
}

// ============================================================
//  آمار کلی
// ============================================================

function getGlobalStats() {
  return statements.globalStats.get();
}

function list(limit = 100) {
  return statements.list.all(limit);
}

function listFiltered(limit = 50, offset = 0, filter = 'all') {
  return statements.listFiltered.all({ limit, offset, filter });
}

function countFiltered(filter = 'all') {
  return statements.countFiltered.get({ filter }).count || 0;
}

function getExpiredPackages() {
  return statements.expiredPackages.all();
}

function getExpiredReplyPackages() {
  return statements.expiredReplyPackages.all();
}

function getOnlineCount() {
  return statements.onlineCount.get().count || 0;
}

function getLanguageDistribution() {
  return statements.languageDistribution.all();
}

function getPackageDistribution() {
  return statements.packageDistribution.all();
}

// ============================================================
//  برترین‌ها
// ============================================================

function getTopReferrers(limit = 10) {
  return statements.topReferrers.all(limit);
}

function getTopByMessages(limit = 10) {
  return statements.topByMessages.all(limit);
}

function getTopBySpent(limit = 10) {
  return statements.topBySpent.all(limit);
}

function getTopByVisits(limit = 10) {
  return statements.topByVisits.all(limit);
}

// ============================================================
//  خروجی
// ============================================================

module.exports = {
  // خواندن
  getByTelegramId,
  getBySlug,
  getById,

  // ساخت
  create,

  // آپدیت
  updateProfile,
  updateFields,
  updateBio,
  updateFirstName,
  updateSlug,
  updateLanguage,
  touchLastActive,
  touchLastSeen,
  incrementVisitCount,

  // آمار
  incrementReceived,
  incrementSent,
  incrementRevealed,
  incrementReferralCount,
  addStarsSpent,

  // بسته‌ها
  activatePackage,
  activateReplyPackage,
  deactivatePackage,
  deactivateReplyPackage,

  // رایگان روزانه
  incrementDailyFree,
  resetDailyFree,

  // بن
  ban,
  unban,
  delete: deleteUser,

  // آمار کلی
  getGlobalStats,
  list,
  listFiltered,
  countFiltered,
  getExpiredPackages,
  getExpiredReplyPackages,
  getOnlineCount,
  getLanguageDistribution,
  getPackageDistribution,

  // برترین‌ها
  getTopReferrers,
  getTopByMessages,
  getTopBySpent,
  getTopByVisits,
};