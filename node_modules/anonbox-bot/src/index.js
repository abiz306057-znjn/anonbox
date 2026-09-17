/**
 * index.js
 * نقطه شروع ربات v3
 * راه‌اندازی ربات + سرور HTTP به‌صورت موازی
 *
 * ⚠️ فایل‌های وابسته باید موجود باشن:
 *   - ./config
 *   - ./server
 *   - ./handlers
 *   - ./actions
 *   - ./middlewares
 *   - ./i18n
 *   - ./utils
 *   - ./db
 */

const { Bot, session } = require('grammy');
const config = require('./config');
const db = require('./db');
const i18n = require('./i18n');
const utils = require('./utils');

// ===== هندلرها =====
const handlers = require('./handlers');

// ===== اکشن‌ها (callbackها) =====
const actions = require('./actions');

// ===== میان‌افزارها =====
const middlewares = require('./middlewares');

// ===== سرور HTTP =====
const { startServer, stopServer } = require('./server');

// ============================================================
//  ساخت ربات
// ============================================================

const bot = new Bot(config.bot.token);

// ============================================================
//  میان‌افزارها (ترتیب مهمه)
// ============================================================

// ۱. سشن — اول از همه
bot.use(
  session({
    initial: () => ({
      // هدف پیام
      targetId: null,
      targetSlug: null,

      // پاسخ ناشناس
      replyToMessageId: null,
      replyAliasId: null,

      // حالت انتظار
      waitingFor: null,

      // اطلاعات موقت
      tempData: {},
    }),

    getSessionKey: (ctx) => {
      if (ctx.from && ctx.chat) {
        return `${ctx.from.id}:${ctx.chat.id}`;
      }
      return undefined;
    },
  })
);

// ۲. چک بن
bot.use(middlewares.banCheck);

// ۳. احراز هویت
bot.use(middlewares.auth);

// ۴. محدودیت نرخ
bot.use(middlewares.rateLimit);

// ============================================================
//  دستورات اصلی
// ============================================================

bot.command('start', handlers.user.handleStart);
bot.command('inbox', handlers.message.handleInbox);
bot.command('settings', handlers.user.handleSettings);
bot.command('help', handlers.user.handleHelp);
bot.command('language', handlers.user.handleLanguage);
bot.command('lang', handlers.user.handleLanguage);
bot.command('admin', handlers.admin.handleAdminCommand);

// ============================================================
//  هندلرهای پرداخت
// ============================================================

bot.on('pre_checkout_query', handlers.payment.handlePreCheckout);
bot.on(':successful_payment', handlers.payment.handleSuccessfulPayment);

// ============================================================
//  هندلر State-based (وقتی کاربر در حال ورودی‌ه)
// ============================================================

bot.on('message', async (ctx, next) => {
  const s = ctx.session;

  if (!s || !s.waitingFor) {
    return next();
  }

  const waitingFor = s.waitingFor;
  const message = ctx.message;

  try {
    // ===== منتظر بیو =====
    if (waitingFor === 'bio') {
      const bio = message.text?.trim();
      const lang = ctx.user?.language || config.languages.default;
      const t = i18n.getTranslator(lang);

      if (!bio) {
        await ctx.reply(t('errors.invalidInput'), { parse_mode: 'HTML' });
        return;
      }

      if (bio.length > config.limits.maxBioLength) {
        await ctx.reply(
          t('errors.tooLong') + `\n(حداکثر ${config.limits.maxBioLength} کاراکتر)`,
          { parse_mode: 'HTML' }
        );
        return;
      }

      const userService = require('./services/user');
      userService.updateBio(ctx.from.id, bio);

      s.waitingFor = null;
      await ctx.reply(t('settings.bioSaved'), { parse_mode: 'HTML' });
      await handlers.user.handleSettings(ctx);
      return;
    }

    // ===== منتظر نام =====
    if (waitingFor === 'name') {
      const name = message.text?.trim();
      const lang = ctx.user?.language || config.languages.default;
      const t = i18n.getTranslator(lang);

      if (!name || name.length < 2 || name.length > config.limits.maxNameLength) {
        await ctx.reply(t('errors.invalidInput'), { parse_mode: 'HTML' });
        return;
      }

      const userService = require('./services/user');
      userService.updateFirstName(ctx.from.id, name);

      s.waitingFor = null;
      await ctx.reply(t('settings.nameSaved'), { parse_mode: 'HTML' });
      await handlers.user.handleSettings(ctx);
      return;
    }

    // ===== منتظر اسلاگ =====
    if (waitingFor === 'slug') {
      const slug = message.text?.trim().toLowerCase();
      const lang = ctx.user?.language || config.languages.default;
      const t = i18n.getTranslator(lang);

      const userService = require('./services/user');
      const isValidSlug = utils.isValidSlug(slug);

      if (!isValidSlug) {
        await ctx.reply(t('settings.slugInvalid'), { parse_mode: 'HTML' });
        return;
      }

      if (userService.getBySlug(slug)) {
        await ctx.reply(t('settings.slugTaken'), { parse_mode: 'HTML' });
        return;
      }

      userService.updateSlug(ctx.from.id, slug);

      s.waitingFor = null;
      await ctx.reply(t('settings.slugChanged', { slug }), { parse_mode: 'HTML' });
      await handlers.user.handleSettings(ctx);
      return;
    }

    // ===== منتظر پاسخ ناشناس =====
    if (waitingFor === 'reply') {
      await handlers.message.handleReplyInput(ctx);
      return;
    }

    // ===== منتظر برودکست (ادمین) =====
    if (waitingFor === 'broadcast' && ctx.from.id === config.admin.id) {
      s.waitingFor = null;
      await handlers.admin.handleBroadcastInput(ctx, message);
      return;
    }

    // حالت ناشناخته
    s.waitingFor = null;
    return next();
  } catch (error) {
    console.error('خطا در state handler:', error);
    s.waitingFor = null;

    const lang = ctx.user?.language || config.languages.default;
    const t = i18n.getTranslator(lang);
    await ctx.reply(t('errors.general'), { parse_mode: 'HTML' });
  }
});

// ============================================================
//  هندلر پیام‌های ناشناس (ارسال)
// ============================================================

bot.on('message:text', handlers.message.handleSend);
bot.on('message:photo', handlers.message.handleSend);
bot.on('message:video', handlers.message.handleSend);
bot.on('message:voice', handlers.message.handleSend);
bot.on('message:audio', handlers.message.handleSend);
bot.on('message:sticker', handlers.message.handleSend);
bot.on('message:document', handlers.message.handleSend);

// ============================================================
//  دکمه‌های inline (callbackها)
// ============================================================

actions.registerCallbacks(bot);

// ============================================================
//  مدیریت خطا
// ============================================================

bot.catch((err) => {
  const ctx = err.ctx;

  console.error(`❌ خطا در بروزرسانی ${ctx.update.update_id}:`);
  console.error(err.error);

  // خطاهای بی‌خطر
  if (
    err.error?.message?.includes('message is not modified') ||
    err.error?.message?.includes('query is too old')
  ) {
    return;
  }

  // اطلاع به ادمین (فقط در production)
  if (config.admin.id && config.env.isProd) {
    const errorMsg = `
🚨 <b>خطای ربات</b>

👤 کاربر: <code>${ctx.from?.id || 'ناشناس'}</code>
📍 نوع: <code>${ctx.updateType}</code>
💬 خطا: <code>${utils.escapeHtml(err.error?.message || 'نامشخص')}</code>
    `.trim();

    bot.api
      .sendMessage(config.admin.id, errorMsg, { parse_mode: 'HTML' })
      .catch(() => {});
  }
});

// ============================================================
//  راه‌اندازی
// ============================================================

async function startBot() {
  try {
    // پاک کردن وبهوک قبلی
    await bot.api.deleteWebhook({ drop_pending_updates: true });

    // اطلاعات ربات
    const me = await bot.api.getMe();

    console.log('');
    console.log('╔══════════════════════════════════════════════╗');
    console.log('║      🎭 AnonBox Bot v3.0 Started             ║');
    console.log('╚══════════════════════════════════════════════╝');
    console.log(`🤖 نام:       ${me.first_name}`);
    console.log(`👤 یوزرنیم:   @${me.username}`);
    console.log(`🆔 آیدی:      ${me.id}`);
    console.log(`🌐 وب‌اپ:     ${config.server.webappUrl}`);
    console.log(`💾 دیتابیس:   ${config.db.path}`);
    console.log(`🔧 حالت:      ${config.env.nodeEnv}`);
    console.log('');

    // راه‌اندازی سرور HTTP (موازی)
    try {
      await startServer();
    } catch (err) {
      console.error('❌ خطا در راه‌اندازی سرور HTTP:', err.message);
      console.error('   ربات همچنان اجرا می‌شه، ولی WebApp در دسترس نیست.');
    }

    // شروع polling
    await bot.start({
      onStart: () => {
        console.log('✅ ربات آماده دریافت پیام‌هاست');
        console.log('📡 منتظر پیام...');
        console.log('');
      },
    });
  } catch (error) {
    console.error('');
    console.error('❌ خطا در راه‌اندازی ربات:');
    console.error(error);
    process.exit(1);
  }
}

// ============================================================
//  خاموش کردن نرم
// ============================================================

let isShuttingDown = false;

async function shutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log('');
  console.log(`⏹  دریافت ${signal} — خاموش کردن...`);

  try {
    // توقف ربات
    await bot.stop();
    console.log('🤖 ربات متوقف شد');

    // توقف سرور HTTP
    await stopServer();
    console.log('🌐 سرور HTTP متوقف شد');

    // بستن دیتابیس
    db.close();
    console.log('💾 دیتابیس بسته شد');

    console.log('✅ خاموش شد');
    console.log('');
    process.exit(0);
  } catch (error) {
    console.error('❌ خطا در خاموش کردن:', error);
    process.exit(1);
  }
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// ============================================================
//  خطاهای پردازش‌نشده
// ============================================================

process.on('unhandledRejection', (reason) => {
  console.error('⚠️  Promise بدون catch:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('💥 خطای غیرمنتظره:', error);

  if (config.env.isProd) {
    shutdown('uncaughtException');
  }
});

// ============================================================
//  اجرا
// ============================================================

startBot();

// ============================================================
//  خروجی (برای تست)
// ============================================================

module.exports = bot;