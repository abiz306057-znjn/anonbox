/**
 * core.js
 * هسته SPA — همه ابزارهای پایه در یک فایل
 * نسخه ۳.۰
 *
 * شامل:
 *   - TelegramApp  (اتصال به SDK)
 *   - API          (ارتباط با سرور)
 *   - UI           (توست، مودال، لودر)
 *   - Theme        (تم روشن/تاریک)
 *   - Audio        (موسیقی + افکت)
 */

(function () {
  'use strict';

  // ============================================================
  //  TELEGRAM SDK
  // ============================================================

  const tg = window.Telegram?.WebApp;

  const TelegramApp = {
    isReady: () => !!tg,
    raw: () => tg,

    init() {
      if (!tg) {
        console.warn('⚠️ Telegram SDK لود نشده');
        return;
      }

      tg.ready();
      tg.expand();

      // رنگ‌ها
      try {
        if (tg.setHeaderColor) tg.setHeaderColor('#0F0E17');
        if (tg.setBackgroundColor) tg.setBackgroundColor('#0F0E17');
        if (tg.setBottomBarColor) tg.setBottomBarColor('#1A1927');
      } catch (e) {
        // ignore
      }

      // تایید بستن
      if (tg.enableClosingConfirmation) {
        tg.enableClosingConfirmation();
      }

      // viewport
      this.updateViewportHeight();

      // رویدادها
      this.setupEvents();

      console.log('✅ Telegram WebApp آماده');
    },

    setupEvents() {
      if (!tg) return;

      // تغییر تم
      tg.onEvent('themeChanged', () => {
        document.dispatchEvent(
          new CustomEvent('tg:theme-changed', {
            detail: { scheme: tg.colorScheme },
          })
        );
      });

      // تغییر viewport
      tg.onEvent('viewportChanged', () => {
        this.updateViewportHeight();
      });

      // فعال شدن
      tg.onEvent('activated', () => {
        document.dispatchEvent(new CustomEvent('tg:activated'));
      });

      // غیرفعال
      tg.onEvent('deactivated', () => {
        document.dispatchEvent(new CustomEvent('tg:deactivated'));
      });
    },

    updateViewportHeight() {
      const height = tg?.viewportStableHeight || window.innerHeight;
      const vh = height * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    },

    // ---- کاربر ----
    getUser: () => tg?.initDataUnsafe?.user || null,
    getUserId: () => tg?.initDataUnsafe?.user?.id || null,
    getUsername: () => tg?.initDataUnsafe?.user?.username || null,
    getFirstName: () => tg?.initDataUnsafe?.user?.first_name || null,
    getLastName: () => tg?.initDataUnsafe?.user?.last_name || null,
    getLanguageCode: () => tg?.initDataUnsafe?.user?.language_code || 'fa',
    getPhotoUrl: () => tg?.initDataUnsafe?.user?.photo_url || null,

    getStartParam: () => tg?.initDataUnsafe?.start_param || null,

    // ---- Haptic ----
    haptic(type = 'light') {
      if (!tg?.HapticFeedback) return;

      try {
        if (['light', 'medium', 'heavy', 'rigid', 'soft'].includes(type)) {
          tg.HapticFeedback.impactOccurred(type);
        } else if (['error', 'success', 'warning'].includes(type)) {
          tg.HapticFeedback.notificationOccurred(type);
        } else if (type === 'selection') {
          tg.HapticFeedback.selectionChanged();
        }
      } catch (e) {
        // ignore
      }
    },

    // ---- Popup ----
    showPopup(options = {}) {
      if (!tg?.showPopup) {
        if (options.message) window.alert(options.message);
        return Promise.resolve('ok');
      }

      return new Promise((resolve) => {
        tg.showPopup(
          {
            title: options.title || '',
            message: options.message || '',
            buttons: options.buttons || [
              { id: 'ok', type: 'default', text: 'باشه' },
            ],
          },
          (id) => resolve(id)
        );
      });
    },

    showConfirm(message, title = '') {
      return this.showPopup({
        title,
        message,
        buttons: [
          { id: 'cancel', type: 'cancel', text: 'انصراف' },
          { id: 'confirm', type: 'default', text: 'تایید' },
        ],
      }).then((id) => id === 'confirm');
    },

    showAlert(message, title = '') {
      return this.showPopup({
        title,
        message,
        buttons: [{ id: 'ok', type: 'default', text: 'باشه' }],
      });
    },

    // ---- Links ----
    close() {
      if (tg?.close) tg.close();
    },

    openTelegramLink(url) {
      if (!url) return;
      if (tg?.openTelegramLink) tg.openTelegramLink(url);
      else window.open(url, '_blank');
    },

    openLink(url) {
      if (!url) return;
      if (tg?.openLink) tg.openLink(url);
      else window.open(url, '_blank');
    },

    shareLink(url, text = '') {
      if (!url) return;
      const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
      this.openTelegramLink(shareUrl);
    },

    openInvoice(invoiceLink) {
      if (!invoiceLink) return;
      this.openTelegramLink(invoiceLink);
    },

    // ---- Clipboard ----
    async copyToClipboard(text) {
      if (!text) return false;

      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(text);
        } else {
          const ta = document.createElement('textarea');
          ta.value = text;
          ta.style.position = 'fixed';
          ta.style.opacity = '0';
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
        }
        this.haptic('success');
        return true;
      } catch (e) {
        console.error('خطا در کپی:', e);
        return false;
      }
    },

    // ---- Environment ----
    getPlatform: () => tg?.platform || 'unknown',
    getColorScheme: () => tg?.colorScheme || 'dark',
    getInitData: () => tg?.initData || '',
  };

  // ============================================================
  //  API CLIENT
  // ============================================================

  const API_BASE = (() => {
    // اگه روی localhost هستیم → localhost:3000
    if (
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1'
    ) {
      return 'http://localhost:3000/api';
    }
    // در غیر این صورت → همون origin
    return `${window.location.origin}/api`;
  })();

  const cache = new Map();
  const CACHE_TTL = 30 * 1000;

  function getCached(key) {
    const item = cache.get(key);
    if (!item) return null;
    if (Date.now() - item.time > item.ttl) {
      cache.delete(key);
      return null;
    }
    return item.value;
  }

  function setCache(key, value, ttl = CACHE_TTL) {
    cache.set(key, { value, time: Date.now(), ttl });
  }

  function getAuthHeaders() {
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    if (tg?.initData) {
      headers['X-Telegram-Init-Data'] = tg.initData;
    }

    if (tg?.initDataUnsafe?.user?.id) {
      headers['X-User-Id'] = String(tg.initDataUnsafe.user.id);
    }

    return headers;
  }

  async function request(endpoint, options = {}) {
    const {
      method = 'GET',
      body = null,
      timeout = 15000,
      retries = 2,
      useCache = false,
    } = options;

    const url = endpoint.startsWith('http')
      ? endpoint
      : `${API_BASE}${endpoint}`;
    const cacheKey = `${method}:${url}`;

    if (useCache && method === 'GET') {
      const cached = getCached(cacheKey);
      if (cached) return cached;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const config = {
      method,
      headers: getAuthHeaders(),
      signal: controller.signal,
    };

    if (body) config.body = JSON.stringify(body);

    let lastError = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, config);
        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const error = new Error(
            errorData.message || `خطای ${response.status}`
          );
          error.status = response.status;
          error.data = errorData;
          error.code = errorData.error;
          throw error;
        }

        if (response.status === 204) return null;

        const data = await response.json();

        if (useCache && method === 'GET') {
          setCache(cacheKey, data);
        }

        return data;
      } catch (error) {
        lastError = error;

        if (
          error.name === 'AbortError' ||
          (error.status && error.status >= 400 && error.status < 500) ||
          attempt >= retries
        ) {
          break;
        }

        await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 500));
      }
    }

    clearTimeout(timeoutId);
    throw lastError;
  }

  const API = {
    request,
    get: (url, opts = {}) => request(url, { ...opts, method: 'GET' }),

    post: (url, body, opts = {}) => {
      cache.clear();
      return request(url, { ...opts, method: 'POST', body });
    },

    patch: (url, body, opts = {}) => {
      cache.clear();
      return request(url, { ...opts, method: 'PATCH', body });
    },

    delete: (url, opts = {}) => {
      cache.clear();
      return request(url, { ...opts, method: 'DELETE' });
    },

    // ---- Users ----
    getMe: () => request('/me', { useCache: true }),
    getStats: () => request('/me/stats', { useCache: true }),
    getVip: () => request('/me/vip', { useCache: true }),
    getBlocks: () => request('/me/blocks', { useCache: true }),
    getAliases: () => request('/me/aliases', { useCache: true }),
    getAliasById: (id) => request(`/me/aliases/${id}`),
    getProfile: (slug) => request(`/profile/${slug}`, { useCache: true }),
    checkSlug: (slug) =>
      request(`/slug/check?slug=${encodeURIComponent(slug)}`),
    updateMe: (data) => API.patch('/me', data),
    updateBio: (bio) => API.patch('/me/bio', { bio }),
    updateName: (name) => API.patch('/me/name', { first_name: name }),
    updateSlug: (slug) => API.patch('/me/slug', { slug }),
    updateLanguage: (language) => API.patch('/me/language', { language }),
    deleteAccount: () => API.delete('/me'),
    unblockUser: (id) => API.delete(`/me/blocks/${id}`),

    // ---- Messages ----
    getMessages: (params = {}) => {
      const q = new URLSearchParams();
      if (params.filter) q.set('filter', params.filter);
      if (params.limit) q.set('limit', params.limit);
      if (params.offset) q.set('offset', params.offset);
      return request(`/messages?${q}`);
    },
    getMessagesStats: () => request('/messages/stats', { useCache: true }),
    getMessage: (id) => request(`/messages/${id}`),
    markRead: (id) => API.post(`/messages/${id}/read`),
    markAllRead: () => API.post('/messages/read-all'),
    reportMessage: (id, reason) =>
      API.post(`/messages/${id}/report`, { reason }),
    blockSender: (id) => API.post(`/messages/${id}/block`),
    deleteMessage: (id) => API.delete(`/messages/${id}`),
    replyMessage: (id, content) =>
      API.post(`/messages/${id}/reply`, { content }),

    // ---- Packages ----
    getPackages: (lang = 'fa') =>
      request(`/packages?lang=${lang}`, { useCache: true }),
    getPackage: (id, lang = 'fa') =>
      request(`/packages/${id}?lang=${lang}`, { useCache: true }),
    getPackagesCompare: (lang = 'fa') =>
      request(`/packages/compare?lang=${lang}`, { useCache: true }),
    getPackageCurrent: () => request('/packages/user/current'),
    getPackagePrices: () => request('/packages/prices', { useCache: true }),
    getReferralInfo: (lang = 'fa') =>
      request(`/packages/referral-info?lang=${lang}`, { useCache: true }),

    // ---- Payments ----
    getPayments: (limit = 20) => request(`/payments?limit=${limit}`),
    buyPackage: (packageId) =>
      API.post('/payments/package', { package_id: packageId }),
    getPaymentSummary: () => request('/payments/summary', { useCache: true }),

    // ---- Referrals ----
    getReferralStats: () => request('/referrals/stats', { useCache: true }),
    getReferrals: (limit = 20) => request(`/referrals?limit=${limit}`),
    getReferralRewards: () => request('/referrals/rewards', { useCache: true }),
    getReferralLink: () => request('/referrals/link', { useCache: true }),
    getLeaderboard: (limit = 10) =>
      request(`/referrals/leaderboard?limit=${limit}`, { useCache: true }),

    // ---- Health ----
    health: () => request('/health').catch(() => null),
  };

  // ============================================================
  //  UI COMPONENTS
  // ============================================================

  const TOAST_ICONS = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
    gift: '🎁',
    vip: '💎',
  };

  const UI = {
    // ---- Toast ----
    showToast(message, type = 'info', duration = 3000) {
      const container = document.getElementById('toast-container');
      if (!container) return;

      const existing = container.querySelectorAll('.toast');
      if (existing.length >= 3) existing[0].remove();

      const toast = document.createElement('div');
      toast.className = `toast toast--${type}`;

      const icon = document.createElement('span');
      icon.className = 'toast-icon';
      icon.textContent = TOAST_ICONS[type] || 'ℹ️';

      const text = document.createElement('span');
      text.className = 'toast-text';
      text.textContent = message;

      toast.appendChild(icon);
      toast.appendChild(text);
      container.appendChild(toast);

      if (type === 'success' || type === 'gift' || type === 'vip')
        TelegramApp.haptic('success');
      else if (type === 'error') TelegramApp.haptic('error');
      else if (type === 'warning') TelegramApp.haptic('warning');
      else TelegramApp.haptic('light');

      // صدا
      if (window.Audio && window.Audio.playSfx) {
        if (type === 'success' || type === 'gift' || type === 'vip') {
          window.Audio.playSfx('success');
        } else if (type === 'error') {
          window.Audio.playSfx('error');
        }
      }

      setTimeout(() => {
        toast.classList.add('toast--leaving');
        setTimeout(() => toast.remove(), 300);
      }, duration);
    },

    // ---- Loader ----
    _loaderCount: 0,

    showLoader() {
      const loader = document.getElementById('loader');
      if (!loader) return;
      this._loaderCount++;
      loader.hidden = false;
    },

    hideLoader() {
      const loader = document.getElementById('loader');
      if (!loader) return;
      this._loaderCount = Math.max(0, this._loaderCount - 1);
      if (this._loaderCount === 0) {
        loader.hidden = true;
      }
    },

    resetLoader() {
      this._loaderCount = 0;
      const loader = document.getElementById('loader');
      if (loader) loader.hidden = true;
    },

    // ---- Modal ----
    openModal(options = {}) {
      const {
        id = `modal-${Date.now()}`,
        title = '',
        content = '',
        actions = [],
        onClose = null,
        size = 'default',
      } = options;

      // حذف قبلی با همین id
      const existing = document.getElementById(id);
      if (existing) existing.remove();

      const overlay = document.createElement('div');
      overlay.className = 'modal-overlay';
      overlay.id = id;

      const modal = document.createElement('div');
      modal.className = 'modal' + (size !== 'default' ? ` modal--${size}` : '');
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');

      // هدر
      if (title) {
        const header = document.createElement('div');
        header.className = 'modal-header';

        const titleEl = document.createElement('h3');
        titleEl.className = 'modal-title';
        titleEl.textContent = title;

        const closeBtn = document.createElement('button');
        closeBtn.className = 'modal-close';
        closeBtn.setAttribute('aria-label', 'بستن');
        closeBtn.textContent = '×';
        closeBtn.addEventListener('click', () => this.closeModal(id));

        header.appendChild(titleEl);
        header.appendChild(closeBtn);
        modal.appendChild(header);
      }

      // بدنه
      const body = document.createElement('div');
      body.className = 'modal-body';

      if (typeof content === 'string') {
        body.innerHTML = content;
      } else if (content instanceof HTMLElement) {
        body.appendChild(content);
      }

      modal.appendChild(body);

      // اکشن‌ها
      if (actions.length > 0) {
        const footer = document.createElement('div');
        footer.className = 'modal-footer';

        actions.forEach((action) => {
          const btn = document.createElement('button');
          btn.className = `btn ${action.className || 'btn-secondary'}`;
          btn.textContent = action.label || 'دکمه';

          if (action.disabled) btn.disabled = true;

          btn.addEventListener('click', () => {
            if (action.onClick) {
              const result = action.onClick();
              if (result !== false && action.closeOnClick !== false) {
                this.closeModal(id);
              }
            } else if (action.closeOnClick !== false) {
              this.closeModal(id);
            }
          });

          footer.appendChild(btn);
        });

        modal.appendChild(footer);
      }

      overlay.appendChild(modal);

      // رویدادها
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) this.closeModal(id);
      });

      // ESC
      const escHandler = (e) => {
        if (e.key === 'Escape') {
          this.closeModal(id);
          document.removeEventListener('keydown', escHandler);
        }
      };
      document.addEventListener('keydown', escHandler);

      document.body.appendChild(overlay);
      document.body.style.overflow = 'hidden';

      if (onClose) overlay._onClose = onClose;

      TelegramApp.haptic('light');

      return id;
    },

    closeModal(id) {
      const overlay = document.getElementById(id);
      if (!overlay) return;

      if (overlay._onClose) overlay._onClose();

      overlay.remove();

      const openModals = document.querySelectorAll('.modal-overlay');
      if (openModals.length === 0) {
        document.body.style.overflow = '';
      }

      TelegramApp.haptic('light');
    },

    closeAllModals() {
      document.querySelectorAll('.modal-overlay').forEach((m) => m.remove());
      document.body.style.overflow = '';
    },

    // ---- Helpers ----
    async copyText(text, button = null) {
      if (!text) return false;

      const success = await TelegramApp.copyToClipboard(text);

      if (success) {
        this.showToast('✅ کپی شد!', 'success', 2000);

        if (button) {
          const originalHTML = button.innerHTML;
          button.classList.add('copied');
          button.innerHTML = '✓';
          setTimeout(() => {
            button.classList.remove('copied');
            button.innerHTML = originalHTML;
          }, 1500);
        }
      } else {
        this.showToast('خطا در کپی', 'error');
      }

      return success;
    },

    confirm(message, title = '') {
      return TelegramApp.showConfirm(message, title);
    },

    alert(message, title = '') {
      return TelegramApp.showAlert(message, title);
    },

    setButtonLoading(button, loading = true) {
      if (!button) return;
      if (loading) {
        button.classList.add('loading');
        button.disabled = true;
      } else {
        button.classList.remove('loading');
        button.disabled = false;
      }
    },

    updateBadge(id, count) {
      const badge = document.getElementById(id);
      if (!badge) return;
      if (count > 0) {
        badge.textContent = count > 99 ? '99+' : count;
        badge.hidden = false;
      } else {
        badge.hidden = true;
      }
    },

    escapeHtml(text) {
      if (!text) return '';
      const div = document.createElement('div');
      div.textContent = String(text);
      return div.innerHTML;
    },

    scrollToTop(smooth = true) {
      window.scrollTo({
        top: 0,
        behavior: smooth ? 'smooth' : 'auto',
      });
    },
  };

  // ============================================================
  //  THEME
  // ============================================================

  const STORAGE_THEME = 'anonbox-theme';
  const THEMES = ['light', 'dark'];
  const DEFAULT_THEME = 'dark';

  let currentTheme = DEFAULT_THEME;

  function getSavedTheme() {
    try {
      const saved = localStorage.getItem(STORAGE_THEME);
      if (saved && THEMES.includes(saved)) return saved;
    } catch (e) {}
    return null;
  }

  function saveTheme(theme) {
    try {
      localStorage.setItem(STORAGE_THEME, theme);
    } catch (e) {}
  }

  function getTelegramTheme() {
    if (tg?.colorScheme) {
      return tg.colorScheme === 'light' ? 'light' : 'dark';
    }
    return null;
  }

  function getSystemTheme() {
    if (window.matchMedia?.('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
    return 'dark';
  }

  const Theme = {
    apply(theme, save = true) {
      if (!THEMES.includes(theme)) theme = DEFAULT_THEME;

      currentTheme = theme;
      const html = document.documentElement;

      html.setAttribute('data-theme', theme);

      // متای رنگ
      const metaTheme = document.querySelector('meta[name="theme-color"]');
      if (metaTheme) {
        metaTheme.setAttribute(
          'content',
          theme === 'dark' ? '#0F0E17' : '#F8F8FC'
        );
      }

      // هدر تلگرام
      if (tg) {
        try {
          if (tg.setHeaderColor) {
            tg.setHeaderColor(theme === 'dark' ? '#0F0E17' : '#F8F8FC');
          }
          if (tg.setBackgroundColor) {
            tg.setBackgroundColor(theme === 'dark' ? '#0F0E17' : '#F8F8FC');
          }
          if (tg.setBottomBarColor) {
            tg.setBottomBarColor(theme === 'dark' ? '#1A1927' : '#FFFFFF');
          }
        } catch (e) {}
      }

      if (save) saveTheme(theme);
      this.updateSwitcherUI();

      document.dispatchEvent(
        new CustomEvent('theme:changed', { detail: { theme } })
      );

      console.log(`🎨 تم: ${theme}`);
      return theme;
    },

    toggle() {
      const next = currentTheme === 'dark' ? 'light' : 'dark';
      this.apply(next);

      const label = next === 'dark' ? '🌙 حالت تاریک' : '☀️ حالت روشن';
      UI.showToast(label, 'info', 1500);

      return next;
    },

    updateSwitcherUI() {
      // دکمه‌های theme-option
      document.querySelectorAll('[data-theme-value]').forEach((opt) => {
        const value = opt.getAttribute('data-theme-value');
        opt.classList.toggle('active', value === currentTheme);
      });

      // آیکون‌های هدر
      const darkIcon = document.querySelector('.theme-icon-dark');
      const lightIcon = document.querySelector('.theme-icon-light');

      if (darkIcon && lightIcon) {
        if (currentTheme === 'dark') {
          darkIcon.hidden = false;
          lightIcon.hidden = true;
        } else {
          darkIcon.hidden = true;
          lightIcon.hidden = false;
        }
      }
    },

    setupSwitcher() {
      document.querySelectorAll('[data-theme-value]').forEach((opt) => {
        opt.addEventListener('click', () => {
          const theme = opt.getAttribute('data-theme-value');
          this.apply(theme);
        });
      });
    },

    setupHeaderToggle() {
      const btn = document.getElementById('btn-theme');
      if (!btn || btn._themeListener) return;

      btn.addEventListener('click', () => this.toggle());
      btn._themeListener = true;
    },

    watchTelegram() {
      document.addEventListener('tg:theme-changed', (e) => {
        const saved = getSavedTheme();
        if (saved) return;

        const scheme = e.detail?.scheme;
        if (scheme && THEMES.includes(scheme)) {
          this.apply(scheme, false);
        }
      });
    },

    init() {
      const saved = getSavedTheme();
      const theme = saved || getTelegramTheme() || getSystemTheme();

      this.apply(theme, false);
      this.setupSwitcher();
      this.setupHeaderToggle();
      this.watchTelegram();
    },

    getCurrent: () => currentTheme,
  };

  // ============================================================
  //  AUDIO
  // ============================================================

  const STORAGE_AUDIO = 'anonbox-audio';

  const audioState = {
    bgMusicEnabled: false,
    sfxEnabled: true,
    bgMusicPlaying: false,
    interactionReceived: false,
    currentSfx: {},
  };

  let bgMusicEl = null;
  const sfxEls = {};

  function loadAudioSettings() {
    try {
      const saved = localStorage.getItem(STORAGE_AUDIO);
      if (saved) {
        const parsed = JSON.parse(saved);
        audioState.bgMusicEnabled = parsed.bgMusicEnabled === true;
        audioState.sfxEnabled = parsed.sfxEnabled !== false;
      }
    } catch (e) {}
  }

  function saveAudioSettings() {
    try {
      localStorage.setItem(
        STORAGE_AUDIO,
        JSON.stringify({
          bgMusicEnabled: audioState.bgMusicEnabled,
          sfxEnabled: audioState.sfxEnabled,
        })
      );
    } catch (e) {}
  }

  function initAudioElements() {
    bgMusicEl = document.getElementById('bg-music');
    if (bgMusicEl) {
      bgMusicEl.volume = 0.3;
      bgMusicEl.loop = true;
    }

    const sfxIds = ['click', 'success', 'gift', 'error'];
    sfxIds.forEach((name) => {
      const el = document.getElementById(`sfx-${name}`);
      if (el) {
        el.volume = 0.5;
        sfxEls[name] = el;
      }
    });
  }

  const Audio = {
    async playBgMusic() {
      if (!bgMusicEl || !audioState.bgMusicEnabled) return false;

      try {
        bgMusicEl.volume = 0;
        await bgMusicEl.play();

        let vol = 0;
        const targetVol = 0.3;
        const step = targetVol / 20;

        const fadeIn = setInterval(() => {
          vol += step;
          if (vol >= targetVol) {
            vol = targetVol;
            clearInterval(fadeIn);
          }
          bgMusicEl.volume = vol;
        }, 50);

        audioState.bgMusicPlaying = true;
        return true;
      } catch (error) {
        return false;
      }
    },

    pauseBgMusic(fade = true) {
      if (!bgMusicEl || !audioState.bgMusicPlaying) return;

      if (!fade) {
        bgMusicEl.pause();
        audioState.bgMusicPlaying = false;
        return;
      }

      const startVol = bgMusicEl.volume;
      const step = startVol / 20;
      let vol = startVol;

      const fadeOut = setInterval(() => {
        vol -= step;
        if (vol <= 0) {
          vol = 0;
          clearInterval(fadeOut);
          bgMusicEl.pause();
          bgMusicEl.volume = 0.3;
          audioState.bgMusicPlaying = false;
        }
        bgMusicEl.volume = vol;
      }, 50);
    },

    toggleBgMusic() {
      audioState.bgMusicEnabled = !audioState.bgMusicEnabled;
      saveAudioSettings();

      if (audioState.bgMusicEnabled && audioState.interactionReceived) {
        this.playBgMusic();
      } else {
        this.pauseBgMusic();
      }

      const label = audioState.bgMusicEnabled ? '🎵 موسیقی روشن' : '🔇 موسیقی خاموش';
      UI.showToast(label, 'info', 1500);

      return audioState.bgMusicEnabled;
    },

    playSfx(name) {
      if (!audioState.sfxEnabled) return false;

      const el = sfxEls[name];
      if (!el) return false;

      try {
        el.currentTime = 0;
        const promise = el.play();
        if (promise) promise.catch(() => {});
        return true;
      } catch (e) {
        return false;
      }
    },

    toggleSfx() {
      audioState.sfxEnabled = !audioState.sfxEnabled;
      saveAudioSettings();

      if (audioState.sfxEnabled) this.playSfx('click');

      const label = audioState.sfxEnabled ? '🔊 صدا روشن' : '🔇 صدا خاموش';
      UI.showToast(label, 'info', 1500);

      return audioState.sfxEnabled;
    },

    setupFirstInteraction() {
      const handler = () => {
        audioState.interactionReceived = true;
        if (audioState.bgMusicEnabled) this.playBgMusic();

        document.removeEventListener('click', handler);
        document.removeEventListener('touchstart', handler);
      };

      document.addEventListener('click', handler, { once: false });
      document.addEventListener('touchstart', handler, { once: false });
    },

    setupGlobalClickSfx() {
      document.addEventListener(
        'click',
        (e) => {
          const target = e.target.closest(
            '.btn, .nav-item, .header-action, button'
          );
          if (target && !target.disabled) {
            this.playSfx('click');
          }
        },
        { passive: true }
      );
    },

    setupVisibilityHandler() {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.pauseBgMusic();
        } else if (document.visibilityState === 'visible' && audioState.bgMusicEnabled) {
          this.playBgMusic();
        }
      });
    },

    init() {
      loadAudioSettings();
      initAudioElements();
      this.setupFirstInteraction();
      this.setupGlobalClickSfx();
      this.setupVisibilityHandler();
    },

    isBgMusicEnabled: () => audioState.bgMusicEnabled,
    isSfxEnabled: () => audioState.sfxEnabled,
    hasInteracted: () => audioState.interactionReceived,
  };

  // ============================================================
  //  INIT ALL
  // ============================================================

  function initCore() {
    TelegramApp.init();
    Theme.init();
    Audio.init();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCore);
  } else {
    initCore();
  }

  // ============================================================
  //  EXPORTS
  // ============================================================

  window.TelegramApp = TelegramApp;
  window.API = API;
  window.UI = UI;
  window.Theme = Theme;
  window.Audio = Audio;

  console.log('✅ core.js آماده');
})();