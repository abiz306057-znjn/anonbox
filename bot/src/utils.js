/**
 * utils.js
 * همه ابزارها در یک فایل
 * نسخه ۳.۰
 *
 * شامل:
 *   - متن و HTML
 *   - زمان و تاریخ
 *   - اعداد
 *   - اسلاگ و لینک
 *   - اعتبارسنجی
 *   - شناسه و هش
 *   - آرایه و آبجکت
 *   - لاگ
 */

const crypto = require('crypto');
const config = require('./config');

// ============================================================
//  متن و HTML
// ============================================================

/**
 * فرار دادن HTML (ضد XSS)
 */
function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * کوتاه کردن متن با ...
 */
function truncate(text, maxLength = 100) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * پاکسازی نام
 */
function sanitizeName(name) {
  if (!name) return '';
  return String(name).trim().substring(0, 50);
}

/**
 * حذف کاراکترهای کنترلی
 */
function stripControlChars(text) {
  if (!text) return '';
  return String(text).replace(/[\x00-\x1F\x7F]/g, '');
}

/**
 * پاکسازی ورودی کاربر
 */
function sanitizeInput(text) {
  if (!text) return '';

  let clean = String(text);
  clean = stripControlChars(clean);
  clean = clean.replace(/\s+/g, ' ').trim();

  return clean;
}

// ============================================================
//  زمان و تاریخ
// ============================================================

/**
 * Timestamp الان (ثانیه)
 */
function now() {
  return Math.floor(Date.now() / 1000);
}

/**
 * Timestamp چند روز بعد
 */
function daysFromNow(days) {
  return now() + days * 24 * 60 * 60;
}

/**
 * Timestamp چند ساعت بعد
 */
function hoursFromNow(hours) {
  return now() + hours * 60 * 60;
}

/**
 * شروع امروز (timestamp)
 */
function startOfDay() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return Math.floor(d.getTime() / 1000);
}

/**
 * تاریخ YYYY-MM-DD
 */
function toDateString(timestamp = null) {
  const date = timestamp ? new Date(timestamp * 1000) : new Date();
  return date.toISOString().split('T')[0];
}

/**
 * فرمت تاریخ به فارسی
 */
function formatDate(timestamp, options = {}) {
  if (!timestamp) return '';

  const date = new Date(timestamp * 1000);

  try {
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...options,
    }).format(date);
  } catch (error) {
    return date.toLocaleDateString('fa-IR');
  }
}

/**
 * فرمت تاریخ + ساعت
 */
function formatDateTime(timestamp) {
  return formatDate(timestamp, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * زمان نسبی (چند دقیقه پیش)
 */
function timeAgo(timestamp) {
  if (!timestamp) return '';

  const nowTs = now();
  const diff = nowTs - timestamp;

  if (diff < 60) return 'همین حالا';
  if (diff < 3600) return `${Math.floor(diff / 60)} دقیقه پیش`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ساعت پیش`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} روز پیش`;
  if (diff < 2592000) return `${Math.floor(diff / 604800)} هفته پیش`;
  if (diff < 31536000) return `${Math.floor(diff / 2592000)} ماه پیش`;
  return `${Math.floor(diff / 31536000)} سال پیش`;
}

// ============================================================
//  اعداد
// ============================================================

/**
 * فرمت عدد با جداکننده هزارگان
 */
function formatNumber(num) {
  if (num === null || num === undefined) return '0';
  return Number(num).toLocaleString('en-US');
}

/**
 * تبدیل اعداد انگلیسی به فارسی
 */
function toPersianDigits(text) {
  if (text === null || text === undefined) return '';
  const persian = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(text).replace(/\d/g, (d) => persian[d]);
}

/**
 * تبدیل اعداد فارسی/عربی به انگلیسی
 */
function toEnglishDigits(text) {
  if (!text) return '';

  const persian = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const arabic = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

  let result = String(text);

  persian.forEach((p, i) => {
    result = result.split(p).join(i);
  });

  arabic.forEach((a, i) => {
    result = result.split(a).join(i);
  });

  return result;
}

/**
 * درصد
 */
function percent(value, total) {
  if (!total || total <= 0) return 0;
  return Math.round((value / total) * 100);
}

/**
 * ساخت progress bar متنی
 */
function progressBar(current, total, length = 10) {
  if (!total || total <= 0) return '░'.repeat(length);

  const filled = Math.round((current / total) * length);
  const empty = length - Math.max(0, Math.min(length, filled));

  return '█'.repeat(Math.max(0, Math.min(length, filled))) + '░'.repeat(empty);
}

// ============================================================
//  اسلاگ و لینک
// ============================================================

/**
 * کلمات رزرو شده
 */
const RESERVED_SLUGS = new Set([
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
]);

/**
 * ساخت اسلاگ پایه از نام
 */
function baseSlugFromName(name) {
  if (!name) return 'user';

  let cleaned = toEnglishDigits(String(name)).toLowerCase();

  cleaned = cleaned
    .replace(/[^a-z0-9_\s]/g, '')
    .replace(/\s+/g, '_')
    .trim();

  if (!cleaned) cleaned = 'user';
  if (cleaned.length > 20) cleaned = cleaned.substring(0, 20);
  if (cleaned.length < 3) cleaned = cleaned + 'user';

  return cleaned;
}

/**
 * ساخت اسلاگ یکتا (با عدد تصادفی)
 */
function generateSlug(name = null) {
  const base = baseSlugFromName(name);
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${base}${random}`;
}

/**
 * اعتبارسنجی اسلاگ
 */
function isValidSlug(slug) {
  if (!slug || typeof slug !== 'string') return false;

  const clean = slug.trim().toLowerCase();

  if (clean.length < config.limits.minSlugLength) return false;
  if (clean.length > config.limits.maxSlugLength) return false;
  if (!/^[a-z][a-z0-9_]*$/.test(clean)) return false;
  if (RESERVED_SLUGS.has(clean)) return false;

  return true;
}

/**
 * ساخت لینک اختصاصی کاربر
 */
function buildUserLink(botUsername, slug) {
  if (!botUsername || !slug) return '';
  return `https://t.me/${botUsername}?start=${slug}`;
}

/**
 * ساخت لینک دعوت
 */
function buildReferralLink(botUsername, slug) {
  if (!botUsername || !slug) return '';
  return `https://t.me/${botUsername}?start=ref_${slug}`;
}

/**
 * ساخت لینک اشتراک‌گذاری تلگرام
 */
function buildShareLink(userLink, text = '') {
  if (!userLink) return '';

  const encodedUrl = encodeURIComponent(userLink);
  const encodedText = encodeURIComponent(text);

  return `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;
}

/**
 * پارس payload شروع
 */
function parseStartPayload(payload) {
  if (!payload) {
    return { type: 'empty', value: null };
  }

  const trimmed = String(payload).trim();

  if (trimmed.startsWith('ref_')) {
    return {
      type: 'referral',
      value: trimmed.substring(4),
    };
  }

  if (isValidSlug(trimmed)) {
    return {
      type: 'user_link',
      value: trimmed,
    };
  }

  return {
    type: 'unknown',
    value: trimmed,
  };
}

// ============================================================
//  اعتبارسنجی
// ============================================================

/**
 * چک طول متن
 */
function isValidLength(text, min = 1, max = 1000) {
  if (!text || typeof text !== 'string') return false;
  const len = text.trim().length;
  return len >= min && len <= max;
}

/**
 * چک خالی نبودن
 */
function isNotEmpty(text) {
  return text !== null && text !== undefined && String(text).trim().length > 0;
}

/**
 * چک متن امن
 */
function isSafeText(text) {
  if (!text) return false;
  const cleaned = stripControlChars(String(text));
  return cleaned.length > 0;
}

/**
 * اعتبارسنجی بیو
 */
function isValidBio(bio) {
  if (!bio) return false;

  const trimmed = String(bio).trim();

  if (trimmed.length < 1) return false;
  if (trimmed.length > config.limits.maxBioLength) return false;
  if (!isSafeText(trimmed)) return false;

  return true;
}

/**
 * اعتبارسنجی نام
 */
function isValidName(name) {
  if (!name) return false;

  const trimmed = String(name).trim();

  if (trimmed.length < 1) return false;
  if (trimmed.length > config.limits.maxNameLength) return false;
  if (!isSafeText(trimmed)) return false;

  return true;
}

/**
 * اعتبارسنجی Telegram ID
 */
function isValidTelegramId(id) {
  if (!id) return false;
  const num = parseInt(toEnglishDigits(String(id)), 10);
  return Number.isFinite(num) && num > 0;
}

/**
 * اعتبارسنجی نوع پرداخت
 */
function isValidPaymentType(type) {
  const validTypes = [
    'package_weekly',
    'package_monthly',
    'package_yearly',
    'package_reply',
  ];
  return validTypes.includes(type);
}

/**
 * اعتبارسنجی package id
 */
function isValidPackageId(packageId) {
  return ['weekly', 'monthly', 'yearly', 'reply'].includes(packageId);
}

/**
 * اعتبارسنجی زبان
 */
function isValidLanguage(lang) {
  return config.languages.supported.includes(lang);
}

/**
 * اعتبارسنجی URL
 */
function isValidUrl(url) {
  if (!url || typeof url !== 'string') return false;

  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * چک URL تلگرام
 */
function isTelegramUrl(url) {
  if (!isValidUrl(url)) return false;
  return url.startsWith('https://t.me/');
}

// ============================================================
//  شناسه و هش
// ============================================================

/**
 * تولید شناسه یکتا
 */
function generateId(length = 16) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * هش SHA256
 */
function hash(text) {
  return crypto.createHash('sha256').update(String(text)).digest('hex');
}

/**
 * هش کوتاه
 */
function shortHash(text, length = 8) {
  return hash(text).substring(0, length);
}

/**
 * هش IP برای حریم خصوصی
 */
function hashIp(ip) {
  if (!ip) return null;
  return shortHash(`anonbox-ip-${ip}`, 16);
}

// ============================================================
//  آرایه و آبجکت
// ============================================================

/**
 * شکستن آرایه به تکه‌های کوچک
 */
function chunk(array, size) {
  if (!Array.isArray(array) || size <= 0) return [];

  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * حذف تکراری‌ها
 */
function unique(array) {
  return [...new Set(array)];
}

/**
 * انتخاب تصادفی از آرایه
 */
function pickRandom(array) {
  if (!Array.isArray(array) || array.length === 0) return null;
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * بهم‌ریختن آرایه
 */
function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * خواب (تاخیر)
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * گروه‌بندی آرایه بر اساس کلید
 */
function groupBy(array, keyFn) {
  if (!Array.isArray(array)) return {};

  return array.reduce((groups, item) => {
    const key = typeof keyFn === 'function' ? keyFn(item) : item[keyFn];
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
    return groups;
  }, {});
}

/**
 * مجموع آرایه
 */
function sum(array, key = null) {
  if (!Array.isArray(array)) return 0;

  return array.reduce((total, item) => {
    const value = key ? item[key] : item;
    return total + (Number(value) || 0);
  }, 0);
}

/**
 * میانگین آرایه
 */
function average(array, key = null) {
  if (!Array.isArray(array) || array.length === 0) return 0;
  return Math.round(sum(array, key) / array.length);
}

// ============================================================
//  متن - ادامه
// ============================================================

/**
 * ساخت لیست بولت‌دار
 */
function bulletList(items, bullet = '•') {
  if (!Array.isArray(items)) return '';
  return items.map((item) => `${bullet} ${item}`).join('\n');
}

/**
 * جایگزینی متغیرها در متن
 */
function replaceVars(template, vars) {
  if (!template || typeof template !== 'string') return '';

  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.split(`{${key}}`).join(String(value));
  }
  return result;
}

// ============================================================
//  لاگ (رنگ‌دار)
// ============================================================

const LOG_COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

/**
 * رنگ‌کردن متن برای لاگ
 */
function logColor(text, color = 'reset') {
  return `${LOG_COLORS[color] || ''}${text}${LOG_COLORS.reset}`;
}

// ============================================================
//  محتوای پیام
// ============================================================

/**
 * استخراج محتوا از پیام تلگرام
 */
function extractMessageContent(message) {
  if (!message) return null;

  // متن
  if (message.text) {
    return { type: 'text', text: message.text };
  }

  // عکس
  if (message.photo && message.photo.length > 0) {
    return {
      type: 'photo',
      fileId: message.photo[message.photo.length - 1].file_id,
      caption: message.caption || '',
      text: message.caption || '[عکس]',
    };
  }

  // ویدیو
  if (message.video) {
    return {
      type: 'video',
      fileId: message.video.file_id,
      caption: message.caption || '',
      text: message.caption || '[ویدیو]',
    };
  }

  // ویس
  if (message.voice) {
    return {
      type: 'voice',
      fileId: message.voice.file_id,
      text: '[پیام صوتی]',
    };
  }

  // صدا
  if (message.audio) {
    return {
      type: 'audio',
      fileId: message.audio.file_id,
      caption: message.caption || '',
      text: message.caption || '[صوت]',
    };
  }

  // استیکر
  if (message.sticker) {
    return {
      type: 'sticker',
      fileId: message.sticker.file_id,
      text: '[استیکر]',
    };
  }

  // فایل
  if (message.document) {
    return {
      type: 'document',
      fileId: message.document.file_id,
      caption: message.caption || '',
      text: message.caption || '[فایل]',
    };
  }

  return null;
}

// ============================================================
//  خروجی
// ============================================================

module.exports = {
  // متن و HTML
  escapeHtml,
  truncate,
  sanitizeName,
  stripControlChars,
  sanitizeInput,

  // زمان
  now,
  daysFromNow,
  hoursFromNow,
  startOfDay,
  toDateString,
  formatDate,
  formatDateTime,
  timeAgo,

  // اعداد
  formatNumber,
  toPersianDigits,
  toEnglishDigits,
  percent,
  progressBar,

  // اسلاگ و لینک
  RESERVED_SLUGS,
  baseSlugFromName,
  generateSlug,
  isValidSlug,
  buildUserLink,
  buildReferralLink,
  buildShareLink,
  parseStartPayload,

  // اعتبارسنجی
  isValidLength,
  isNotEmpty,
  isSafeText,
  isValidBio,
  isValidName,
  isValidTelegramId,
  isValidPaymentType,
  isValidPackageId,
  isValidLanguage,
  isValidUrl,
  isTelegramUrl,

  // شناسه و هش
  generateId,
  hash,
  shortHash,
  hashIp,

  // آرایه
  chunk,
  unique,
  pickRandom,
  shuffle,
  sleep,
  groupBy,
  sum,
  average,

  // متن - ادامه
  bulletList,
  replaceVars,

  // لاگ
  logColor,
  LOG_COLORS,

  // محتوا
  extractMessageContent,
};