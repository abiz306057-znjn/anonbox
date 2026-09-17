/**
 * db/packages.js
 * کوئری‌های جدول package_activations + referral_rewards
 * نسخه ۳.۰ — لاگ فعال‌سازی بسته‌ها و پاداش‌های دعوت
 */

const db = require('./index');
const config = require('../config');

// ============================================================
//  Prepared Statements — package_activations
// ============================================================

const activationStatements = {
  // ---- ساخت ----
  create: db.prepare(`
    INSERT INTO package_activations (
      user_id, package_type, source, duration_days,
      started_at, expires_at, payment_id, referral_count_at_activation
    ) VALUES (
      @user_id, @package_type, @source, @duration_days,
      @started_at, @expires_at, @payment_id, @referral_count_at_activation
    )
  `),

  // ---- خواندن ----
  getById: db.prepare('SELECT * FROM package_activations WHERE id = ?'),

  getForUser: db.prepare(`
    SELECT * FROM package_activations
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT ?
  `),

  getActiveForUser: db.prepare(`
    SELECT * FROM package_activations
    WHERE user_id = ? AND expires_at > strftime('%s', 'now')
    ORDER BY expires_at DESC
  `),

  getLatestForUser: db.prepare(`
    SELECT * FROM package_activations
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 1
  `),

  getByType: db.prepare(`
    SELECT * FROM package_activations
    WHERE package_type = ?
    ORDER BY created_at DESC
    LIMIT ?
  `),

  // ---- آمار ----
  countByType: db.prepare(`
    SELECT package_type, COUNT(*) as count
    FROM package_activations
    GROUP BY package_type
  `),

  countBySource: db.prepare(`
    SELECT source, COUNT(*) as count
    FROM package_activations
    GROUP BY source
  `),

  totalActivations: db.prepare(`
    SELECT COUNT(*) as count FROM package_activations
  `),

  todayActivations: db.prepare(`
    SELECT COUNT(*) as count FROM package_activations
    WHERE created_at >= strftime('%s', 'now', 'start of day')
  `),

  // ---- پاکسازی ----
  deleteExpired: db.prepare(`
    DELETE FROM package_activations
    WHERE expires_at < ? AND source != 'purchase'
  `),
};

// ============================================================
//  Prepared Statements — referral_rewards
// ============================================================

const rewardStatements = {
  // ---- ساخت ----
  create: db.prepare(`
    INSERT INTO referral_rewards (
      user_id, reward_type, reward_value, awarded_at, threshold_reached
    ) VALUES (
      @user_id, @reward_type, @reward_value, @awarded_at, @threshold_reached
    )
  `),

  // ---- خواندن ----
  getById: db.prepare('SELECT * FROM referral_rewards WHERE id = ?'),

  getForUser: db.prepare(`
    SELECT * FROM referral_rewards
    WHERE user_id = ?
    ORDER BY awarded_at DESC
    LIMIT ?
  `),

  getUnconsumedForUser: db.prepare(`
    SELECT * FROM referral_rewards
    WHERE user_id = ? AND is_consumed = 0
    ORDER BY awarded_at ASC
  `),

  getByType: db.prepare(`
    SELECT * FROM referral_rewards
    WHERE user_id = ? AND reward_type = ?
    ORDER BY awarded_at DESC
  `),

  countForUser: db.prepare(`
    SELECT reward_type, COUNT(*) as count
    FROM referral_rewards
    WHERE user_id = ?
    GROUP BY reward_type
  `),

  // ---- آپدیت ----
  markConsumed: db.prepare(`
    UPDATE referral_rewards
    SET is_consumed = 1, consumed_at = strftime('%s', 'now')
    WHERE id = ?
  `),

  markAllConsumedForUser: db.prepare(`
    UPDATE referral_rewards
    SET is_consumed = 1, consumed_at = strftime('%s', 'now')
    WHERE user_id = ? AND is_consumed = 0
  `),

  // ---- آمار ----
  totalAwarded: db.prepare(`
    SELECT COUNT(*) as count FROM referral_rewards
  `),

  byType: db.prepare(`
    SELECT reward_type, COUNT(*) as count, SUM(reward_value) as total_value
    FROM referral_rewards
    GROUP BY reward_type
  `),
};

// ============================================================
//  توابع — package_activations
// ============================================================

function createActivation(data) {
  const now = Math.floor(Date.now() / 1000);

  const result = activationStatements.create.run({
    user_id: data.user_id,
    package_type: data.package_type,
    source: data.source || 'purchase',
    duration_days: data.duration_days,
    started_at: data.started_at || now,
    expires_at: data.expires_at,
    payment_id: data.payment_id || null,
    referral_count_at_activation: data.referral_count_at_activation || null,
  });

  return activationStatements.getById.get(result.lastInsertRowid);
}

function getActivationById(id) {
  return activationStatements.getById.get(id);
}

function getActivationsForUser(userId, limit = 20) {
  return activationStatements.getForUser.all(userId, limit);
}

function getActiveActivationsForUser(userId) {
  return activationStatements.getActiveForUser.all(userId);
}

function getLatestActivationForUser(userId) {
  return activationStatements.getLatestForUser.get(userId);
}

function getActivationsByType(packageType, limit = 50) {
  return activationStatements.getByType.all(packageType, limit);
}

function getActivationCountByType() {
  return activationStatements.countByType.all();
}

function getActivationCountBySource() {
  return activationStatements.countBySource.all();
}

function getTotalActivations() {
  return activationStatements.totalActivations.get().count || 0;
}

function getTodayActivations() {
  return activationStatements.todayActivations.get().count || 0;
}

function deleteExpiredActivations() {
  const now = Math.floor(Date.now() / 1000);
  return activationStatements.deleteExpired.run(now);
}

// ============================================================
//  توابع — referral_rewards
// ============================================================

function createReward(data) {
  const now = Math.floor(Date.now() / 1000);

  const result = rewardStatements.create.run({
    user_id: data.user_id,
    reward_type: data.reward_type,
    reward_value: data.reward_value,
    awarded_at: data.awarded_at || now,
    threshold_reached: data.threshold_reached,
  });

  return rewardStatements.getById.get(result.lastInsertRowid);
}

function getRewardById(id) {
  return rewardStatements.getById.get(id);
}

function getRewardsForUser(userId, limit = 50) {
  return rewardStatements.getForUser.all(userId, limit);
}

function getUnconsumedRewardsForUser(userId) {
  return rewardStatements.getUnconsumedForUser.all(userId);
}

function getRewardsByType(userId, rewardType) {
  return rewardStatements.getByType.all(userId, rewardType);
}

function getRewardCountsForUser(userId) {
  return rewardStatements.countForUser.all(userId);
}

function markRewardConsumed(rewardId) {
  return rewardStatements.markConsumed.run(rewardId);
}

function markAllRewardsConsumedForUser(userId) {
  return rewardStatements.markAllConsumedForUser.run(userId);
}

function getTotalRewardsAwarded() {
  return rewardStatements.totalAwarded.get().count || 0;
}

function getRewardsByTypeStats() {
  return rewardStatements.byType.all();
}

// ============================================================
//  آمار ترکیبی
// ============================================================

/**
 * آمار کامل بسته‌ها
 */
function getFullPackageStats() {
  const byType = getActivationCountByType();
  const bySource = getActivationCountBySource();

  const typeMap = {};
  byType.forEach((row) => {
    typeMap[row.package_type] = row.count;
  });

  const sourceMap = {};
  bySource.forEach((row) => {
    sourceMap[row.source] = row.count;
  });

  return {
    total: getTotalActivations(),
    today: getTodayActivations(),
    by_type: typeMap,
    by_source: sourceMap,
  };
}

/**
 * آمار پاداش‌های دعوت
 */
function getReferralRewardStats() {
  const byType = getRewardsByTypeStats();

  const typeMap = {};
  byType.forEach((row) => {
    typeMap[row.reward_type] = {
      count: row.count,
      total_value: row.total_value || 0,
    };
  });

  return {
    total: getTotalRewardsAwarded(),
    by_type: typeMap,
  };
}

// ============================================================
//  خروجی
// ============================================================

module.exports = {
  // package_activations
  createActivation,
  getActivationById,
  getActivationsForUser,
  getActiveActivationsForUser,
  getLatestActivationForUser,
  getActivationsByType,
  getActivationCountByType,
  getActivationCountBySource,
  getTotalActivations,
  getTodayActivations,
  deleteExpiredActivations,

  // referral_rewards
  createReward,
  getRewardById,
  getRewardsForUser,
  getUnconsumedRewardsForUser,
  getRewardsByType,
  getRewardCountsForUser,
  markRewardConsumed,
  markAllRewardsConsumedForUser,
  getTotalRewardsAwarded,
  getRewardsByTypeStats,

  // آمار ترکیبی
  getFullPackageStats,
  getReferralRewardStats,
};