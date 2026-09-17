/**
 * constants.js
 * ثابت‌های مشترک بین بک‌اند (bot) و فرانت‌اند (webapp)
 * نسخه ۳.۰
 *
 * ⚠️ UMD Pattern — هم Node.js هم مرورگر
 *   - بک‌اند: const constants = require('../../shared/constants');
 *   - فرانت: window.AnonBoxConstants
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.AnonBoxConstants = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ============================================================
  //  اطلاعات پروژه
  // ============================================================

  const APP = {
    name: 'AnonBox',
    nameFa: 'صندوق راز',
    nameEn: 'AnonBox',
    nameAr: 'صندوق السر',
    version: '3.0.0',
    botUsername: 'AnonBoxBot',
    description: 'پیام‌های ناشناس تلگرام',
  };

  // ============================================================
  //  بسته‌های اشتراک
  // ============================================================

  const PACKAGES = {
    weekly: {
      id: 'weekly',
      price: 40,
      days: 7,
      icon: '📅',
      name: { fa: 'یک هفته‌ای', en: 'Weekly', ar: 'أسبوعي' },
    },
    monthly: {
      id: 'monthly',
      price: 120,
      days: 30,
      icon: '📆',
      name: { fa: 'ماهانه', en: 'Monthly', ar: 'شهري' },
      popular: true,
    },
    yearly: {
      id: 'yearly',
      price: 1000,
      days: 365,
      icon: '🗓',
      name: { fa: 'سالانه', en: 'Yearly', ar: 'سنوي' },
      bestValue: true,
    },
    reply: {
      id: 'reply',
      price: 400,
      days: 30,
      icon: '💬',
      name: { fa: 'پاسخ ناشناس', en: 'Anonymous Reply', ar: 'الرد المجهول' },
      isReply: true,
    },
  };

  // ============================================================
  //  سیستم رایگان روزانه
  // ============================================================

  const FREE = {
    dailyMessages: 10,
  };

  // ============================================================
  //  پاداش‌های دعوت (تکرارپذیر)
  // ============================================================

  const REFERRAL = {
    hoursPerInvite: 24,
    threeInvites: {
      threshold: 3,
      days: 7,
    },
    tenInvites: {
      threshold: 10,
      days: 30,
      giveReplyPackage: true,
    },
  };

  // ============================================================
  //  مدت‌زمان‌ها
  // ============================================================

  const DURATION = {
    minute: 60,
    hour: 60 * 60,
    day: 24 * 60 * 60,
    week: 7 * 24 * 60 * 60,
    month: 30 * 24 * 60 * 60,
    year: 365 * 24 * 60 * 60,
  };

  // ============================================================
  //  محدودیت‌ها
  // ============================================================

  const LIMITS = {
    maxMessageLength: 1000,
    minMessageLength: 1,
    maxBioLength: 200,
    maxNameLength: 50,

    minSlugLength: 3,
    maxSlugLength: 32,

    maxMessagesPerHour: 20,
    maxMessagesPerDay: 50,
    maxMessagesPerMinute: 5,
    maxReportsPerDay: 10,

    maxFileSizeMb: 10,

    maxPaginationSize: 50,
    defaultPaginationSize: 20,
  };

  // ============================================================
  //  انواع محتوا
  // ============================================================

  const CONTENT_TYPES = {
    text: 'text',
    photo: 'photo',
    video: 'video',
    voice: 'voice',
    audio: 'audio',
    sticker: 'sticker',
    document: 'document',
  };

  const CONTENT_TYPE_ICONS = {
    text: '📝',
    photo: '🖼',
    video: '🎥',
    voice: '🎤',
    audio: '🎵',
    sticker: '😀',
    document: '📎',
  };

  // ============================================================
  //  زبان‌ها
  // ============================================================

  const LANGUAGES = {
    supported: ['fa', 'en', 'ar'],
    default: 'fa',
    rtl: ['fa', 'ar'],
    ltr: ['en'],
  };

  const LANGUAGE_INFO = {
    fa: { name: 'فارسی', flag: '🇮🇷', dir: 'rtl' },
    en: { name: 'English', flag: '🇬🇧', dir: 'ltr' },
    ar: { name: 'العربية', flag: '🇸🇦', dir: 'rtl' },
  };

  // ============================================================
  //  تم‌ها
  // ============================================================

  const THEMES = {
    available: ['light', 'dark'],
    default: 'dark',
  };

  // ============================================================
  //  رنگ‌ها
  // ============================================================

  const COLORS = {
    primary: '#7C3AED',
    primaryLight: '#9F67FF',
    primaryDark: '#5B21B6',

    secondary: '#EC4899',
    secondaryLight: '#F472B6',
    secondaryDark: '#BE185D',

    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',

    vipGold: '#FBBF24',
    vipGoldLight: '#FCD34D',
    vipGoldDark: '#D97706',

    bgPrimary: '#0F0E17',
    bgSecondary: '#1A1927',
    bgTertiary: '#232135',

    textPrimary: '#FFFFFE',
    textSecondary: '#A7A9BE',
    textMuted: '#4A4C5E',
  };

  // ============================================================
  //  کلمات رزرو شده اسلاگ
  // ============================================================

  const RESERVED_SLUGS = [
    'start', 'help', 'inbox', 'settings', 'admin', 'login', 'logout',
    'lang', 'language', 'cancel', 'stop',
    'api', 'bot', 'webapp', 'web', 'app', 'static', 'public',
    'support', 'contact', 'about', 'terms', 'privacy', 'policy',
    'me', 'you', 'system', 'root', 'null', 'undefined', 'true', 'false',
    'moderator', 'owner', 'master', 'superuser',
    'vip', 'premium', 'package', 'packages', 'upgrade', 'buy',
    'referral', 'referrals', 'invite', 'reward', 'rewards',
    'reply', 'replies', 'message', 'messages',
    'alias', 'aliases', 'anonymous', 'anon',
    'dashboard', 'stats', 'analytics', 'report', 'reports',
  ];

  // ============================================================
  //  کلیدهای Storage
  // ============================================================

  const STORAGE_KEYS = {
    theme: 'anonbox-theme',
    language: 'anonbox-lang',
    audio: 'anonbox-audio',
    user: 'anonbox-user',
    lastSeen: 'anonbox-last-seen',
    tutorial: 'anonbox-tutorial-seen',
  };

  // ============================================================
  //  رویدادها
  // ============================================================

  const EVENTS = {
    themeChanged: 'theme:changed',
    i18nChanged: 'i18n:changed',
    tgThemeChanged: 'tg:theme-changed',
    tgActivated: 'tg:activated',
    tgDeactivated: 'tg:deactivated',
    userUpdated: 'user:updated',
    messageReceived: 'message:received',
    paymentSuccess: 'payment:success',
    routeChanged: 'route:changed',
  };

  // ============================================================
  //  کدهای خطا
  // ============================================================

  const ERROR_CODES = {
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    NOT_FOUND: 'NOT_FOUND',
    BAD_REQUEST: 'BAD_REQUEST',
    RATE_LIMITED: 'RATE_LIMITED',
    BANNED: 'BANNED',
    INVALID_INPUT: 'INVALID_INPUT',
    BLOCKED: 'BLOCKED',
    DAILY_LIMIT: 'DAILY_LIMIT',
    HOURLY_LIMIT: 'HOURLY_LIMIT',
    RECEIVER_NOT_FOUND: 'RECEIVER_NOT_FOUND',
    RECEIVER_BANNED: 'RECEIVER_BANNED',
    MESSAGE_NOT_FOUND: 'MESSAGE_NOT_FOUND',
    ALREADY_REPORTED: 'ALREADY_REPORTED',
    NOT_YOUR_MESSAGE: 'NOT_YOUR_MESSAGE',
    INVALID_PAYMENT_TYPE: 'INVALID_PAYMENT_TYPE',
    INVALID_AMOUNT: 'INVALID_AMOUNT',
    INVALID_PACKAGE: 'INVALID_PACKAGE',
    SELF_BLOCK: 'SELF_BLOCK',
    SLUG_TAKEN: 'SLUG_TAKEN',
    NO_REPLY_PACKAGE: 'NO_REPLY_PACKAGE',
    FREE_LIMIT_REACHED: 'FREE_LIMIT_REACHED',
    NEED_PACKAGE: 'NEED_PACKAGE',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
  };

  // ============================================================
  //  ایموجی‌های Alias
  // ============================================================

  const EMOJI_POOL = [
    // حیوانات
    '🦊', '🐼', '🦁', '🐯', '🐸', '🐧', '🦉', '🦅', '🐺', '🐻',
    '🐨', '🐵', '🦄', '🐲', '🦖', '🦕', '🐙', '🦑', '🦋', '🐝',
    // طبیعت
    '🌸', '🌺', '🌻', '🌹', '🍀', '🌿', '🍁', '🌲', '🌳', '🌵',
    // اجرام
    '⭐️', '🌟', '✨', '💫', '☄️', '🌙', '🌞', '🌈', '🔥', '❄️',
    // اشیاء
    '💎', '🎭', '🎩', '🕶', '👻', '🤖', '🎃', '🎯', '🎲', '🎪',
  ];

  // ============================================================
  //  API Endpoints (برای فرانت)
  // ============================================================

  const API_ENDPOINTS = {
    // کاربران
    me: '/me',
    meStats: '/me/stats',
    meVip: '/me/vip',
    meBlocks: '/me/blocks',
    meAliases: '/me/aliases',
    user: (id) => `/users/${id}`,
    profile: (slug) => `/profile/${slug}`,
    slugCheck: (slug) => `/slug/check?slug=${encodeURIComponent(slug)}`,

    // پیام‌ها
    messages: '/messages',
    messagesStats: '/messages/stats',
    message: (id) => `/messages/${id}`,
    messageRead: (id) => `/messages/${id}/read`,
    messageReport: (id) => `/messages/${id}/report`,
    messageBlock: (id) => `/messages/${id}/block`,
    messageReply: (id) => `/messages/${id}/reply`,
    messagesReadAll: '/messages/read-all',

    // پرداخت + بسته
    payments: '/payments',
    paymentPackage: '/payments/package',
    paymentSummary: '/payments/summary',
    packages: '/packages',
    packagesCompare: '/packages/compare',
    packagesCurrent: '/packages/user/current',
    packagesPrices: '/packages/prices',
    packagesReferralInfo: '/packages/referral-info',
    package: (id) => `/packages/${id}`,

    // دعوت
    referrals: '/referrals',
    referralsStats: '/referrals/stats',
    referralsRewards: '/referrals/rewards',
    referralsLink: '/referrals/link',
    referralsLeaderboard: '/referrals/leaderboard',

    // آمار (ادمین)
    adminDashboard: '/admin/dashboard',
    adminUsers: '/admin/users',
    adminReports: '/admin/reports',
    adminPayments: '/admin/payments',
    adminSystem: '/admin/system',
    adminMaintenance: '/admin/maintenance',
    statsOverview: '/stats/overview',
    statsOnline: '/stats/online',
    statsToday: '/stats/today',
    statsWeek: '/stats/week',
    statsChart: (type, days) => `/stats/chart/${type}?days=${days}`,
    statsLanguages: '/stats/languages',
    statsPackages: '/stats/packages',
    statsRevenue: '/stats/revenue',
    statsTopUsers: '/stats/top-users',
    statsAdvertising: '/stats/advertising-report',
  };

  // ============================================================
  //  خروجی
  // ============================================================

  return {
    APP,
    VERSION: APP.version,
    BOT_USERNAME: APP.botUsername,

    PACKAGES,
    FREE,
    REFERRAL,
    DURATION,

    LIMITS,
    RESERVED_SLUGS,

    CONTENT_TYPES,
    CONTENT_TYPE_ICONS,

    LANGUAGES,
    LANGUAGE_INFO,
    THEMES,

    COLORS,
    EMOJI_POOL,

    STORAGE_KEYS,
    EVENTS,
    ERROR_CODES,
    API_ENDPOINTS,
  };
});