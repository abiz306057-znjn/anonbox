/**
 * handlers/payment.js
 * هندلرهای پرداخت Telegram Stars
 * نسخه ۳.۰ — با ۴ بسته جدید
 *
 * شامل:
 *   - handlePreCheckout       ← تایید پیش‌پرداخت
 *   - handleSuccessfulPayment ← تکمیل خرید
 *   - applyPackageToUser      ← فعال‌سازی بسته (helper)
 */

const config = require('../config');
const i18n = require('../i18n');
const utils = require('../utils');
const userService = require('../services/user');
const paymentService = require('../services/payment');
const packageService = require('../services/package');

// ============================================================
//  Pre-Checkout — قبل از پرداخت
// ============================================================

async function handlePreCheckout(ctx) {
  try {
    const query = ctx.preCheckoutQuery;
    const payload = query.invoice_payload;

    // ---- پارس payload ----
    // فرمت: package_<id>:<userId>
    const parts = payload.split(':');
    const type = parts[0];
    const userId = parseInt(parts[1], 10);

    if (!type || !userId || userId !== ctx.from.id) {
      await ctx.answerPreCheckoutQuery(false, {
        error_message: 'درخواست پرداخت نامعتبر است.',
      });
      return;
    }

    // ---- انواع معتبر ----
    const validTypes = [
      'package_weekly',
      'package_monthly',
      'package_yearly',
      'package_reply',
    ];

    if (!validTypes.includes(type)) {
      await ctx.answerPreCheckoutQuery(false, {
        error_message: 'نوع خرید نامعتبر است.',
      });
      return;
    }

    // ---- استخراج packageId ----
    const packageId = type.replace('package_', '');
    const pkg = config.packages[packageId];

    if (!pkg) {
      await ctx.answerPreCheckoutQuery(false, {
        error_message: 'بسته مورد نظر پیدا نشد.',
      });
      return;
    }

    // ---- چک قیمت ----
    if (query.total_amount !== pkg.price) {
      await ctx.answerPreCheckoutQuery(false, {
        error_message: 'قیمت پرداخت نامعتبر است.',
      });
      return;
    }

    // ---- چک کاربر ----
    const user = userService.getByTelegramId(userId);
    if (!user) {
      await ctx.answerPreCheckoutQuery(false, {
        error_message: 'کاربر پیدا نشد.',
      });
      return;
    }

    if (user.is_banned) {
      await ctx.answerPreCheckoutQuery(false, {
        error_message: 'حساب شما مسدود است.',
      });
      return;
    }

    // ---- ثبت پرداخت pending ----
    paymentService.createPending({
      user_id: userId,
      telegram_payment_id: query.id,
      type: type,
      amount: query.total_amount,
      currency: query.currency || 'XTR',
      payload: payload,
    });

    // ---- تایید ----
    await ctx.answerPreCheckoutQuery(true);
  } catch (error) {
    console.error('خطا در handlePreCheckout:', error);

    try {
      await ctx.answerPreCheckoutQuery(false, {
        error_message: 'خطای داخلی رخ داد.',
      });
    } catch (e) {
      // ignore
    }
  }
}

// ============================================================
//  Successful Payment — پرداخت موفق
// ============================================================

async function handleSuccessfulPayment(ctx) {
  try {
    const payment = ctx.message.successful_payment;
    const payload = payment.invoice_payload;

    // ---- پارس payload ----
    const parts = payload.split(':');
    const type = parts[0];
    const userId = parseInt(parts[1], 10);
    const packageId = type.replace('package_', '');

    // ---- ثبت تکمیل ----
    paymentService.markCompleted({
      telegram_payment_id: payment.telegram_payment_charge_id,
      user_id: userId,
      amount: payment.total_amount,
      type: type,
    });

    // ---- فعال‌سازی بسته ----
    await applyPackageToUser(ctx, userId, packageId, payment.total_amount);

    // ---- آمار ----
    userService.addStarsSpent(userId, payment.total_amount);
  } catch (error) {
    console.error('خطا در handleSuccessfulPayment:', error);

    const lang = ctx.user?.language || config.languages.default;
    const t = i18n.getTranslator(lang);

    try {
      await ctx.reply(t('errors.paymentFailed'), { parse_mode: 'HTML' });
    } catch (e) {
      // ignore
    }
  }
}

// ============================================================
//  Helper — فعال‌سازی بسته پس از خرید
// ============================================================

async function applyPackageToUser(ctx, userId, packageId, amount) {
  const user = userService.getByTelegramId(userId);
  if (!user) return;

  const lang = user.language || config.languages.default;
  const t = i18n.getTranslator(lang);

  const pkg = config.packages[packageId];
  if (!pkg) {
    await ctx.reply(t('errors.paymentInvalid'), { parse_mode: 'HTML' });
    return;
  }

  // ---- فعال‌سازی از طریق سرویس ----
  const result = packageService.activatePackage(userId, packageId, {
    source: 'purchase',
  });

  if (!result.success) {
    await ctx.reply(t('errors.paymentFailed'), { parse_mode: 'HTML' });
    return;
  }

  // ---- ساخت پیام موفقیت ----
  const pkgName = pkg.name[lang] || pkg.name.fa;

  let successMessage = `✅ <b>${t('payment.success')}</b>\n\n`;
  successMessage += `📦 <b>${t('payment.packageActivated')}</b>\n`;
  successMessage += `${pkg.icon} ${pkgName}\n`;
  successMessage += `⏱ ${t('payment.validFor', { days: pkg.days })}\n`;

  if (result.expiresAt) {
    const expiryDate = new Date(result.expiresAt * 1000);
    const dateStr = i18n.formatDate(expiryDate, lang);
    successMessage += `📅 ${t('payment.expiresAt', { date: dateStr })}`;
  }

  await ctx.reply(successMessage, { parse_mode: 'HTML' });

  // ---- اطلاع به ادمین ----
  if (config.admin.id) {
    const adminMsg = `
💰 <b>خرید جدید</b>

👤 کاربر: <code>${userId}</code>
📦 بسته: ${pkgName}
💵 مبلغ: ${amount} ⭐️
    `.trim();

    ctx.api
      .sendMessage(config.admin.id, adminMsg, { parse_mode: 'HTML' })
      .catch(() => {});
  }

  // ---- لاگ ----
  if (config.env.isDev) {
    console.log(`💰 خرید: کاربر ${userId} - بسته ${packageId} - ${amount} Stars`);
  }
}

// ============================================================
//  خروجی
// ============================================================

module.exports = {
  handlePreCheckout,
  handleSuccessfulPayment,
  applyPackageToUser,
};