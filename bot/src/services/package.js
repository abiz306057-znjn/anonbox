/**
 * services/package.js
 * منطق کاری بسته‌های اشتراک
 * نسخه ۳.۰ — با ۴ بسته (weekly, monthly, yearly, reply)
 */

const db = require('../db');
const dbUsers = require('../db/users');
const dbPackages = require('../db/packages');
const config = require('../config');

// ============================================================
//  اطلاعات بسته‌ها
// ============================================================

/**
 * همه بسته‌ها (برای نمایش)
 */
function getAllPackages(lang = 'fa') {
  return Object.values(config.packages).map((pkg) => ({
    id: pkg.id,
    name: getName(pkg.id, lang),
    price: pkg.price,
    days: pkg.days,
    icon: pkg.icon,
    features: getFeatures(pkg.id, lang),
    isReply: pkg.isReply || false,
    popular: pkg.popular || false,
    bestValue: pkg.bestValue || false,
  }));
}

/**
 * اسم بسته به زبان
 */
function getName(packageId, lang = 'fa') {
  const pkg = config.packages[packageId];
  if (!pkg) return '';
  return pkg.name[lang] || pkg.name.fa;
}

/**
 * لیست مزایا
 */
function getFeatures(packageId, lang = 'fa') {
  const features = {
    weekly: {
      fa: [
        'باز کردن نامحدود پیام‌ها',
        'نشان VIP در پروفایل',
        'پشتیبانی اولویت‌دار',
      ],
      en: [
        'Unlimited message unlock',
        'VIP badge',
        'Priority support',
      ],
      ar: [
        'فتح غير محدود للرسائل',
        'شارة VIP',
        'دعم أولوية',
      ],
    },
    monthly: {
      fa: [
        'باز کردن نامحدود پیام‌ها',
        'نشان VIP در پروفایل',
        'پشتیبانی اولویت‌دار',
        'بدون تبلیغات',
      ],
      en: [
        'Unlimited message unlock',
        'VIP badge',
        'Priority support',
        'No ads',
      ],
      ar: [
        'فتح غير محدود',
        'شارة VIP',
        'دعم أولوية',
        'بدون إعلانات',
      ],
    },
    yearly: {
      fa: [
        'باز کردن نامحدود پیام‌ها',
        'نشان VIP در پروفایل',
        'پشتیبانی اولویت‌دار',
        'بدون تبلیغات',
        '🎁 هدیه ویژه تولد',
      ],
      en: [
        'Unlimited message unlock',
        'VIP badge',
        'Priority support',
        'No ads',
        '🎁 Birthday gift',
      ],
      ar: [
        'فتح غير محدود',
        'شارة VIP',
        'دعم أولوية',
        'بدون إعلانات',
        '🎁 هدية عيد الميلاد',
      ],
    },
    reply: {
      fa: [
        'پاسخ دادن به پیام ناشناس',
        'گفتگوی ناشناس با فرستنده',
        'بدون فاش شدن هویت',
      ],
      en: [
        'Reply to anonymous messages',
        'Anonymous chat',
        'Identity protected',
      ],
      ar: [
        'الرد على الرسائل المجهولة',
        'محادثة مجهولة',
        'حماية الهوية',
      ],
    },
  };

  return features[packageId]?.[lang] || features[packageId]?.fa || [];
}

/**
 * توضیحات بسته
 */
function getDescription(packageId, lang = 'fa') {
  const pkg = config.packages[packageId];
  if (!pkg) return '';

  const descriptions = {
    weekly: {
      fa: 'دسترسی نامحدود به مدت ۷ روز',
      en: 'Unlimited access for 7 days',
      ar: 'وصول غير محدود لمدة 7 أيام',
    },
    monthly: {
      fa: 'دسترسی نامحدود به مدت ۳۰ روز',
      en: 'Unlimited access for 30 days',
      ar: 'وصول غير محدود لمدة 30 يوم',
    },
    yearly: {
      fa: 'دسترسی نامحدود به مدت ۱ سال',
      en: 'Unlimited access for 1 year',
      ar: 'وصول غير محدود لمدة سنة',
    },
    reply: {
      fa: 'امکان پاسخ دادن به پیام‌های ناشناس',
      en: 'Reply to anonymous messages',
      ar: 'الرد على الرسائل المجهولة',
    },
  };

  return descriptions[packageId]?.[lang] || descriptions[packageId]?.fa || '';
}

/**
 * جزئیات کامل بسته
 */
function getPackageDetails(packageId, lang = 'fa') {
  const pkg = config.packages[packageId];
  if (!pkg) return null;

  return {
    id: pkg.id,
    name: getName(packageId, lang),
    price: pkg.price,
    days: pkg.days,
    icon: pkg.icon,
    features: getFeatures(packageId, lang),
    description: getDescription(packageId, lang),
    isReply: pkg.isReply || false,
  };
}

/**
 * جدول مقایسه
 */
function getComparison(lang = 'fa') {
  return {
    packages: getAllPackages(lang),
    free: {
      dailyMessages: config.free.dailyMessages,
      description:
        lang === 'fa'
          ? `روزانه ${config.free.dailyMessages} پیام رایگان`
          : `Free ${config.free.dailyMessages} messages daily`,
    },
  };
}

// ============================================================
//  فعال‌سازی
// ============================================================

/**
 * فعال‌سازی بسته برای کاربر
 * با تمدید خودکار اگه بسته فعال داشت
 */
function activatePackage(userId, packageId, options = {}) {
  const pkg = config.packages[packageId];
  if (!pkg) throw new Error('INVALID_PACKAGE');

  const user = dbUsers.getByTelegramId(userId);
  if (!user) throw new Error('USER_NOT_FOUND');

  const now = Math.floor(Date.now() / 1000);
  const durationDays = options.days || pkg.days;
  let expiresAt;

  // ---- بسته پاسخ (جدا از VIP) ----
  if (packageId === 'reply') {
    // تمدید اگه قبلاً داشت
    if (user.reply_package_expires_at && user.reply_package_expires_at > now) {
      expiresAt = user.reply_package_expires_at + durationDays * 24 * 60 * 60;
    } else {
      expiresAt = now + durationDays * 24 * 60 * 60;
    }

    dbUsers.activateReplyPackage(userId, expiresAt);
  } else {
    // ---- بسته VIP عادی ----
    // تمدید اگه قبلاً داشت
    if (user.is_vip && user.vip_expires_at > now) {
      expiresAt = user.vip_expires_at + durationDays * 24 * 60 * 60;
    } else {
      expiresAt = now + durationDays * 24 * 60 * 60;
    }

    dbUsers.activatePackage(userId, expiresAt, packageId);
  }

  // ---- لاگ فعال‌سازی ----
  try {
    dbPackages.createActivation({
      user_id: userId,
      package_type: packageId,
      source: options.source || 'purchase',
      duration_days: durationDays,
      started_at: now,
      expires_at: expiresAt,
      payment_id: options.paymentId || null,
      referral_count_at_activation: options.referralCount || null,
    });
  } catch (err) {
    console.error('خطا در لاگ فعال‌سازی:', err);
  }

  return {
    success: true,
    expiresAt,
    days: durationDays,
    packageId,
  };
}

// ============================================================
//  بررسی دسترسی
// ============================================================

/**
 * چک بسته VIP فعال
 */
function hasActivePackage(userId) {
  const user = dbUsers.getByTelegramId(userId);
  if (!user || !user.is_vip || !user.vip_expires_at) return false;

  const now = Math.floor(Date.now() / 1000);
  return user.vip_expires_at > now;
}

/**
 * چک بسته پاسخ فعال
 */
function hasReplyPackage(userId) {
  const user = dbUsers.getByTelegramId(userId);
  if (!user || !user.reply_package_expires_at) return false;

  const now = Math.floor(Date.now() / 1000);
  return user.reply_package_expires_at > now;
}

/**
 * چک دسترسی به یه بسته خاص
 */
function hasPackage(userId, packageId) {
  if (packageId === 'reply') {
    return hasReplyPackage(userId);
  }
  return hasActivePackage(userId);
}

/**
 * وضعیت کامل بسته کاربر
 */
function getActivePackage(userId) {
  const user = dbUsers.getByTelegramId(userId);

  if (!user) {
    return {
      hasPackage: false,
      hasReplyPackage: false,
      daysLeft: 0,
      replyDaysLeft: 0,
    };
  }

  const now = Math.floor(Date.now() / 1000);

  const hasVip = user.is_vip && user.vip_expires_at > now;
  const hasReply = user.reply_package_expires_at > now;

  const vipDaysLeft = hasVip
    ? Math.ceil((user.vip_expires_at - now) / (24 * 60 * 60))
    : 0;

  const replyDaysLeft = hasReply
    ? Math.ceil((user.reply_package_expires_at - now) / (24 * 60 * 60))
    : 0;

  return {
    // VIP عادی
    hasPackage: hasVip,
    packageId: user.package_type || null,
    name: user.package_type ? getName(user.package_type, user.language) : null,
    expiresAt: user.vip_expires_at || null,
    daysLeft: vipDaysLeft,

    // بسته پاسخ
    hasReplyPackage: hasReply,
    replyExpiresAt: user.reply_package_expires_at || null,
    replyDaysLeft,
  };
}

// ============================================================
//  آمار
// ============================================================

function getFullStats() {
  return dbPackages.getFullPackageStats();
}

function getActivationHistory(userId, limit = 20) {
  return dbPackages.getActivationsForUser(userId, limit);
}

function getActiveActivations(userId) {
  return dbPackages.getActiveActivationsForUser(userId);
}

// ============================================================
//  خروجی
// ============================================================

module.exports = {
  // اطلاعات بسته‌ها
  getAllPackages,
  getName,
  getFeatures,
  getDescription,
  getPackageDetails,
  getComparison,

  // فعال‌سازی
  activatePackage,

  // بررسی دسترسی
  hasActivePackage,
  hasReplyPackage,
  hasPackage,
  getActivePackage,

  // آمار
  getFullStats,
  getActivationHistory,
  getActiveActivations,
};