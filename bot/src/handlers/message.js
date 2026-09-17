/**
 * handlers/message.js
 * هندلرهای مربوط به پیام
 * نسخه ۳.۰ — send, inbox, reply, report
 *
 * شامل:
 *   - handleSend        ← ارسال پیام ناشناس
 *   - handleInbox       ← نمایش صندوق
 *   - handleReplyInput  ← پردازش پاسخ ناشناس
 */

const config = require('../config');
const i18n = require('../i18n');
const utils = require('../utils');
const userService = require('../services/user');
const messageService = require('../services/message');
const aliasService = require('../services/alias');
const statsService = require('../services/stats');
const packageService = require('../services/package');
const actions = require('../actions');

// ============================================================
//  handleSend — ارسال پیام ناشناس
// ============================================================

async function handleSend(ctx) {
  try {
    const from = ctx.from;
    const message = ctx.message;

    if (!message) return;

    // ---- بررسی session ----
    const s = ctx.session || {};
    const targetId = s.targetId;
    const targetSlug = s.targetSlug;

    // اگه در حالت ارسال نبود، نادیده بگیر
    if (!targetId || !targetSlug) {
      return;
    }

    // ---- فرستنده ----
    const sender = userService.getByTelegramId(from.id);
    if (!sender) {
      const t = i18n.getTranslator(config.languages.default);
      await ctx.reply(t('errors.notRegistered'), { parse_mode: 'HTML' });
      return;
    }

    const lang = sender.language || config.languages.default;
    const t = i18n.getTranslator(lang);

    if (sender.is_banned) {
      await ctx.reply(t('errors.banned'), { parse_mode: 'HTML' });
      return;
    }

    // ---- ارسال به خود ----
    if (sender.telegram_id === targetId) {
      await ctx.reply(t('send.cantSendToSelf'), { parse_mode: 'HTML' });
      delete ctx.session.targetId;
      delete ctx.session.targetSlug;
      return;
    }

    // ---- هدف ----
    const target = userService.getByTelegramId(targetId);
    if (!target || target.is_banned) {
      await ctx.reply(t('send.targetNotFound'), { parse_mode: 'HTML' });
      delete ctx.session.targetId;
      delete ctx.session.targetSlug;
      return;
    }

    // ---- بلاک ----
    if (messageService.isBlocked(targetId, from.id)) {
      await ctx.reply(t('send.blocked'), { parse_mode: 'HTML' });
      delete ctx.session.targetId;
      delete ctx.session.targetSlug;
      return;
    }

    // ---- محدودیت روزانه ----
    const todayCount = messageService.countTodayBySender(from.id);
    if (todayCount >= config.limits.maxMessagesPerDay) {
      await ctx.reply(t('send.dailyLimitReached'), { parse_mode: 'HTML' });
      return;
    }

    // ---- محدودیت ساعتی ----
    const hourCount = messageService.countLastHourBySender(from.id);
    if (hourCount >= config.limits.maxMessagesPerHour) {
      await ctx.reply(t('send.hourlyLimitReached'), { parse_mode: 'HTML' });
      return;
    }

    // ---- اعتبارسنجی محتوا ----
    const content = extractContent(message);
    if (!content) {
      await ctx.reply(t('send.unsupportedContent'), { parse_mode: 'HTML' });
      return;
    }

    if (
      content.type === 'text' &&
      content.text.length > config.limits.maxMessageLength
    ) {
      await ctx.reply(
        t('send.tooLong', { max: config.limits.maxMessageLength }),
        { parse_mode: 'HTML' }
      );
      return;
    }

    // ---- دریافت یا ساخت شناسه ناشناس ----
    let alias = null;
    try {
      alias = aliasService.getOrCreateAlias(sender.telegram_id, targetId);
    } catch (err) {
      console.error('خطا در ساخت alias:', err);
    }

    // ---- ذخیره پیام ----
    const savedMessage = messageService.createMessage({
      receiver_id: targetId,
      sender_id: sender.telegram_id,
      sender_telegram_id: from.id,
      content_type: content.type,
      content: content.text,
      file_id: content.fileId,
      caption: content.caption,
      alias_id: alias ? alias.id : null,
    });

    // ---- افزایش شمارنده alias ----
    if (alias) {
      aliasService.incrementMessageCount(alias.id);
    }

    // ---- اطلاع به گیرنده ----
    try {
      const targetLang = target.language || config.languages.default;
      const targetT = i18n.getTranslator(targetLang);

      await ctx.api.sendMessage(targetId, targetT('send.newMessageNotification'), {
        parse_mode: 'HTML',
      });
    } catch (notifyError) {
      console.error('خطا در اطلاع به گیرنده:', notifyError);
    }

    // ---- آمار ----
    userService.incrementSent(from.id);
    userService.incrementReceived(targetId);

    // ---- پیام موفقیت ----
    await ctx.reply(t('send.success'), {
      parse_mode: 'HTML',
      reply_markup: actions.afterSendKeyboard(targetSlug, lang),
    });

    // ---- پاکسازی session ----
    delete ctx.session.targetId;
    delete ctx.session.targetSlug;
  } catch (error) {
    console.error('خطا در handleSend:', error);

    const lang = ctx.user?.language || config.languages.default;
    const t = i18n.getTranslator(lang);

    await ctx.reply(t('errors.general'), { parse_mode: 'HTML' });
  }
}

// ============================================================
//  handleInbox — نمایش صندوق پیام
// ============================================================

async function handleInbox(ctx) {
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

    // ---- آمار صندوق ----
    const stats = messageService.getStatsForUser(user.telegram_id);
    const unread = stats.unread || 0;
    const total = stats.total || 0;

    // ---- آمار رایگان امروز ----
    const freeStats = statsService.getDailyFreeStats(user.telegram_id);
    const remainingFree = Math.max(0, freeStats.remaining);
    const usedToday = freeStats.used;

    // ---- وضعیت بسته ----
    const packageStatus = statsService.getActivePackageStatus(user.telegram_id);

    // ---- لینک WebApp ----
    const webappUrl = `${config.server.webappUrl}/webapp/index.html#/inbox`;

    // ---- ساخت متن ----
    let text = `<b>📬 ${t('inbox.header')}</b>\n\n`;

    text += `📨 ${t('inbox.totalMessages', { count: total })}\n`;
    text += `🔵 ${t('inbox.unreadMessages', { count: unread })}\n\n`;

    // وضعیت رایگان یا بسته
    if (packageStatus.hasPackage) {
      text += `💎 <b>${t('inbox.activePackage')}</b>\n`;
      text += `⏱ ${t('inbox.daysLeft', { count: packageStatus.daysLeft })}\n`;
    } else {
      text += `🆓 ${t('inbox.freeToday', { remaining: remainingFree })}\n`;
      if (usedToday > 0) {
        text += `📊 ${t('inbox.usedToday', { used: usedToday, limit: config.free.dailyMessages })}\n`;
      }
    }

    // ---- ارسال ----
    await ctx.reply(text, {
      parse_mode: 'HTML',
      reply_markup: actions.inboxKeyboard(webappUrl, unread, lang),
    });
  } catch (error) {
    console.error('خطا در handleInbox:', error);

    const lang = ctx.user?.language || config.languages.default;
    const t = i18n.getTranslator(lang);

    await ctx.reply(t('errors.general'), { parse_mode: 'HTML' });
  }
}

// ============================================================
//  handleReplyInput — پردازش پاسخ ناشناس
// ============================================================

async function handleReplyInput(ctx) {
  try {
    const s = ctx.session || {};
    const message = ctx.message;

    if (!message || !message.text) {
      return;
    }

    const user = userService.getByTelegramId(ctx.from.id);
    if (!user) {
      s.waitingFor = null;
      return;
    }

    const lang = user.language || config.languages.default;
    const t = i18n.getTranslator(lang);

    const content = message.text.trim();

    // ---- اعتبارسنجی ----
    if (content.length < 1) {
      await ctx.reply(t('errors.invalidInput'), { parse_mode: 'HTML' });
      return;
    }

    if (content.length > config.limits.maxMessageLength) {
      await ctx.reply(
        t('send.tooLong', { max: config.limits.maxMessageLength }),
        { parse_mode: 'HTML' }
      );
      return;
    }

    const messageId = s.replyToMessageId;
    const targetId = s.targetId;
    const aliasId = s.replyAliasId;

    if (!messageId || !targetId) {
      s.waitingFor = null;
      await ctx.reply(t('errors.general'), { parse_mode: 'HTML' });
      return;
    }

    // ---- چک بسته پاسخ ----
    if (!packageService.hasReplyPackage(user.telegram_id)) {
      s.waitingFor = null;
      await ctx.reply(t('reply.needPackage'), { parse_mode: 'HTML' });
      return;
    }

    // ---- ثبت پاسخ ----
    const replyService = require('../services/reply');
    const result = replyService.sendReply({
      originalMessageId: messageId,
      senderId: user.telegram_id,
      targetId: targetId,
      aliasId: aliasId,
      content: content,
    });

    if (!result.success) {
      s.waitingFor = null;
      await ctx.reply(t('errors.general'), { parse_mode: 'HTML' });
      return;
    }

    // ---- اطلاع به فرستنده اصلی ----
    try {
      const target = userService.getByTelegramId(targetId);
      if (target) {
        const targetLang = target.language || config.languages.default;
        const targetT = i18n.getTranslator(targetLang);

        // اطلاعات alias
        let aliasLabel = targetT('labels.anonymous');
        if (aliasId) {
          const alias = aliasService.getById(aliasId);
          if (alias) {
            aliasLabel = aliasService.formatAlias(alias);
          }
        }

        let notifyText = targetT('reply.newReplyNotification');
        notifyText += `\n\n`;
        notifyText += `<b>${aliasLabel}</b>\n`;
        notifyText += `<i>${utils.escapeHtml(content)}</i>`;

        await ctx.api.sendMessage(targetId, notifyText, { parse_mode: 'HTML' });
      }
    } catch (err) {
      console.error('خطا در اطلاع به فرستنده اصلی:', err);
    }

    // ---- پاکسازی session ----
    s.waitingFor = null;
    delete s.replyToMessageId;
    delete s.replyAliasId;
    delete s.targetId;

    await ctx.reply(t('reply.success'), { parse_mode: 'HTML' });
  } catch (error) {
    console.error('خطا در handleReplyInput:', error);

    if (ctx.session) {
      ctx.session.waitingFor = null;
    }

    const lang = ctx.user?.language || config.languages.default;
    const t = i18n.getTranslator(lang);

    await ctx.reply(t('errors.general'), { parse_mode: 'HTML' });
  }
}

// ============================================================
//  استخراج محتوا از پیام
// ============================================================

function extractContent(message) {
  // ---- متن ----
  if (message.text) {
    return { type: 'text', text: message.text };
  }

  // ---- عکس ----
  if (message.photo && message.photo.length > 0) {
    return {
      type: 'photo',
      fileId: message.photo[message.photo.length - 1].file_id,
      caption: message.caption || '',
      text: message.caption || '[عکس]',
    };
  }

  // ---- ویدیو ----
  if (message.video) {
    return {
      type: 'video',
      fileId: message.video.file_id,
      caption: message.caption || '',
      text: message.caption || '[ویدیو]',
    };
  }

  // ---- ویس ----
  if (message.voice) {
    return {
      type: 'voice',
      fileId: message.voice.file_id,
      text: '[پیام صوتی]',
    };
  }

  // ---- صدا ----
  if (message.audio) {
    return {
      type: 'audio',
      fileId: message.audio.file_id,
      caption: message.caption || '',
      text: message.caption || '[صوت]',
    };
  }

  // ---- استیکر ----
  if (message.sticker) {
    return {
      type: 'sticker',
      fileId: message.sticker.file_id,
      text: '[استیکر]',
    };
  }

  // ---- فایل ----
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
  handleSend,
  handleInbox,
  handleReplyInput,
};