/**
 * handlers/admin.js
 * هندلرهای ادمین
 * نسخه ۳.۰ — داشبورد، برودکست، مدیریت کاربران
 *
 * شامل:
 *   - handleAdminCommand     ← دستور /admin
 *   - handleBroadcastInput   ← دریافت پیام برودکست
 *   - isAdmin                ← بررسی ادمین
 */

const config = require('../config');
const i18n = require('../i18n');
const utils = require('../utils');
const userService = require('../services/user');
const messageService = require('../services/message');
const statsService = require('../services/stats');
const actions = require('../actions');

// ============================================================
//  بررسی ادمین
// ============================================================

function isAdmin(userId) {
  return userId === config.admin.id;
}

// ============================================================
//  /admin
// ============================================================

async function handleAdminCommand(ctx) {
  try {
    // فقط ادمین
    if (!isAdmin(ctx.from.id)) {
      // به کاربر عادی هیچی نمی‌گیم (امنیت)
      return;
    }

    await showDashboard(ctx);
  } catch (error) {
    console.error('خطا در handleAdminCommand:', error);
    await ctx.reply('خطا در نمایش داشبورد', { parse_mode: 'HTML' });
  }
}

// ============================================================
//  داشبورد اصلی
// ============================================================

async function showDashboard(ctx) {
  try {
    // ---- آمار ----
    const overview = statsService.getOverview();
    const onlineCount = statsService.getOnlineCount();

    // ---- ساخت متن ----
    let text = '🔧 <b>پنل مدیریت</b>\n\n';

    text += '📊 <b>آمار کلی</b>\n';
    text += `👥 کاربران: <b>${formatNumber(overview.totalUsers)}</b>\n`;
    text += `🟢 آنلاین الان: <b>${formatNumber(onlineCount)}</b>\n`;
    text += `✅ فعال امروز: <b>${formatNumber(overview.activeToday || 0)}</b>\n`;
    text += `📨 پیام‌ها: <b>${formatNumber(overview.totalMessages)}</b>\n`;
    text += `💳 پرداخت‌ها: <b>${formatNumber(overview.totalPayments || 0)}</b>\n`;
    text += `💰 درآمد کل: <b>${formatNumber(overview.totalRevenue)}</b> ⭐️\n`;
    text += `💎 بسته فعال: <b>${formatNumber(overview.activePackages)}</b>\n`;
    text += `⚠️ گزارش باز: <b>${formatNumber(overview.pendingReports)}</b>\n`;
    text += `🚫 بن‌شده: <b>${formatNumber(overview.bannedUsers)}</b>\n`;

    await ctx.reply(text, {
      parse_mode: 'HTML',
      reply_markup: actions.adminKeyboard(),
    });
  } catch (error) {
    console.error('خطا در showDashboard:', error);
    await ctx.reply('خطا در بارگذاری آمار', { parse_mode: 'HTML' });
  }
}

// ============================================================
//  برودکست — دریافت پیام
// ============================================================

async function handleBroadcastInput(ctx, message) {
  try {
    if (!isAdmin(ctx.from.id)) return;

    const users = userService.listUsers(100000);

    await ctx.reply(`📢 شروع ارسال به ${users.length} کاربر...`);

    let success = 0;
    let failed = 0;
    let blocked = 0;

    for (const user of users) {
      try {
        await ctx.api.copyMessage(user.telegram_id, ctx.chat.id, message.message_id);
        success++;

        // جلوگیری از rate limit تلگرام
        if (success % 30 === 0) {
          await sleep(1000);
        }
      } catch (error) {
        if (error.error_code === 403) {
          blocked++;
        } else {
          failed++;
        }
      }
    }

    await ctx.reply(
      `✅ ارسال تمام شد.\n\n✅ موفق: ${success}\n⚠️ ناموفق: ${failed}\n🚫 بلاک: ${blocked}`
    );
  } catch (error) {
    console.error('خطا در handleBroadcastInput:', error);
    await ctx.reply('خطا در برودکست', { parse_mode: 'HTML' });
  }
}

// ============================================================
//  ابزارها
// ============================================================

function formatNumber(num) {
  if (!num && num !== 0) return '0';
  return Number(num).toLocaleString('en-US');
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================
//  خروجی
// ============================================================

module.exports = {
  handleAdminCommand,
  handleBroadcastInput,
  showDashboard,
  isAdmin,
};