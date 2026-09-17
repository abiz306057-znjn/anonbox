/**
 * config.js
 * تنظیمات مرکزی پروژه v3
 * همه مقادیر از .env خونده می‌شن
 *
 * ⚠️ این فایل فقط یه بار لود می‌شه و تو کل پروژه استفاده می‌شه
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// ============================================================
//  بررسی متغیرهای حیاتی
// ============================================================

const REQUIRED_ENV_VARS = ['BOT_TOKEN', 'BOT_USERNAME'];
const missingVars = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);

if (missingVars.length > 0) {
  console.error('');
  console.error('❌ متغیرهای محیطی زیر تنظیم نشدن:');
  missingVars.forEach((v) => console.error(`   • ${v}`));
  console.error('');
  console.error('💡 فایل .env.example رو کپی کن به .env و مقادیر رو پر کن.');
  console.error('');
  process.exit(1);
}

// ============================================================
//  اعتبارسنجی توکن
// ============================================================

const BOT_TOKEN_REGEX = /^\d+:[A-Za-z0-9_-]+$/;

if (!BOT_TOKEN_REGEX.test(process.env.BOT_TOKEN)) {
  console.error('');
  console.error('❌ فرمت BOT_TOKEN نامعتبره.');
  console.error('   باید شبیه این باشه: 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ');
  console.error('');
  process.exit(1);
}

// ============================================================
//  تنظیمات
// ============================================================

const config = {
  // ===== اطلاعات اپ =====
  app: {
    name: 'AnonBox',
    nameFa: 'صندوق راز',
    nameEn: 'AnonBox',
    nameAr: 'صندوق السر',
    version: '3.0.0',
  },

  // ===== ربات =====
  bot: {
    token: process.env.BOT_TOKEN,
    username: process.env.BOT_USERNAME,
  },

  // ===== ادمین =====
  admin: {
    id: parseInt(process.env.ADMIN_ID || '0', 10),
  },

  // ===== دیتابیس =====
  db: {
    path: path.isAbsolute(process.env.DB_PATH || '')
      ? process.env.DB_PATH
      : path.join(__dirname, '..', process.env.DB_PATH || './data/anonbox.db'),
  },

  // ===== سرور HTTP =====
  server: {
    host: process.env.SERVER_HOST || '0.0.0.0',
    port: parseInt(process.env.SERVER_PORT || '3000', 10),
    webappUrl: process.env.WEBAPP_URL || 'http://localhost:3000',
    corsOrigin: process.env.CORS_ORIGIN || '*',
  },

  // ===== بسته‌های اشتراک =====
  packages: {
    weekly: {
      id: 'weekly',
      price: 40,
      days: 7,
      name: { fa: 'یک هفته‌ای', en: 'Weekly', ar: 'أسبوعي' },
      icon: '📅',
    },
    monthly: {
      id: 'monthly',
      price: 120,
      days: 30,
      name: { fa: 'ماهانه', en: 'Monthly', ar: 'شهري' },
      icon: '📆',
      popular: true,
    },
    yearly: {
      id: 'yearly',
      price: 1000,
      days: 365,
      name: { fa: 'سالانه', en: 'Yearly', ar: 'سنوي' },
      icon: '🗓',
      bestValue: true,
    },
    reply: {
      id: 'reply',
      price: 400,
      days: 30,
      name: { fa: 'پاسخ ناشناس', en: 'Anonymous Reply', ar: 'الرد المجهول' },
      icon: '💬',
      isReply: true, // ← بسته ویژه
    },
  },

  // ===== سیستم رایگان روزانه =====
  free: {
    dailyMessages: parseInt(process.env.FREE_DAILY_MESSAGES || '10', 10),
  },

  // ===== پاداش دعوت (تکرارپذیر) =====
  referral: {
    // هر ۱ دعوت = ۲۴ ساعت
    hoursPerInvite: 24,

    // هر ۳ دعوت = ۱ هفته
    threeInvites: {
      threshold: 3,
      days: 7,
    },

    // هر ۱۰ دعوت = ۱ ماه + بسته پاسخ
    tenInvites: {
      threshold: 10,
      days: 30,
      giveReplyPackage: true, // ← بسته پاسخ رایگان
    },
  },

  // ===== زبان‌ها =====
  languages: {
    supported: ['fa', 'en', 'ar'],
    default: 'fa', // ← فارسی زبان اصلی
    rtl: ['fa', 'ar'],
    ltr: ['en'],
  },

  // ===== تم =====
  theme: {
    available: ['light', 'dark'],
    default: 'dark',
  },

  // ===== صدا =====
  audio: {
    enabled: true,
    bgMusic: false, // موسیقی پس‌زمینه به‌صورت پیش‌فرض خاموش
    sfx: true,      // افکت‌های صوتی روشن
  },

  // ===== شناسه ناشناس =====
  alias: {
    enabled: true,
    maxPerReceiver: 500, // حداکثر تعداد alias برای هر گیرنده
    emojiCount: 50,
  },

  // ===== محدودیت‌ها =====
  limits: {
    // پیام
    maxMessageLength: 1000,
    minMessageLength: 1,

    // پروفایل
    maxBioLength: 200,
    maxNameLength: 50,
    minSlugLength: 3,
    maxSlugLength: 32,

    // نرخ ارسال
    maxMessagesPerHour: 20,
    maxMessagesPerDay: 50,
    maxMessagesPerMinute: 5,
    maxReportsPerDay: 10,

    // فایل
    maxFileSizeMb: 10,

    // Pagination
    maxPaginationSize: 50,
    defaultPaginationSize: 20,
  },

  // ===== حالت اجرا =====
  env: {
    nodeEnv: process.env.NODE_ENV || 'development',
    isDev: (process.env.NODE_ENV || 'development') === 'development',
    isProd: process.env.NODE_ENV === 'production',
  },

  // ===== پرداخت =====
  payment: {
    currency: 'XTR',
  },
};

// ============================================================
//  بررسی ادمین
// ============================================================

if (!config.admin.id || config.admin.id === 0) {
  console.warn('');
  console.warn('⚠️  ADMIN_ID تنظیم نشده.');
  console.warn('   داشبورد مدیریتی در دسترس نخواهد بود.');
  console.warn('');
}

// ============================================================
//  لاگ راه‌اندازی (فقط در dev)
// ============================================================

if (config.env.isDev) {
  console.log('');
  console.log('╭──────────────────────────────────────────╮');
  console.log('│  🎭 AnonBox v3.0 — Config Loaded         │');
  console.log('╰──────────────────────────────────────────╯');
  console.log(`📁 دیتابیس:      ${config.db.path}`);
  console.log(`🌐 سرور:         ${config.server.host}:${config.server.port}`);
  console.log(`🌍 زبان‌ها:       ${config.languages.supported.join(', ')}`);
  console.log(`🌐 زبان پیش‌فرض:  ${config.languages.default}`);
  console.log(`💰 بسته‌ها:       weekly=${config.packages.weekly.price} | monthly=${config.packages.monthly.price} | yearly=${config.packages.yearly.price} | reply=${config.packages.reply.price}`);
  console.log(`📨 رایگان:       ${config.free.dailyMessages} پیام در روز`);
  console.log(`🎁 دعوت:         هر ۱ = +${config.referral.hoursPerInvite}h | هر ۳ = +${config.referral.threeInvites.days}d | هر ۱۰ = +${config.referral.tenInvites.days}d + بسته پاسخ`);
  console.log('');
}

// ============================================================
//  خروجی
// ============================================================

module.exports = config;