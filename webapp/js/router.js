/**
 * router.js
 * مسیریاب SPA با hash-based routing
 * نسخه ۳.۰
 */

(function () {
  'use strict';

  // ============================================================
  //  تنظیمات
  // ============================================================

  const DEFAULT_ROUTE = 'home';

  const ROUTES = {
    home: { title: 'خانه', icon: '🏠', requiresAuth: true },
    inbox: { title: 'صندوق', icon: '📬', requiresAuth: true },
    referral: { title: 'دعوت', icon: '🎁', requiresAuth: true },
    upgrade: { title: 'VIP', icon: '💎', requiresAuth: true },
    settings: { title: 'تنظیمات', icon: '⚙️', requiresAuth: true },
    profile: { title: 'پروفایل', icon: '👤', requiresAuth: false },
    help: { title: 'راهنما', icon: '❓', requiresAuth: false },
    admin: { title: 'مدیریت', icon: '🔧', requiresAuth: true, requiresAdmin: true },
  };

  // ============================================================
  //  State
  // ============================================================

  let currentRoute = null;
  let currentParams = {};
  let isNavigating = false;
  const history = [];
  const MAX_HISTORY = 20;

  let contentEl = null;
  let navEl = null;

  // ============================================================
  //  پارس hash
  // ============================================================

  function parseHash(hash) {
    let path = (hash || '').replace(/^#\/?/, '');
    const [routePart, queryPart] = path.split('?');
    const route = (routePart || DEFAULT_ROUTE).toLowerCase().trim();

    const params = {};
    if (queryPart) {
      const searchParams = new URLSearchParams(queryPart);
      for (const [key, value] of searchParams) {
        params[key] = value;
      }
    }

    return { route, params };
  }

  function buildHash(route, params = {}) {
    const query = new URLSearchParams(params).toString();
    return `#/${route}${query ? '?' + query : ''}`;
  }

  // ============================================================
  //  Navigation
  // ============================================================

  async function navigate(route, params = {}, options = {}) {
    if (isNavigating) return;

    if (!ROUTES[route]) {
      console.warn(`مسیر "${route}" وجود نداره`);
      route = DEFAULT_ROUTE;
    }

    // اگه همون مسیر فعلی
    if (currentRoute === route && !options.force) {
      const currentQuery = new URLSearchParams(currentParams).toString();
      const newQuery = new URLSearchParams(params).toString();
      if (currentQuery === newQuery) return;
    }

    isNavigating = true;

    try {
      // history
      if (!options.replace && currentRoute) {
        history.push({ route: currentRoute, params: currentParams });
        if (history.length > MAX_HISTORY) history.shift();
      }

      // hash
      const hash = buildHash(route, params);
      if (options.replace) {
        window.history.replaceState(null, '', hash);
      } else if (window.location.hash !== hash) {
        window.history.pushState(null, '', hash);
      }

      // بارگذاری
      await loadRoute(route, params);
    } catch (error) {
      console.error('خطا در navigation:', error);
      renderError(error);
    } finally {
      isNavigating = false;
    }
  }

  // ============================================================
  //  بارگذاری مسیر
  // ============================================================

  async function loadRoute(route, params) {
    console.log(`🧭 مسیر: ${route}`, params);

    // unload قبلی
    if (currentRoute && window.Pages) {
      const oldPage = window.Pages[currentRoute];
      if (oldPage?.unmount) {
        try {
          await oldPage.unmount();
        } catch (e) {
          console.warn('خطا در unmount:', e);
        }
      }
    }

    // آپدیت state
    currentRoute = route;
    currentParams = params || {};

    // عنوان
    updateTitle(route);

    // nav
    updateBottomNav(route);

    // محتوا
    if (contentEl) contentEl.innerHTML = '';

    // چک وجود صفحه
    if (!window.Pages || !window.Pages[route]) {
      render404();
      return;
    }

    const page = window.Pages[route];

    // چک ادمین
    if (page.meta?.requiresAdmin) {
      const user = window.App?.getUser?.();
      const isAdmin = user?.is_admin === true || user?.role === 'admin';
      if (!isAdmin) {
        render404();
        return;
      }
    }

    // رندر
    try {
      if (page.render) {
        const html = await page.render(currentParams);
        if (typeof html === 'string') {
          contentEl.innerHTML = html;
        } else if (html instanceof HTMLElement) {
          contentEl.appendChild(html);
        }
      }

      // mount
      if (page.mount) {
        await page.mount(currentParams);
      }

      // اسکرول بالا
      if (!params.noScroll) {
        window.scrollTo({ top: 0, behavior: 'instant' });
      }

      // رویداد
      document.dispatchEvent(
        new CustomEvent('route:changed', {
          detail: { route, params: currentParams },
        })
      );

      // haptic
      window.TelegramApp?.haptic?.('light');

      // ترجمه عناصر جدید
      window.i18n?.translateElements?.(contentEl);
    } catch (error) {
      console.error(`خطا در رندر ${route}:`, error);
      renderError(error);
    }
  }

  // ============================================================
  //  Back
  // ============================================================

  function back() {
    if (history.length > 0) {
      const prev = history.pop();
      navigate(prev.route, prev.params, { replace: true });
    } else {
      navigate(DEFAULT_ROUTE, {}, { replace: true });
    }
  }

  function canGoBack() {
    return history.length > 0;
  }

  // ============================================================
  //  عنوان
  // ============================================================

  function updateTitle(route) {
    const routeInfo = ROUTES[route];
    if (!routeInfo) return;

    const t = window.i18n?.t || ((k) => k);
    const emoji = routeInfo.icon || '';

    document.title = `${emoji} ${t(`nav.${route}`) || routeInfo.title} — صندوق راز`;
  }

  // ============================================================
  //  Bottom Nav
  // ============================================================

  function updateBottomNav(route) {
    if (!navEl) return;

    navEl.querySelectorAll('.nav-item').forEach((item) => {
      const page = item.getAttribute('data-page');
      item.classList.toggle('active', page === route);
    });
  }

  // ============================================================
  //  404 / Error
  // ============================================================

  function render404() {
    if (!contentEl) return;

    const t = window.i18n?.t || ((k) => k);

    contentEl.innerHTML = `
      <div class="not-found">
        <div class="not-found-icon">🔍</div>
        <h2 class="not-found-title">${t('errors.notFound') || 'پیدا نشد'}</h2>
        <p class="not-found-text">${t('errors.pageNotFound') || 'صفحه‌ای که می‌خوای پیدا نشد.'}</p>
        <button class="btn btn-primary" onclick="Router.navigate('home')">
          ${t('nav.home') || 'خانه'}
        </button>
      </div>
    `;
  }

  function renderError(error) {
    if (!contentEl) return;

    contentEl.innerHTML = `
      <div class="not-found">
        <div class="not-found-icon">⚠️</div>
        <h2 class="not-found-title">خطا</h2>
        <p class="not-found-text">${window.UI?.escapeHtml?.(error?.message) || 'خطای نامشخص'}</p>
        <button class="btn btn-primary" onclick="location.reload()">تلاش دوباره</button>
      </div>
    `;
  }

  // ============================================================
  //  رویدادها
  // ============================================================

  function handleHashChange() {
    const { route, params } = parseHash(window.location.hash);

    if (route === currentRoute) {
      const currentQuery = new URLSearchParams(currentParams).toString();
      const newQuery = new URLSearchParams(params).toString();
      if (currentQuery === newQuery) return;
    }

    loadRoute(route, params);
  }

  function setupLinkInterception() {
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href^="#/"]');
      if (!link) return;

      const href = link.getAttribute('href');
      if (!href) return;

      e.preventDefault();

      const { route, params } = parseHash(href);
      navigate(route, params);
    });
  }

  // ============================================================
  //  راه‌اندازی
  // ============================================================

  function init() {
    contentEl = document.getElementById('app-content');
    navEl = document.getElementById('bottom-nav');

    if (!contentEl) {
      console.error('❌ app-content پیدا نشد');
      return;
    }

    // رویدادها
    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);
    setupLinkInterception();

    // بارگذاری اولیه
    const { route, params } = parseHash(window.location.hash);
    navigate(route || DEFAULT_ROUTE, params, { replace: true });

    console.log('🧭 Router آماده');
  }

  // ============================================================
  //  اجرا
  // ============================================================

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(init, 100);
    });
  } else {
    setTimeout(init, 100);
  }

  // ============================================================
  //  خروجی
  // ============================================================

  window.Router = {
    init,
    navigate,
    back,
    canGoBack,
    getCurrent: () => ({ route: currentRoute, params: currentParams }),
    reload: () => {
      if (currentRoute) loadRoute(currentRoute, currentParams);
    },
    ROUTES,
    DEFAULT_ROUTE,
  };
})();