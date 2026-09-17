/**
 * routes/referral.js
 * HTTP API سیستم دعوت دوستان
 * نسخه ۳.۰
 *
 * همه مسیرها با prefix کامل — mount: app.use('/api', routes.referral)
 *
 * مسیرها:
 *   GET    /api/referrals             ← لیست دعوت‌شده‌ها
 *   GET    /api/referrals/stats       ← آمار کامل
 *   GET    /api/referrals/rewards     ← لیست پاداش‌ها
 *   GET    /api/referrals/link        ← لینک دعوت
 *   GET    /api/referrals/leaderboard ← لیدربورد
 */

const express = require('express');
const router = express.Router();

const config = require('../config');
const i18n = require('../i18n');
const utils = require('../utils');
const middlewares = require('../middlewares');
const referralService = require('../services/referral');
const userService = require('../services/user');

// ============================================================
//  GET /api/referrals
//  لیست دعوت‌شده‌ها
// ============================================================

router.get('/referrals', middlewares.verifyTelegram, (req, res, next) => {
  try {
    const user = req.user;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);

    const referrals = referralService.getReferrals(user.telegram_id, limit);

    const formatted = referrals.map((r) => ({
      telegram_id: r.telegram_id,
      first_name: r.first_name,
      username: r.username,
      created_at: r.created_at,
    }));

    res.json({ referrals: formatted });
  } catch (error) {
    next(error);
  }
});

// ============================================================
//  GET /api/referrals/stats
//  آمار کامل دعوت‌ها
// ============================================================

router.get('/referrals/stats', middlewares.verifyTelegram, (req, res, next) => {
  try {
    const user = req.user;
    const stats = referralService.getStats(user.telegram_id);
    const next = referralService.getNextRewards(user.telegram_id);

    res.json({
      total: stats.total || 0,
      active: stats.active || 0,
      rewards: stats.rewards || 0,

      // تفکیک پاداش‌ها
      reward_breakdown: {
        hours24: stats.breakdown?.hours24 || 0,
        weeks: stats.breakdown?.weeks || 0,
        months: stats.breakdown?.months || 0,
        reply_packages: stats.breakdown?.replyPackages || 0,
        total_days: stats.totalDays || 0,
      },

      // پاداش‌های بعدی
      next_rewards: {
        to_next_week: next.toNextWeek || 0,
        to_next_month: next.toNextMonth || 0,
        to_next_reply: next.toNextReply || 0,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================
//  GET /api/referrals/rewards
//  لیست پاداش‌ها
// ============================================================

router.get('/referrals/rewards', middlewares.verifyTelegram, (req, res, next) => {
  try {
    const user = req.user;
    const stats = referralService.getStats(user.telegram_id);
    const b = stats.breakdown || {};

    // لیست پاداش‌های کسب‌شده
    const rewards = [];

    if (b.hours24 > 0) {
      rewards.push({
        type: '24h_unlimited',
        count: b.hours24,
        description: `${b.hours24} × ۲۴ ساعت نامحدود`,
        unlocked: true,
      });
    }

    if (b.weeks > 0) {
      rewards.push({
        type: 'weekly_unlimited',
        count: b.weeks,
        description: `${b.weeks} × ۱ هفته نامحدود`,
        unlocked: true,
      });
    }

    if (b.months > 0) {
      rewards.push({
        type: 'monthly_unlimited',
        count: b.months,
        description: `${b.months} × ۱ ماه نامحدود`,
        unlocked: true,
      });
    }

    if (b.replyPackages > 0) {
      rewards.push({
        type: 'reply_package',
        count: b.replyPackages,
        description: `${b.replyPackages} × بسته پاسخ ۱ ماهه`,
        unlocked: true,
      });
    }

    res.json({
      referral_count: stats.total || 0,
      total_days: stats.totalDays || 0,
      rewards,
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================
//  GET /api/referrals/link
//  لینک دعوت
// ============================================================

router.get('/referrals/link', middlewares.verifyTelegram, (req, res, next) => {
  try {
    const user = req.user;
    const link = utils.buildReferralLink(config.bot.username, user.link_slug);

    res.json({
      link,
      slug: user.link_slug,
      bot_username: config.bot.username,
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================
//  GET /api/referrals/leaderboard
//  لیدربورد
// ============================================================

router.get('/referrals/leaderboard', middlewares.verifyTelegram, (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
    const top = referralService.getTopReferrers(limit);

    const formatted = top.map((t, index) => ({
      rank: index + 1,
      first_name: t.first_name || 'کاربر',
      username: t.username,
      referral_count: t.referral_count,
      is_vip: !!t.is_vip,
    }));

    res.json({ leaderboard: formatted });
  } catch (error) {
    next(error);
  }
});

// ============================================================
//  خروجی
// ============================================================

module.exports = router;