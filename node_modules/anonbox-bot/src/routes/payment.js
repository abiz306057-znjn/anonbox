/**
 * routes/payment.js
 * HTTP API پرداخت‌ها + بسته‌ها
 * نسخه ۳.۰
 *
 * همه مسیرها با prefix کامل — mount در server.js: app.use('/api', routes.payment)
 *
 * مسیرها:
 *   GET    /api/payments              ← لیست پرداخت‌ها
 *   GET    /api/payments/summary      ← خلاصه درآمد
 *   POST   /api/payments/package      ← خرید بسته
 *   GET    /api/payments/package/:id  ← اطلاعات یه بسته
 *   GET    /api/packages              ← لیست همه بسته‌ها (public)
 *   GET    /api/packages/list         ← لیست ساده
 *   GET    /api/packages/prices       ← فقط قیمت‌ها
 *   GET    /api/packages/user/current ← بسته فعلی کاربر
 *   GET    /api/packages/referral-info← اطلاعات پاداش دعوت
 *   GET    /api/packages/:id          ← جزئیات یه بسته
 *   GET    /api/packages/compare      ← جدول مقایسه
 */

const express = require('express');
const router = express.Router();

const config = require('../config');
const i18n = require('../i18n');
const utils = require('../utils');
const middlewares = require('../middlewares');
const paymentService = require('../services/payment');
const packageService = require('../services/package');
const userService = require('../services/user');

// ============================================================
//  Public — بسته‌ها (بدون احراز هویت)
// ============================================================

/**
 * GET /api/packages
 * لیست همه بسته‌ها
 */
router.get('/packages', (req, res, next) => {
  try {
    const lang = config.languages.supported.includes(req.query.lang)
      ? req.query.lang
      : config.languages.default;

    const packages = packageService.getAllPackages(lang);

    res.json({
      packages,
      currency: 'XTR',
      language: lang,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/packages/list
 * لیست ساده بسته‌ها
 */
router.get('/packages/list', (req, res, next) => {
  try {
    const packages = Object.values(config.packages).map((p) => ({
      id: p.id,
      price: p.price,
      days: p.days,
      icon: p.icon,
    }));

    res.json({ packages });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/packages/prices
 * فقط قیمت‌ها (برای نمایش سریع)
 */
router.get('/packages/prices', (req, res, next) => {
  try {
    res.json({
      weekly: config.packages.weekly.price,
      monthly: config.packages.monthly.price,
      yearly: config.packages.yearly.price,
      reply: config.packages.reply.price,
      free_daily: config.free.dailyMessages,
      currency: 'XTR',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/packages/referral-info
 * اطلاعات پاداش‌های دعوت
 */
router.get('/packages/referral-info', (req, res, next) => {
  try {
    const lang = config.languages.supported.includes(req.query.lang)
      ? req.query.lang
      : config.languages.default;

    const t = i18n.getTranslator(lang);

    res.json({
      reward_per_invite: {
        hours: config.referral.hoursPerInvite,
        description: t('packages.referralRewards'),
      },
      three_invites: {
        reward: 'weekly',
        days: config.referral.threeInvites.days,
      },
      ten_invites: {
        reward: 'monthly',
        days: config.referral.tenInvites.days,
      },
      ten_invites_reply: {
        reward: 'reply',
        days: 30,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/packages/compare
 * جدول مقایسه
 */
router.get('/packages/compare', (req, res, next) => {
  try {
    const lang = config.languages.supported.includes(req.query.lang)
      ? req.query.lang
      : config.languages.default;

    const comparison = packageService.getComparison(lang);

    res.json(comparison);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/packages/:id
 * جزئیات یه بسته
 */
router.get('/packages/:id', (req, res, next) => {
  try {
    const packageId = req.params.id;

    // اگه مسیرهای خاص بالا بودن، این‌جا فقط id واقعی میاد
    if (['list', 'prices', 'compare', 'referral-info'].includes(packageId)) {
      return next(); // جلوگیری از تداخل (اما ترتیب مهمه)
    }

    const lang = config.languages.supported.includes(req.query.lang)
      ? req.query.lang
      : config.languages.default;

    const pkg = packageService.getPackageDetails(packageId, lang);

    if (!pkg) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'بسته پیدا نشد.',
      });
    }

    res.json(pkg);
  } catch (error) {
    next(error);
  }
});

// ============================================================
//  Protected — پرداخت‌ها
// ============================================================

/**
 * GET /api/payments
 * لیست پرداخت‌های کاربر
 */
router.get('/payments', middlewares.verifyTelegram, (req, res, next) => {
  try {
    const user = req.user;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);

    const payments = paymentService.getForUser(user.telegram_id, limit);

    const formatted = payments.map((p) => ({
      id: p.id,
      type: p.type,
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      created_at: p.created_at,
      completed_at: p.completed_at,
    }));

    res.json({ payments: formatted });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/payments/summary
 * خلاصه خریدهای کاربر
 */
router.get('/payments/summary', middlewares.verifyTelegram, (req, res, next) => {
  try {
    const user = req.user;
    const stats = paymentService.getUserPurchaseStats(user.telegram_id);

    res.json({
      total_payments: stats.total_payments,
      total_spent: stats.total_spent,
      currency: 'XTR',
      by_type: stats.by_type,
      last_payment_at: stats.last_payment_at,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/payments/package
 * درخواست خرید بسته
 */
router.post('/payments/package', middlewares.verifyTelegram, (req, res, next) => {
  try {
    const user = req.user;
    const { package_id } = req.body || {};

    if (!package_id) {
      return res.status(400).json({
        error: 'INVALID_INPUT',
        message: 'شناسه بسته ارسال نشده.',
      });
    }

    // ---- چک بسته ----
    const pkg = config.packages[package_id];

    if (!pkg) {
      return res.status(400).json({
        error: 'INVALID_PACKAGE',
        message: 'بسته نامعتبر.',
      });
    }

    // ---- چک بسته reply ----
    if (package_id === 'reply') {
      const messageService = require('../services/message');
      const stats = messageService.getStatsForUser(user.telegram_id);

      if (stats.total === 0) {
        return res.status(400).json({
          error: 'INVALID_PACKAGE',
          message: 'برای خرید بسته پاسخ، ابتدا باید پیامی دریافت کنید.',
        });
      }
    }

    // ---- ساخت فاکتور ----
    const invoice = paymentService.buildInvoice(package_id, user.telegram_id, user.language);

    res.json({
      success: true,
      invoice,
      package: {
        id: pkg.id,
        name: pkg.name[user.language] || pkg.name.fa,
        price: pkg.price,
        days: pkg.days,
        icon: pkg.icon,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/payments/package/:id
 * اطلاعات یه بسته خاص
 */
router.get('/payments/package/:id', middlewares.verifyTelegram, (req, res, next) => {
  try {
    const packageId = req.params.id;
    const pkg = config.packages[packageId];

    if (!pkg) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'بسته پیدا نشد.',
      });
    }

    res.json({
      id: pkg.id,
      name: pkg.name,
      price: pkg.price,
      days: pkg.days,
      icon: pkg.icon,
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================
//  Protected — بسته فعلی کاربر
// ============================================================

/**
 * GET /api/packages/user/current
 * بسته فعلی کاربر
 */
router.get('/packages/user/current', middlewares.verifyTelegram, (req, res, next) => {
  try {
    const user = req.user;
    const status = packageService.getActivePackage(user.telegram_id);

    res.json({
      has_package: status.hasPackage,
      package_id: status.packageId || null,
      package_name: status.name || null,
      expires_at: status.expiresAt || null,
      days_left: status.daysLeft || 0,

      has_reply_package: status.hasReplyPackage,
      reply_expires_at: status.replyExpiresAt || null,
      reply_days_left: status.replyDaysLeft || 0,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/packages/check/:id
 * چک دسترسی کاربر به یه بسته
 */
router.get('/packages/check/:id', middlewares.verifyTelegram, (req, res, next) => {
  try {
    const packageId = req.params.id;
    const user = req.user;

    if (!config.packages[packageId]) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'بسته پیدا نشد.',
      });
    }

    const hasAccess = packageService.hasPackage(user.telegram_id, packageId);

    res.json({
      package_id: packageId,
      has_access: hasAccess,
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================
//  خروجی
// ============================================================

module.exports = router;