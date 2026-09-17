/**
 * services/referral.js
 * منطق کاری سیستم دعوت دوستان
 * نسخه ۳.۰ — پاداش‌های تکرارپذیر
 *
 * سیستم پاداش:
 *   - هر ۱ دعوت = +۲۴ ساعت نامحدود
 *   - هر ۳ دعوت = +۱ هفته نامحدود (تکرارپذیر)
 *   - هر ۱۰ دعوت = +۱ ماه نامحدود (تکرارپذیر)
 *   - هر ۱۰ دعوت = + بسته پاسخ ۱ ماهه (تکرارپذیر)
 *
 * مثال ۱۰ دعوت:
 *   ۱۰ روز (هر دعوت)
 *   + ۱ هفته (۳ دعوت)
 *   + ۱ هفته (۳ دعوت دوم)
 *   + ۱ هفته (۳ دعوت سوم)
 *   + ۱ ماه (۱۰ دعوت)
 *   + ۱ بسته پاسخ
 *   = ۱۰ + ۲۱ + ۳۰ = ۶۱ روز + بسته پاسخ
 */

const db = require('../db');
const dbUsers = require('../db/users');
const dbPackages = require('../db/packages');
const packageService = require('./package');
const config = require('../config');

// ============================================================
//  ثبت دعوت
// ============================================================

/**
 * ثبت دعوت جدید
 */
function registerReferral(referrerTelegramId, referredTelegramId) {
  // جلوگیری از خود-دعوتی
  if (referrerTelegramId === referredTelegramId) {
    return null;
  }

  const referrer = dbUsers.getByTelegramId(referrerTelegramId);
  if (!referrer) {
    throw new Error('REFERRER_NOT_FOUND');
  }

  const referred = dbUsers.getByTelegramId(referredTelegramId);
  if (!referred) {
    throw new Error('REFERRED_NOT_FOUND');
  }

  // اگه قبلاً توسط کسی دیگه دعوت شده
  if (referred.referred_by && referred.referred_by !== referrerTelegramId) {
    return null;
  }

  // اگه قبلاً همین کاربر دعوتش کرده
  if (referred.referred_by === referrerTelegramId) {
    return null;
  }

  // ---- تراکنش ----
  const tx = db.transaction(() => {
    // آپدیت referred_by
    db.prepare(`
      UPDATE users
      SET referred_by = ?
      WHERE telegram_id = ? AND (referred_by IS NULL OR referred_by = ?)
    `).run(referrerTelegramId, referredTelegramId, referrerTelegramId);

    // افزایش شمارنده
    dbUsers.incrementReferralCount(referrerTelegramId);
  });

  tx();

  // ---- بررسی و اعمال پاداش‌ها ----
  const newCount = (referrer.referral_count || 0) + 1;
  const rewards = applyReferralRewards(referrerTelegramId, newCount);

  return {
    success: true,
    newCount,
    rewards,
  };
}

// ============================================================
//  اعمال پاداش‌ها (تکرارپذیر)
// ============================================================

/**
 * اعمال همه پاداش‌های قابل دریافت بر اساس تعداد دعوت
 */
function applyReferralRewards(userId, referralCount) {
  const rewards = [];

  // ---- پاداش ۲۴ ساعته (هر ۱ دعوت) ----
  // هر دعوت = +۱ روز
  // این پاداش به‌صورت تجمعی اضافه می‌شه
  // یعنی با هر دعوت، ۱ روز به VIP اضافه می‌شه
  // (توی حلقه نیازی نیست، چون خود registerReferral دونه‌دونه اضافه می‌کنه)

  const hoursPerInvite = config.referral.hoursPerInvite; // 24

  // ---- پاداش هفتگی (هر ۳ دعوت) ----
  const threeThreshold = config.referral.threeInvites.threshold; // 3
  if (referralCount % threeThreshold === 0) {
    rewards.push({
      type: 'weekly',
      days: config.referral.threeInvites.days, // 7
      threshold: referralCount,
    });
  }

  // ---- پاداش ماهانه (هر ۱۰ دعوت) ----
  const tenThreshold = config.referral.tenInvites.threshold; // 10
  if (referralCount % tenThreshold === 0) {
    rewards.push({
      type: 'monthly',
      days: config.referral.tenInvites.days, // 30
      threshold: referralCount,
    });

    // ---- بسته پاسخ رایگان (هر ۱۰ دعوت) ----
    if (config.referral.tenInvites.giveReplyPackage) {
      rewards.push({
        type: 'reply',
        days: 30,
        threshold: referralCount,
      });
    }
  }

  // ---- اعمال هر پاداش ----
  const applied = rewards.map((reward) => {
    return applySingleReward(userId, reward, referralCount);
  });

  return applied.filter(Boolean);
}

/**
 * اعمال یه پاداش خاص
 */
function applySingleReward(userId, reward, referralCount) {
  const now = Math.floor(Date.now() / 1000);
  const user = dbUsers.getByTelegramId(userId);
  if (!user) return null;

  // ---- فعال‌سازی از طریق packageService ----
  const result = packageService.activatePackage(userId, reward.type, {
    source: 'referral_reward',
    days: reward.days,
    referralCount,
  });

  if (!result.success) {
    return null;
  }

  // ---- لاگ پاداش ----
  try {
    dbPackages.createReward({
      user_id: userId,
      reward_type: reward.type,
      reward_value: reward.days,
      awarded_at: now,
      threshold_reached: referralCount,
    });
  } catch (err) {
    console.error('خطا در لاگ پاداش:', err);
  }

  return {
    type: reward.type,
    days: reward.days,
    expiresAt: result.expiresAt,
  };
}

// ============================================================
//  آمار دعوت
// ============================================================

/**
 * آمار کامل دعوت‌های کاربر
 */
function getStats(telegramId) {
  const user = dbUsers.getByTelegramId(telegramId);

  if (!user) {
    return {
      total: 0,
      active: 0,
      rewards: 0,
      breakdown: {},
    };
  }

  const total = user.referral_count || 0;

  // ---- دعوت‌شده‌های فعال ----
  // (اونا که حداقل ۱ پیام فرستادن یا دریافت کردن)
  const activeRow = db
    .prepare(`
      SELECT COUNT(*) AS count FROM users
      WHERE referred_by = ?
        AND (total_sent > 0 OR total_received > 0)
    `)
    .get(telegramId);

  const active = activeRow?.count || 0;

  // ---- محاسبه breakdown ----
  const threeThreshold = config.referral.threeInvites.threshold;
  const tenThreshold = config.referral.tenInvites.threshold;

  const breakdown = {
    // ۲۴ ساعته = تعداد دعوت (هر دعوت = ۱ روز)
    hours24: total,

    // هفتگی = هر ۳ دعوت
    weeks: Math.floor(total / threeThreshold),

    // ماهانه = هر ۱۰ دعوت
    months: Math.floor(total / tenThreshold),

    // بسته پاسخ = هر ۱۰ دعوت
    replyPackages: Math.floor(total / tenThreshold),
  };

  // ---- کل روزهای اضافه‌شده ----
  const totalDays =
    total * 1 + // هر دعوت = ۱ روز
    breakdown.weeks * config.referral.threeInvites.days + // هر هفته = ۷ روز
    breakdown.months * config.referral.tenInvites.days; // هر ماه = ۳۰ روز

  // ---- تعداد پاداش‌ها ----
  const rewards =
    breakdown.weeks + breakdown.months + breakdown.replyPackages;

  return {
    total,
    active,
    rewards,
    breakdown,
    totalDays,
  };
}

// ============================================================
//  لیست دعوت‌شده‌ها
// ============================================================

function getReferrals(telegramId, limit = 50) {
  return db.prepare(`
    SELECT telegram_id, first_name, username, created_at
    FROM users
    WHERE referred_by = ?
    ORDER BY created_at DESC
    LIMIT ?
  `).all(telegramId, limit);
}

// ============================================================
//  لیدربورد
// ============================================================

function getTopReferrers(limit = 10) {
  return db.prepare(`
    SELECT telegram_id, first_name, username, referral_count, is_vip
    FROM users
    WHERE referral_count > 0
    ORDER BY referral_count DESC
    LIMIT ?
  `).all(limit);
}

// ============================================================
//  پاداش‌های کاربر
// ============================================================

/**
 * لیست پاداش‌های دریافت‌شده کاربر
 */
function getRewards(telegramId) {
  return dbPackages.getRewardsForUser(telegramId, 100);
}

/**
 * پاداش‌های بعدی (برای نمایش progress)
 */
function getNextRewards(telegramId) {
  const user = dbUsers.getByTelegramId(telegramId);

  const threeThreshold = config.referral.threeInvites.threshold;
  const tenThreshold = config.referral.tenInvites.threshold;

  if (!user) {
    return {
      toNextWeek: threeThreshold,
      toNextMonth: tenThreshold,
      toNextReply: tenThreshold,
    };
  }

  const count = user.referral_count || 0;

  const toNextWeek = threeThreshold - (count % threeThreshold);
  const toNextMonth = tenThreshold - (count % tenThreshold);

  return {
    // چند دعوت مونده تا پاداش هفتگی بعدی
    toNextWeek: toNextWeek === threeThreshold ? 0 : toNextWeek,

    // چند دعوت مونده تا پاداش ماهانه بعدی
    toNextMonth: toNextMonth === tenThreshold ? 0 : toNextMonth,

    // چند دعوت مونده تا بسته پاسخ بعدی (همون آستانه ۱۰)
    toNextReply: toNextMonth === tenThreshold ? 0 : toNextMonth,
  };
}

// ============================================================
//  پاکسازی
// ============================================================

/**
 * حذف referrals کاربر (وقتی حذف می‌شه)
 */
function clearReferrals(telegramId) {
  return db.prepare(`
    UPDATE users SET referred_by = NULL WHERE referred_by = ?
  `).run(telegramId);
}

// ============================================================
//  آمار کلی (ادمین)
// ============================================================

function getGlobalReferralStats() {
  const totalReferrals = db
    .prepare('SELECT COUNT(*) as count FROM users WHERE referred_by IS NOT NULL')
    .get().count;

  const activeReferrers = db
    .prepare('SELECT COUNT(*) as count FROM users WHERE referral_count > 0')
    .get().count;

  const totalRewards = dbPackages.getTotalRewardsAwarded();

  return {
    total_referrals: totalReferrals,
    active_referrers: activeReferrers,
    total_rewards_awarded: totalRewards,
  };
}

// ============================================================
//  خروجی
// ============================================================

module.exports = {
  // ثبت
  registerReferral,

  // پاداش
  applyReferralRewards,
  applySingleReward,

  // آمار
  getStats,
  getReferrals,
  getTopReferrers,
  getRewards,
  getNextRewards,

  // پاکسازی
  clearReferrals,

  // ادمین
  getGlobalReferralStats,
};