/**
 * db/index.js
 * اتصال دیتابیس SQLite + راه‌اندازی + مهاجرت
 * نسخه ۳.۰ — با ۱۱ جدول و بهینه‌سازی کامل
 *
 * ⚠️ این فایل اتصال یه‌تایی رو نگه می‌داره و در کل پروژه استفاده می‌شه
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const config = require('../config');

// ============================================================
//  اطمینان از وجود پوشه data
// ============================================================

const dbDir = path.dirname(config.db.path);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// ============================================================
//  باز کردن دیتابیس
// ============================================================

const db = new Database(config.db.path);

// ============================================================
//  تنظیمات عملکردی
// ============================================================

db.pragma('journal_mode = WAL');       // سریع‌تر و پایدارتر
db.pragma('foreign_keys = ON');        // کلید خارجی
db.pragma('synchronous = NORMAL');     // تعادل سرعت/امنیت
db.pragma('temp_store = MEMORY');      // جداول موقت در RAM
db.pragma('cache_size = -20000');      // ۲۰ مگابایت cache
db.pragma('busy_timeout = 5000');      // صبر ۵ ثانیه در قفل‌شدن

// ============================================================
//  اجرای schema.sql
// ============================================================

function initializeSchema() {
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');

    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf8');
      db.exec(schema);

      if (config.env.isDev) {
        console.log('✅ اسکیمای دیتابیس بررسی/ساخته شد');
      }
    } else {
      console.warn('⚠️  فایل schema.sql پیدا نشد');
    }
  } catch (error) {
    console.error('❌ خطا در راه‌اندازی اسکیما:', error);
    throw error;
  }
}

// ============================================================
//  مهاجرت‌های v3
// ============================================================

function runMigrations() {
  try {
    let migrated = 0;

    // ---- بررسی ستون‌های users ----
    const userColumns = db
      .prepare('PRAGMA table_info(users)')
      .all()
      .map((c) => c.name);

    const userMigrations = [
      { name: 'language', sql: "ALTER TABLE users ADD COLUMN language TEXT DEFAULT 'fa'" },
      { name: 'last_seen', sql: 'ALTER TABLE users ADD COLUMN last_seen INTEGER' },
      { name: 'visit_count', sql: 'ALTER TABLE users ADD COLUMN visit_count INTEGER DEFAULT 0' },
      { name: 'package_type', sql: 'ALTER TABLE users ADD COLUMN package_type TEXT' },
      { name: 'reply_package_expires_at', sql: 'ALTER TABLE users ADD COLUMN reply_package_expires_at INTEGER' },
      { name: 'daily_free_used', sql: 'ALTER TABLE users ADD COLUMN daily_free_used INTEGER DEFAULT 0' },
      { name: 'daily_free_reset_at', sql: 'ALTER TABLE users ADD COLUMN daily_free_reset_at INTEGER' },
    ];

    userMigrations.forEach((m) => {
      if (!userColumns.includes(m.name)) {
        try {
          db.exec(m.sql);
          migrated++;
          if (config.env.isDev) {
            console.log(`   ✅ users.${m.name} اضافه شد`);
          }
        } catch (e) {
          // ignore
        }
      }
    });

    // ---- بررسی ستون‌های messages ----
    const messageColumns = db
      .prepare('PRAGMA table_info(messages)')
      .all()
      .map((c) => c.name);

    const messageMigrations = [
      { name: 'alias_id', sql: 'ALTER TABLE messages ADD COLUMN alias_id INTEGER' },
      { name: 'is_reply', sql: 'ALTER TABLE messages ADD COLUMN is_reply INTEGER DEFAULT 0' },
      { name: 'original_message_id', sql: 'ALTER TABLE messages ADD COLUMN original_message_id INTEGER' },
      { name: 'file_url', sql: 'ALTER TABLE messages ADD COLUMN file_url TEXT' },
    ];

    messageMigrations.forEach((m) => {
      if (!messageColumns.includes(m.name)) {
        try {
          db.exec(m.sql);
          migrated++;
          if (config.env.isDev) {
            console.log(`   ✅ messages.${m.name} اضافه شد`);
          }
        } catch (e) {
          // ignore
        }
      }
    });

    if (config.env.isDev && migrated > 0) {
      console.log(`✅ ${migrated} مهاجرت انجام شد`);
    }
  } catch (error) {
    console.error('❌ خطا در مهاجرت‌ها:', error);
    throw error;
  }
}

// ============================================================
//  پاکسازی داده‌های قدیمی
// ============================================================

function cleanupOldData() {
  try {
    const now = Math.floor(Date.now() / 1000);
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60;
    const ninetyDaysAgo = now - 90 * 24 * 60 * 60;

    // پیام‌های حذف‌شده قدیمی‌تر از ۳۰ روز
    const messagesResult = db
      .prepare('DELETE FROM messages WHERE is_deleted = 1 AND created_at < ?')
      .run(thirtyDaysAgo);

    // بازدیدهای قدیمی‌تر از ۹۰ روز
    const visitsResult = db
      .prepare('DELETE FROM visits WHERE created_at < ?')
      .run(ninetyDaysAgo);

    // لاگ رایگان قدیمی‌تر از ۹۰ روز
    const freeLogResult = db
      .prepare("DELETE FROM daily_free_log WHERE day_date < date('now', '-90 days')")
      .run();

    if (config.env.isDev) {
      const total = messagesResult.changes + visitsResult.changes + freeLogResult.changes;
      if (total > 0) {
        console.log(`🧹 پاکسازی: ${messagesResult.changes} پیام | ${visitsResult.changes} بازدید | ${freeLogResult.changes} لاگ رایگان`);
      }
    }
  } catch (error) {
    console.error('خطا در cleanupOldData:', error);
  }
}

// ============================================================
//  ریست رایگان روزانه
// ============================================================

function resetDailyFreeQuota() {
  try {
    const now = Math.floor(Date.now() / 1000);
    const startOfDay = Math.floor(new Date().setHours(0, 0, 0, 0) / 1000);

    const result = db
      .prepare(
        `UPDATE users 
         SET daily_free_used = 0, daily_free_reset_at = ?
         WHERE daily_free_reset_at IS NULL 
            OR daily_free_reset_at < ?`
      )
      .run(now, startOfDay);

    if (config.env.isDev && result.changes > 0) {
      console.log(`🔄 رایگان روزانه برای ${result.changes} کاربر ریست شد`);
    }
  } catch (error) {
    console.error('خطا در resetDailyFreeQuota:', error);
  }
}

// ============================================================
//  بهینه‌سازی
// ============================================================

function optimize() {
  try {
    db.prepare('VACUUM').run();
    db.prepare('ANALYZE').run();

    if (config.env.isDev) {
      console.log('⚡ دیتابیس بهینه شد');
    }
  } catch (error) {
    console.error('خطا در optimize:', error);
  }
}

// ============================================================
//  بررسی سلامت دیتابیس
// ============================================================

function healthCheck() {
  try {
    const integrity = db.prepare('PRAGMA integrity_check').get();
    const fkCheck = db.prepare('PRAGMA foreign_key_check').all();

    return {
      integrity: integrity?.integrity_check === 'ok',
      foreignKeys: fkCheck.length === 0,
      tables: db
        .prepare(
          "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
        )
        .all().length,
    };
  } catch (error) {
    return {
      integrity: false,
      foreignKeys: false,
      error: error.message,
    };
  }
}

// ============================================================
//  بستن دیتابیس
// ============================================================

function close() {
  try {
    db.close();

    if (config.env.isDev) {
      console.log('🔒 اتصال دیتابیس بسته شد');
    }
  } catch (error) {
    console.error('خطا در بستن دیتابیس:', error);
  }
}

// ============================================================
//  راه‌اندازی خودکار
// ============================================================

initializeSchema();
runMigrations();

// پاکسازی هر ۶ ساعت
setInterval(cleanupOldData, 6 * 60 * 60 * 1000);

// ریست رایگان روزانه هر ۱ ساعت
setInterval(resetDailyFreeQuota, 60 * 60 * 1000);

// ریست فوری در شروع
resetDailyFreeQuota();

// ============================================================
//  خروجی
// ============================================================

module.exports = db;
module.exports.close = close;
module.exports.initializeSchema = initializeSchema;
module.exports.runMigrations = runMigrations;
module.exports.cleanupOldData = cleanupOldData;
module.exports.resetDailyFreeQuota = resetDailyFreeQuota;
module.exports.optimize = optimize;
module.exports.healthCheck = healthCheck;