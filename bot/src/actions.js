/**
 * actions.js
 * همه کیبوردها + callbackها در یک فایل
 * نسخه ۳.۰
 *
 * شامل:
 *   - همه InlineKeyboardها
 *   - ثبت و مدیریت callbackها
 *
 * ⚠️ از InlineKeyboard استفاده می‌کنه
 */

const { InlineKeyboard } = require('grammy');
const config = require('./config');
const i18n = require('./i18n');
const utils = require('./utils');
const userService = require('./services/user');
const messageService = require('./services/message');
const packageService = require('./services/package');
const referralService = require('./services/referral');
const statsService = require('./services/stats');

// ============================================================
//  بخش ۱: کیبوردها
// ============================================================

// ------------------------------------------------------------
//  اصلی
// ------------------------------------------------------------

/**
 * به اشتراک‌گذاری لینک
 */
function shareLinkKeyboard(userLink, lang = 'fa') {
  const t = i18n.getTranslator(lang);
  const shareText = t('share.defaultText');

  return new InlineKeyboard()
    .url(
      `📤 ${t('buttons.shareLink')}`,
      `https://t.me/share/url?url=${encodeURIComponent(userLink)}&text=${encodeURIComponent(shareText)}`
    )
    .row()
    .copyText(`📋 ${t('buttons.copyLink')}`, userLink);
}

/**
 * منوی اصلی
 */
function mainMenuKeyboard(lang = 'fa') {
  const t = i18n.getTranslator(lang);

  return new InlineKeyboard()
    .text(`📬 ${t('buttons.openInbox')}`, 'open_inbox')
    .text(`⚙️ ${t('buttons.settings')}`, 'open_settings')
    .row()
    .text(`🎁 ${t('buttons.referral')}`, 'open_referral')
    .text(`💎 ${t('buttons.buyPackage')}`, 'open_upgrade')
    .row()
    .text(`🌐 ${t('buttons.language')}`, 'open_language')
    .text(`❓ ${t('buttons.help')}`, 'open_help');
}

/**
 * صندوق پیام
 */
function inboxKeyboard(webappUrl, unreadCount = 0, lang = 'fa') {
  const t = i18n.getTranslator(lang);
  const kb = new InlineKeyboard();

  const btnText =
    unreadCount > 0
      ? `📬 ${t('buttons.openInboxWithCount', { count: unreadCount })}`
      : `📬 ${t('buttons.openInbox')}`;

  if (webappUrl && !webappUrl.includes('localhost')) {
    kb.webApp(btnText, webappUrl).row();
  } else {
    kb.text(btnText, 'open_inbox_webapp').row();
  }

  kb.text(`🔄 ${t('buttons.refresh')}`, 'inbox_refresh')
    .text(`🔙 ${t('buttons.back')}`, 'back_to_menu');

  return kb;
}

/**
 * تنظیمات
 */
function settingsKeyboard(lang = 'fa') {
  const t = i18n.getTranslator(lang);

  return new InlineKeyboard()
    .text(`📝 ${t('buttons.editBio')}`, 'settings_edit_bio')
    .text(`👤 ${t('buttons.editName')}`, 'settings_edit_name')
    .row()
    .text(`🔗 ${t('buttons.changeSlug')}`, 'settings_change_slug')
    .text(`🌐 ${t('buttons.changeLanguage')}`, 'open_language')
    .row()
    .text(`🔒 ${t('buttons.privacy')}`, 'settings_privacy')
    .text(`🚫 ${t('buttons.blockList')}`, 'settings_blocklist')
    .row()
    .text(`🗑 ${t('buttons.deleteAccount')}`, 'settings_delete_account')
    .row()
    .text(`🔙 ${t('buttons.back')}`, 'back_to_menu');
}

/**
 * بازگشت به منو
 */
function backToMenuKeyboard(lang = 'fa') {
  const t = i18n.getTranslator(lang);
  return new InlineKeyboard().text(`🔙 ${t('buttons.back')}`, 'back_to_menu');
}

/**
 * بازگشت به تنظیمات
 */
function backToSettingsKeyboard(lang = 'fa') {
  const t = i18n.getTranslator(lang);
  return new InlineKeyboard().text(`🔙 ${t('buttons.back')}`, 'open_settings');
}

// ------------------------------------------------------------
//  پیام
// ------------------------------------------------------------

/**
 * بعد از ارسال موفق
 */
function afterSendKeyboard(targetSlug, lang = 'fa') {
  const t = i18n.getTranslator(lang);

  return new InlineKeyboard()
    .text(`📤 ${t('buttons.sendAnother')}`, `send_another_${targetSlug}`)
    .row()
    .url(`🔗 ${t('buttons.myOwnLink')}`, `https://t.me/${config.bot.username}`);
}

// ------------------------------------------------------------
//  بسته‌ها
// ------------------------------------------------------------

/**
 * خرید بسته (صفحه upgrade)
 */
function upgradeKeyboard(lang = 'fa') {
  const t = i18n.getTranslator(lang);

  return new InlineKeyboard()
    .text(
      `📅 ${t('packages.weekly')} — ${config.packages.weekly.price} ⭐️`,
      'buy_weekly'
    )
    .row()
    .text(
      `📆 ${t('packages.monthly')} — ${config.packages.monthly.price} ⭐️`,
      'buy_monthly'
    )
    .row()
    .text(
      `🗓 ${t('packages.yearly')} — ${config.packages.yearly.price} ⭐️`,
      'buy_yearly'
    )
    .row()
    .text(
      `💬 ${t('packages.reply')} — ${config.packages.reply.price} ⭐️`,
      'buy_reply'
    )
    .row()
    .text(`🎁 ${t('buttons.freeWithInvites')}`, 'info_referral_rewards')
    .row()
    .text(`🔙 ${t('buttons.back')}`, 'back_to_menu');
}

/**
 * کیبورد بسته پاسخ (وقتی کاربر بسته نداره)
 */
function replyPackageKeyboard(lang = 'fa') {
  const t = i18n.getTranslator(lang);

  return new InlineKeyboard()
    .text(
      `💬 ${t('buttons.buyReplyPackage')} — ${config.packages.reply.price} ⭐️`,
      'buy_reply'
    )
    .row()
    .text(`🎁 ${t('buttons.freeWithInvites')}`, 'info_referral_rewards')
    .row()
    .text(`🔙 ${t('buttons.back')}`, 'cancel_action');
}

// ------------------------------------------------------------
//  دعوت
// ------------------------------------------------------------

/**
 * صفحه دعوت
 */
function referralKeyboard(userLink, lang = 'fa') {
  const t = i18n.getTranslator(lang);
  const shareText = t('share.referralText');
  const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(userLink)}&text=${encodeURIComponent(shareText)}`;

  return new InlineKeyboard()
    .url(`📤 ${t('buttons.shareToFriends')}`, shareUrl)
    .row()
    .copyText(`📋 ${t('buttons.copyInviteLink')}`, userLink)
    .row()
    .text(`📊 ${t('buttons.referralStats')}`, 'referral_stats')
    .row()
    .text(`🎁 ${t('buttons.viewRewards')}`, 'referral_rewards')
    .row()
    .text(`🔙 ${t('buttons.back')}`, 'back_to_menu');
}

/**
 * آمار دعوت
 */
function referralStatsKeyboard(lang = 'fa') {
  const t = i18n.getTranslator(lang);

  return new InlineKeyboard()
    .text(`🎁 ${t('buttons.viewRewards')}`, 'referral_rewards')
    .row()
    .text(`🔙 ${t('buttons.back')}`, 'open_referral');
}

// ------------------------------------------------------------
//  زبان
// ------------------------------------------------------------

/**
 * انتخاب زبان
 */
function languageKeyboard(currentLang = 'fa') {
  const languages = [
    { code: 'fa', name: 'فارسی', flag: '🇮🇷' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  ];

  const kb = new InlineKeyboard();

  languages.forEach((lang) => {
    const isActive = lang.code === currentLang;
    const label = `${isActive ? '✅ ' : ''}${lang.flag} ${lang.name}`;

    kb.text(label, `set_lang_${lang.code}`).row();
  });

  const t = i18n.getTranslator(currentLang);
  kb.text(`🔙 ${t('buttons.back')}`, 'back_to_menu');

  return kb;
}

// ------------------------------------------------------------
//  کمکی
// ------------------------------------------------------------

/**
 * تایید عملیات خطرناک
 */
function confirmActionKeyboard(action, confirmText = 'بله، مطمئنم', lang = 'fa') {
  const t = i18n.getTranslator(lang);

  return new InlineKeyboard()
    .text(`✅ ${confirmText}`, `confirm_${action}`)
    .row()
    .text(`❌ ${t('buttons.cancel')}`, 'cancel_action');
}

/**
 * انصراف
 */
function cancelKeyboard(lang = 'fa') {
  const t = i18n.getTranslator(lang);
  return new InlineKeyboard().text(`❌ ${t('buttons.cancel')}`, 'cancel_action');
}

/**
 * لیست بلاک‌شده‌ها
 */
function blockListKeyboard(blockedUsers, lang = 'fa') {
  const t = i18n.getTranslator(lang);
  const kb = new InlineKeyboard();

  blockedUsers.forEach((user) => {
    const name = user.first_name || user.username || `کاربر ${user.telegram_id}`;
    kb.text(`❌ ${name}`, `unblock_${user.telegram_id}`).row();
  });

  kb.text(`🔙 ${t('buttons.back')}`, 'open_settings');
  return kb;
}

/**
 * پیشنهاد اسلاگ
 */
function slugOptionsKeyboard(suggestedSlug, lang = 'fa') {
  const t = i18n.getTranslator(lang);

  return new InlineKeyboard()
    .text(
      `✅ ${t('buttons.useSuggested', { slug: suggestedSlug })}`,
      `slug_use_${suggestedSlug}`
    )
    .row()
    .text(`✏️ ${t('buttons.enterCustomSlug')}`, 'slug_custom')
    .row()
    .text(`❌ ${t('buttons.cancel')}`, 'cancel_action');
}

// ------------------------------------------------------------
//  ادمین
// ------------------------------------------------------------

function adminKeyboard(lang = 'fa') {
  return new InlineKeyboard()
    .text('📊 آمار کامل', 'admin_full_stats')
    .text('📈 نمودارها', 'admin_charts')
    .row()
    .text('👥 کاربران', 'admin_users')
    .text('⚠️ گزارش‌ها', 'admin_reports')
    .row()
    .text('💰 پرداخت‌ها', 'admin_payments')
    .text('⚙️ سیستم', 'admin_system')
    .row()
    .text('📢 برودکست', 'admin_broadcast')
    .row()
    .text('🔄 بروزرسانی', 'admin_refresh');
}

// ============================================================
//  بخش ۲: ثبت callbackها
// ============================================================

function registerCallbacks(bot) {
  // ===== ناوبری =====
  bot.callbackQuery('back_to_menu', handleBackToMenu);
  bot.callbackQuery('open_inbox', handleOpenInbox);
  bot.callbackQuery('inbox_refresh', handleInboxRefresh);
  bot.callbackQuery('open_settings', handleOpenSettings);
  bot.callbackQuery('open_referral', handleOpenReferral);
  bot.callbackQuery('open_upgrade', handleOpenUpgrade);
  bot.callbackQuery('open_help', handleOpenHelp);
  bot.callbackQuery('open_language', handleOpenLanguage);

  // ===== تنظیمات =====
  bot.callbackQuery('settings_edit_bio', handleEditBio);
  bot.callbackQuery('settings_edit_name', handleEditName);
  bot.callbackQuery('settings_change_slug', handleChangeSlug);
  bot.callbackQuery('settings_privacy', handlePrivacy);
  bot.callbackQuery('settings_blocklist', handleBlockList);
  bot.callbackQuery('settings_delete_account', handleDeleteAccount);

  // ===== پیام‌ها =====
  bot.callbackQuery(/^msg_report_(\d+)$/, (ctx) => {
    const id = parseInt(ctx.match[1], 10);
    return handleReport(ctx, id);
  });

  bot.callbackQuery(/^msg_block_(\d+)$/, (ctx) => {
    const id = parseInt(ctx.match[1], 10);
    return handleBlock(ctx, id);
  });

  bot.callbackQuery(/^msg_delete_(\d+)$/, (ctx) => {
    const id = parseInt(ctx.match[1], 10);
    return handleDelete(ctx, id);
  });

  bot.callbackQuery(/^msg_reply_(\d+)$/, (ctx) => {
    const id = parseInt(ctx.match[1], 10);
    return handleStartReply(ctx, id);
  });

  // ===== ارسال =====
  bot.callbackQuery(/^send_another_(.+)$/, handleSendAnother);

  // ===== خرید بسته =====
  bot.callbackQuery('buy_weekly', (ctx) => handleBuyPackage(ctx, 'weekly'));
  bot.callbackQuery('buy_monthly', (ctx) => handleBuyPackage(ctx, 'monthly'));
  bot.callbackQuery('buy_yearly', (ctx) => handleBuyPackage(ctx, 'yearly'));
  bot.callbackQuery('buy_reply', (ctx) => handleBuyPackage(ctx, 'reply'));
  bot.callbackQuery('info_referral_rewards', handleReferralRewardsInfo);

  // ===== دعوت =====
  bot.callbackQuery('referral_stats', handleReferralStats);
  bot.callbackQuery('referral_rewards', handleReferralRewards);

  // ===== زبان =====
  bot.callbackQuery(/^set_lang_(fa|en|ar)$/, (ctx) => {
    const newLang = ctx.match[1];
    return handleSetLanguage(ctx, newLang);
  });

  // ===== اسلاگ =====
  bot.callbackQuery(/^slug_use_(.+)$/, handleSlugUse);
  bot.callbackQuery('slug_custom', handleSlugCustom);

  // ===== آنبلاک =====
  bot.callbackQuery(/^unblock_(\d+)$/, (ctx) => {
    const id = parseInt(ctx.match[1], 10);
    return handleUnblock(ctx, id);
  });

  // ===== عمومی =====
  bot.callbackQuery('cancel_action', handleCancelAction);
  bot.callbackQuery(/^confirm_(.+)$/, (ctx) => {
    const action = ctx.match[1];
    return handleConfirmAction(ctx, action);
  });

  // ===== ادمین =====
  bot.callbackQuery('admin_refresh', handleAdminRefresh);
  bot.callbackQuery('admin_full_stats', handleAdminFullStats);
  bot.callbackQuery('admin_users', handleAdminUsers);
  bot.callbackQuery('admin_reports', handleAdminReports);
  bot.callbackQuery('admin_payments', handleAdminPayments);
  bot.callbackQuery('admin_system', handleAdminSystem);
  bot.callbackQuery('admin_broadcast', handleAdminBroadcast);

  // ===== ناشناخته =====
  bot.on('callback_query:data', async (ctx) => {
    console.warn(`⚠️  callback ناشناخته: ${ctx.callbackQuery.data}`);
    await ctx.answerCallbackQuery({
      text: 'این دکمه دیگه فعال نیست.',
      show_alert: false,
    });
  });
}

// ============================================================
//  بخش ۳: توابع مدیریت callback
// ============================================================

// ------------------------------------------------------------
//  ناوبری
// ------------------------------------------------------------

async function handleBackToMenu(ctx) {
  try {
    const user = userService.getByTelegramId(ctx.from.id);
    if (!user) {
      await ctx.answerCallbackQuery({ text: 'ابتدا /start بزنید.', show_alert: true });
      return;
    }

    const lang = user.language || config.languages.default;
    const t = i18n.getTranslator(lang);

    const userLink = utils.buildUserLink(config.bot.username, user.link_slug);

    await ctx.answerCallbackQuery();
    await ctx.editMessageText(t('start.welcomeBack', { link: userLink }), {
      parse_mode: 'HTML',
      reply_markup: mainMenuKeyboard(lang),
      link_preview_options: { is_disabled: true },
    });
  } catch (error) {
    if (!error.message?.includes('message is not modified')) {
      console.error('خطا در back_to_menu:', error);
    }
    await ctx.answerCallbackQuery();
  }
}

async function handleOpenInbox(ctx) {
  try {
    const user = userService.getByTelegramId(ctx.from.id);
    if (!user) return;

    const lang = user.language || config.languages.default;
    const t = i18n.getTranslator(lang);

    const stats = messageService.getStatsForUser(user.telegram_id);
    const freeStats = statsService.getDailyFreeStats(user.telegram_id);
    const pkgStatus = statsService.getActivePackageStatus(user.telegram_id);

    const webappUrl = `${config.server.webappUrl}/webapp/index.html#/inbox`;

    let text = `<b>📬 ${t('inbox.header')}</b>\n\n`;
    text += `📨 ${t('inbox.totalMessages', { count: stats.total })}\n`;
    text += `🔵 ${t('inbox.unreadMessages', { count: stats.unread })}\n\n`;

    if (pkgStatus.hasPackage) {
      text += `💎 ${t('inbox.activePackage')} — ${pkgStatus.daysLeft} ${t('labels.daysLeft')}\n`;
    } else {
      text += `🆓 ${t('inbox.freeToday', { remaining: freeStats.remaining })}\n`;
    }

    await ctx.answerCallbackQuery();
    await ctx.editMessageText(text, {
      parse_mode: 'HTML',
      reply_markup: inboxKeyboard(webappUrl, stats.unread, lang),
    });
  } catch (error) {
    if (!error.message?.includes('message is not modified')) {
      console.error('خطا در open_inbox:', error);
    }
    await ctx.answerCallbackQuery();
  }
}

async function handleInboxRefresh(ctx) {
  await ctx.answerCallbackQuery({ text: '🔄' });
  return handleOpenInbox(ctx);
}

async function handleOpenSettings(ctx) {
  try {
    const user = userService.getByTelegramId(ctx.from.id);
    if (!user) return;

    const lang = user.language || config.languages.default;
    const t = i18n.getTranslator(lang);

    const bio = user.bio ? utils.escapeHtml(user.bio) : `<i>${t('labels.empty')}</i>`;
    const langName = i18n.getLanguageName(lang);
    const pkgStatus = statsService.getActivePackageStatus(user.telegram_id);

    let text = `<b>${t('settings.header')}</b>\n\n`;
    text += `👤 <b>${t('labels.name')}:</b> ${utils.escapeHtml(user.first_name || '—')}\n`;
    text += `📝 <b>${t('labels.bio')}:</b> ${bio}\n`;
    text += `🔗 <b>${t('labels.link')}:</b> <code>${user.link_slug}</code>\n`;
    text += `🌐 <b>${t('labels.language')}:</b> ${langName}\n\n`;
    text += `📬 ${user.total_received} | 📤 ${user.total_sent} | 🎁 ${user.referral_count}\n\n`;
    text += `💎 <b>${t('labels.package')}:</b> ${
      pkgStatus.hasPackage ? `${pkgStatus.name} — ${pkgStatus.daysLeft}d` : t('labels.noPackage')
    }`;

    await ctx.answerCallbackQuery();
    await ctx.editMessageText(text, {
      parse_mode: 'HTML',
      reply_markup: settingsKeyboard(lang),
    });
  } catch (error) {
    if (!error.message?.includes('message is not modified')) {
      console.error('خطا در open_settings:', error);
    }
    await ctx.answerCallbackQuery();
  }
}

async function handleOpenReferral(ctx) {
  try {
    const user = userService.getByTelegramId(ctx.from.id);
    if (!user) return;

    const lang = user.language || config.languages.default;
    const t = i18n.getTranslator(lang);

    const userLink = utils.buildReferralLink(config.bot.username, user.link_slug);
    const stats = referralService.getStats(user.telegram_id);

    let text = `<b>${t('referral.header')}</b>\n\n`;
    text += `${t('referral.yourLink')}\n<code>${userLink}</code>\n\n`;
    text += `👥 ${t('referral.totalInvited')}: <b>${user.referral_count}</b>\n`;
    text += `✅ ${t('referral.active')}: <b>${stats.active}</b>\n`;
    text += `🎁 ${t('referral.rewardsEarned')}: <b>${stats.rewards}</b>`;

    await ctx.answerCallbackQuery();
    await ctx.editMessageText(text, {
      parse_mode: 'HTML',
      reply_markup: referralKeyboard(userLink, lang),
      link_preview_options: { is_disabled: true },
    });
  } catch (error) {
    if (!error.message?.includes('message is not modified')) {
      console.error('خطا در open_referral:', error);
    }
    await ctx.answerCallbackQuery();
  }
}

async function handleOpenUpgrade(ctx) {
  try {
    const user = userService.getByTelegramId(ctx.from.id);
    const lang = user?.language || config.languages.default;
    const t = i18n.getTranslator(lang);

    await ctx.answerCallbackQuery();
    await ctx.editMessageText(t('upgrade.header'), {
      parse_mode: 'HTML',
      reply_markup: upgradeKeyboard(lang),
    });
  } catch (error) {
    if (!error.message?.includes('message is not modified')) {
      console.error('خطا در open_upgrade:', error);
    }
    await ctx.answerCallbackQuery();
  }
}

async function handleOpenHelp(ctx) {
  try {
    const user = userService.getByTelegramId(ctx.from.id);
    const lang = user?.language || config.languages.default;
    const t = i18n.getTranslator(lang);

    await ctx.answerCallbackQuery();
    await ctx.editMessageText(t('help.text'), {
      parse_mode: 'HTML',
      reply_markup: backToMenuKeyboard(lang),
    });
  } catch (error) {
    if (!error.message?.includes('message is not modified')) {
      console.error('خطا در open_help:', error);
    }
    await ctx.answerCallbackQuery();
  }
}

// ------------------------------------------------------------
//  زبان
// ------------------------------------------------------------

async function handleOpenLanguage(ctx) {
  try {
    const user = userService.getByTelegramId(ctx.from.id);
    if (!user) return;

    const lang = user.language || config.languages.default;
    const t = i18n.getTranslator(lang);

    let text = `<b>${t('language.header')}</b>\n\n`;
    text += `${t('language.current')}\n`;
    text += `🌐 <b>${i18n.getLanguageName(lang)}</b>\n\n`;
    text += t('language.chooseNew');

    await ctx.answerCallbackQuery();
    await ctx.editMessageText(text, {
      parse_mode: 'HTML',
      reply_markup: languageKeyboard(lang),
    });
  } catch (error) {
    if (!error.message?.includes('message is not modified')) {
      console.error('خطا در open_language:', error);
    }
    await ctx.answerCallbackQuery();
  }
}

async function handleSetLanguage(ctx, newLang) {
  try {
    if (!config.languages.supported.includes(newLang)) {
      await ctx.answerCallbackQuery({ text: '❌ زبان نامعتبر', show_alert: true });
      return;
    }

    const user = userService.getByTelegramId(ctx.from.id);
    if (!user) return;

    const oldLang = user.language || config.languages.default;
    const t = i18n.getTranslator(newLang);

    if (oldLang === newLang) {
      await ctx.answerCallbackQuery({
        text: t('language.alreadySet'),
        show_alert: false,
      });
      return;
    }

    // آپدیت زبان
    userService.updateLanguage(user.telegram_id, newLang);

    await ctx.answerCallbackQuery({
      text: `✅ ${i18n.getLanguageName(newLang)}`,
      show_alert: false,
    });

    let text = `<b>${t('language.changed')}</b>\n\n`;
    text += `🌐 ${i18n.getLanguageName(newLang)}\n\n`;
    text += t('language.applied');

    try {
      await ctx.editMessageText(text, {
        parse_mode: 'HTML',
        reply_markup: languageKeyboard(newLang),
      });
    } catch (e) {
      await ctx.reply(text, {
        parse_mode: 'HTML',
        reply_markup: languageKeyboard(newLang),
      });
    }
  } catch (error) {
    console.error('خطا در set_language:', error);
    await ctx.answerCallbackQuery({ text: 'خطا', show_alert: true });
  }
}

// ------------------------------------------------------------
//  تنظیمات
// ------------------------------------------------------------

async function handleEditBio(ctx) {
  try {
    const user = userService.getByTelegramId(ctx.from.id);
    const lang = user?.language || config.languages.default;
    const t = i18n.getTranslator(lang);

    ctx.session = ctx.session || {};
    ctx.session.waitingFor = 'bio';

    await ctx.answerCallbackQuery();
    await ctx.editMessageText(t('settings.enterBio'), {
      parse_mode: 'HTML',
      reply_markup: cancelKeyboard(lang),
    });
  } catch (error) {
    console.error('خطا در edit_bio:', error);
    await ctx.answerCallbackQuery();
  }
}

async function handleEditName(ctx) {
  try {
    const user = userService.getByTelegramId(ctx.from.id);
    const lang = user?.language || config.languages.default;
    const t = i18n.getTranslator(lang);

    ctx.session = ctx.session || {};
    ctx.session.waitingFor = 'name';

    await ctx.answerCallbackQuery();
    await ctx.editMessageText(t('settings.enterName'), {
      parse_mode: 'HTML',
      reply_markup: cancelKeyboard(lang),
    });
  } catch (error) {
    console.error('خطا در edit_name:', error);
    await ctx.answerCallbackQuery();
  }
}

async function handleChangeSlug(ctx) {
  try {
    const user = userService.getByTelegramId(ctx.from.id);
    if (!user) return;

    const lang = user.language || config.languages.default;
    const t = i18n.getTranslator(lang);
    const suggested = utils.generateSlug(ctx.from.username || 'user');

    await ctx.answerCallbackQuery();
    await ctx.editMessageText(
      t('settings.changeSlug', { current: user.link_slug }),
      {
        parse_mode: 'HTML',
        reply_markup: slugOptionsKeyboard(suggested, lang),
      }
    );
  } catch (error) {
    console.error('خطا در change_slug:', error);
    await ctx.answerCallbackQuery();
  }
}

async function handleSlugUse(ctx) {
  try {
    const slug = ctx.match[1];
    const user = userService.getByTelegramId(ctx.from.id);
    const lang = user?.language || config.languages.default;
    const t = i18n.getTranslator(lang);

    if (userService.getBySlug(slug)) {
      await ctx.answerCallbackQuery({
        text: t('settings.slugTaken'),
        show_alert: true,
      });
      return;
    }

    userService.updateSlug(ctx.from.id, slug);

    await ctx.answerCallbackQuery({ text: '✅' });
    await ctx.editMessageText(t('settings.slugChanged', { slug }), {
      parse_mode: 'HTML',
      reply_markup: backToSettingsKeyboard(lang),
    });
  } catch (error) {
    console.error('خطا در slug_use:', error);
    await ctx.answerCallbackQuery();
  }
}

async function handleSlugCustom(ctx) {
  try {
    const user = userService.getByTelegramId(ctx.from.id);
    const lang = user?.language || config.languages.default;
    const t = i18n.getTranslator(lang);

    ctx.session = ctx.session || {};
    ctx.session.waitingFor = 'slug';

    await ctx.answerCallbackQuery();
    await ctx.editMessageText(t('settings.enterCustomSlug'), {
      parse_mode: 'HTML',
      reply_markup: cancelKeyboard(lang),
    });
  } catch (error) {
    console.error('خطا در slug_custom:', error);
    await ctx.answerCallbackQuery();
  }
}

async function handlePrivacy(ctx) {
  try {
    const user = userService.getByTelegramId(ctx.from.id);
    const lang = user?.language || config.languages.default;
    const t = i18n.getTranslator(lang);

    await ctx.answerCallbackQuery();
    await ctx.editMessageText(t('settings.privacyText'), {
      parse_mode: 'HTML',
      reply_markup: backToSettingsKeyboard(lang),
    });
  } catch (error) {
    if (!error.message?.includes('message is not modified')) {
      console.error('خطا در privacy:', error);
    }
    await ctx.answerCallbackQuery();
  }
}

async function handleBlockList(ctx) {
  try {
    const user = userService.getByTelegramId(ctx.from.id);
    if (!user) return;

    const lang = user.language || config.languages.default;
    const t = i18n.getTranslator(lang);

    const blocked = messageService.getBlockList(user.telegram_id);

    if (blocked.length === 0) {
      await ctx.answerCallbackQuery();
      await ctx.editMessageText(t('block.empty'), {
        parse_mode: 'HTML',
        reply_markup: backToSettingsKeyboard(lang),
      });
      return;
    }

    const blockedUsers = blocked
      .map((b) => userService.getByTelegramId(b.blocked_id))
      .filter(Boolean);

    await ctx.answerCallbackQuery();
    await ctx.editMessageText(t('block.listHeader'), {
      parse_mode: 'HTML',
      reply_markup: blockListKeyboard(blockedUsers, lang),
    });
  } catch (error) {
    console.error('خطا در blocklist:', error);
    await ctx.answerCallbackQuery();
  }
}

async function handleUnblock(ctx, blockedId) {
  try {
    const user = userService.getByTelegramId(ctx.from.id);
    const lang = user?.language || config.languages.default;
    const t = i18n.getTranslator(lang);

    messageService.unblockUser(ctx.from.id, blockedId);

    await ctx.answerCallbackQuery({
      text: t('block.unblockSuccess'),
      show_alert: false,
    });
  } catch (error) {
    console.error('خطا در unblock:', error);
    await ctx.answerCallbackQuery();
  }
}

async function handleDeleteAccount(ctx) {
  try {
    const user = userService.getByTelegramId(ctx.from.id);
    const lang = user?.language || config.languages.default;
    const t = i18n.getTranslator(lang);

    await ctx.answerCallbackQuery();
    await ctx.editMessageText(t('settings.deleteAccountWarning'), {
      parse_mode: 'HTML',
      reply_markup: confirmActionKeyboard(
        'delete_account',
        t('buttons.yesDelete'),
        lang
      ),
    });
  } catch (error) {
    if (!error.message?.includes('message is not modified')) {
      console.error('خطا در delete_account:', error);
    }
    await ctx.answerCallbackQuery();
  }
}

// ------------------------------------------------------------
//  پیام‌ها
// ------------------------------------------------------------

async function handleReport(ctx, messageId) {
  try {
    const user = userService.getByTelegramId(ctx.from.id);
    const lang = user?.language || config.languages.default;
    const t = i18n.getTranslator(lang);

    messageService.markReported(messageId, ctx.from.id, 'user_report');

    await ctx.answerCallbackQuery({
      text: t('report.success'),
      show_alert: true,
    });

    // اطلاع به ادمین
    if (config.admin.id) {
      const msg = messageService.getById(messageId);
      const adminText = `
🚨 <b>گزارش جدید</b>

📨 پیام: <code>${messageId}</code>
👤 گزارش‌دهنده: <code>${ctx.from.id}</code>
📝 محتوا: <i>${utils.escapeHtml((msg?.content || '').substring(0, 200))}</i>
      `.trim();

      ctx.api
        .sendMessage(config.admin.id, adminText, { parse_mode: 'HTML' })
        .catch(() => {});
    }
  } catch (error) {
    console.error('خطا در report:', error);
    await ctx.answerCallbackQuery({ text: 'خطا', show_alert: true });
  }
}

async function handleBlock(ctx, messageId) {
  try {
    const user = userService.getByTelegramId(ctx.from.id);
    const lang = user?.language || config.languages.default;
    const t = i18n.getTranslator(lang);

    const msg = messageService.getById(messageId);
    if (!msg || !msg.sender_telegram_id) {
      await ctx.answerCallbackQuery({ text: '❌', show_alert: true });
      return;
    }

    messageService.blockUser(ctx.from.id, msg.sender_telegram_id);

    await ctx.answerCallbackQuery({
      text: t('block.success'),
      show_alert: true,
    });

    try {
      await ctx.editMessageReplyMarkup({ reply_markup: undefined });
    } catch (e) {
      // ignore
    }
  } catch (error) {
    console.error('خطا در block:', error);
    await ctx.answerCallbackQuery({ text: 'خطا', show_alert: true });
  }
}

async function handleDelete(ctx, messageId) {
  try {
    const user = userService.getByTelegramId(ctx.from.id);
    const lang = user?.language || config.languages.default;
    const t = i18n.getTranslator(lang);

    const msg = messageService.getById(messageId);
    if (!msg || msg.receiver_id !== ctx.from.id) {
      await ctx.answerCallbackQuery({ text: '❌', show_alert: true });
      return;
    }

    messageService.markDeleted(messageId);

    await ctx.answerCallbackQuery({
      text: t('inbox.messageDeleted'),
      show_alert: false,
    });

    try {
      await ctx.deleteMessage();
    } catch (e) {
      await ctx.editMessageReplyMarkup({ reply_markup: undefined });
    }
  } catch (error) {
    console.error('خطا در delete:', error);
    await ctx.answerCallbackQuery({ text: 'خطا', show_alert: true });
  }
}

async function handleStartReply(ctx, messageId) {
  try {
    const user = userService.getByTelegramId(ctx.from.id);
    if (!user) return;

    const lang = user.language || config.languages.default;
    const t = i18n.getTranslator(lang);

    // چک بسته پاسخ
    if (!packageService.hasReplyPackage(user.telegram_id)) {
      await ctx.answerCallbackQuery();
      await ctx.editMessageText(t('reply.needPackage'), {
        parse_mode: 'HTML',
        reply_markup: replyPackageKeyboard(lang),
      });
      return;
    }

    const msg = messageService.getById(messageId);
    if (!msg) {
      await ctx.answerCallbackQuery({ text: '❌ پیام پیدا نشد', show_alert: true });
      return;
    }

    if (msg.receiver_id !== user.telegram_id) {
      await ctx.answerCallbackQuery({ text: '❌ این پیام برای شما نیست', show_alert: true });
      return;
    }

    if (!msg.sender_telegram_id) {
      await ctx.answerCallbackQuery({ text: t('reply.cantReply'), show_alert: true });
      return;
    }

    // ذخیره در session
    ctx.session = ctx.session || {};
    ctx.session.replyToMessageId = messageId;
    ctx.session.replyAliasId = msg.alias_id || null;
    ctx.session.targetId = msg.sender_telegram_id;
    ctx.session.waitingFor = 'reply';

    await ctx.answerCallbackQuery();
    await ctx.reply(t('reply.askForReply'), {
      parse_mode: 'HTML',
      reply_markup: cancelKeyboard(lang),
    });
  } catch (error) {
    console.error('خطا در start_reply:', error);
    await ctx.answerCallbackQuery({ text: 'خطا', show_alert: true });
  }
}

async function handleSendAnother(ctx) {
  try {
    const targetSlug = ctx.match[1];
    const user = userService.getByTelegramId(ctx.from.id);
    const lang = user?.language || config.languages.default;
    const t = i18n.getTranslator(lang);

    const targetUser = userService.getBySlug(targetSlug);

    ctx.session = ctx.session || {};
    ctx.session.targetSlug = targetSlug;
    if (targetUser) {
      ctx.session.targetId = targetUser.telegram_id;
    }

    await ctx.answerCallbackQuery();
    await ctx.reply(
      t('send.askForMessage', { name: targetUser?.first_name || 'کاربر' }),
      {
        parse_mode: 'HTML',
        reply_markup: cancelKeyboard(lang),
      }
    );
  } catch (error) {
    console.error('خطا در send_another:', error);
    await ctx.answerCallbackQuery();
  }
}

// ------------------------------------------------------------
//  خرید بسته
// ------------------------------------------------------------

async function handleBuyPackage(ctx, packageId) {
  try {
    const user = userService.getByTelegramId(ctx.from.id);
    const lang = user?.language || config.languages.default;
    const t = i18n.getTranslator(lang);

    const pkg = config.packages[packageId];
    if (!pkg) {
      await ctx.answerCallbackQuery({ text: '❌', show_alert: true });
      return;
    }

    // اگه بسته reply هست، چک کن پیام دریافت کرده
    if (packageId === 'reply') {
      const stats = messageService.getStatsForUser(user.telegram_id);
      if (stats.total === 0) {
        await ctx.answerCallbackQuery({
          text: t('packages.needMessageForReply'),
          show_alert: true,
        });
        return;
      }
    }

    // فاکتور Stars
    const payload = `package_${packageId}:${ctx.from.id}`;
    const pkgName = pkg.name[lang] || pkg.name.fa;

    await ctx.answerCallbackQuery();
    await ctx.api.sendInvoice(ctx.from.id, {
      title: pkgName,
      description: `${pkg.days} روز`,
      payload,
      currency: 'XTR',
      prices: [{ label: pkgName, amount: pkg.price }],
    });
  } catch (error) {
    console.error('خطا در buy_package:', error);
    await ctx.answerCallbackQuery({ text: 'خطا', show_alert: true });
  }
}

async function handleReferralRewardsInfo(ctx) {
  try {
    const user = userService.getByTelegramId(ctx.from.id);
    const lang = user?.language || config.languages.default;
    const t = i18n.getTranslator(lang);

    let text = `<b>${t('packages.referralRewardsTitle')}</b>\n\n`;
    text += t('packages.referralRewards');

    await ctx.answerCallbackQuery();
    await ctx.editMessageText(text, {
      parse_mode: 'HTML',
      reply_markup: backToMenuKeyboard(lang),
    });
  } catch (error) {
    if (!error.message?.includes('message is not modified')) {
      console.error('خطا در referral_rewards_info:', error);
    }
    await ctx.answerCallbackQuery();
  }
}

// ------------------------------------------------------------
//  دعوت
// ------------------------------------------------------------

async function handleReferralStats(ctx) {
  try {
    const user = userService.getByTelegramId(ctx.from.id);
    const lang = user?.language || config.languages.default;
    const t = i18n.getTranslator(lang);

    const stats = referralService.getStats(user.telegram_id);
    const next = referralService.getNextRewards(user.telegram_id);

    let text = `<b>${t('referral.statsHeader')}</b>\n\n`;
    text += `👥 ${t('referral.totalInvited')}: <b>${stats.total}</b>\n`;
    text += `✅ ${t('referral.active')}: <b>${stats.active}</b>\n`;
    text += `🎁 ${t('referral.rewardsEarned')}: <b>${stats.rewards}</b>\n\n`;

    if (next.toNextWeek > 0) {
      text += `📅 ${next.toNextWeek} دعوت تا پاداش هفتگی\n`;
    }
    if (next.toNextMonth > 0) {
      text += `📆 ${next.toNextMonth} دعوت تا پاداش ماهانه\n`;
    }

    await ctx.answerCallbackQuery();
    await ctx.editMessageText(text, {
      parse_mode: 'HTML',
      reply_markup: referralStatsKeyboard(lang),
    });
  } catch (error) {
    console.error('خطا در referral_stats:', error);
    await ctx.answerCallbackQuery();
  }
}

async function handleReferralRewards(ctx) {
  try {
    const user = userService.getByTelegramId(ctx.from.id);
    const lang = user?.language || config.languages.default;
    const t = i18n.getTranslator(lang);

    const stats = referralService.getStats(user.telegram_id);
    const b = stats.breakdown || {};

    let text = `<b>${t('referral.rewardsTitle')}</b>\n\n`;
    text += `🎁 ۲۴ ساعته: <b>${b.hours24 || 0}</b> بار\n`;
    text += `📅 هفتگی: <b>${b.weeks || 0}</b> بار\n`;
    text += `📆 ماهانه: <b>${b.months || 0}</b> بار\n`;
    text += `💬 بسته پاسخ: <b>${b.replyPackages || 0}</b> بار\n\n`;
    text += `📊 کل روزهای اضافه‌شده: <b>${stats.totalDays || 0}</b> روز\n\n`;
    text += t('referral.rewardsNote');

    await ctx.answerCallbackQuery();
    await ctx.editMessageText(text, {
      parse_mode: 'HTML',
      reply_markup: referralStatsKeyboard(lang),
    });
  } catch (error) {
    console.error('خطا در referral_rewards:', error);
    await ctx.answerCallbackQuery();
  }
}

// ------------------------------------------------------------
//  عمومی
// ------------------------------------------------------------

async function handleCancelAction(ctx) {
  try {
    const user = userService.getByTelegramId(ctx.from.id);
    const lang = user?.language || config.languages.default;
    const t = i18n.getTranslator(lang);

    ctx.session = ctx.session || {};
    delete ctx.session.targetId;
    delete ctx.session.targetSlug;
    delete ctx.session.waitingFor;
    delete ctx.session.replyToMessageId;
    delete ctx.session.replyAliasId;

    await ctx.answerCallbackQuery({ text: '❌' });

    const userLink = user
      ? utils.buildUserLink(config.bot.username, user.link_slug)
      : '';

    await ctx.editMessageText(
      userLink ? t('start.welcomeBack', { link: userLink }) : t('errors.general'),
      {
        parse_mode: 'HTML',
        reply_markup: mainMenuKeyboard(lang),
      }
    );
  } catch (error) {
    if (!error.message?.includes('message is not modified')) {
      console.error('خطا در cancel_action:', error);
    }
    await ctx.answerCallbackQuery();
  }
}

async function handleConfirmAction(ctx, action) {
  try {
    const user = userService.getByTelegramId(ctx.from.id);
    const lang = user?.language || config.languages.default;
    const t = i18n.getTranslator(lang);

    if (action === 'delete_account') {
      userService.deleteAccount(ctx.from.id);

      await ctx.answerCallbackQuery({ text: '✅' });
      await ctx.editMessageText(t('settings.accountDeleted'), {
        parse_mode: 'HTML',
      });
      return;
    }

    await ctx.answerCallbackQuery({ text: '✅' });
  } catch (error) {
    console.error('خطا در confirm_action:', error);
    await ctx.answerCallbackQuery();
  }
}

// ------------------------------------------------------------
//  ادمین
// ------------------------------------------------------------

function checkAdmin(ctx) {
  return ctx.from.id === config.admin.id;
}

async function handleAdminRefresh(ctx) {
  if (!checkAdmin(ctx)) {
    await ctx.answerCallbackQuery({ text: '⛔️', show_alert: true });
    return;
  }

  await ctx.answerCallbackQuery({ text: '🔄' });
}

async function handleAdminFullStats(ctx) {
  if (!checkAdmin(ctx)) {
    await ctx.answerCallbackQuery({ text: '⛔️', show_alert: true });
    return;
  }

  try {
    const overview = statsService.getOverview();
    const today = statsService.getTodayStats();
    const online = statsService.getOnlineCount();

    let text = '<b>📊 آمار کامل</b>\n\n';
    text += `👥 کاربران: <b>${overview.totalUsers}</b>\n`;
    text += `🟢 آنلاین: <b>${online}</b>\n`;
    text += `✅ فعال امروز: <b>${overview.activeToday}</b>\n`;
    text += `📨 پیام‌ها: <b>${overview.totalMessages}</b>\n`;
    text += `💰 درآمد: <b>${overview.totalRevenue}</b> ⭐️\n\n`;

    text += '<b>📅 امروز</b>\n';
    text += `👥 کاربر جدید: ${today.newUsers}\n`;
    text += `📨 پیام: ${today.messages}\n`;
    text += `👁 بازدید: ${today.visits}\n`;
    text += `💰 درآمد: ${today.revenue} ⭐️\n`;

    await ctx.answerCallbackQuery();
    await ctx.editMessageText(text, {
      parse_mode: 'HTML',
      reply_markup: adminKeyboard(),
    });
  } catch (error) {
    console.error('خطا در admin_full_stats:', error);
    await ctx.answerCallbackQuery({ text: 'خطا', show_alert: true });
  }
}

async function handleAdminUsers(ctx) {
  if (!checkAdmin(ctx)) {
    await ctx.answerCallbackQuery({ text: '⛔️', show_alert: true });
    return;
  }

  try {
    const users = userService.listUsers(20);

    let text = '👥 <b>کاربران اخیر</b>\n\n';
    users.forEach((u, i) => {
      const name = u.first_name || u.username || 'ناشناس';
      const vip = u.is_vip ? ' 💎' : '';
      const banned = u.is_banned ? ' 🚫' : '';
      text += `${i + 1}. ${utils.escapeHtml(name)}${vip}${banned}\n`;
    });

    await ctx.answerCallbackQuery();
    await ctx.editMessageText(text, {
      parse_mode: 'HTML',
      reply_markup: adminKeyboard(),
    });
  } catch (error) {
    console.error('خطا در admin_users:', error);
    await ctx.answerCallbackQuery({ text: 'خطا', show_alert: true });
  }
}

async function handleAdminReports(ctx) {
  if (!checkAdmin(ctx)) {
    await ctx.answerCallbackQuery({ text: '⛔️', show_alert: true });
    return;
  }

  try {
    const reports = messageService.getPendingReports(10);

    if (reports.length === 0) {
      await ctx.answerCallbackQuery();
      await ctx.editMessageText('📭 گزارش جدیدی نیست.', {
        reply_markup: adminKeyboard(),
      });
      return;
    }

    let text = '⚠️ <b>گزارش‌های اخیر</b>\n\n';
    reports.forEach((r, i) => {
      text += `${i + 1}. پیام #<code>${r.message_id}</code>\n`;
      text += `   گزارش‌دهنده: <code>${r.reporter_id}</code>\n\n`;
    });

    await ctx.answerCallbackQuery();
    await ctx.editMessageText(text, {
      parse_mode: 'HTML',
      reply_markup: adminKeyboard(),
    });
  } catch (error) {
    console.error('خطا در admin_reports:', error);
    await ctx.answerCallbackQuery({ text: 'خطا', show_alert: true });
  }
}

async function handleAdminPayments(ctx) {
  if (!checkAdmin(ctx)) {
    await ctx.answerCallbackQuery({ text: '⛔️', show_alert: true });
    return;
  }

  try {
    const payments = require('./services/payment').getRecentPayments(10);

    let text = '💰 <b>پرداخت‌های اخیر</b>\n\n';
    if (payments.length === 0) {
      text += 'پرداختی وجود نداره.';
    } else {
      payments.forEach((p, i) => {
        text += `${i + 1}. ${p.amount} ⭐️ — <code>${p.user_id}</code>\n`;
      });
    }

    await ctx.answerCallbackQuery();
    await ctx.editMessageText(text, {
      parse_mode: 'HTML',
      reply_markup: adminKeyboard(),
    });
  } catch (error) {
    console.error('خطا در admin_payments:', error);
    await ctx.answerCallbackQuery({ text: 'خطا', show_alert: true });
  }
}

async function handleAdminSystem(ctx) {
  if (!checkAdmin(ctx)) {
    await ctx.answerCallbackQuery({ text: '⛔️', show_alert: true });
    return;
  }

  try {
    const mem = process.memoryUsage();
    const uptime = process.uptime();

    let text = '⚙️ <b>اطلاعات سیستم</b>\n\n';
    text += `🤖 Node: ${process.version}\n`;
    text += `⏱ Uptime: ${Math.floor(uptime / 3600)}h\n`;
    text += `💾 RAM: ${Math.floor(mem.rss / 1024 / 1024)} MB\n`;

    await ctx.answerCallbackQuery();
    await ctx.editMessageText(text, {
      parse_mode: 'HTML',
      reply_markup: adminKeyboard(),
    });
  } catch (error) {
    console.error('خطا در admin_system:', error);
    await ctx.answerCallbackQuery({ text: 'خطا', show_alert: true });
  }
}

async function handleAdminBroadcast(ctx) {
  if (!checkAdmin(ctx)) {
    await ctx.answerCallbackQuery({ text: '⛔️', show_alert: true });
    return;
  }

  ctx.session = ctx.session || {};
  ctx.session.waitingFor = 'broadcast';

  await ctx.answerCallbackQuery();
  await ctx.editMessageText('📢 پیام همگانی رو بفرست. (لغو با /cancel)', {
    reply_markup: cancelKeyboard('fa'),
  });
}

// ============================================================
//  خروجی
// ============================================================

module.exports = {
  // کیبوردها
  shareLinkKeyboard,
  mainMenuKeyboard,
  inboxKeyboard,
  settingsKeyboard,
  backToMenuKeyboard,
  backToSettingsKeyboard,
  afterSendKeyboard,
  upgradeKeyboard,
  replyPackageKeyboard,
  referralKeyboard,
  referralStatsKeyboard,
  languageKeyboard,
  confirmActionKeyboard,
  cancelKeyboard,
  blockListKeyboard,
  slugOptionsKeyboard,
  adminKeyboard,

  // ثبت
  registerCallbacks,
};