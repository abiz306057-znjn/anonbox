/**
 * handlers/user.js
 * هندلرهای مربوط به کاربر
 * نسخه ۳.۰ — start, settings, language, help
 *
 * شامل:
 *   - handleStart
 *   - handleSettings
 *   - handleLanguage
 *   - handleHelp
 */

const config = require('../config');
const i18n = require('../i18n');
const utils = require('../utils');
const userService = require('../services/user');
const referralService = require('../services/referral');
const statsService = require('../services/stats');
const actions = require('../actions');

// ============================================================
//  /start
// ============================================================

async function handleStart(ctx) {
  try {
    const from = ctx.from;
    const payload = ctx.match ? String(ctx.match).trim() : '';

    // ---- بررسی کاربر موجود ----
    let user = userService.getByTelegramId(from.id);
    let isNewUser = false;

    // ---- کاربر جدید ----
    if (!user) {
      isNewUser = true;

      // ساخت اسلاگ یکتا
      let slug;
      let attempts = 0;
      do {
        slug = utils.generateSlug(from.username || from.first_name || 'user');
        attempts++;
      } while (userService.getBySlug(slug) && attempts < 10);

      // بررسی payload دعوت
      let referredBy = null;
      if (payload && payload.startsWith('ref_')) {
        const referrerSlug = payload.substring(4);
        const referrer = userService.getBySlug(referrerSlug);
        if (referrer && referrer.telegram_id !== from.id) {
          referredBy = referrer.telegram_id;
        }
      }

      // زبان پیش‌فرض از تلگرام
      const detectedLang = i18n.detectLanguage(from.language_code);

      // ساخت کاربر
      user = userService.create({
        telegram_id: from.id,
        username: from.username || null,
        first_name: from.first_name || null,
        last_name: from.last_name || null,
        language_code: detectedLang,
        link_slug: slug,
        referred_by: referredBy,
      });

      // ثبت دعوت
      if (referredBy) {
        try {
          referralService.registerReferral(referredBy, from.id);
        } catch (err) {
          console.error('خطا در ثبت دعوت:', err);
        }
      }
    } else {
      // آپدیت پروفایل کاربر موجود
      userService.updateProfile(from.id, {
        username: from.username || null,
        first_name: from.first_name || null,
        last_name: from.last_name || null,
      });
      userService.touchLastActive(from.id);
    }

    // ---- زبان کاربر ----
    const lang = user.language || config.languages.default;
    const t = i18n.getTranslator(lang);

    // ---- ورود برای ارسال پیام ----
    if (payload && !payload.startsWith('ref_')) {
      const targetUser = userService.getBySlug(payload);

      if (targetUser && targetUser.telegram_id !== from.id && !targetUser.is_banned) {
        ctx.session = ctx.session || {};
        ctx.session.targetSlug = payload;
        ctx.session.targetId = targetUser.telegram_id;

        const targetName = targetUser.first_name || targetUser.username || t('labels.user');

        await ctx.reply(t('send.askForMessage', { name: targetName }), {
          parse_mode: 'HTML',
          reply_markup: actions.cancelKeyboard(lang),
        });
        return;
      } else {
        await ctx.reply(t('send.targetNotFound'), { parse_mode: 'HTML' });
      }
    }

    // ---- لینک اختصاصی ----
    const userLink = utils.buildUserLink(config.bot.username, user.link_slug);

    // ---- پیام خوش‌آمد ----
    const welcomeKey = isNewUser ? 'start.welcomeNew' : 'start.welcomeBack';
    const welcomeText = t(welcomeKey, { link: userLink });

    await ctx.reply(welcomeText, {
      parse_mode: 'HTML',
      reply_markup: actions.shareLinkKeyboard(userLink, lang),
      link_preview_options: { is_disabled: true },
    });

    // ---- منوی اصلی (فقط کاربر جدید) ----
    if (isNewUser) {
      await ctx.reply(t('start.mainMenuHint'), {
        parse_mode: 'HTML',
        reply_markup: actions.mainMenuKeyboard(lang),
      });
    }
  } catch (error) {
    console.error('خطا در handleStart:', error);

    const lang = ctx.user?.language || config.languages.default;
    const t = i18n.getTranslator(lang);

    await ctx.reply(t('errors.general'), { parse_mode: 'HTML' });
  }
}

// ============================================================
//  /settings
// ============================================================

async function handleSettings(ctx) {
  try {
    const user = userService.getByTelegramId(ctx.from.id);

    if (!user) {
      const t = i18n.getTranslator(config.languages.default);
      await ctx.reply(t('errors.notRegistered'), { parse_mode: 'HTML' });
      return;
    }

    if (user.is_banned) {
      const lang = user.language || config.languages.default;
      const t = i18n.getTranslator(lang);
      await ctx.reply(t('errors.banned'), { parse_mode: 'HTML' });
      return;
    }

    const lang = user.language || config.languages.default;
    const t = i18n.getTranslator(lang);

    // ---- اطلاعات ----
    const bio = user.bio ? utils.escapeHtml(user.bio) : `<i>${t('labels.empty')}</i>`;
    const languageName = i18n.getLanguageName(lang);

    // ---- وضعیت بسته ----
    const packageStatus = statsService.getActivePackageStatus(user.telegram_id);
    const packageText = packageStatus.hasPackage
      ? `💎 ${packageStatus.name} — ${packageStatus.daysLeft} ${t('labels.daysLeft')}`
      : `⚪ ${t('labels.noPackage')}`;

    // ---- ساخت متن ----
    let text = `<b>${t('settings.header')}</b>\n\n`;

    text += `👤 <b>${t('labels.name')}:</b> ${utils.escapeHtml(user.first_name || '—')}\n`;
    text += `📝 <b>${t('labels.bio')}:</b> ${bio}\n`;
    text += `🔗 <b>${t('labels.link')}:</b> <code>${user.link_slug}</code>\n`;
    text += `🌐 <b>${t('labels.language')}:</b> ${languageName}\n\n`;

    text += `📬 <b>${t('labels.received')}:</b> ${user.total_received}\n`;
    text += `📤 <b>${t('labels.sent')}:</b> ${user.total_sent}\n`;
    text += `🎁 <b>${t('labels.referrals')}:</b> ${user.referral_count}\n\n`;

    text += `💎 <b>${t('labels.package')}:</b>\n${packageText}`;

    await ctx.reply(text, {
      parse_mode: 'HTML',
      reply_markup: actions.settingsKeyboard(lang),
    });
  } catch (error) {
    console.error('خطا در handleSettings:', error);

    const lang = ctx.user?.language || config.languages.default;
    const t = i18n.getTranslator(lang);

    await ctx.reply(t('errors.general'), { parse_mode: 'HTML' });
  }
}

// ============================================================
//  /language یا /lang
// ============================================================

async function handleLanguage(ctx) {
  try {
    const user = userService.getByTelegramId(ctx.from.id);

    if (!user) {
      const t = i18n.getTranslator(config.languages.default);
      await ctx.reply(t('errors.notRegistered'), { parse_mode: 'HTML' });
      return;
    }

    if (user.is_banned) {
      const lang = user.language || config.languages.default;
      const t = i18n.getTranslator(lang);
      await ctx.reply(t('errors.banned'), { parse_mode: 'HTML' });
      return;
    }

    const lang = user.language || config.languages.default;
    const t = i18n.getTranslator(lang);

    let text = `<b>${t('language.header')}</b>\n\n`;
    text += `${t('language.current')}\n`;
    text += `🌐 <b>${i18n.getLanguageName(lang)}</b>\n\n`;
    text += t('language.chooseNew');

    await ctx.reply(text, {
      parse_mode: 'HTML',
      reply_markup: actions.languageKeyboard(lang),
    });
  } catch (error) {
    console.error('خطا در handleLanguage:', error);

    const lang = ctx.user?.language || config.languages.default;
    const t = i18n.getTranslator(lang);

    await ctx.reply(t('errors.general'), { parse_mode: 'HTML' });
  }
}

// ============================================================
//  /help
// ============================================================

async function handleHelp(ctx) {
  try {
    const user = userService.getByTelegramId(ctx.from.id);
    const lang = user?.language || config.languages.default;
    const t = i18n.getTranslator(lang);

    const helpText = t('help.text');

    await ctx.reply(helpText, {
      parse_mode: 'HTML',
      reply_markup: actions.backToMenuKeyboard(lang),
      link_preview_options: { is_disabled: true },
    });
  } catch (error) {
    console.error('خطا در handleHelp:', error);

    const lang = ctx.user?.language || config.languages.default;
    const t = i18n.getTranslator(lang);

    await ctx.reply(t('errors.general'), { parse_mode: 'HTML' });
  }
}

// ============================================================
//  خروجی
// ============================================================

module.exports = {
  handleStart,
  handleSettings,
  handleLanguage,
  handleHelp,
};