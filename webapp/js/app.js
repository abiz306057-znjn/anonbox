/**
 * app.js
 * راه‌انداز اصلی SPA
 * نسخه ۳.۰ — آخرین فایل، همه چیز رو راه می‌ندازه
 *
 * وظایف:
 *   - راه‌اندازی ماژول‌ها (به ترتیب)
 *   - لود اطلاعات کاربر
 *   - شروع auto-refresh
 *   - مدیریت رویدادها
 *   - خاموش کردن نرم
 */

(function () {
  'use strict';

  // ============================================================
  //  State
  // ============================================================

  let currentUser = null;
  let isInitialized = false;
  let refreshInterval = null;
  let lastFetchTime = 0;

  // ============================================================
  //  راه‌اندازی
  // ============================================================

  async function init() {
    if (isInitialized) return;

    console.log('');
    console.log('╔══════════════════════════════════════════════╗');
    console.log('║      🎭 AnonBox WebApp v3.0                  ║');
    console.log('╚══════════════════════════════════════════════╝');
    console.log('');

    try {
      // ---- ۱. بررسی SDK تلگرام ----
      if (!window.Telegram?.WebApp) {
        console.warn('⚠️ Telegram SDK لود نشده — حالت توسعه');
      } else {
        console.log('✅ Telegram SDK لود شد');
      }

      // ---- ۲. راه‌اندازی i18n ----
      if (!window.i18n) {
        console.error('❌ i18n.js لود نشده!');
        throw new Error('i18n missing');
      }
      console.log('✅ i18n آماده — زبان:', window.i18n.getCurrentLanguage());

      // ---- ۳. بررسی API ----
      if (!window.API) {
        console.error('❌ API آماده نیست!');
        throw new Error('API missing');
      }
      console.log('✅ API آماده');

      // ---- ۴. اطلاعات کاربر تلگرام ----
      setupTelegramUser();

      // ---- ۵. بررسی سلامت سرور ----
      const health = await window.API.health();
      if (health) {
        console.log('✅ سرور متصل — نسخه:', health.version);
      } else {
        console.warn('⚠️ سرور در دسترس نیست');
        window.UI.showToast('اتصال به سرور برقرار نشد', 'warning', 5000);
      }

      // ---- ۶. لود اطلاعات کاربر از سرور ----
      await loadUserData();

      // ---- ۷. رویدادها ----
      setupEventListeners();

      // ---- ۸. شروع auto-refresh ----
      startAutoRefresh();

      isInitialized = true;
      console.log('');
      console.log('✅ راه‌اندازی کامل شد');
      console.log('👤 کاربر:', currentUser?.first_name || 'نامشخص');
      console.log('');
    } catch (error) {
      console.error('❌ خطا در راه‌اندازی:', error);

      if (window.UI) {
        const msg = window.i18n?.t?.('errors.loadFailed') || 'خطا در بارگذاری';
        window.UI.showToast(msg, 'error', 5000);
      }

      // نمایش خطا در محتوا
      const content = document.getElementById('app-content');
      if (content && !currentUser) {
        content.innerHTML = `
          <div class="not-found">
            <div class="not-found-icon">⚠️</div>
            <h2 class="not-found-title">خطا در راه‌اندازی</h2>
            <p class="not-found-text">${window.UI?.escapeHtml?.(error.message) || 'خطای نامشخص'}</p>
            <button class="btn btn-primary" onclick="location.reload()">
              تلاش دوباره
            </button>
          </div>
        `;
      }
    }
  }

  // ============================================================
  //  اطلاعات کاربر تلگرام
  // ============================================================

  function setupTelegramUser() {
    const tg = window.TelegramApp;
    if (!tg || !tg.isReady()) {
      console.warn('⚠️ TelegramApp آماده نیست');
      return;
    }

    const user = tg.getUser();
    if (!user) {
      console.warn('⚠️ کاربر تلگرام پیدا نشد');
      return;
    }

    console.log('👤 تلگرام:', user.first_name || user.username || user.id);
  }

  // ============================================================
  //  لود اطلاعات کاربر
  // ============================================================

  async function loadUserData() {
    if (!window.API) return;

    try {
      const data = await window.API.getMe();

      if (data) {
        currentUser = data;
        cacheUser(data);
        updateGlobalUI();

        console.log('✅ کاربر لود شد:', data.first_name || 'نامشخص');
      }
    } catch (error) {
      console.warn('خطا در لود کاربر:', error.message);

      // بازیابی از cache
      const cached = loadCachedUser();
      if (cached) {
        currentUser = cached;
        updateGlobalUI();
        console.log('📦 کاربر از cache لود شد');
      }
    }
  }

  function cacheUser(user) {
    try {
      localStorage.setItem('anonbox-user', JSON.stringify(user));
    } catch (e) {
      // ignore
    }
  }

  function loadCachedUser() {
    try {
      const cached = localStorage.getItem('anonbox-user');
      return cached ? JSON.parse(cached) : null;
    } catch (e) {
      return null;
    }
  }

  // ============================================================
  //  آپدیت UI سراسری
  // ============================================================

  function updateGlobalUI() {
    if (!currentUser) return;

    // بج خوانده‌نشده
    const unreadCount = currentUser.unread_count || 0;
    if (window.UI) {
      window.UI.updateBadge('nav-inbox-badge', unreadCount);
    }

    // رویداد برای صفحات
    document.dispatchEvent(
      new CustomEvent('user:updated', { detail: currentUser })
    );
  }

  // ============================================================
  //  رویدادها
  // ============================================================

  function setupEventListeners() {
    // ---- بازگشت به WebApp ----
    document.addEventListener('tg:activated', () => {
      console.log('📱 WebApp فعال شد');
      refreshUserData();
    });

    // ---- تغییر تم تلگرام ----
    document.addEventListener('tg:theme-changed', (e) => {
      console.log('🎨 تم تلگرام تغییر کرد:', e.detail?.scheme);
      // Theme خودش هندل می‌کنه
    });

    // ---- تغییر مسیر ----
    document.addEventListener('route:changed', (e) => {
      console.log('📍 مسیر:', e.detail.route);

      // رفرش آمار صندوق
      if (e.detail.route === 'inbox') {
        refreshInboxBadge();
      }
    });

    // ---- آنلاین/آفلاین ----
    window.addEventListener('online', () => {
      console.log('🌐 آنلاین شد');
      refreshUserData();
      window.UI?.showToast?.('🌐 اتصال برقرار شد', 'success', 2000);
    });

    window.addEventListener('offline', () => {
      console.log('📴 آفلاین شد');
      window.UI?.showToast?.('اتصال اینترنت قطع شد', 'warning', 3000);
    });

    // ---- تغییر visibility ----
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        // اگه بیش از ۳۰ ثانیه از آخرین fetch گذشته
        const now = Date.now();
        if (now - lastFetchTime > 30000) {
          refreshUserData();
        }
      }
    });

    // ---- beforeunload ----
    window.addEventListener('beforeunload', () => {
      stopAutoRefresh();
    });

    // ---- میانبرهای کیبورد ----
    setupKeyboardShortcuts();

    // ---- data-action ----
    document.addEventListener('click', (e) => {
      const actionBtn = e.target.closest('[data-action]');
      if (actionBtn) {
        const action = actionBtn.getAttribute('data-action');
        handleDataAction(action, actionBtn);
      }
    });

    // ---- hashchange (با Router هماهنگ) ----
    window.addEventListener('hashchange', () => {
      // Router خودش مدیریت می‌کنه
    });

    console.log('✅ رویدادها متصل شدن');
  }

  // ============================================================
  //  data-action handler
  // ============================================================

  function handleDataAction(action, element) {
    switch (action) {
      case 'copy-link': {
        const link = element.getAttribute('data-link');
        if (link) window.UI?.copyText?.(link, element);
        break;
      }

      case 'share': {
        const shareLink = element.getAttribute('data-share-link');
        const shareText = element.getAttribute('data-share-text') || '';
        if (shareLink && window.TelegramApp) {
          window.TelegramApp.shareLink(shareLink, shareText);
        }
        break;
      }

      case 'navigate': {
        const route = element.getAttribute('data-route');
        if (route && window.Router) {
          window.Router.navigate(route);
        }
        break;
      }

      case 'toggle-music':
        window.Audio?.toggleBgMusic?.();
        break;

      case 'toggle-sfx':
        window.Audio?.toggleSfx?.();
        break;

      case 'change-language':
        window.i18n?.openLanguagePicker?.();
        break;

      case 'toggle-theme':
        window.Theme?.toggle?.();
        break;

      case 'reload':
        location.reload();
        break;

      case 'close':
        window.TelegramApp?.close?.();
        break;

      default:
        console.warn(`data-action ناشناخته: ${action}`);
    }
  }

  // ============================================================
  //  میانبرهای کیبورد
  // ============================================================

  function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Escape → بستن مودال
      if (e.key === 'Escape') {
        const openModals = document.querySelectorAll('.modal-overlay');
        if (openModals.length > 0) {
          const last = openModals[openModals.length - 1];
          window.UI?.closeModal?.(last.id);
        }
      }

      // Ctrl/Cmd + R → اجازه پیش‌فرض
      if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        return;
      }
    });
  }

  // ============================================================
  //  رفرش
  // ============================================================

  async function refreshUserData() {
    if (!window.API) return;

    lastFetchTime = Date.now();

    try {
      const data = await window.API.getMe();
      if (data) {
        currentUser = data;
        cacheUser(data);
        updateGlobalUI();
      }
    } catch (error) {
      console.warn('خطا در رفرش کاربر:', error.message);
    }
  }

  async function refreshInboxBadge() {
    try {
      const stats = await window.API.getMessagesStats();
      if (stats && window.UI) {
        window.UI.updateBadge('nav-inbox-badge', stats.unread || 0);
      }
    } catch (error) {
      console.warn('خطا در رفرش بج صندوق:', error.message);
    }
  }

  // ============================================================
  //  Auto-Refresh
  // ============================================================

  function startAutoRefresh() {
    // هر ۹۰ ثانیه
    refreshInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        refreshUserData();
      }
    }, 90000);

    console.log('🔄 Auto-refresh شروع شد (هر ۹۰ ثانیه)');
  }

  function stopAutoRefresh() {
    if (refreshInterval) {
      clearInterval(refreshInterval);
      refreshInterval = null;
    }
  }

  // ============================================================
  //  Helpers
  // ============================================================

  function getUser() {
    return currentUser;
  }

  function isAdmin() {
    if (!currentUser) return false;
    return currentUser.is_admin === true || currentUser.role === 'admin';
  }

  function reloadUser() {
    return loadUserData();
  }

  // ============================================================
  //  Auto-Init
  // ============================================================

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      // با کمی تاخیر برای اطمینان از لود شدن بقیه ماژول‌ها
      setTimeout(init, 100);
    });
  } else {
    setTimeout(init, 100);
  }

  // ============================================================
  //  خروجی
  // ============================================================

  window.App = {
    init,
    getUser,
    isAdmin,
    refreshUserData,
    refreshInboxBadge,
    reloadUser,
    stopAutoRefresh,
  };

  console.log('✅ app.js آماده');
})();