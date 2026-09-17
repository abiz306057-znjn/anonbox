/**
 * routes/user.js
 * HTTP API کاربران
 * نسخه ۳.۰
 *
 * مسیرها (بسته به mount):
 *   GET    /api/me              ← اطلاعات کاربر
 *   GET    /api/me/stats        ← آمار
 *   GET    /api/me/vip          ← وضعیت بسته
 *   GET    /api/me/blocks       ← لیست بلاک
 *   GET    /api/me/aliases      ← لیست alias
 *   PATCH  /api/me              ← آپدیت پروفایل
 *   PATCH  /api/me/bio          ← آپدیت بیو
 *   PATCH  /api/me/name         ← آپدیت نام
 *   PATCH  /api/me/slug         ← آپدیت اسلاگ
 *   PATCH  /api/me/language     ← آپدیت زبان
 *   DELETE /api/me              ← حذف حساب
 *   DELETE /api/me/blocks/:id   ← آنبلاک
 *   GET    /api/slug/check      ← چک اسلاگ
 *   GET    /api/profile/:slug   ← پروفایل عمومی (public)
 *   GET    /api/users/:id       ← اطلاعات یه کاربر
 */

const express = require('express');
const router = express.Router();

const config = require('../config');
const i18n = require('../i18n');
const utils = require('../utils');
const userService = require('../services/user');
const messageService = require('../services/message');
const packageService = require('../services/package');
const statsService = require('../services/stats');
const aliasService = require('../services/alias');

// ============================================================
//  Public — بدون احراز هویت
// ============================================================

/**
 * GET /api/profile/:slug
 * پروفایل عمومی کاربر
 */
router.get('/profile/:slug', (req, res, next) => {
  try {
    const slug = req.params.slug;

    if (!slug) {
      return res.status(400).json({
        error: 'INVALID_INPUT',
        message: 'اسلاگ نامعتبر.',
      });
    }

    const user = userService.getBySlug(slug);

    if (!user) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'پروفایل پیدا نشد.',
      });
    }

    if (user.is_banned) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'پروفایل پیدا نشد.',
      });
    }

    // اطلاعات عمومی (بدون اطلاعات حساس)
    res.json({
      telegram_id: user.telegram_id,
      first_name: user.first_name,
      username: user.username,
      bio: user.bio || '',
      link_slug: user.link_slug,
      total_received: user.total_received || 0,
      is_vip: !!(user.is_vip && user.vip_expires_at > Date.now() / 1000),
      member_since: user.created_at,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/slug/check?slug=ali_2024
 * چک در دسترس بودن اسلاگ
 */
router.get('/slug/check', (req, res, next) => {
  try {
    const slug = req.query.slug ? String(req.query.slug).trim().toLowerCase() : '';

    if (!slug) {
      return res.status(400).json({
        error: 'INVALID_INPUT',
        message: 'اسلاگ ارسال نشده.',
      });
    }

    // اعتبارسنجی فرمت
    if (!utils.isValidSlug(slug)) {
      return res.json({
        available: false,
        slug,
        reason: 'INVALID_FORMAT',
      });
    }

    // چک تکراری
    const existing = userService.getBySlug(slug);

    res.json({
      available: !existing,
      slug,
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================
//  احراز هویت شده — نیاز به req.user
// ============================================================

/**
 * GET /api/me
 * اطلاعات کامل کاربر
 */
router.get('/', (req, res, next) => {
  try {
    const user = req.user;

    // وضعیت بسته
    const packageStatus = packageService.getActivePackage(user.telegram_id);

    // رایگان روزانه
    const dailyFree = statsService.getDailyFreeStats(user.telegram_id);

    // تعداد خوانده‌نشده
    const msgStats = messageService.getStatsForUser(user.telegram_id);

    // لیست بلاک
    const blocks = messageService.getBlockList(user.telegram_id);

    res.json({
      // اطلاعات پایه
      telegram_id: user.telegram_id,
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
      bio: user.bio || '',
      link_slug: user.link_slug,
      language: user.language || config.languages.default,

      // وضعیت
      is_banned: !!user.is_banned,
      is_vip: !!packageStatus.hasPackage,
      vip_expires_at: user.vip_expires_at || null,
      package_type: user.package_type || null,

      // بسته
      package: packageStatus.hasPackage
        ? {
            id: packageStatus.packageId,
            name: packageStatus.name,
            expires_at: packageStatus.expiresAt,
            days_left: packageStatus.daysLeft,
          }
        : null,

      // بسته پاسخ
      has_reply_package: packageStatus.hasReplyPackage,
      reply_package_expires_at: packageStatus.replyExpiresAt,
      reply_days_left: packageStatus.replyDaysLeft || 0,

      // آمار
      total_received: user.total_received || 0,
      total_sent: user.total_sent || 0,
      total_revealed: user.total_revealed || 0,
      referral_count: user.referral_count || 0,
      stars_spent: user.stars_spent || 0,
      visit_count: user.visit_count || 0,

      // شمارنده‌ها
      unread_count: msgStats.unread || 0,
      blocked_count: blocks.length || 0,

      // رایگان روزانه
      daily_free: {
        limit: dailyFree.limit,
        used: dailyFree.used,
        remaining: dailyFree.remaining,
      },

      // زمان‌ها
      created_at: user.created_at,
      last_active_at: user.last_active_at,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/me/stats
 * آمار کاربر
 */
router.get('/stats', (req, res, next) => {
  try {
    const user = req.user;

    const stats = statsService.getUserStats(user.telegram_id);

    if (!stats) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'کاربر پیدا نشد.',
      });
    }

    res.json(stats);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/me/vip
 * وضعیت بسته VIP
 */
router.get('/vip', (req, res, next) => {
  try {
    const user = req.user;

    const status = packageService.getActivePackage(user.telegram_id);

    res.json({
      has_package: status.hasPackage,
      is_active: status.hasPackage,
      package_id: status.packageId,
      package_name: status.name,
      expires_at: status.expiresAt,
      days_remaining: status.daysLeft || 0,

      // بسته پاسخ
      has_reply_package: status.hasReplyPackage,
      reply_expires_at: status.replyExpiresAt,
      reply_days_remaining: status.replyDaysLeft || 0,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/me/blocks
 * لیست بلاک‌شده‌ها
 */
router.get('/blocks', (req, res, next) => {
  try {
    const user = req.user;

    const blockedIds = messageService.getBlockList(user.telegram_id);

    const blocks = blockedIds
      .map((b) => {
        const u = userService.getByTelegramId(b.blocked_id);
        if (!u) return null;

        return {
          telegram_id: u.telegram_id,
          first_name: u.first_name,
          username: u.username,
          blocked_at: b.created_at,
        };
      })
      .filter(Boolean);

    res.json({ blocks });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/me/aliases
 * لیست aliasهای کاربر (به‌عنوان گیرنده)
 */
router.get('/aliases', (req, res, next) => {
  try {
    const user = req.user;

    const aliases = aliasService.getReceiverAliases(user.telegram_id);

    const formatted = aliases.map((a) => ({
      id: a.id,
      label: aliasService.formatAlias(a),
      emoji: a.emoji,
      number: a.alias_number,
      message_count: a.message_count || 0,
      last_message_at: a.last_message_at || null,
      created_at: a.created_at,
    }));

    res.json({
      aliases: formatted,
      total: formatted.length,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/me/aliases/:id
 * جزئیات یه alias
 */
router.get('/aliases/:id', (req, res, next) => {
  try {
    const user = req.user;
    const aliasId = parseInt(req.params.id, 10);

    if (!aliasId || isNaN(aliasId)) {
      return res.status(400).json({
        error: 'INVALID_INPUT',
        message: 'آیدی نامعتبر.',
      });
    }

    const alias = aliasService.getById(aliasId);

    if (!alias || alias.receiver_id !== user.telegram_id) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'شناسه پیدا نشد.',
      });
    }

    res.json({
      id: alias.id,
      label: aliasService.formatAlias(alias),
      emoji: alias.emoji,
      number: alias.alias_number,
      message_count: alias.message_count || 0,
      last_message_at: alias.last_message_at,
      created_at: alias.created_at,
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================
//  آپدیت‌ها
// ============================================================

/**
 * PATCH /api/me
 * آپدیت چند فیلد (نام، بیو، اسلاگ، زبان)
 */
router.patch('/', (req, res, next) => {
  try {
    const user = req.user;
    const { first_name, bio, link_slug, language } = req.body || {};

    const updates = {};

    // ---- نام ----
    if (first_name !== undefined) {
      const name = String(first_name).trim();

      if (name.length < 1 || name.length > config.limits.maxNameLength) {
        return res.status(400).json({
          error: 'INVALID_INPUT',
          message: `نام باید بین ۱ تا ${config.limits.maxNameLength} کاراکتر باشد.`,
        });
      }

      updates.first_name = name;
    }

    // ---- بیو ----
    if (bio !== undefined) {
      const bioText = String(bio).trim();

      if (bioText.length > config.limits.maxBioLength) {
        return res.status(400).json({
          error: 'INVALID_INPUT',
          message: `بیو نمی‌تواند بیشتر از ${config.limits.maxBioLength} کاراکتر باشد.`,
        });
      }

      updates.bio = bioText;
    }

    // ---- اسلاگ ----
    if (link_slug !== undefined) {
      const slug = String(link_slug).trim().toLowerCase();

      if (!utils.isValidSlug(slug)) {
        return res.status(400).json({
          error: 'INVALID_INPUT',
          message: 'اسلاگ نامعتبر است.',
        });
      }

      const existing = userService.getBySlug(slug);
      if (existing && existing.telegram_id !== user.telegram_id) {
        return res.status(409).json({
          error: 'SLUG_TAKEN',
          message: 'این اسلاگ قبلاً گرفته شده است.',
        });
      }

      updates.link_slug = slug;
    }

    // ---- زبان ----
    if (language !== undefined) {
      if (!config.languages.supported.includes(language)) {
        return res.status(400).json({
          error: 'INVALID_INPUT',
          message: 'زبان پشتیبانی نمی‌شود.',
        });
      }

      updates.language = language;
    }

    // ---- اعمال ----
    if (Object.keys(updates).length === 0) {
      return res.json({ success: true, user: req.user });
    }

    userService.updateFields(user.telegram_id, updates);

    const updated = userService.getByTelegramId(user.telegram_id);

    res.json({
      success: true,
      user: {
        telegram_id: updated.telegram_id,
        first_name: updated.first_name,
        bio: updated.bio,
        link_slug: updated.link_slug,
        language: updated.language,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/me/bio
 * آپدیت بیو
 */
router.patch('/bio', (req, res, next) => {
  try {
    const user = req.user;
    const { bio } = req.body || {};

    if (bio === undefined) {
      return res.status(400).json({
        error: 'INVALID_INPUT',
        message: 'بیو ارسال نشده.',
      });
    }

    const bioText = String(bio).trim();

    if (bioText.length > config.limits.maxBioLength) {
      return res.status(400).json({
        error: 'INVALID_INPUT',
        message: `بیو نمی‌تواند بیشتر از ${config.limits.maxBioLength} کاراکتر باشد.`,
      });
    }

    userService.updateBio(user.telegram_id, bioText);

    res.json({
      success: true,
      bio: bioText,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/me/name
 * آپدیت نام
 */
router.patch('/name', (req, res, next) => {
  try {
    const user = req.user;
    const { first_name } = req.body || {};

    if (!first_name) {
      return res.status(400).json({
        error: 'INVALID_INPUT',
        message: 'نام ارسال نشده.',
      });
    }

    const name = String(first_name).trim();

    if (name.length < 1 || name.length > config.limits.maxNameLength) {
      return res.status(400).json({
        error: 'INVALID_INPUT',
        message: `نام باید بین ۱ تا ${config.limits.maxNameLength} کاراکتر باشد.`,
      });
    }

    userService.updateFirstName(user.telegram_id, name);

    res.json({
      success: true,
      first_name: name,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/me/slug
 * آپدیت اسلاگ
 */
router.patch('/slug', (req, res, next) => {
  try {
    const user = req.user;
    const { slug } = req.body || {};

    if (!slug) {
      return res.status(400).json({
        error: 'INVALID_INPUT',
        message: 'اسلاگ ارسال نشده.',
      });
    }

    const cleanSlug = String(slug).trim().toLowerCase();

    if (!utils.isValidSlug(cleanSlug)) {
      return res.status(400).json({
        error: 'INVALID_INPUT',
        message: 'اسلاگ نامعتبر است.',
      });
    }

    const existing = userService.getBySlug(cleanSlug);
    if (existing && existing.telegram_id !== user.telegram_id) {
      return res.status(409).json({
        error: 'SLUG_TAKEN',
        message: 'این اسلاگ قبلاً گرفته شده است.',
      });
    }

    userService.updateSlug(user.telegram_id, cleanSlug);

    res.json({
      success: true,
      link_slug: cleanSlug,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/me/language
 * آپدیت زبان
 */
router.patch('/language', (req, res, next) => {
  try {
    const user = req.user;
    const { language } = req.body || {};

    if (!language) {
      return res.status(400).json({
        error: 'INVALID_INPUT',
        message: 'زبان ارسال نشده.',
      });
    }

    if (!config.languages.supported.includes(language)) {
      return res.status(400).json({
        error: 'INVALID_INPUT',
        message: 'زبان پشتیبانی نمی‌شود.',
      });
    }

    userService.updateLanguage(user.telegram_id, language);

    res.json({
      success: true,
      language,
      language_name: i18n.getLanguageName(language),
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================
//  حذف
// ============================================================

/**
 * DELETE /api/me
 * حذف حساب
 */
router.delete('/', (req, res, next) => {
  try {
    const user = req.user;

    if (user.telegram_id === config.admin.id) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: 'حساب ادمین قابل حذف نیست.',
      });
    }

    userService.deleteAccount(user.telegram_id);

    res.json({
      success: true,
      message: 'حساب حذف شد.',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/me/blocks/:telegramId
 * آنبلاک کردن کاربر
 */
router.delete('/blocks/:telegramId', (req, res, next) => {
  try {
    const user = req.user;
    const blockedId = parseInt(req.params.telegramId, 10);

    if (!blockedId || isNaN(blockedId)) {
      return res.status(400).json({
        error: 'INVALID_INPUT',
        message: 'آیدی نامعتبر.',
      });
    }

    messageService.unblockUser(user.telegram_id, blockedId);

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// ============================================================
//  ادمین یا کاربر خاص
// ============================================================

/**
 * GET /api/users/:id
 * اطلاعات یه کاربر خاص (فقط ادمین یا خود کاربر)
 */
router.get('/users/:id', (req, res, next) => {
  try {
    const requesterId = req.user?.telegram_id;
    const targetId = parseInt(req.params.id, 10);

    if (!targetId || isNaN(targetId)) {
      return res.status(400).json({
        error: 'INVALID_INPUT',
        message: 'آیدی نامعتبر.',
      });
    }

    // چک دسترسی
    const isAdmin = requesterId === config.admin.id;
    const isSelf = requesterId === targetId;

    if (!isAdmin && !isSelf) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: 'دسترسی ندارید.',
      });
    }

    const user = userService.getByTelegramId(targetId);

    if (!user) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'کاربر پیدا نشد.',
      });
    }

    res.json({
      telegram_id: user.telegram_id,
      username: user.username,
      first_name: user.first_name,
      bio: user.bio || '',
      language: user.language,
      link_slug: user.link_slug,
      is_vip: !!user.is_vip,
      is_banned: !!user.is_banned,
      total_received: user.total_received,
      total_sent: user.total_sent,
      referral_count: user.referral_count,
      created_at: user.created_at,
      last_active_at: user.last_active_at,
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================
//  خروجی
// ============================================================

module.exports = router;