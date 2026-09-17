/**
 * middlewares.js
 * همه میان‌افزارها در یک فایل
 * نسخه ۳.۰
 *
 * شامل:
 *   - verifyTelegram    ← احراز هویت WebApp (HMAC-SHA256)
 *   - adminOnly         ← فقط ادمین
 *   - auth              ← احراز هویت ربات
 *   - banCheck          ← چک بن
 *   - rateLimit         ← ضد اسپم
 */

const crypto = require('crypto');
const config = require('./config');
const i18n = require('./i18n');
const utils = require('./utils');
const userService = require('./services/user');
const db = require('./db');

// ============================================================
//  ۱. verifyTelegram — احراز هویت WebApp
// ============================================================

/**
 * بررسی امضای initData (طبق مستندات تلگرام)
 */
function verifyInitData(initData) {
  if (!initData || typeof initData !== 'string') {
    return { valid: false, reason: 'MISSING_INIT_DATA' };
  }

  try {
    // پارس query string
    const params = new URLSearchParams(initData);

    // استخراج hash
    const hash = params.get('hash');
    if (!hash) {
      return { valid: false, reason: 'MISSING_HASH' };
    }

    // حذف hash
    params.delete('hash');

    // مرتب‌سازی الفبایی
    const dataCheckString = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    // محاسبه secret key
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(config.bot.token)
      .digest();

    // محاسبه hash مورد انتظار
    const expectedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    // مقایسه
    if (expectedHash !== hash) {
      return { valid: false, reason: 'INVALID_HASH' };
    }

    // بررسی انقضا (۲۴ ساعت)
    const authDate = parseInt(params.get('auth_date') || '0', 10);
    const now = Math.floor(Date.now() / 1000);
    const maxAge = 24 * 60 * 60;

    if (now - authDate > maxAge) {
      return { valid: false, reason: 'EXPIRED' };
    }

    // پارس user
    const userData = params.get('user');
    if (!userData) {
      return { valid: false, reason: 'MISSING_USER' };
    }

    const user = JSON.parse(userData);

    return {
      valid: true,
      user,
      authDate,
      queryId: params.get('query_id') || null,
      startParam: params.get('start_param') || null,
    };
  } catch (error) {
    console.error('خطا در verifyInitData:', error);
    return { valid: false, reason: 'PARSE_ERROR' };
  }
}

/**
 * Middleware احراز هویت WebApp
 */
async function verifyTelegram(req, res, next) {
  try {
    const initData = req.headers['x-telegram-init-data'];
    const headerUserId = req.headers['x-user-id'];

    // ---- اگه initData داشت ----
    if (initData) {
      const result = verifyInitData(initData);

      if (!result.valid) {
        console.warn(`⚠️  initData نامعتبر: ${result.reason}`);

        return res.status(401).json({
          error: 'UNAUTHORIZED',
          message: 'احراز هویت نامعتبر است.',
          reason: config.env.isDev ? result.reason : undefined,
        });
      }

      const tgUser = result.user;

      // چک تطابق با header
      if (headerUserId && parseInt(headerUserId, 10) !== tgUser.id) {
        return res.status(401).json({
          error: 'UNAUTHORIZED',
          message: 'تطابق کاربر نامعتبر.',
        });
      }

      // چک وجود کاربر در DB
      const user = userService.getByTelegramId(tgUser.id);

      if (!user) {
        return res.status(401).json({
          error: 'UNAUTHORIZED',
          message: 'ابتدا /start بزنید.',
        });
      }

      // چک بن
      if (user.is_banned) {
        return res.status(403).json({
          error: 'BANNED',
          message: 'حساب شما مسدود شده است.',
        });
      }

      // آپدیت last_seen
      userService.touchLastSeen(user.telegram_id);

      // ست کردن req
      req.user = user;
      req.tgUser = tgUser;
      req.initData = result;

      return next();
    }

    // ---- حالت توسعه: از header user_id ----
    if (config.env.isDev && headerUserId) {
      const userId = parseInt(headerUserId, 10);

      if (!userId || isNaN(userId)) {
        return res.status(401).json({
          error: 'UNAUTHORIZED',
          message: 'user_id نامعتبر.',
        });
      }

      const user = userService.getByTelegramId(userId);

      if (!user) {
        return res.status(401).json({
          error: 'UNAUTHORIZED',
          message: 'ابتدا /start بزنید.',
        });
      }

      if (user.is_banned) {
        return res.status(403).json({
          error: 'BANNED',
          message: 'حساب شما مسدود شده است.',
        });
      }

      userService.touchLastSeen(user.telegram_id);

      req.user = user;
      req.tgUser = { id: userId };

      return next();
    }

    // ---- هیچ‌کدوم ----
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'احراز هویت لازم است.',
    });
  } catch (error) {
    console.error('خطا در verifyTelegram:', error);

    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'خطای داخلی سرور.',
    });
  }
}

// ============================================================
//  ۲. adminOnly — فقط ادمین
// ============================================================

/**
 * چک ادمین بودن
 */
function isAdmin(userId) {
  if (!userId) return false;

  // ادمین اصلی از config
  if (userId === config.admin.id) {
    return true;
  }

  // ادمین‌های اضافی از DB
  try {
    const result = db
      .prepare('SELECT 1 FROM admins WHERE telegram_id = ? LIMIT 1')
      .get(userId);

    return !!result;
  } catch (error) {
    return false;
  }
}

/**
 * دریافت نقش ادمین
 */
function getAdminRole(userId) {
  if (userId === config.admin.id) {
    return 'superadmin';
  }

  try {
    const result = db
      .prepare('SELECT role FROM admins WHERE telegram_id = ? LIMIT 1')
      .get(userId);

    return result?.role || null;
  } catch (error) {
    return null;
  }
}

/**
 * Middleware فقط ادمین
 */
async function adminOnly(req, res, next) {
  try {
    // چک احراز هویت
    if (!req.user) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'احراز هویت لازم است.',
      });
    }

    const userId = req.user.telegram_id;

    // چک ادمین
    if (!isAdmin(userId)) {
      // به کاربر عادی ۴۰۴ می‌دیم (امنیت)
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'مسیر پیدا نشد.',
      });
    }

    // ذخیره role
    req.adminRole = getAdminRole(userId);
    req.isAdmin = true;

    return next();
  } catch (error) {
    console.error('خطا در adminOnly:', error);

    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'خطای داخلی سرور.',
    });
  }
}

// ============================================================
//  ۳. auth — احراز هویت ربات
// ============================================================

/**
 * Middleware احراز هویت کاربر ربات
 * اگه کاربر جدید بود، فقط /start می‌تونه بسازه
 * اگه موجود بود، آپدیت می‌شه
 */
async function auth(ctx, next) {
  // اگه از تلگرام نیومده یا بات هست
  if (!ctx.from || ctx.from.is_bot) {
    return next();
  }

  const from = ctx.from;

  try {
    // ---- بررسی کاربر ----
    let user = userService.getByTelegramId(from.id);

    if (!user) {
      // فقط /start کاربر رو می‌سازه
      const isStartCommand =
        ctx.message?.text && ctx.message.text.startsWith('/start');

      if (!isStartCommand) {
        if (ctx.message) {
          await ctx.reply(
            '👋 سلام! برای استفاده از ربات، اول دستور /start رو بزن.',
            { parse_mode: 'HTML' }
          );
        } else if (ctx.callbackQuery) {
          await ctx.answerCallbackQuery({
            text: 'اول /start رو بزن.',
            show_alert: true,
          });
        }
        return;
      }

      // برای /start اجازه بده handler خودش بسازه
      return next();
    }

    // ---- چک بن ----
    if (user.is_banned) {
      return next();
    }

    // ---- آپدیت last_active / last_seen ----
    const now = Math.floor(Date.now() / 1000);

    if (!user.last_active_at || now - user.last_active_at > 300) {
      userService.touchLastActive(from.id);
    } else {
      userService.touchLastSeen(from.id);
    }

    // ---- آپدیت پروفایل اگه تغییر کرده ----
    if (
      user.username !== (from.username || null) ||
      user.first_name !== (from.first_name || null)
    ) {
      userService.updateProfile(from.id, {
        username: from.username || null,
        first_name: from.first_name || null,
        last_name: from.last_name || null,
      });

      // آپدیت object محلی
      user = userService.getByTelegramId(from.id);
    }

    // ---- ذخیره user در ctx ----
    ctx.user = user;

    // ---- ذخیره زبان در session ----
    if (ctx.session && !ctx.session.language && user.language) {
      ctx.session.language = user.language;
    }

    return next();
  } catch (error) {
    console.error('خطا در middleware/auth:', error);
    return next();
  }
}

// ============================================================
//  ۴. banCheck — چک بن
// ============================================================

/**
 * Middleware چک بن
 * اگه کاربر بن شده، متوقفش می‌کنه
 */
async function banCheck(ctx, next) {
  if (!ctx.from || ctx.from.is_bot) {
    return next();
  }

  try {
    const user = userService.getByTelegramId(ctx.from.id);

    // کاربر وجود نداره یا بن نیست
    if (!user || !user.is_banned) {
      return next();
    }

    // ---- کاربر بن شده ----
    const lang = user.language || config.languages.default;
    const t = i18n.getTranslator(lang);

    const banReason = user.ban_reason || t('errors.bannedReason');

    // ---- برای پیام ----
    if (ctx.message) {
      await ctx.reply(
        t('errors.bannedFull', { reason: banReason }),
        { parse_mode: 'HTML' }
      );
      return;
    }

    // ---- برای callback ----
    if (ctx.callbackQuery) {
      await ctx.answerCallbackQuery({
        text: t('errors.bannedShort'),
        show_alert: true,
      });
      return;
    }

    return;
  } catch (error) {
    console.error('خطا در middleware/banCheck:', error);
    return next();
  }
}

// ============================================================
//  ۵. rateLimit — ضد اسپم
// ============================================================

/**
 * ذخیره‌سازی در حافظه
 * Map<`${userId}:${key}`, { count, resetAt }>
 */
const userBuckets = new Map();

// پاکسازی هر ۵ دقیقه
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of userBuckets.entries()) {
    if (bucket.resetAt < now) {
      userBuckets.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * تنظیمات پیش‌فرض
 */
const RATE_LIMITS = {
  general: { max: 30, windowMs: 60 * 1000 },   // ۳۰ درخواست/دقیقه
  send: { max: 5, windowMs: 60 * 1000 },       // ۵ پیام ناشناس/دقیقه
  reply: { max: 10, windowMs: 60 * 1000 },     // ۱۰ پاسخ/دقیقه
  auth: { max: 10, windowMs: 60 * 1000 },      // ۱۰ /start/دقیقه
};

/**
 * چک محدودیت
 */
function checkLimit(userId, key = 'general', customMax = null) {
  const now = Date.now();
  const bucketKey = `${userId}:${key}`;

  const settings = RATE_LIMITS[key] || RATE_LIMITS.general;
  const maxRequests = customMax || settings.max;

  let bucket = userBuckets.get(bucketKey);

  if (!bucket || bucket.resetAt < now) {
    bucket = { count: 0, resetAt: now + settings.windowMs };
    userBuckets.set(bucketKey, bucket);
  }

  bucket.count++;

  if (bucket.count > maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      retryAfter: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }

  return {
    allowed: true,
    remaining: maxRequests - bucket.count,
    retryAfter: 0,
  };
}

/**
 * ریست محدودیت
 */
function resetLimit(userId, key = 'general') {
  userBuckets.delete(`${userId}:${key}`);
}

/**
 * پاکسازی کامل کاربر
 */
function clearAll(userId) {
  for (const key of userBuckets.keys()) {
    if (key.startsWith(`${userId}:`)) {
      userBuckets.delete(key);
    }
  }
}

/**
 * Middleware ضد اسپم
 */
async function rateLimit(ctx, next) {
  if (!ctx.from || ctx.from.is_bot) {
    return next();
  }

  // ادمین محدودیت نداره
  if (ctx.from.id === config.admin.id) {
    return next();
  }

  const userId = ctx.from.id;
  const user = ctx.user || userService.getByTelegramId(userId);

  const lang = user?.language || config.languages.default;
  const t = i18n.getTranslator(lang);

  // ---- محدودیت کلی ----
  const general = checkLimit(userId, 'general');

  if (!general.allowed) {
    if (ctx.message) {
      await ctx.reply(
        t('errors.rateLimited', { seconds: general.retryAfter }),
        { parse_mode: 'HTML' }
      );
    } else if (ctx.callbackQuery) {
      await ctx.answerCallbackQuery({
        text: t('errors.rateLimitedShort', { seconds: general.retryAfter }),
        show_alert: false,
      });
    }
    return;
  }

  // ---- محدودیت /start ----
  if (ctx.message?.text?.startsWith('/start')) {
    const authLimit = checkLimit(userId, 'auth');

    if (!authLimit.allowed) {
      return;
    }
  }

  // ---- محدودیت ارسال پیام ناشناس ----
  if (ctx.message && ctx.session && ctx.session.targetId) {
    const sendLimit = checkLimit(userId, 'send');

    if (!sendLimit.allowed) {
      await ctx.reply(
        t('errors.sendRateLimited', { seconds: sendLimit.retryAfter }),
        { parse_mode: 'HTML' }
      );
      return;
    }
  }

  // ---- محدودیت پاسخ ----
  if (ctx.message && ctx.session && ctx.session.waitingFor === 'reply') {
    const replyLimit = checkLimit(userId, 'reply');

    if (!replyLimit.allowed) {
      await ctx.reply(
        t('errors.replyRateLimited', { seconds: replyLimit.retryAfter }),
        { parse_mode: 'HTML' }
      );
      return;
    }
  }

  return next();
}

// ============================================================
//  خروجی
// ============================================================

module.exports = {
  // WebApp
  verifyTelegram,
  verifyInitData,

  // Admin
  adminOnly,
  isAdmin,
  getAdminRole,

  // Bot
  auth,
  banCheck,
  rateLimit,

  // Rate Limit Helpers
  checkLimit,
  resetLimit,
  clearAll,
  RATE_LIMITS,
};