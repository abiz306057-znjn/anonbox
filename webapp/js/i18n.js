/**
 * i18n.js
 * سیستم چندزبانه فرانت‌اند
 * نسخه ۳.۰ — با آبجکت داخلی (بدون fetch)
 *
 * ⚠️ ترجمه‌ها از shared/locales.js لود می‌شن که در HTML قبل از این فایل بارگذاری شده
 */

(function () {
  'use strict';

  // ============================================================
  //  تنظیمات
  // ============================================================

  const SUPPORTED_LANGS = ['fa', 'en', 'ar'];
  const DEFAULT_LANG = 'fa';
  const RTL_LANGS = ['fa', 'ar'];
  const STORAGE_KEY = 'anonbox-lang';

  // ============================================================
  //  State
  // ============================================================

  let currentLang = DEFAULT_LANG;
  let TRANSLATIONS = {};

  // ============================================================
  //  بارگذاری ترجمه‌ها از shared/locales.js
  // ============================================================

  function loadTranslations() {
    // از window.AnonBoxLocales (که تو shared/locales.js هست)
    if (window.AnonBoxLocales) {
      TRANSLATIONS = window.AnonBoxLocales;
      console.log('✅ ترجمه‌ها لود شدن:', Object.keys(TRANSLATIONS));
      return true;
    }

    console.warn('⚠️  window.AnonBoxLocales پیدا نشد');
    TRANSLATIONS = { fa: {}, en: {}, ar: {} };
    return false;
  }

  // ============================================================
  //  ذخیره و بازیابی زبان
  // ============================================================

  function getSavedLang() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && SUPPORTED_LANGS.includes(saved)) return saved;
    } catch (e) {}
    return null;
  }

  function saveLang(lang) {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {}
  }

  // ============================================================
  //  تشخیص زبان
  // ============================================================

  function detectLanguage() {
    // ۱. ذخیره‌شده
    const saved = getSavedLang();
    if (saved) return saved;

    // ۲. زبان تلگرام
    const tg = window.Telegram?.WebApp;
    const tgLang = tg?.initDataUnsafe?.user?.language_code;

    if (tgLang) {
      const code = String(tgLang).toLowerCase().split('-')[0];
      if (SUPPORTED_LANGS.includes(code)) return code;
    }

    // ۳. زبان مرورگر
    const navLang = navigator.language || navigator.userLanguage;
    if (navLang) {
      const code = String(navLang).toLowerCase().split('-')[0];
      if (SUPPORTED_LANGS.includes(code)) return code;
    }

    // ۴. پیش‌فرض
    return DEFAULT_LANG;
  }

  // ============================================================
  //  ترجمه
  // ============================================================

  function getNestedValue(obj, path) {
    if (!obj || !path) return undefined;

    const keys = String(path).split('.');
    let current = obj;

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return undefined;
      }
    }

    return current;
  }

  function replaceVars(text, vars) {
    if (typeof text !== 'string') return text;

    let result = text;
    for (const [key, value] of Object.entries(vars)) {
      result = result.split(`{${key}}`).join(String(value));
    }
    return result;
  }

  function translate(key, vars = {}) {
    // جستجو در زبان فعلی
    let value = getNestedValue(TRANSLATIONS[currentLang], key);

    // fallback به فارسی
    if (value === undefined && currentLang !== DEFAULT_LANG) {
      value = getNestedValue(TRANSLATIONS[DEFAULT_LANG], key);
    }

    // اگه پیدا نشد → خود کلید
    if (value === undefined) {
      return key;
    }

    // جایگزینی متغیرها
    if (typeof value === 'string' && Object.keys(vars).length > 0) {
      return replaceVars(value, vars);
    }

    return value;
  }

  function t(key, vars = {}) {
    return translate(key, vars);
  }

  // ============================================================
  //  اعمال زبان
  // ============================================================

  function applyLanguage(lang, options = {}) {
    if (!SUPPORTED_LANGS.includes(lang)) {
      lang = DEFAULT_LANG;
    }

    currentLang = lang;

    const html = document.documentElement;
    const dir = RTL_LANGS.includes(lang) ? 'rtl' : 'ltr';

    html.setAttribute('data-lang', lang);
    html.setAttribute('lang', lang);
    html.setAttribute('dir', dir);

    if (options.save !== false) {
      saveLang(lang);
    }

    if (options.translateElements !== false) {
      translateElements();
    }

    document.dispatchEvent(
      new CustomEvent('i18n:changed', {
        detail: { lang, dir },
      })
    );

    console.log(`🌐 زبان: ${lang} (${dir})`);
    return { lang, dir };
  }

  // ============================================================
  //  ترجمه عناصر DOM
  // ============================================================

  function translateElements(root = document) {
    // data-i18n → textContent
    root.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (key) {
        const value = t(key);
        if (value && value !== key) {
          el.textContent = value;
        }
      }
    });

    // data-i18n-placeholder → placeholder
    root.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (key) {
        const value = t(key);
        if (value && value !== key) {
          el.setAttribute('placeholder', value);
        }
      }
    });

    // data-i18n-title → title
    root.querySelectorAll('[data-i18n-title]').forEach((el) => {
      const key = el.getAttribute('data-i18n-title');
      if (key) {
        const value = t(key);
        if (value && value !== key) {
          el.setAttribute('title', value);
        }
      }
    });

    // data-i18n-aria → aria-label
    root.querySelectorAll('[data-i18n-aria]').forEach((el) => {
      const key = el.getAttribute('data-i18n-aria');
      if (key) {
        const value = t(key);
        if (value && value !== key) {
          el.setAttribute('aria-label', value);
        }
      }
    });
  }

  // ============================================================
  //  تغییر زبان
  // ============================================================

  async function setLanguage(lang, options = {}) {
    if (!SUPPORTED_LANGS.includes(lang)) {
      throw new Error(`زبان ${lang} پشتیبانی نمی‌شه`);
    }

    applyLanguage(lang, options);

    // اطلاع به سرور
    if (options.sync !== false && window.API?.updateLanguage) {
      try {
        await window.API.updateLanguage(lang);
      } catch (error) {
        console.warn('خطا در همگام‌سازی زبان:', error);
      }
    }

    return { lang, dir: getDirection(lang) };
  }

  // ============================================================
  //  اطلاعات زبان
  // ============================================================

  function getCurrentLanguage() {
    return currentLang;
  }

  function getDirection(lang = currentLang) {
    return RTL_LANGS.includes(lang) ? 'rtl' : 'ltr';
  }

  function isRtl(lang = currentLang) {
    return RTL_LANGS.includes(lang);
  }

  function getLanguageName(lang) {
    const names = {
      fa: 'فارسی',
      en: 'English',
      ar: 'العربية',
    };
    return names[lang] || names[DEFAULT_LANG];
  }

  function getLanguageFlag(lang) {
    const flags = {
      fa: '🇮🇷',
      en: '🇬🇧',
      ar: '🇸🇦',
    };
    return flags[lang] || '🌐';
  }

  function getAllLanguages() {
    return SUPPORTED_LANGS.map((code) => ({
      code,
      name: getLanguageName(code),
      flag: getLanguageFlag(code),
      dir: getDirection(code),
      isActive: code === currentLang,
    }));
  }

  // ============================================================
  //  فرمت‌دهی
  // ============================================================

  function getLocale() {
    return {
      fa: 'fa-IR',
      en: 'en-US',
      ar: 'ar-SA',
    }[currentLang] || 'fa-IR';
  }

  function formatNumber(num) {
    if (num === null || num === undefined) return '0';

    try {
      return new Intl.NumberFormat(getLocale()).format(num);
    } catch (e) {
      return String(num);
    }
  }

  function formatDate(timestamp, options = {}) {
    if (!timestamp) return '';

    const date = new Date(timestamp * 1000);

    try {
      return new Intl.DateTimeFormat(getLocale(), {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        ...options,
      }).format(date);
    } catch (e) {
      return date.toLocaleDateString();
    }
  }

  function formatTime(timestamp) {
    if (!timestamp) return '';

    const date = new Date(timestamp * 1000);

    try {
      return new Intl.DateTimeFormat(getLocale(), {
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch (e) {
      return date.toLocaleTimeString();
    }
  }

  function timeAgo(timestamp) {
    if (!timestamp) return '';

    const now = Math.floor(Date.now() / 1000);
    const diff = now - timestamp;

    if (diff < 60) return t('time.justNow') || 'همین حالا';
    if (diff < 3600) return t('time.minutesAgo', { count: Math.floor(diff / 60) });
    if (diff < 86400) return t('time.hoursAgo', { count: Math.floor(diff / 3600) });
    if (diff < 604800) return t('time.daysAgo', { count: Math.floor(diff / 86400) });
    if (diff < 2592000) return t('time.weeksAgo', { count: Math.floor(diff / 604800) });
    if (diff < 31536000) return t('time.monthsAgo', { count: Math.floor(diff / 2592000) });
    return t('time.yearsAgo', { count: Math.floor(diff / 31536000) });
  }

  // ============================================================
  //  زبان‌های انتخاب‌گر
  // ============================================================

  function openLanguagePicker() {
    const langs = getAllLanguages();

    const content = document.createElement('div');
    content.className = 'language-list';

    langs.forEach((lang) => {
      const option = document.createElement('div');
      option.className = `language-option ${lang.code === currentLang ? 'active' : ''}`;
      option.innerHTML = `
        <div class="language-flag">${lang.flag}</div>
        <div class="language-info">
          <div class="language-name">${lang.name}</div>
          <div class="language-name-en">${lang.code.toUpperCase()}</div>
        </div>
        <div class="language-check" ${lang.code === currentLang ? '' : 'hidden'}>✓</div>
      `;

      option.addEventListener('click', async () => {
        if (lang.code === currentLang) {
          window.UI.closeAllModals();
          return;
        }

        try {
          window.Audio?.playSfx?.('click');
          await setLanguage(lang.code);
          window.UI.closeAllModals();
          window.UI.showToast(t('language.changed'), 'success');

          // رفرش صفحه برای ترجمه کامل
          setTimeout(() => {
            if (window.Router?.reload) window.Router.reload();
          }, 300);
        } catch (error) {
          console.error('خطا در تغییر زبان:', error);
          window.UI.showToast('خطا', 'error');
        }
      });

      content.appendChild(option);
    });

    window.UI.openModal({
      title: `🌐 ${t('language.header')}`,
      content,
      actions: [
        {
          label: t('buttons.cancel') || 'انصراف',
          className: 'btn-ghost',
        },
      ],
      size: 'default',
    });
  }

  // ============================================================
  //  راه‌اندازی
  // ============================================================

  function setupLanguageButton() {
    const btn = document.getElementById('btn-language');
    if (!btn || btn._langListener) return;

    btn.addEventListener('click', () => {
      openLanguagePicker();
    });

    btn._langListener = true;
  }

  function init() {
    loadTranslations();

    const lang = detectLanguage();
    applyLanguage(lang, { save: false, translateElements: true });

    setupLanguageButton();

    console.log('✅ i18n آماده — زبان:', lang);
  }

  // ============================================================
  //  اجرای خودکار
  // ============================================================

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ============================================================
  //  خروجی
  // ============================================================

  window.i18n = {
    // ترجمه
    t,
    translate,
    translateElements,

    // زبان
    setLanguage,
    getCurrentLanguage,
    getDirection,
    isRtl,
    detectLanguage,

    // اطلاعات
    getLanguageName,
    getLanguageFlag,
    getAllLanguages,
    SUPPORTED_LANGS,
    DEFAULT_LANG,
    RTL_LANGS,

    // فرمت
    formatNumber,
    formatDate,
    formatTime,
    timeAgo,

    // Pickers
    openLanguagePicker,
  };
})();