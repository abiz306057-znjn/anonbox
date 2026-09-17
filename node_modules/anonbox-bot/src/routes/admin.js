/**
 * routes/admin.js
 * HTTP API داشبورد مدیریتی
 * نسخه ۳.۰
 *
 * همه مسیرها با prefix کامل — mount: app.use('/api', routes.admin)
 * همه مسیرها نیاز به احراز هویت + ادمین دارن
 *
 * مسیرها:
 *   GET    /api/admin/dashboard              ← داشبورد
 *   GET    /api/admin/users                  ← لیست کاربران
 *   GET    /api/admin/users/:id              ← جزئیات یه کاربر
 *   POST   /api/admin/users/:id/ban          ← بن
 *   POST   /api/admin/users/:id/unban        ← آنبن
 *   POST   /api/admin/users/:id/gift-package ← هدیه بسته
 *   GET    /api/admin/reports                ← لیست گزارش‌ها
 *   POST   /api/admin/reports/:id/resolve    ← بررسی گزارش
 *   GET    /api/admin/payments               ← پرداخت‌ها
 *   GET    /api/admin/messages               ← آخرین پیام‌ها
 *   GET    /api/admin/system                 ← اطلاعات سیستم
 *   POST   /api/admin/maintenance            ← نگهداری
 *   GET    /api/stats/overview               ← آمار کلی
 *   GET    /api/stats/online                 ← کاربران آنلاین
 *   GET    /api/stats/today                  ← آمار امروز
 *   GET    /api/stats/week                   ← آمار هفته
 *   GET    /api/stats/chart/visits           ← نمودار بازدید
 *   GET    /api/stats/chart/users            ← نمودار کاربران
 *   GET    /api/stats/chart/revenue          ← نمودار درآمد
 *   GET    /api/stats/chart/messages         ← نمودار پیام‌ها
 *   GET    /api/stats/languages              ← توزیع زبان
 *   GET    /api/stats/packages               ← توزیع بسته
 *   GET    /api/stats/revenue                ← درآمد
 *   GET    /api/stats/top-users              ← برترین کاربران
 *   GET    /api/stats/advertising-report     ← گزارش تبلیغاتی
 */

const express = require('express');
const router = express.Router();

const config = require('../config');
const i18n = require('../i18n');
const utils = require('../utils');
const middlewares = require('../middlewares');
const userService = require('../services/user');
const messageService = require('../services/message');
const paymentService = require('../services/payment');
const packageService = require('../services/package');
const statsService = require('../services/stats');

// ============================================================
//  Admin — Dashboard
// ============================================================

/**
 * GET /api/admin/dashboard
 * داشبورد کامل
 */
router.get(
  '/admin/dashboard',
  middlewares.verifyTelegram,
  middlewares.adminOnly,
  (req, res, next) => {
    try {
      const overview = statsService.getOverview();
      const online = statsService.getOnlineCount();
      const today = statsService.getTodayStats();

      res.json({
        overview: {
          ...overview,
          online_now: online,
        },
        today,
        server: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          node_version: process.version,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================
//  Admin — Users
// ============================================================

/**
 * GET /api/admin/users
 * لیست کاربران
 */
router.get(
  '/admin/users',
  middlewares.verifyTelegram,
  middlewares.adminOnly,
  (req, res, next) => {
    try {
      const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
      const offset = parseInt(req.query.offset, 10) || 0;
      const filter = req.query.filter || 'all'; // all | vip | banned | active

      const users = statsService.getUsersList({ limit, offset, filter });
      const total = statsService.getUsersCount(filter);

      const formatted = users.map((u) => ({
        telegram_id: u.telegram_id,
        username: u.username,
        first_name: u.first_name,
        language: u.language,
        is_vip: !!u.is_vip,
        is_banned: !!u.is_banned,
        total_received: u.total_received || 0,
        total_sent: u.total_sent || 0,
        referral_count: u.referral_count || 0,
        stars_spent: u.stars_spent || 0,
        visit_count: u.visit_count || 0,
        created_at: u.created_at,
        last_active_at: u.last_active_at,
        is_online: statsService.isUserOnline(u.telegram_id),
      }));

      res.json({
        users: formatted,
        total,
        has_more: offset + users.length < total,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/admin/users/:id
 * جزئیات یه کاربر
 */
router.get(
  '/admin/users/:id',
  middlewares.verifyTelegram,
  middlewares.adminOnly,
  (req, res, next) => {
    try {
      const userId = parseInt(req.params.id, 10);

      if (!userId || isNaN(userId)) {
        return res.status(400).json({
          error: 'INVALID_INPUT',
          message: 'آیدی نامعتبر.',
        });
      }

      const user = userService.getByTelegramId(userId);

      if (!user) {
        return res.status(404).json({
          error: 'NOT_FOUND',
          message: 'کاربر پیدا نشد.',
        });
      }

      const msgStats = messageService.getStatsForUser(userId);
      const pkgStatus = packageService.getActivePackage(userId);
      const payments = paymentService.getForUser(userId, 20);
      const userStats = statsService.getUserStats(userId);

      res.json({
        user: {
          telegram_id: user.telegram_id,
          username: user.username,
          first_name: user.first_name,
          bio: user.bio,
          link_slug: user.link_slug,
          language: user.language,
          is_vip: !!user.is_vip,
          is_banned: !!user.is_banned,
          ban_reason: user.ban_reason,
          vip_expires_at: user.vip_expires_at,
          package_type: user.package_type,
          reply_package_expires_at: user.reply_package_expires_at,
          total_received: user.total_received,
          total_sent: user.total_sent,
          referral_count: user.referral_count,
          stars_spent: user.stars_spent,
          visit_count: user.visit_count,
          created_at: user.created_at,
          last_active_at: user.last_active_at,
          last_seen: user.last_seen,
        },
        stats: userStats,
        message_stats: msgStats,
        package: pkgStatus,
        recent_payments: payments.map((p) => ({
          id: p.id,
          type: p.type,
          amount: p.amount,
          status: p.status,
          completed_at: p.completed_at,
        })),
        is_online: statsService.isUserOnline(userId),
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/admin/users/:id/ban
 * بن کردن کاربر
 */
router.post(
  '/admin/users/:id/ban',
  middlewares.verifyTelegram,
  middlewares.adminOnly,
  (req, res, next) => {
    try {
      const userId = parseInt(req.params.id, 10);
      const { reason } = req.body || {};

      if (!userId || isNaN(userId)) {
        return res.status(400).json({
          error: 'INVALID_INPUT',
          message: 'آیدی نامعتبر.',
        });
      }

      if (userId === config.admin.id) {
        return res.status(400).json({
          error: 'FORBIDDEN',
          message: 'ادمین قابل بن نیست.',
        });
      }

      userService.ban(userId, reason || 'نقض قوانین');

      res.json({
        success: true,
        message: 'کاربر بن شد.',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/admin/users/:id/unban
 * آنبن کردن کاربر
 */
router.post(
  '/admin/users/:id/unban',
  middlewares.verifyTelegram,
  middlewares.adminOnly,
  (req, res, next) => {
    try {
      const userId = parseInt(req.params.id, 10);

      if (!userId || isNaN(userId)) {
        return res.status(400).json({
          error: 'INVALID_INPUT',
          message: 'آیدی نامعتبر.',
        });
      }

      userService.unban(userId);

      res.json({
        success: true,
        message: 'کاربر آنبن شد.',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/admin/users/:id/gift-package
 * هدیه دادن بسته به کاربر
 */
router.post(
  '/admin/users/:id/gift-package',
  middlewares.verifyTelegram,
  middlewares.adminOnly,
  (req, res, next) => {
    try {
      const userId = parseInt(req.params.id, 10);
      const { package_id } = req.body || {};

      if (!userId || isNaN(userId)) {
        return res.status(400).json({
          error: 'INVALID_INPUT',
          message: 'آیدی نامعتبر.',
        });
      }

      if (!package_id || !config.packages[package_id]) {
        return res.status(400).json({
          error: 'INVALID_PACKAGE',
          message: 'بسته نامعتبر.',
        });
      }

      const result = packageService.activatePackage(userId, package_id, {
        source: 'admin_gift',
      });

      res.json({
        success: true,
        expires_at: result.expiresAt,
        message: 'بسته فعال شد.',
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================
//  Admin — Reports
// ============================================================

/**
 * GET /api/admin/reports
 * لیست گزارش‌ها
 */
router.get(
  '/admin/reports',
  middlewares.verifyTelegram,
  middlewares.adminOnly,
  (req, res, next) => {
    try {
      const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
      const status = req.query.status || 'pending'; // pending | all

      const reports = statsService.getReportsList({ limit, status });

      const formatted = reports.map((r) => ({
        id: r.id,
        reporter_id: r.reporter_id,
        message_id: r.message_id,
        reason: r.reason,
        is_reviewed: !!r.is_reviewed,
        created_at: r.created_at,
      }));

      res.json({
        reports: formatted,
        total: formatted.length,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/admin/reports/:id/resolve
 * بررسی گزارش
 */
router.post(
  '/admin/reports/:id/resolve',
  middlewares.verifyTelegram,
  middlewares.adminOnly,
  (req, res, next) => {
    try {
      const reportId = parseInt(req.params.id, 10);

      if (!reportId || isNaN(reportId)) {
        return res.status(400).json({
          error: 'INVALID_INPUT',
          message: 'آیدی نامعتبر.',
        });
      }

      messageService.markReportReviewed(reportId);

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================
//  Admin — Payments
// ============================================================

/**
 * GET /api/admin/payments
 * پرداخت‌های اخیر
 */
router.get(
  '/admin/payments',
  middlewares.verifyTelegram,
  middlewares.adminOnly,
  (req, res, next) => {
    try {
      const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);

      const payments = paymentService.getRecentPayments(limit);

      const formatted = payments.map((p) => ({
        id: p.id,
        user_id: p.user_id,
        type: p.type,
        amount: p.amount,
        currency: p.currency,
        status: p.status,
        created_at: p.created_at,
        completed_at: p.completed_at,
      }));

      res.json({
        payments: formatted,
        total: formatted.length,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================
//  Admin — Messages
// ============================================================

/**
 * GET /api/admin/messages
 * آخرین پیام‌ها (برای مانیتور)
 */
router.get(
  '/admin/messages',
  middlewares.verifyTelegram,
  middlewares.adminOnly,
  (req, res, next) => {
    try {
      const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
      const offset = parseInt(req.query.offset, 10) || 0;

      const messages = statsService.getRecentMessages(limit, offset);

      const formatted = messages.map((m) => ({
        id: m.id,
        receiver_id: m.receiver_id,
        sender_id: m.sender_id,
        content_type: m.content_type,
        content: utils.escapeHtml((m.content || '').substring(0, 100)),
        is_read: !!m.is_read,
        is_reported: !!m.is_reported,
        is_reply: !!m.is_reply,
        created_at: m.created_at,
      }));

      res.json({
        messages: formatted,
        total: formatted.length,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================
//  Admin — System
// ============================================================

/**
 * GET /api/admin/system
 * اطلاعات سیستم
 */
router.get(
  '/admin/system',
  middlewares.verifyTelegram,
  middlewares.adminOnly,
  (req, res, next) => {
    try {
      const memory = process.memoryUsage();
      const uptime = process.uptime();

      const db = require('../db');
      const fs = require('fs');

      let dbSize = 0;
      try {
        const stats = fs.statSync(config.db.path);
        dbSize = stats.size;
      } catch (e) {
        // ignore
      }

      res.json({
        system: {
          node_version: process.version,
          platform: process.platform,
          arch: process.arch,
          uptime: Math.floor(uptime),
          memory: {
            rss: Math.floor(memory.rss / 1024 / 1024),
            heapTotal: Math.floor(memory.heapTotal / 1024 / 1024),
            heapUsed: Math.floor(memory.heapUsed / 1024 / 1024),
            external: Math.floor(memory.external / 1024 / 1024),
          },
        },
        database: {
          size: dbSize,
          size_human: `${(dbSize / 1024 / 1024).toFixed(2)} MB`,
          path: config.db.path,
        },
        config: {
          version: config.app.version,
          env: config.env.nodeEnv,
          admin_id: config.admin.id,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/admin/maintenance
 * عملیات نگهداری
 */
router.post(
  '/admin/maintenance',
  middlewares.verifyTelegram,
  middlewares.adminOnly,
  (req, res, next) => {
    try {
      const { action } = req.body || {};

      const validActions = ['cleanup', 'vacuum', 'analyze', 'backup'];

      if (!action || !validActions.includes(action)) {
        return res.status(400).json({
          error: 'INVALID_INPUT',
          message: 'عملیات نامعتبر.',
        });
      }

      const db = require('../db');
      let result = null;

      if (action === 'cleanup') {
        db.cleanupOldData();
        result = 'پاکسازی قدیمی‌ها انجام شد.';
      } else if (action === 'vacuum') {
        db.prepare('VACUUM').run();
        result = 'فشرده‌سازی دیتابیس انجام شد.';
      } else if (action === 'analyze') {
        db.prepare('ANALYZE').run();
        result = 'تحلیل دیتابیس انجام شد.';
      } else if (action === 'backup') {
        const fs = require('fs');
        const path = require('path');
        const backupDir = path.join(__dirname, '..', '..', 'data', 'backups');

        if (!fs.existsSync(backupDir)) {
          fs.mkdirSync(backupDir, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(backupDir, `backup-${timestamp}.db`);

        fs.copyFileSync(config.db.path, backupPath);
        result = `پشتیبان در ${backupPath} ذخیره شد.`;
      }

      res.json({
        success: true,
        action,
        result,
        timestamp: Math.floor(Date.now() / 1000),
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================
//  Stats — آمار (نیاز به ادمین)
// ============================================================

/**
 * GET /api/stats/overview
 */
router.get(
  '/stats/overview',
  middlewares.verifyTelegram,
  middlewares.adminOnly,
  (req, res, next) => {
    try {
      const overview = statsService.getOverview();
      const onlineCount = statsService.getOnlineCount();

      res.json({
        ...overview,
        online_now: onlineCount,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/stats/online
 */
router.get(
  '/stats/online',
  middlewares.verifyTelegram,
  middlewares.adminOnly,
  (req, res, next) => {
    try {
      const count = statsService.getOnlineCount();

      res.json({
        online_count: count,
        threshold_minutes: 5,
        timestamp: Math.floor(Date.now() / 1000),
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/stats/today
 */
router.get(
  '/stats/today',
  middlewares.verifyTelegram,
  middlewares.adminOnly,
  (req, res, next) => {
    try {
      res.json(statsService.getTodayStats());
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/stats/week
 */
router.get(
  '/stats/week',
  middlewares.verifyTelegram,
  middlewares.adminOnly,
  (req, res, next) => {
    try {
      res.json(statsService.getWeekStats());
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/stats/chart/visits
 */
router.get(
  '/stats/chart/visits',
  middlewares.verifyTelegram,
  middlewares.adminOnly,
  (req, res, next) => {
    try {
      const days = Math.min(parseInt(req.query.days, 10) || 7, 90);
      const data = statsService.getVisitsChart(days);

      res.json({ days, data });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/stats/chart/users
 */
router.get(
  '/stats/chart/users',
  middlewares.verifyTelegram,
  middlewares.adminOnly,
  (req, res, next) => {
    try {
      const days = Math.min(parseInt(req.query.days, 10) || 7, 90);
      const data = statsService.getNewUsersChart(days);

      res.json({ days, data });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/stats/chart/revenue
 */
router.get(
  '/stats/chart/revenue',
  middlewares.verifyTelegram,
  middlewares.adminOnly,
  (req, res, next) => {
    try {
      const days = Math.min(parseInt(req.query.days, 10) || 7, 90);
      const data = statsService.getRevenueChart(days);

      res.json({ days, currency: 'XTR', data });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/stats/chart/messages
 */
router.get(
  '/stats/chart/messages',
  middlewares.verifyTelegram,
  middlewares.adminOnly,
  (req, res, next) => {
    try {
      const days = Math.min(parseInt(req.query.days, 10) || 7, 90);
      const data = statsService.getMessagesChart(days);

      res.json({ days, data });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/stats/languages
 */
router.get(
  '/stats/languages',
  middlewares.verifyTelegram,
  middlewares.adminOnly,
  (req, res, next) => {
    try {
      const languages = statsService.getLanguageDistribution();

      res.json({ languages });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/stats/packages
 */
router.get(
  '/stats/packages',
  middlewares.verifyTelegram,
  middlewares.adminOnly,
  (req, res, next) => {
    try {
      const packages = statsService.getPackageDistribution();

      res.json({ packages });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/stats/revenue
 */
router.get(
  '/stats/revenue',
  middlewares.verifyTelegram,
  middlewares.adminOnly,
  (req, res, next) => {
    try {
      const full = paymentService.getFullRevenueStats();

      res.json(full);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/stats/top-users
 */
router.get(
  '/stats/top-users',
  middlewares.verifyTelegram,
  middlewares.adminOnly,
  (req, res, next) => {
    try {
      const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
      const type = req.query.type || 'referrals'; // referrals | messages | spent | visits

      const topUsers = statsService.getTopUsers(type, limit);

      res.json({ type, users: topUsers });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/stats/advertising-report
 * گزارش تبلیغاتی
 */
router.get(
  '/stats/advertising-report',
  middlewares.verifyTelegram,
  middlewares.adminOnly,
  (req, res, next) => {
    try {
      const days = Math.min(parseInt(req.query.days, 10) || 30, 365);
      const report = statsService.getAdvertisingReport(days);

      res.json(report);
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================
//  خروجی
// ============================================================

module.exports = router;