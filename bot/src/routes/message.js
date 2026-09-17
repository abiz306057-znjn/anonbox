/**
 * routes/message.js
 * HTTP API پیام‌ها
 * نسخه ۳.۰
 *
 * همه مسیرها با prefix کامل — mount در server.js: app.use('/api', routes.message)
 *
 * مسیرها:
 *   GET    /api/messages              ← لیست پیام‌ها
 *   GET    /api/messages/stats        ← آمار صندوق
 *   GET    /api/messages/:id          ← جزئیات یه پیام
 *   POST   /api/messages/:id/read     ← علامت‌گذاری خوانده‌شده
 *   POST   /api/messages/read-all     ← علامت‌گذاری همه
 *   POST   /api/messages/:id/report   ← گزارش
 *   POST   /api/messages/:id/block    ← بلاک فرستنده
 *   POST   /api/messages/:id/reply    ← پاسخ ناشناس
 *   DELETE /api/messages/:id          ← حذف پیام
 */

const express = require('express');
const router = express.Router();

const config = require('../config');
const i18n = require('../i18n');
const utils = require('../utils');
const middlewares = require('../middlewares');
const messageService = require('../services/message');
const packageService = require('../services/package');
const statsService = require('../services/stats');
const aliasService = require('../services/alias');
const userService = require('../services/user');

// ============================================================
//  GET /api/messages
//  لیست پیام‌ها با فیلتر
// ============================================================

router.get('/messages', middlewares.verifyTelegram, (req, res, next) => {
  try {
    const user = req.user;

    // ---- پارامترها ----
    const filter = req.query.filter || 'all';
    const limit = Math.min(
      parseInt(req.query.limit, 10) || config.limits.defaultPaginationSize,
      config.limits.maxPaginationSize
    );
    const offset = parseInt(req.query.offset, 10) || 0;

    // ---- وضعیت بسته ----
    const packageStatus = packageService.getActivePackage(user.telegram_id);
    const hasUnlimited = packageStatus.hasPackage;

    // ---- رایگان روزانه ----
    const dailyStats = statsService.getDailyFreeStats(user.telegram_id);
    const remainingFree = dailyStats.remaining;

    // ---- لیست پیام‌ها ----
    const messages = messageService.getForUserWithFilter(
      user.telegram_id,
      filter,
      limit,
      offset
    );

    // ---- پردازش هر پیام ----
    let freeUsedInBatch = 0;

    const processedMessages = messages.map((m) => {
      let canView = false;
      let requiresPayment = false;

      if (hasUnlimited) {
        canView = true;
      } else if (m.is_read || m.is_revealed) {
        canView = true;
      } else if (freeUsedInBatch < remainingFree) {
        canView = true;
        freeUsedInBatch++;
      } else {
        requiresPayment = true;
      }

      // ---- اطلاعات alias ----
      let aliasInfo = null;
      if (m.alias_id) {
        const alias = aliasService.getById(m.alias_id);
        if (alias) {
          aliasInfo = {
            id: alias.id,
            label: aliasService.formatAlias(alias),
            emoji: alias.emoji,
            number: alias.alias_number,
          };
        }
      }

      return {
        id: m.id,
        content_type: m.content_type,
        content: canView ? m.content : null,
        preview: canView
          ? m.content
          : m.content
            ? `🔒 پیام قفل شده — ${m.content_type}`
            : '🔒 پیام قفل شده',
        caption: canView ? m.caption : null,
        file_url: canView && m.file_url ? m.file_url : null,
        is_read: !!m.is_read,
        is_revealed: !!m.is_revealed,
        is_reported: !!m.is_reported,
        is_reply: !!m.is_reply,
        requires_payment: requiresPayment,
        can_view: canView,
        alias: aliasInfo,
        created_at: m.created_at,
      };
    });

    // ---- شمارش کل ----
    const total = messageService.getTotalCountForUser(user.telegram_id, filter);

    res.json({
      messages: processedMessages,
      total,
      has_more: offset + messages.length < total,
      has_unlimited: hasUnlimited,
      daily_free: {
        limit: dailyStats.limit,
        used: dailyStats.used,
        remaining: dailyStats.remaining,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================
//  GET /api/messages/stats
//  آمار صندوق
// ============================================================

router.get('/messages/stats', middlewares.verifyTelegram, (req, res, next) => {
  try {
    const user = req.user;

    const stats = messageService.getStatsForUser(user.telegram_id);
    const dailyStats = statsService.getDailyFreeStats(user.telegram_id);
    const packageStatus = packageService.getActivePackage(user.telegram_id);

    res.json({
      total: stats.total || 0,
      unread: stats.unread || 0,
      revealed: stats.revealed || 0,

      package: packageStatus.hasPackage
        ? {
            id: packageStatus.packageId,
            name: packageStatus.name,
            days_left: packageStatus.daysLeft,
          }
        : null,

      has_reply_package: packageStatus.hasReplyPackage,

      daily_free: {
        limit: dailyStats.limit,
        used: dailyStats.used,
        remaining: dailyStats.remaining,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================
//  POST /api/messages/read-all
//  علامت‌گذاری همه
// ============================================================

router.post('/messages/read-all', middlewares.verifyTelegram, (req, res, next) => {
  try {
    messageService.markAllReadForUser(req.user.telegram_id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// ============================================================
//  GET /api/messages/:id
//  جزئیات یه پیام
// ============================================================

router.get('/messages/:id', middlewares.verifyTelegram, (req, res, next) => {
  try {
    const user = req.user;
    const messageId = parseInt(req.params.id, 10);

    if (!messageId || isNaN(messageId)) {
      return res.status(400).json({
        error: 'INVALID_INPUT',
        message: 'آیدی نامعتبر.',
      });
    }

    const message = messageService.getById(messageId);

    if (!message) {
      return res.status(404).json({
        error: 'MESSAGE_NOT_FOUND',
        message: 'پیام پیدا نشد.',
      });
    }

    if (message.receiver_id !== user.telegram_id) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: 'این پیام برای شما نیست.',
      });
    }

    // ---- بررسی دسترسی ----
    const packageStatus = packageService.getActivePackage(user.telegram_id);
    const hasUnlimited = packageStatus.hasPackage;

    let canView = false;
    let requiresPayment = false;

    if (hasUnlimited) {
      canView = true;
    } else if (message.is_read || message.is_revealed) {
      canView = true;
    } else {
      const dailyStats = statsService.getDailyFreeStats(user.telegram_id);
      if (dailyStats.remaining > 0) {
        canView = true;
      } else {
        requiresPayment = true;
      }
    }

    // ---- اطلاعات alias ----
    let aliasInfo = null;
    if (message.alias_id) {
      const alias = aliasService.getById(message.alias_id);
      if (alias) {
        aliasInfo = {
          id: alias.id,
          label: aliasService.formatAlias(alias),
          emoji: alias.emoji,
          number: alias.alias_number,
        };
      }
    }

    res.json({
      id: message.id,
      content_type: message.content_type,
      content: canView ? message.content : null,
      caption: canView ? message.caption : null,
      file_url: canView && message.file_url ? message.file_url : null,

      is_read: !!message.is_read,
      is_revealed: !!message.is_revealed,
      is_reported: !!message.is_reported,
      is_reply: !!message.is_reply,
      requires_payment: requiresPayment,
      can_view: canView,

      alias: aliasInfo,

      // امکان پاسخ
      can_reply: packageStatus.hasReplyPackage,
      has_sender: !!message.sender_telegram_id,

      created_at: message.created_at,
      read_at: message.read_at,
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================
//  POST /api/messages/:id/read
//  علامت‌گذاری خوانده‌شده + مصرف رایگان
// ============================================================

router.post('/messages/:id/read', middlewares.verifyTelegram, (req, res, next) => {
  try {
    const user = req.user;
    const messageId = parseInt(req.params.id, 10);

    if (!messageId || isNaN(messageId)) {
      return res.status(400).json({
        error: 'INVALID_INPUT',
        message: 'آیدی نامعتبر.',
      });
    }

    const message = messageService.getById(messageId);

    if (!message) {
      return res.status(404).json({
        error: 'MESSAGE_NOT_FOUND',
        message: 'پیام پیدا نشد.',
      });
    }

    if (message.receiver_id !== user.telegram_id) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: 'این پیام برای شما نیست.',
      });
    }

    // ---- بررسی دسترسی ----
    const access = messageService.checkMessageAccess(user.telegram_id, messageId);

    if (!access.allowed) {
      if (access.reason === 'NEED_PACKAGE') {
        return res.status(403).json({
          error: 'NEED_PACKAGE',
          message: 'برای دیدن این پیام نیاز به بسته داری.',
        });
      }

      return res.status(403).json({
        error: access.reason || 'FORBIDDEN',
        message: 'دسترسی ندارید.',
      });
    }

    // ---- مصرف رایگان ----
    if (access.reason === 'FREE_QUOTA' && !message.is_read) {
      statsService.useDailyFree(user.telegram_id);

      // لاگ
      try {
        messageService.logDailyFreeUsage(user.telegram_id, messageId);
      } catch (err) {
        // ignore
      }
    }

    // ---- علامت‌گذاری ----
    if (!message.is_read) {
      messageService.markRead(messageId);
    }

    res.json({
      success: true,
      can_view: true,
      reason: access.reason,
      content: message.content,
      caption: message.caption,
      file_url: message.file_url,
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================
//  POST /api/messages/:id/report
//  گزارش پیام
// ============================================================

router.post('/messages/:id/report', middlewares.verifyTelegram, (req, res, next) => {
  try {
    const user = req.user;
    const messageId = parseInt(req.params.id, 10);
    const { reason } = req.body || {};

    if (!messageId || isNaN(messageId)) {
      return res.status(400).json({
        error: 'INVALID_INPUT',
        message: 'آیدی نامعتبر.',
      });
    }

    const message = messageService.getById(messageId);

    if (!message) {
      return res.status(404).json({
        error: 'MESSAGE_NOT_FOUND',
        message: 'پیام پیدا نشد.',
      });
    }

    if (message.receiver_id !== user.telegram_id) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: 'این پیام برای شما نیست.',
      });
    }

    if (message.is_reported) {
      return res.status(409).json({
        error: 'ALREADY_REPORTED',
        message: 'این پیام قبلاً گزارش شده.',
      });
    }

    messageService.markReported(messageId, user.telegram_id, reason || 'user_report');

    // ---- اطلاع به ادمین ----
    if (config.admin.id) {
      const adminText = `
🚨 <b>گزارش جدید</b>

📨 پیام: <code>${messageId}</code>
👤 گزارش‌دهنده: <code>${user.telegram_id}</code>
📝 محتوا: <i>${utils.escapeHtml((message.content || '').substring(0, 200))}</i>
      `.trim();

      // نیاز به bot instance — از require inline
      try {
        const bot = require('../index');
        if (bot?.api) {
          bot.api
            .sendMessage(config.admin.id, adminText, { parse_mode: 'HTML' })
            .catch(() => {});
        }
      } catch (e) {
        // ignore
      }
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// ============================================================
//  POST /api/messages/:id/block
//  بلاک فرستنده
// ============================================================

router.post('/messages/:id/block', middlewares.verifyTelegram, (req, res, next) => {
  try {
    const user = req.user;
    const messageId = parseInt(req.params.id, 10);

    if (!messageId || isNaN(messageId)) {
      return res.status(400).json({
        error: 'INVALID_INPUT',
        message: 'آیدی نامعتبر.',
      });
    }

    const message = messageService.getById(messageId);

    if (!message) {
      return res.status(404).json({
        error: 'MESSAGE_NOT_FOUND',
        message: 'پیام پیدا نشد.',
      });
    }

    if (message.receiver_id !== user.telegram_id) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: 'این پیام برای شما نیست.',
      });
    }

    const blockedId = message.sender_telegram_id;

    if (!blockedId) {
      return res.status(400).json({
        error: 'INVALID_INPUT',
        message: 'امکان بلاک این کاربر وجود ندارد.',
      });
    }

    if (blockedId === user.telegram_id) {
      return res.status(400).json({
        error: 'SELF_BLOCK',
        message: 'نمی‌توانید خودتان را بلاک کنید.',
      });
    }

    messageService.blockUser(user.telegram_id, blockedId);

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// ============================================================
//  POST /api/messages/:id/reply
//  پاسخ ناشناس
// ============================================================

router.post('/messages/:id/reply', middlewares.verifyTelegram, (req, res, next) => {
  try {
    const user = req.user;
    const messageId = parseInt(req.params.id, 10);
    const { content } = req.body || {};

    if (!messageId || isNaN(messageId)) {
      return res.status(400).json({
        error: 'INVALID_INPUT',
        message: 'آیدی نامعتبر.',
      });
    }

    if (!content || String(content).trim().length === 0) {
      return res.status(400).json({
        error: 'INVALID_INPUT',
        message: 'متن پاسخ خالی است.',
      });
    }

    const contentText = String(content).trim();

    if (contentText.length > config.limits.maxMessageLength) {
      return res.status(400).json({
        error: 'INVALID_INPUT',
        message: `متن نمی‌تواند بیشتر از ${config.limits.maxMessageLength} کاراکتر باشد.`,
      });
    }

    // ---- چک بسته پاسخ ----
    if (!packageService.hasReplyPackage(user.telegram_id)) {
      return res.status(403).json({
        error: 'NO_REPLY_PACKAGE',
        message: 'برای پاسخ دادن به پیام ناشناس نیاز به بسته پاسخ دارید.',
      });
    }

    const message = messageService.getById(messageId);

    if (!message) {
      return res.status(404).json({
        error: 'MESSAGE_NOT_FOUND',
        message: 'پیام پیدا نشد.',
      });
    }

    if (message.receiver_id !== user.telegram_id) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: 'این پیام برای شما نیست.',
      });
    }

    if (!message.sender_telegram_id) {
      return res.status(400).json({
        error: 'INVALID_INPUT',
        message: 'امکان پاسخ به این پیام وجود ندارد.',
      });
    }

    // ---- ثبت پاسخ ----
    const replyService = require('../services/reply');
    const result = replyService.sendReply({
      originalMessageId: messageId,
      senderId: user.telegram_id,
      targetId: message.sender_telegram_id,
      aliasId: message.alias_id,
      content: contentText,
    });

    if (!result.success) {
      return res.status(500).json({
        error: 'REPLY_FAILED',
        message: 'خطا در ارسال پاسخ.',
        reason: result.error,
      });
    }

    // ---- اطلاع به فرستنده اصلی ----
    try {
      const target = userService.getByTelegramId(message.sender_telegram_id);
      if (target) {
        const targetLang = target.language || config.languages.default;
        const targetT = i18n.getTranslator(targetLang);

        // alias
        let aliasLabel = targetT('labels.anonymous');
        if (message.alias_id) {
          const alias = aliasService.getById(message.alias_id);
          if (alias) {
            aliasLabel = aliasService.formatAlias(alias);
          }
        }

        let notifyText = targetT('reply.newReplyNotification');
        notifyText += `\n\n`;
        notifyText += `<b>${aliasLabel}</b>\n`;
        notifyText += `<i>${utils.escapeHtml(contentText)}</i>`;

        const bot = require('../index');
        if (bot?.api) {
          bot.api
            .sendMessage(message.sender_telegram_id, notifyText, { parse_mode: 'HTML' })
            .catch(() => {});
        }
      }
    } catch (err) {
      console.error('خطا در اطلاع به فرستنده:', err);
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// ============================================================
//  DELETE /api/messages/:id
//  حذف پیام
// ============================================================

router.delete('/messages/:id', middlewares.verifyTelegram, (req, res, next) => {
  try {
    const user = req.user;
    const messageId = parseInt(req.params.id, 10);

    if (!messageId || isNaN(messageId)) {
      return res.status(400).json({
        error: 'INVALID_INPUT',
        message: 'آیدی نامعتبر.',
      });
    }

    const message = messageService.getById(messageId);

    if (!message) {
      return res.status(404).json({
        error: 'MESSAGE_NOT_FOUND',
        message: 'پیام پیدا نشد.',
      });
    }

    if (message.receiver_id !== user.telegram_id) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: 'این پیام برای شما نیست.',
      });
    }

    messageService.markDeleted(messageId);

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// ============================================================
//  خروجی
// ============================================================

module.exports = router;