/**
 * pages.js
 * همه صفحات SPA
 * نسخه ۳.۰
 *
 * صفحات:
 *   - home
 *   - inbox
 *   - referral
 *   - upgrade
 *   - settings
 *   - profile
 *   - help
 *   - admin (اختیاری)
 */

(function () {
  'use strict';

  window.Pages = window.Pages || {};

  // ============================================================
  //  Helper های مشترک
  // ============================================================

  function t(key, vars = {}) {
    return window.i18n?.t?.(key, vars) || key;
  }

  function escapeHtml(text) {
    return window.UI?.escapeHtml?.(text) || '';
  }

  function formatNumber(num) {
    return window.i18n?.formatNumber?.(num) || String(num || 0);
  }

  function timeAgo(ts) {
    return window.i18n?.timeAgo?.(ts) || '';
  }

  function buildUserLink(slug) {
    const botUsername = 'AnonBoxBot';
    return `https://t.me/${botUsername}?start=${slug}`;
  }

  function buildReferralLink(slug) {
    const botUsername = 'AnonBoxBot';
    return `https://t.me/${botUsername}?start=ref_${slug}`;
  }

  // ============================================================
  //  صفحه: HOME
  // ============================================================

  window.Pages.home = {
    meta: { requiresAuth: true },

    async render() {
      const user = window.App?.getUser?.();
      const tgUser = window.TelegramApp?.getUser?.();

      const firstName = tgUser?.first_name || user?.first_name || t('labels.user');
      const initial = firstName.charAt(0).toUpperCase();
      const now = Math.floor(Date.now() / 1000);
      const isVip = user?.is_vip && user?.vip_expires_at > now;
      const userLink = user?.link_slug ? buildUserLink(user.link_slug) : '';

      return `
        <div class="page-home">
          <section class="hero">
            <div class="hero-avatar">
              <div class="avatar-placeholder">${initial}</div>
            </div>
            <h1 class="hero-title">${t('home.greeting', { name: firstName })}</h1>
            <p class="hero-subtitle">${t('home.subtitle')}</p>

            <div class="link-box">
              <input
                type="text"
                class="link-input"
                id="user-link"
                readonly
                value="${userLink}"
              />
              <button class="link-copy-btn" id="btn-copy-link" type="button">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              </button>
            </div>

            <div class="hero-actions">
              <button class="btn btn-primary" id="btn-share" type="button">
                📤 ${t('buttons.share')}
              </button>
              <button class="btn btn-secondary" id="btn-help" type="button">
                ❓ ${t('nav.help')}
              </button>
            </div>
          </section>

          <section class="stats-grid">
            <div class="stat-card" data-nav-to="inbox">
              <div class="stat-icon">📨</div>
              <div class="stat-value">${formatNumber(user?.total_received || 0)}</div>
              <div class="stat-label">${t('stats.received')}</div>
            </div>
            <div class="stat-card" data-nav-to="inbox">
              <div class="stat-icon">📤</div>
              <div class="stat-value">${formatNumber(user?.total_sent || 0)}</div>
              <div class="stat-label">${t('stats.sent')}</div>
            </div>
            <div class="stat-card" data-nav-to="referral">
              <div class="stat-icon">🎁</div>
              <div class="stat-value">${formatNumber(user?.referral_count || 0)}</div>
              <div class="stat-label">${t('stats.referrals')}</div>
            </div>
          </section>

          ${
            isVip
              ? `
            <section class="vip-banner">
              <div class="vip-content">
                <div class="vip-icon">💎</div>
                <div class="vip-text">
                  <h3 class="vip-title">${t('vip.activeTitle')}</h3>
                  <p class="vip-subtitle">${t('vip.daysLeft', {
                    count: Math.ceil((user.vip_expires_at - now) / 86400),
                  })}</p>
                </div>
              </div>
            </section>
          `
              : `
            <section class="upgrade-banner" data-nav-to="upgrade" style="cursor:pointer;">
              <div class="upgrade-content">
                <div class="upgrade-icon">💎</div>
                <div class="upgrade-text">
                  <h3 class="upgrade-title">${t('vip.upgradeTitle')}</h3>
                  <p class="upgrade-subtitle">${t('vip.upgradeSubtitle')}</p>
                </div>
                <button class="btn btn-vip" type="button">${t('buttons.view')}</button>
              </div>
            </section>
          `
          }

          <section class="how-to">
            <h2 class="section-title">${t('home.howItWorks')}</h2>
            <div class="steps">
              <div class="step">
                <div class="step-number">۱</div>
                <div class="step-content">
                  <h4 class="step-title">${t('home.step1Title')}</h4>
                  <p class="step-text">${t('home.step1Text')}</p>
                </div>
              </div>
              <div class="step">
                <div class="step-number">۲</div>
                <div class="step-content">
                  <h4 class="step-title">${t('home.step2Title')}</h4>
                  <p class="step-text">${t('home.step2Text')}</p>
                </div>
              </div>
              <div class="step">
                <div class="step-number">۳</div>
                <div class="step-content">
                  <h4 class="step-title">${t('home.step3Title')}</h4>
                  <p class="step-text">${t('home.step3Text')}</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      `;
    },

    async mount() {
      const userLink = document.getElementById('user-link')?.value;

      // کپی
      document.getElementById('btn-copy-link')?.addEventListener('click', async (e) => {
        if (userLink) await window.UI.copyText(userLink, e.currentTarget);
      });

      // اشتراک
      document.getElementById('btn-share')?.addEventListener('click', () => {
        if (userLink) {
          window.TelegramApp.shareLink(userLink, t('share.defaultText'));
        }
      });

      // راهنما
      document.getElementById('btn-help')?.addEventListener('click', () => {
        window.Router.navigate('help');
      });

      // data-nav-to
      document.querySelectorAll('[data-nav-to]').forEach((el) => {
        el.addEventListener('click', () => {
          const route = el.getAttribute('data-nav-to');
          if (route) window.Router.navigate(route);
        });
      });
    },

    async unmount() {},
  };

  // ============================================================
  //  صفحه: INBOX
  // ============================================================

  const inboxState = {
    messages: [],
    filter: 'all',
    offset: 0,
    hasMore: true,
    isLoading: false,
    stats: null,
  };

  const PAGE_SIZE = 15;

  window.Pages.inbox = {
    meta: { requiresAuth: true },

    async render() {
      return `
        <div class="page-inbox">
          <section class="inbox-stats">
            <div class="inbox-stat">
              <div class="inbox-stat-value" id="inbox-total">0</div>
              <div class="inbox-stat-label">${t('stats.total')}</div>
            </div>
            <div class="inbox-stat">
              <div class="inbox-stat-value inbox-stat-value--unread" id="inbox-unread">0</div>
              <div class="inbox-stat-label">${t('inbox.filterUnread')}</div>
            </div>
            <div class="inbox-stat">
              <div class="inbox-stat-value inbox-stat-value--free" id="inbox-free">0</div>
              <div class="inbox-stat-label">${t('stats.free') || 'رایگان'}</div>
            </div>
          </section>

          <div class="daily-free-bar" id="daily-free-bar" hidden></div>

          <div class="filter-tabs">
            <button class="filter-tab active" data-filter="all" type="button">
              ${t('inbox.filterAll')}
            </button>
            <button class="filter-tab" data-filter="unread" type="button">
              ${t('inbox.filterUnread')}
            </button>
            <button class="filter-tab" data-filter="revealed" type="button">
              ${t('inbox.filterRevealed')}
            </button>
          </div>

          <div class="messages-list" id="messages-list"></div>

          <div class="empty-state" id="empty-state" hidden>
            <div class="empty-icon">📭</div>
            <h3 class="empty-title">${t('inbox.empty')}</h3>
            <p class="empty-text">${t('inbox.emptyText')}</p>
            <button class="btn btn-primary" id="btn-go-home" type="button">
              ${t('nav.home')}
            </button>
          </div>

          <div class="loading-state" id="inbox-loading">
            <div class="loader"></div>
          </div>

          <button class="btn btn-secondary btn-load-more" id="btn-load-more" hidden type="button">
            ${t('common.loadMore') || 'بارگذاری بیشتر'}
          </button>
        </div>
      `;
    },

    async mount() {
      // ریست
      inboxState.messages = [];
      inboxState.offset = 0;
      inboxState.hasMore = true;
      inboxState.filter = 'all';

      // تنظیمات
      setupFilterTabs();
      setupInboxButtons();

      // لود
      await Promise.all([loadInboxStats(), loadMessages()]);
    },

    async unmount() {
      window.UI.closeAllModals();
    },
  };

  function setupFilterTabs() {
    document.querySelectorAll('.filter-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        const filter = tab.getAttribute('data-filter');
        if (filter === inboxState.filter) return;

        document.querySelectorAll('.filter-tab').forEach((t) =>
          t.classList.remove('active')
        );
        tab.classList.add('active');

        inboxState.filter = filter;
        inboxState.offset = 0;
        inboxState.messages = [];
        loadMessages();
      });
    });
  }

  function setupInboxButtons() {
    document.getElementById('btn-go-home')?.addEventListener('click', () => {
      window.Router.navigate('home');
    });

    document.getElementById('btn-load-more')?.addEventListener('click', () => {
      loadMessages(true);
    });
  }

  async function loadInboxStats() {
    try {
      const stats = await window.API.getMessagesStats();
      inboxState.stats = stats;

      const totalEl = document.getElementById('inbox-total');
      const unreadEl = document.getElementById('inbox-unread');
      const freeEl = document.getElementById('inbox-free');

      if (totalEl) totalEl.textContent = formatNumber(stats.total);
      if (unreadEl) unreadEl.textContent = formatNumber(stats.unread);
      if (freeEl) freeEl.textContent = formatNumber(stats.daily_free?.remaining || 0);

      // نوار رایگان
      const bar = document.getElementById('daily-free-bar');
      if (bar && stats.daily_free) {
        if (stats.package) {
          bar.hidden = false;
          bar.innerHTML = `
            <div class="daily-free-bar-icon">💎</div>
            <div class="daily-free-bar-content">
              <div class="daily-free-bar-title">${escapeHtml(stats.package.name)}</div>
              <div class="daily-free-bar-text">${t('inbox.daysLeft', { count: stats.package.days_left })}</div>
            </div>
          `;
        } else if (stats.daily_free.remaining > 0) {
          bar.hidden = false;
          bar.innerHTML = `
            <div class="daily-free-bar-icon">🎁</div>
            <div class="daily-free-bar-content">
              <div class="daily-free-bar-title">${t('inbox.freeRemaining', { count: stats.daily_free.remaining })}</div>
              <div class="daily-free-bar-text">${t('inbox.usedToday', { used: stats.daily_free.used, limit: stats.daily_free.limit })}</div>
            </div>
          `;
        } else {
          bar.hidden = false;
          bar.innerHTML = `
            <div class="daily-free-bar-icon">⚠️</div>
            <div class="daily-free-bar-content">
              <div class="daily-free-bar-title">${t('inbox.freeLimitReached')}</div>
              <div class="daily-free-bar-text">${t('inbox.buyPackageHint')}</div>
            </div>
          `;
        }
      }

      // بج
      window.UI.updateBadge('nav-inbox-badge', stats.unread || 0);
    } catch (error) {
      console.error('خطا در آمار صندوق:', error);
    }
  }

  async function loadMessages(loadMore = false) {
    if (inboxState.isLoading) return;
    if (loadMore && !inboxState.hasMore) return;

    inboxState.isLoading = true;

    if (!loadMore) {
      const list = document.getElementById('messages-list');
      if (list) list.innerHTML = '';
      document.getElementById('inbox-loading').hidden = false;
    }

    try {
      const data = await window.API.getMessages({
        filter: inboxState.filter,
        limit: PAGE_SIZE,
        offset: inboxState.offset,
      });

      const messages = data.messages || [];

      if (loadMore) {
        inboxState.messages = [...inboxState.messages, ...messages];
      } else {
        inboxState.messages = messages;
      }

      inboxState.offset += messages.length;
      inboxState.hasMore = data.has_more === true;

      renderMessages();
    } catch (error) {
      console.error('خطا در لود پیام‌ها:', error);
      window.UI.showToast(t('errors.loadFailed'), 'error');
    } finally {
      inboxState.isLoading = false;
      document.getElementById('inbox-loading').hidden = true;
    }
  }

  function renderMessages() {
    const list = document.getElementById('messages-list');
    const emptyState = document.getElementById('empty-state');
    const loadMoreBtn = document.getElementById('btn-load-more');

    if (!list) return;

    if (inboxState.messages.length === 0) {
      list.innerHTML = '';
      emptyState.hidden = false;
      loadMoreBtn.hidden = true;
      return;
    }

    emptyState.hidden = true;
    loadMoreBtn.hidden = !inboxState.hasMore;

    list.innerHTML = '';

    inboxState.messages.forEach((msg, index) => {
      const card = createMessageCard(msg, index);
      list.appendChild(card);
    });
  }

  function createMessageCard(msg, index) {
    const card = document.createElement('div');
    card.className = 'message-card';
    card.setAttribute('data-message-id', msg.id);

    if (!msg.is_read) card.classList.add('unread');
    if (msg.is_revealed) card.classList.add('revealed');
    if (!msg.can_view) card.classList.add('locked');

    const alias = msg.alias || {};
    const emoji = alias.emoji || '🎭';
    const label = alias.label || t('labels.anonymous');

    const typeIcons = {
      text: '📝',
      photo: '🖼',
      video: '🎥',
      voice: '🎤',
      audio: '🎵',
      sticker: '😀',
      document: '📎',
    };

    const preview = msg.can_view
      ? escapeHtml(msg.preview || msg.content || '—')
      : t('inbox.lockedPreview');

    card.innerHTML = `
      <div class="message-header">
        <div class="message-sender-info">
          <div class="message-sender-avatar ${!msg.can_view ? 'locked' : ''}">${emoji}</div>
          <span class="alias-tag">
            <span class="alias-tag-emoji">${emoji}</span>
            ${escapeHtml(label)}
          </span>
        </div>
        <span class="message-time">${timeAgo(msg.created_at)}</span>
      </div>
      <div class="message-body ${!msg.can_view ? 'blurred' : ''}">${preview}</div>
      ${
        !msg.can_view
          ? `<div class="locked-overlay">
              <div class="locked-icon">🔒</div>
              <div class="locked-text">${t('inbox.lockedText')}</div>
            </div>`
          : ''
      }
      <div class="message-footer">
        <div class="message-meta">
          <span class="message-meta-item">${typeIcons[msg.content_type] || '📝'}</span>
          ${msg.is_revealed ? `<span class="message-meta-item text-success">✓ ${t('inbox.read')}</span>` : ''}
        </div>
      </div>
    `;

    card.addEventListener('click', () => openMessage(msg));

    return card;
  }

  async function openMessage(msg) {
    // علامت‌گذاری خوانده‌شده
    if (!msg.is_read && msg.can_view) {
      try {
        await window.API.markRead(msg.id);
        msg.is_read = true;
        const card = document.querySelector(`[data-message-id="${msg.id}"]`);
        if (card) card.classList.remove('unread');
        loadInboxStats();
      } catch (e) {}
    }

    // قفل
    if (!msg.can_view) {
      openLockedModal(msg);
      return;
    }

    // نمایش جزئیات
    const alias = msg.alias || {};
    const aliasLabel = alias.label || t('labels.anonymous');

    const content = `
      <div class="message-detail-meta">
        <span class="alias-tag">
          <span class="alias-tag-emoji">${alias.emoji || '🎭'}</span>
          ${escapeHtml(aliasLabel)}
        </span>
        <span class="message-time">${timeAgo(msg.created_at)}</span>
      </div>
      <div class="message-content">${escapeHtml(msg.content || '—')}</div>
    `;

    const actions = [];

    if (msg.can_reply && msg.has_sender) {
      actions.push({
        label: `↩️ ${t('buttons.reply')}`,
        className: 'btn-primary btn-icon',
        onClick: () => handleReply(msg),
      });
    }

    if (!msg.is_reported) {
      actions.push({
        label: `⚠️ ${t('buttons.report')}`,
        className: 'btn-warning btn-icon',
        onClick: () => handleReport(msg),
      });
    }

    if (msg.has_sender) {
      actions.push({
        label: `🚫 ${t('buttons.block')}`,
        className: 'btn-danger btn-icon',
        onClick: () => handleBlock(msg),
      });
    }

    actions.push({
      label: `🗑 ${t('buttons.delete')}`,
      className: 'btn-ghost btn-icon',
      onClick: () => handleDelete(msg),
    });

    window.UI.openModal({
      title: t('inbox.messageTitle') || 'پیام ناشناس',
      content,
      actions,
      size: 'message',
    });
  }

  function openLockedModal(msg) {
    const price = 15; // TODO از config

    const content = `
      <div class="reveal-icon">🔒</div>
      <h3 class="reveal-title">${t('inbox.lockedTitle')}</h3>
      <p class="reveal-text">${t('inbox.lockedText')}</p>
      <div class="reveal-price">
        <span class="stars-icon">⭐️</span>
        <span class="reveal-price-value">${price}</span>
        <span class="reveal-price-label">Stars</span>
      </div>
    `;

    window.UI.openModal({
      title: '',
      content,
      actions: [
        {
          label: t('buttons.buyPackage') || 'خرید بسته',
          className: 'btn-primary',
          onClick: () => window.Router.navigate('upgrade'),
        },
        {
          label: t('buttons.cancel') || 'انصراف',
          className: 'btn-ghost',
        },
      ],
      size: 'reveal',
    });
  }

  async function handleReply(msg) {
    window.UI.closeAllModals();

    const input = document.createElement('textarea');
    input.className = 'textarea';
    input.placeholder = t('reply.placeholder') || 'پاسخت رو بنویس...';
    input.maxLength = 1000;
    input.rows = 4;

    window.UI.openModal({
      title: `↩️ ${t('reply.title') || 'پاسخ ناشناس'}`,
      content: input,
      actions: [
        {
          label: t('buttons.cancel') || 'انصراف',
          className: 'btn-ghost',
        },
        {
          label: t('buttons.send') || 'ارسال',
          className: 'btn-primary',
          onClick: async () => {
            const content = input.value.trim();
            if (!content) return false;

            try {
              await window.API.replyMessage(msg.id, content);
              window.UI.showToast(t('reply.success'), 'success');
              window.Audio?.playSfx?.('success');
            } catch (error) {
              window.UI.showToast(error.message || t('errors.general'), 'error');
              return false;
            }
          },
        },
      ],
    });
  }

  async function handleReport(msg) {
    const confirmed = await window.UI.confirm(t('report.confirm'));
    if (!confirmed) return;

    try {
      await window.API.reportMessage(msg.id, 'user_report');
      window.UI.showToast(t('report.success'), 'success');
      window.UI.closeAllModals();
      msg.is_reported = true;
    } catch (error) {
      window.UI.showToast(t('errors.general'), 'error');
    }
  }

  async function handleBlock(msg) {
    const confirmed = await window.UI.confirm(t('block.confirm'));
    if (!confirmed) return;

    try {
      await window.API.blockSender(msg.id);
      window.UI.showToast(t('block.success'), 'success');
      window.UI.closeAllModals();

      inboxState.messages = inboxState.messages.filter((m) => m.id !== msg.id);
      renderMessages();
      loadInboxStats();
    } catch (error) {
      window.UI.showToast(t('errors.general'), 'error');
    }
  }

  async function handleDelete(msg) {
    const confirmed = await window.UI.confirm(t('inbox.deleteConfirm') || 'حذف بشه؟');
    if (!confirmed) return;

    try {
      await window.API.deleteMessage(msg.id);
      inboxState.messages = inboxState.messages.filter((m) => m.id !== msg.id);
      renderMessages();
      loadInboxStats();
      window.UI.showToast(t('success.deleted'), 'success');
      window.UI.closeAllModals();
    } catch (error) {
      window.UI.showToast(t('errors.general'), 'error');
    }
  }

  // ============================================================
  //  صفحه: REFERRAL
  // ============================================================

  window.Pages.referral = {
    meta: { requiresAuth: true },

    async render() {
      const user = window.App?.getUser?.();
      const referralLink = user?.link_slug ? buildReferralLink(user.link_slug) : '';

      return `
        <div class="page-referral">
          <section class="referral-hero">
            <div class="referral-icon">🎁</div>
            <h1 class="referral-title">${t('referral.heroTitle')}</h1>
            <p class="referral-subtitle">${t('referral.heroSubtitle')}</p>
          </section>

          <section class="referral-stats">
            <div class="referral-stat">
              <div class="referral-stat-icon">👥</div>
              <div class="referral-stat-value" id="ref-total">0</div>
              <div class="referral-stat-label">${t('referral.totalInvited')}</div>
            </div>
            <div class="referral-stat">
              <div class="referral-stat-icon">✅</div>
              <div class="referral-stat-value" id="ref-active">0</div>
              <div class="referral-stat-label">${t('referral.active')}</div>
            </div>
            <div class="referral-stat">
              <div class="referral-stat-icon">🎁</div>
              <div class="referral-stat-value" id="ref-rewards">0</div>
              <div class="referral-stat-label">${t('referral.rewardsEarned')}</div>
            </div>
          </section>

          <section class="referral-link-section">
            <h2 class="section-title">${t('referral.yourLinkTitle')}</h2>
            <div class="link-box link-box--primary">
              <input type="text" class="link-input" id="referral-link" readonly value="${referralLink}" />
              <button class="link-copy-btn" id="btn-copy-referral" type="button">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              </button>
            </div>
            <button class="btn btn-primary btn-block btn-lg" id="btn-share-referral" type="button">
              📤 ${t('buttons.shareToFriends')}
            </button>
          </section>

          <section class="rewards-section">
            <h2 class="section-title">${t('referral.rewardsTitle')}</h2>
            <div class="rewards-list" id="rewards-list">
              <div class="loading-state"><div class="loader"></div></div>
            </div>
          </section>

          <section class="referrals-list-section">
            <h2 class="section-title">${t('referral.recentInvites')}</h2>
            <div class="referrals-list" id="referrals-list"></div>
            <div class="empty-state empty-state--small" id="empty-ref" hidden>
              <div class="empty-icon">👥</div>
              <p class="empty-text">${t('referral.noInvites')}</p>
            </div>
          </section>
        </div>
      `;
    },

    async mount() {
      const link = document.getElementById('referral-link')?.value;

      // کپی
      document.getElementById('btn-copy-referral')?.addEventListener('click', async (e) => {
        if (link) await window.UI.copyText(link, e.currentTarget);
      });

      // اشتراک
      document.getElementById('btn-share-referral')?.addEventListener('click', () => {
        if (link) window.TelegramApp.shareLink(link, t('share.referralText'));
      });

      await Promise.all([loadReferralStats(), loadReferralsList()]);
    },

    async unmount() {},
  };

  async function loadReferralStats() {
  console.log('🎁 شروع لود آمار دعوت...');

  // ---- آمار (جدا، بدون Promise.all) ----
  let stats = {
    total: 0,
    active: 0,
    rewards: 0,
    reward_breakdown: {},
  };

  try {
    const data = await window.API.getReferralStats();
    if (data) stats = data;
    console.log('✅ آمار دعوت لود شد:', stats);
  } catch (e) {
    console.warn('⚠️ خطا در آمار دعوت:', e.message);
  }

  // ---- آپدیت کارت‌های آماری ----
  const totalEl = document.getElementById('ref-total');
  const activeEl = document.getElementById('ref-active');
  const rewardsEl = document.getElementById('ref-rewards');

  if (totalEl) totalEl.textContent = formatNumber(stats.total || 0);
  if (activeEl) activeEl.textContent = formatNumber(stats.active || 0);
  if (rewardsEl) rewardsEl.textContent = formatNumber(stats.rewards || 0);
 
  
  const rewardsList = document.getElementById('rewards-list');
  if (!rewardsList) {
    console.error('❌ rewards-list پیدا نشد!');
    return;
  }

  const total = stats.total || 0;
  const rewards = stats.reward_breakdown || {};

  const tiers = [
    {
     count: 1,
     icon: '⏱',
     title: t('referral.reward24hTitle'),
     desc: t('referral.reward24hDesc'),
     unlocked: (rewards.hours24 || 0) > 0,
    },
    {
     count: 3,
     icon: '📅',
     title: t('referral.rewardWeeklyTitle'),
     desc: t('referral.rewardWeeklyDesc'),
     unlocked: (rewards.weeks || 0) > 0,
   },
   {
     count: 10,
     icon: '📆',
     title: t('referral.rewardMonthlyTitle'),
     desc: t('referral.rewardMonthlyDesc'),
      unlocked: (rewards.months || 0) > 0,
   },
   {
     count: 10,
     icon: '💬',
     title: t('referral.rewardReplyTitle'),
     desc: t('referral.rewardReplyDesc'),
     unlocked: (rewards.reply_packages || 0) > 0,
   },
  ];


  rewardsList.innerHTML = tiers
    .map((tier) => {
      const inTier = total % tier.count;
      const percent =
        tier.count === 1
          ? total > 0
            ? 100
            : 0
          : Math.min(100, (inTier / tier.count) * 100);

      const progressText =
        tier.count === 1 ? `${total}/${tier.count}` : `${inTier}/${tier.count}`;

      return `
        <div class="reward-card ${tier.unlocked ? 'completed' : ''}">
          <div class="reward-content">
            <div class="reward-icon">${tier.icon}</div>
            <div class="reward-info">
              <div class="reward-title">${tier.title}</div>
              <div class="reward-text">${tier.desc}</div>
            </div>
          </div>
          <div class="reward-progress">
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${percent}%"></div>
            </div>
            <span class="progress-text">${progressText}</span>
          </div>
        </div>
      `;
    })
    .join('');

  console.log('✅ ۴ کارت پاداش نمایش داده شد');
}

  async function loadReferralsList() {
    try {
      const data = await window.API.getReferrals(20);
      const list = document.getElementById('referrals-list');
      const empty = document.getElementById('empty-ref');

      const referrals = data.referrals || [];

      if (referrals.length === 0) {
        list.innerHTML = '';
        empty.hidden = false;
        return;
      }

      empty.hidden = true;
      list.innerHTML = referrals
        .map(
          (r) => `
        <div class="referral-item">
          <div class="avatar avatar--sm">
            <div class="avatar-placeholder">${(r.first_name || '؟').charAt(0).toUpperCase()}</div>
          </div>
          <div class="referral-item-info">
            <div class="referral-item-name">${escapeHtml(r.first_name || r.username || 'کاربر')}</div>
            <div class="referral-item-time">${timeAgo(r.created_at)}</div>
          </div>
        </div>
      `
        )
        .join('');
    } catch (error) {
      console.error('خطا در لیست دعوت‌ها:', error);
    }
  }

  // ============================================================
  //  صفحه: UPGRADE (VIP)
  // ============================================================

  window.Pages.upgrade = {
    meta: { requiresAuth: true },

    async render() {
      const user = window.App?.getUser?.();
      const now = Math.floor(Date.now() / 1000);
      const isVip = user?.is_vip && user?.vip_expires_at > now;

      return `
        <div class="page-upgrade">
          <section class="vip-hero">
            <div class="vip-hero-icon">💎</div>
            <h1 class="vip-hero-title">${t('vip.heroTitle')}</h1>
            <p class="vip-hero-subtitle">${t('vip.heroSubtitle')}</p>

            ${
              isVip
                ? `
              <div class="vip-active-banner">
                <div class="vip-active-icon">✅</div>
                <div class="vip-active-info">
                  <div class="vip-active-title">${t('vip.activeTitle')}</div>
                  <div class="vip-active-expiry">${t('vip.daysLeft', {
                    count: Math.ceil((user.vip_expires_at - now) / 86400),
                  })}</div>
                </div>
              </div>
            `
                : ''
            }
          </section>

          <section class="plans-section">
            <h2 class="section-title">${t('vip.choosePlan')}</h2>
            <div class="plans-grid">
              ${renderPlanCards()}
            </div>
          </section>

          <section class="payment-info">
            <div class="payment-info-card">
              <div class="payment-icon">⭐️</div>
              <div class="payment-content">
                <h3 class="payment-title">${t('vip.paymentTitle')}</h3>
                <p class="payment-text">${t('vip.paymentText')}</p>
              </div>
            </div>
          </section>

          <section class="upgrade-banner" data-nav-to="referral" style="cursor:pointer;">
            <div class="upgrade-content">
              <div class="upgrade-icon">🎁</div>
              <div class="upgrade-text">
                <h3 class="upgrade-title">${t('vip.freeWayTitle')}</h3>
                <p class="upgrade-subtitle">${t('vip.freeWaySubtitle')}</p>
              </div>
              <button class="btn btn-vip" type="button">${t('buttons.view')}</button>
            </div>
          </section>

          <section class="faq-section">
            <h2 class="section-title">${t('vip.faqTitle')}</h2>
            <div class="faq-list">
              ${renderFAQ()}
            </div>
          </section>
        </div>
      `;
    },

    async mount() {
      document.querySelectorAll('[data-buy-plan]').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          handleBuyPackage(btn.getAttribute('data-buy-plan'));
        });
      });

      document.querySelectorAll('[data-nav-to]').forEach((el) => {
        el.addEventListener('click', () => {
          const route = el.getAttribute('data-nav-to');
          if (route) window.Router.navigate(route);
        });
      });
    },

    async unmount() {
      window.UI.closeAllModals();
    },
  };

  function renderPlanCards() {
    const plans = [
      { id: 'weekly', icon: '📅', price: 40, days: 7, badge: null },
      { id: 'monthly', icon: '📆', price: 120, days: 30, badge: t('vip.mostPopular'), featured: true },
      { id: 'yearly', icon: '🗓', price: 1000, days: 365, badge: t('vip.bestValue'), savings: t('vip.savings', { percent: 45 }) },
      { id: 'reply', icon: '💬', price: 400, days: 30, badge: null, reply: true },
    ];

    return plans
      .map((p) => {
        const nameKey = p.reply ? 'packages.reply' : `packages.${p.id}`;
        const name = t(nameKey);
        const desc = t(`packages.${p.id}Desc`);

        return `
        <div class="plan-card ${p.featured ? 'plan-card--featured' : ''}">
          ${p.badge ? `<div class="plan-badge ${p.featured ? 'plan-badge--featured' : ''}">${p.badge}</div>` : ''}
          <div class="plan-header">
            <div class="plan-name">${p.icon} ${name}</div>
            <div class="plan-price">
              <span class="plan-price-value">${formatNumber(p.price)}</span>
              <span class="stars-icon">⭐️</span>
            </div>
            <div class="plan-period">${desc}</div>
            ${p.savings ? `<div class="plan-savings">🎉 ${p.savings}</div>` : ''}
          </div>
          <button class="btn ${p.featured ? 'btn-vip' : 'btn-primary'} btn-block" data-buy-plan="${p.id}" type="button">
            ${t('buttons.buy')} ${name}
          </button>
        </div>
      `;
      })
      .join('');
  }

  function renderFAQ() {
    const faqs = [
      { q: t('vip.faq1Q'), a: t('vip.faq1A') },
      { q: t('vip.faq2Q'), a: t('vip.faq2A') },
      { q: t('vip.faq3Q'), a: t('vip.faq3A') },
      { q: t('vip.faq4Q'), a: t('vip.faq4A') },
      { q: t('vip.faq5Q'), a: t('vip.faq5A') },
    ];

    return faqs
      .map(
        (f) => `
      <details class="faq-item">
        <summary class="faq-question">${f.q}</summary>
        <div class="faq-answer">${f.a}</div>
      </details>
    `
      )
      .join('');
  }

  async function handleBuyPackage(packageId) {
    const prices = { weekly: 40, monthly: 120, yearly: 1000, reply: 400 };
    const price = prices[packageId];
    const name = t(`packages.${packageId}`);

    window.UI.openModal({
      title: t('vip.confirmTitle'),
      content: `
        <div class="confirm-plan">
          <div class="confirm-plan-name">${name}</div>
          <div class="confirm-plan-price">
            <span>${formatNumber(price)}</span>
            <span class="stars-icon">⭐️</span>
          </div>
        </div>
        <p class="confirm-text">${t('vip.confirmText')}</p>
      `,
      actions: [
        {
          label: t('buttons.cancel'),
          className: 'btn-ghost',
        },
        {
          label: t('buttons.confirmPurchase', { price }),
          className: 'btn-primary',
          onClick: async () => {
            try {
              const res = await window.API.buyPackage(packageId);
              if (res?.invoice?.payload) {
                // فاکتور باید از داخل ربات ارسال بشه
                // برای WebApp: فقط close می‌کنیم تا کاربر تو ربات ببینه
                window.UI.showToast(t('vip.redirecting'), 'info');
                window.Audio?.playSfx?.('success');
              }
            } catch (error) {
              window.UI.showToast(error.message || t('errors.paymentFailed'), 'error');
              return false;
            }
          },
        },
      ],
    });
  }

  // ============================================================
  //  صفحه: SETTINGS
  // ============================================================

  const settingsState = {
    user: null,
    original: {},
    slugTimer: null,
  };

  window.Pages.settings = {
    meta: { requiresAuth: true },

    async render() {
      const user = window.App?.getUser?.() || {};
      const bio = user.bio || '';
      const slug = user.link_slug || '';

      return `
        <div class="page-settings">
          <section class="settings-section">
            <h2 class="section-title">${t('settings.profileSection')}</h2>
            <div class="settings-card">
              <div class="settings-row settings-row--avatar">
                <div class="profile-avatar profile-avatar--small">
                  <div class="avatar-placeholder" id="settings-initial">
                    ${(user.first_name || '؟').charAt(0).toUpperCase()}
                  </div>
                </div>
                <div class="settings-info">
                  <div class="settings-label">${t('settings.avatar')}</div>
                  <div class="settings-hint">${t('settings.avatarHint')}</div>
                </div>
              </div>

              <div class="settings-row settings-row--column">
                <div class="settings-info">
                  <label class="settings-label" for="input-name">${t('settings.name')}</label>
                </div>
                <input type="text" class="settings-input" id="input-name" maxlength="50" value="${escapeHtml(user.first_name || '')}" />
              </div>

              <div class="settings-row settings-row--column">
                <div class="settings-info">
                  <label class="settings-label" for="input-bio">${t('settings.bio')}</label>
                  <div class="settings-hint" id="bio-hint">${bio.length}/200</div>
                </div>
                <textarea class="settings-textarea" id="input-bio" maxlength="200" rows="3">${escapeHtml(bio)}</textarea>
              </div>
            </div>
          </section>

          <section class="settings-section">
            <h2 class="section-title">${t('settings.linkSection')}</h2>
            <div class="settings-card">
              <div class="settings-row">
                <div class="settings-info">
                  <div class="settings-label">${t('settings.currentLink')}</div>
                  <div class="settings-hint" id="current-slug">/${slug}</div>
                </div>
              </div>
              <div class="settings-row settings-row--column">
                <div class="settings-info">
                  <label class="settings-label" for="input-slug">${t('settings.newSlug')}</label>
                  <div class="settings-hint">${t('settings.slugHint')}</div>
                </div>
                <input type="text" class="settings-input settings-input--ltr" id="input-slug" maxlength="32" dir="ltr" value="${slug}" />
              </div>
              <div class="slug-status" id="slug-status" hidden></div>
            </div>
          </section>

          <section class="settings-section">
            <h2 class="section-title">${t('settings.languageSection')}</h2>
            <div class="settings-card">
              <div class="language-list">
                ${renderLanguageOptions()}
              </div>
            </div>
          </section>

          <section class="settings-section">
            <h2 class="section-title">${t('settings.appearanceSection')}</h2>
            <div class="settings-card">
              <div class="settings-row">
                <div class="settings-info">
                  <div class="settings-label">${t('settings.theme')}</div>
                  <div class="settings-hint">${t('settings.themeHint')}</div>
                </div>
                <div class="theme-switcher">
                  <button class="theme-option" data-theme-value="light" type="button">☀️</button>
                  <button class="theme-option" data-theme-value="dark" type="button">🌙</button>
                </div>
              </div>

              <div class="settings-row">
                <div class="settings-info">
                  <div class="settings-label">🎵 ${t('settings.bgMusic')}</div>
                  <div class="settings-hint">${t('settings.bgMusicHint')}</div>
                </div>
                <label class="switch">
                  <input type="checkbox" id="toggle-music" />
                  <span class="switch-slider"></span>
                </label>
              </div>

              <div class="settings-row">
                <div class="settings-info">
                  <div class="settings-label">🔊 ${t('settings.sfx')}</div>
                  <div class="settings-hint">${t('settings.sfxHint')}</div>
                </div>
                <label class="switch">
                  <input type="checkbox" id="toggle-sfx" />
                  <span class="switch-slider"></span>
                </label>
              </div>
            </div>
          </section>

          <button class="btn btn-primary btn-block btn-lg" id="btn-save" style="opacity: 0.5;" disabled type="button">
            💾 ${t('buttons.save')}
          </button>

          <section class="settings-section settings-section--danger">
            <h2 class="section-title">${t('settings.dangerZone')}</h2>
            <div class="settings-card settings-card--danger">
              <button class="btn btn-danger btn-block" id="btn-delete-account" type="button">
                🗑 ${t('settings.deleteAccount')}
              </button>
              <p class="danger-hint">${t('settings.deleteHint')}</p>
            </div>
          </section>

          <div class="version-info">
            <span>🎭 ${t('app.name')}</span>
            <span class="version-separator">•</span>
            <span>${t('app.version') || 'v3'}</span>
          </div>
        </div>
      `;
    },

    async mount() {
      const user = window.App?.getUser?.() || {};
      settingsState.user = user;
      settingsState.original = { ...user };

      setupSettingsInputs();
      setupSettingsButtons();
      setupThemeSwitcher();
      setupAudioSwitcher();
      setupLanguageSwitcher();

      // آپدیت UI
      window.Theme.updateSwitcherUI();
    },

    async unmount() {
      if (settingsState.slugTimer) clearTimeout(settingsState.slugTimer);
      window.UI.closeAllModals();
    },
  };

  function renderLanguageOptions() {
    const langs = window.i18n?.getAllLanguages?.() || [];
    const current = window.i18n?.getCurrentLanguage?.() || 'fa';

    return langs
      .map(
        (l) => `
      <div class="language-option ${l.code === current ? 'active' : ''}" data-lang="${l.code}">
        <div class="language-flag">${l.flag}</div>
        <div class="language-info">
          <div class="language-name">${l.name}</div>
          <div class="language-name-en">${l.code.toUpperCase()}</div>
        </div>
        <div class="language-check" ${l.code === current ? '' : 'hidden'}>✓</div>
      </div>
    `
      )
      .join('');
  }

  function setupSettingsInputs() {
    const nameInput = document.getElementById('input-name');
    const bioInput = document.getElementById('input-bio');
    const slugInput = document.getElementById('input-slug');

    nameInput?.addEventListener('input', checkSettingsChanges);

    bioInput?.addEventListener('input', () => {
      const len = bioInput.value.length;
      const hint = document.getElementById('bio-hint');
      if (hint) hint.textContent = `${len}/200`;
      checkSettingsChanges();
    });

    slugInput?.addEventListener('input', (e) => {
      e.target.value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
      if (settingsState.slugTimer) clearTimeout(settingsState.slugTimer);
      settingsState.slugTimer = setTimeout(() => checkSlug(e.target.value), 500);
      checkSettingsChanges();
    });
  }

  function checkSettingsChanges() {
    const name = document.getElementById('input-name')?.value.trim() || '';
    const bio = document.getElementById('input-bio')?.value.trim() || '';
    const slug = document.getElementById('input-slug')?.value.trim() || '';

    const changed =
      name !== (settingsState.original.first_name || '') ||
      bio !== (settingsState.original.bio || '') ||
      slug !== (settingsState.original.link_slug || '');

    const saveBtn = document.getElementById('btn-save');
    if (saveBtn) {
      saveBtn.style.opacity = changed ? '1' : '0.5';
      saveBtn.disabled = !changed;
    }
  }

  async function checkSlug(slug) {
    const status = document.getElementById('slug-status');
    if (!status) return;

    if (slug === settingsState.original.link_slug) {
      status.hidden = true;
      return;
    }

    if (!slug || slug.length < 3) {
      status.hidden = false;
      status.className = 'slug-status slug-status--error';
      status.textContent = `❌ ${t('settings.slugTooShort')}`;
      return;
    }

    if (!/^[a-z][a-z0-9_]*$/.test(slug)) {
      status.hidden = false;
      status.className = 'slug-status slug-status--error';
      status.textContent = `❌ ${t('settings.slugInvalid')}`;
      return;
    }

    status.hidden = false;
    status.className = 'slug-status';
    status.textContent = `⏳ ${t('settings.checking')}`;

    try {
      const res = await window.API.checkSlug(slug);
      if (res.available) {
        status.className = 'slug-status slug-status--success';
        status.textContent = `✅ ${t('settings.slugAvailable')}`;
      } else {
        status.className = 'slug-status slug-status--error';
        status.textContent = `❌ ${t('settings.slugTaken')}`;
      }
    } catch (e) {
      status.hidden = true;
    }
  }

  function setupSettingsButtons() {
    document.getElementById('btn-save')?.addEventListener('click', saveSettings);

    document.getElementById('btn-delete-account')?.addEventListener('click', () => {
      window.UI.openModal({
        title: `⚠️ ${t('settings.deleteAccount')}`,
        content: `<p>${t('settings.deleteConfirm')}</p>
                  <p class="danger-hint">${t('settings.deleteWarning')}</p>`,
        actions: [
          { label: t('buttons.cancel'), className: 'btn-ghost' },
          {
            label: t('buttons.yesDelete') || 'بله، حذف کن',
            className: 'btn-danger',
            onClick: async () => {
              try {
                await window.API.deleteAccount();
                window.UI.showToast(t('settings.accountDeleted'), 'success');
                setTimeout(() => window.TelegramApp.close(), 2000);
              } catch (e) {
                window.UI.showToast(t('errors.general'), 'error');
                return false;
              }
            },
          },
        ],
      });
    });
  }

  async function saveSettings() {
    const name = document.getElementById('input-name')?.value.trim();
    const bio = document.getElementById('input-bio')?.value.trim();
    const slug = document.getElementById('input-slug')?.value.trim();

    const updates = {};
    if (name && name !== settingsState.original.first_name) updates.first_name = name;
    if (bio !== (settingsState.original.bio || '')) updates.bio = bio;
    if (slug && slug !== settingsState.original.link_slug) updates.link_slug = slug;

    if (Object.keys(updates).length === 0) {
      window.UI.showToast(t('success.noChanges'), 'info');
      return;
    }

    const saveBtn = document.getElementById('btn-save');
    window.UI.setButtonLoading(saveBtn, true);

    try {
      await window.API.updateMe(updates);
      settingsState.original = { ...settingsState.original, ...updates };

      const slugEl = document.getElementById('current-slug');
      if (slugEl && updates.link_slug) slugEl.textContent = `/${updates.link_slug}`;

      window.UI.showToast(t('success.saved'), 'success');
      window.Audio?.playSfx?.('success');
      checkSettingsChanges();
      window.App?.refreshUserData?.();
    } catch (error) {
      if (error.status === 409) {
        window.UI.showToast(t('settings.slugTaken'), 'error');
      } else {
        window.UI.showToast(error.message || t('errors.saveFailed'), 'error');
      }
    } finally {
      window.UI.setButtonLoading(saveBtn, false);
    }
  }

  function setupThemeSwitcher() {
    document.querySelectorAll('[data-theme-value]').forEach((opt) => {
      opt.addEventListener('click', () => {
        const theme = opt.getAttribute('data-theme-value');
        window.Theme.apply(theme);
      });
    });
  }

  function setupAudioSwitcher() {
    const musicToggle = document.getElementById('toggle-music');
    const sfxToggle = document.getElementById('toggle-sfx');

    if (musicToggle) {
      musicToggle.checked = window.Audio?.isBgMusicEnabled?.() || false;
      musicToggle.addEventListener('change', () => window.Audio.toggleBgMusic());
    }

    if (sfxToggle) {
      sfxToggle.checked = window.Audio?.isSfxEnabled?.() !== false;
      sfxToggle.addEventListener('change', () => window.Audio.toggleSfx());
    }
  }

  function setupLanguageSwitcher() {
    document.querySelectorAll('.language-option').forEach((opt) => {
      opt.addEventListener('click', async () => {
        const lang = opt.getAttribute('data-lang');
        try {
          await window.i18n.setLanguage(lang);
          setTimeout(() => window.Router.reload(), 300);
        } catch (e) {}
      });
    });
  }

  // ============================================================
  //  صفحه: PROFILE
  // ============================================================

  window.Pages.profile = {
    meta: { requiresAuth: false },

    async render(params) {
      const slug = params.u || params.slug;
      if (!slug) {
        return `<div class="not-found">
          <div class="not-found-icon">⚠️</div>
          <h2 class="not-found-title">لینک نامعتبر</h2>
        </div>`;
      }

      return `
        <div class="page-profile">
          <div class="loading-state" id="profile-loading">
            <div class="loader"></div>
          </div>
          <div id="profile-content" hidden></div>
        </div>
      `;
    },

    async mount(params) {
      const slug = params.u || params.slug;
      try {
        const profile = await window.API.getProfile(slug);
        renderProfile(profile);
      } catch (error) {
        const loading = document.getElementById('profile-loading');
        if (loading) {
          loading.innerHTML = `
            <div class="empty-icon">🔍</div>
            <h3 class="empty-title">${t('profile.notFound')}</h3>
            <button class="btn btn-primary" onclick="Router.navigate('home')">${t('nav.home')}</button>
          `;
        }
      }
    },

    async unmount() {},
  };

  function renderProfile(profile) {
    const content = document.getElementById('profile-content');
    const loading = document.getElementById('profile-loading');
    if (!content) return;

    if (loading) loading.hidden = true;
    content.hidden = false;

    const initial = (profile.first_name || '؟').charAt(0).toUpperCase();
    const userLink = buildUserLink(profile.link_slug);
    const memberSince = window.i18n?.formatDate?.(profile.member_since || profile.created_at) || '';

    content.innerHTML = `
      <section class="profile-card">
        <div class="profile-avatar-wrapper">
          <div class="profile-avatar">
            <div class="avatar-placeholder">${initial}</div>
          </div>
          ${profile.is_vip ? '<span class="vip-badge">💎</span>' : ''}
        </div>
        <h1 class="profile-name">${escapeHtml(profile.first_name || 'کاربر')}</h1>
        ${profile.username ? `<p class="profile-username">@${escapeHtml(profile.username)}</p>` : ''}
        ${profile.bio ? `<p class="profile-bio">${escapeHtml(profile.bio)}</p>` : `<p class="profile-bio text-muted"><em>${t('profile.noBio')}</em></p>`}
        <button class="btn btn-primary btn-block" id="btn-send-msg" type="button">
          📤 ${t('profile.sendMessage')}
        </button>
      </section>

      <section class="profile-stats">
        <div class="profile-stat">
          <div class="profile-stat-value">${formatNumber(profile.total_received || 0)}</div>
          <div class="profile-stat-label">${t('stats.received')}</div>
        </div>
        <div class="profile-stat">
          <div class="profile-stat-value" style="font-size: var(--fs-base);">${memberSince}</div>
          <div class="profile-stat-label">${t('profile.memberSince')}</div>
        </div>
      </section>

      <section class="share-section">
        <h2 class="section-title">${t('profile.yourLink')}</h2>
        <div class="link-box">
          <input type="text" class="link-input" id="profile-link" readonly value="${userLink}" />
          <button class="link-copy-btn" id="btn-copy-profile" type="button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          </button>
        </div>
      </section>
    `;

    document.getElementById('btn-send-msg')?.addEventListener('click', () => {
      window.TelegramApp.openTelegramLink(userLink);
    });

    document.getElementById('btn-copy-profile')?.addEventListener('click', async (e) => {
      await window.UI.copyText(userLink, e.currentTarget);
    });
  }

  // ============================================================
  //  صفحه: HELP
  // ============================================================

  window.Pages.help = {
    meta: { requiresAuth: false },

    async render() {
      return `
        <div class="page-help">
          <div class="help-content">
            <section class="help-hero">
              <div class="help-hero-icon">📖</div>
              <h1 class="help-hero-title">${t('help.title')}</h1>
              <p class="help-hero-subtitle">${t('help.subtitle')}</p>
            </section>

            <section>
              <h2 class="section-title">${t('help.howItWorks')}</h2>
              <div class="steps">
                <div class="step">
                  <div class="step-number">۱</div>
                  <div class="step-content">
                    <h4 class="step-title">${t('help.step1Title')}</h4>
                    <p class="step-text">${t('help.step1Text')}</p>
                  </div>
                </div>
                <div class="step">
                  <div class="step-number">۲</div>
                  <div class="step-content">
                    <h4 class="step-title">${t('help.step2Title')}</h4>
                    <p class="step-text">${t('help.step2Text')}</p>
                  </div>
                </div>
                <div class="step">
                  <div class="step-number">۳</div>
                  <div class="step-content">
                    <h4 class="step-title">${t('help.step3Title')}</h4>
                    <p class="step-text">${t('help.step3Text')}</p>
                  </div>
                </div>
                <div class="step">
                  <div class="step-number">۴</div>
                  <div class="step-content">
                    <h4 class="step-title">${t('help.step4Title')}</h4>
                    <p class="step-text">${t('help.step4Text')}</p>
                  </div>
                </div>
              </div>
            </section>

            <section class="faq-section">
              <h2 class="section-title">${t('help.faqTitle')}</h2>
              <div class="faq-list">
                ${renderFAQHelp()}
              </div>
            </section>

            <section>
              <div class="help-step">
                <div class="help-step-icon">💬</div>
                <div class="help-step-content">
                  <div class="help-step-title">${t('help.supportTitle')}</div>
                  <div class="help-step-text">${t('help.supportText')}</div>
                </div>
              </div>
            </section>

            <div class="version-info">
              <span>🎭 ${t('app.name')}</span>
              <span class="version-separator">•</span>
              <span>${t('app.version') || 'v3'}</span>
            </div>
          </div>
        </div>
      `;
    },

    async mount() {},
    async unmount() {},
  };

  function renderFAQHelp() {
    const faqs = [
      { q: t('help.faq1Q'), a: t('help.faq1A') },
      { q: t('help.faq2Q'), a: t('help.faq2A') },
      { q: t('help.faq3Q'), a: t('help.faq3A') },
      { q: t('help.faq4Q'), a: t('help.faq4A') },
      { q: t('help.faq5Q'), a: t('help.faq5A') },
      { q: t('help.faq6Q'), a: t('help.faq6A') },
    ];

    return faqs
      .map(
        (f) => `
      <details class="faq-item">
        <summary class="faq-question">${f.q}</summary>
        <div class="faq-answer">${f.a}</div>
      </details>
    `
      )
      .join('');
  }

  // ============================================================
  //  صفحه: ADMIN (اختیاری)
  // ============================================================

  window.Pages.admin = {
    meta: { requiresAuth: true, requiresAdmin: true },

    async render() {
      return `
        <div class="admin-dashboard">
          <div class="admin-header">
            <div class="admin-header-icon">🔧</div>
            <div class="admin-header-text">
              <div class="admin-header-title">داشبورد مدیریتی</div>
              <div class="admin-header-subtitle" id="admin-update">—</div>
            </div>
            <button class="btn btn-sm btn-secondary" id="admin-refresh" type="button">🔄</button>
          </div>

          <div class="admin-stats-grid" id="admin-stats">
            <div class="loading-state"><div class="loader"></div></div>
          </div>

          <div class="admin-chart-card">
            <div class="admin-chart-title">📈 بازدید ۷ روز اخیر</div>
            <div class="admin-chart-text" id="admin-chart-visits">...</div>
          </div>

          <div class="admin-chart-card">
            <div class="admin-chart-title">👥 کاربران جدید ۷ روز</div>
            <div class="admin-chart-text" id="admin-chart-users">...</div>
          </div>
        </div>
      `;
    },

    async mount() {
      document.getElementById('admin-refresh')?.addEventListener('click', () => loadAdminDashboard());
      await loadAdminDashboard();
    },

    async unmount() {},
  };

  async function loadAdminDashboard() {
    try {
      const overview = await window.API.request('/stats/overview');
      const chartVisits = await window.API.request('/stats/chart/visits?days=7');
      const chartUsers = await window.API.request('/stats/chart/users?days=7');

      const statsEl = document.getElementById('admin-stats');
      if (statsEl) {
        statsEl.innerHTML = `
          <div class="admin-stat-card">
            <div class="admin-stat-icon">👥</div>
            <div class="admin-stat-value">${formatNumber(overview.totalUsers || 0)}</div>
            <div class="admin-stat-label">کل کاربران</div>
          </div>
          <div class="admin-stat-card">
            <div class="admin-stat-icon">🟢</div>
            <div class="admin-stat-value">${formatNumber(overview.online_now || 0)}</div>
            <div class="admin-stat-label">آنلاین</div>
          </div>
          <div class="admin-stat-card">
            <div class="admin-stat-icon">📨</div>
            <div class="admin-stat-value">${formatNumber(overview.totalMessages || 0)}</div>
            <div class="admin-stat-label">پیام‌ها</div>
          </div>
          <div class="admin-stat-card">
            <div class="admin-stat-icon">💰</div>
            <div class="admin-stat-value">${formatNumber(overview.totalRevenue || 0)}</div>
            <div class="admin-stat-label">درآمد</div>
          </div>
        `;
      }

      // نمودارها
      const visitsEl = document.getElementById('admin-chart-visits');
      if (visitsEl && Array.isArray(chartVisits.data)) {
        visitsEl.textContent = chartVisits.data
          .map((d) => {
            const bar = '█'.repeat(Math.min(20, Math.ceil((d.value || 0) / 5)));
            return `${d.label}: ${bar} ${d.value}`;
          })
          .join('\n');
      }

      const usersEl = document.getElementById('admin-chart-users');
      if (usersEl && Array.isArray(chartUsers.data)) {
        usersEl.textContent = chartUsers.data
          .map((d) => {
            const bar = '█'.repeat(Math.min(20, Math.ceil((d.value || 0) / 2)));
            return `${d.label}: ${bar} ${d.value}`;
          })
          .join('\n');
      }

      const upd = document.getElementById('admin-update');
      if (upd) upd.textContent = `آخرین بروزرسانی: ${new Date().toLocaleTimeString('fa-IR')}`;
    } catch (error) {
      console.error('خطا در داشبورد ادمین:', error);
    }
  }

  console.log('✅ pages.js آماده — ' + Object.keys(window.Pages).length + ' صفحه');
})();