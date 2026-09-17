/**
 * migrate.js
 * ساخت / بازسازی دیتابیس SQLite
 * نسخه ۳.۰
 *
 * کاربرد:
 *   node scripts/migrate.js              ← ساخت دیتابیس
 *   node scripts/migrate.js --reset      ← پاکسازی و ساخت مجدد
 *   node scripts/migrate.js --backup     ← پشتیبان قبل از عملیات
 *   node scripts/migrate.js --status     ← نمایش وضعیت
 *   node scripts/migrate.js --help       ← راهنما
 */

const fs = require('fs');
const path = require('path');

// ============================================================
//  مسیرها
// ============================================================

const ROOT_DIR = path.join(__dirname, '..');
const BOT_DIR = path.join(ROOT_DIR, 'bot');
const DATA_DIR = path.join(BOT_DIR, 'data');
const DB_PATH = path.join(DATA_DIR, 'anonbox.db');
const SCHEMA_PATH = path.join(BOT_DIR, 'src', 'db', 'schema.sql');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');

// ============================================================
//  رنگ‌های ترمینال
// ============================================================

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function line() {
  console.log('─'.repeat(55));
}

function header(title) {
  console.log('');
  line();
  log(`  🎭 AnonBox v3.0 — ${title}`, 'bright');
  line();
  console.log('');
}

// ============================================================
//  بررسی پیش‌نیازها
// ============================================================

function checkPrerequisites() {
  // چک schema.sql
  if (!fs.existsSync(SCHEMA_PATH)) {
    log(`❌ فایل schema.sql پیدا نشد:`, 'red');
    log(`   ${SCHEMA_PATH}`, 'red');
    log('');
    log('💡 مطمئن شو که پروژه رو کامل دانلود کردی.', 'yellow');
    process.exit(1);
  }

  // چک better-sqlite3
  try {
    require(path.join(BOT_DIR, 'node_modules', 'better-sqlite3'));
  } catch (e) {
    try {
      require('better-sqlite3');
    } catch (err) {
      log('❌ پکیج better-sqlite3 نصب نیست.', 'red');
      log('');
      log('💡 نصب کن:', 'yellow');
      log('   cd bot && npm install', 'cyan');
      process.exit(1);
    }
  }

  // ساخت پوشه data
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    log(`📁 پوشه data ساخته شد`, 'cyan');
  }
}

// ============================================================
//  پشتیبان‌گیری
// ============================================================

function createBackup() {
  if (!fs.existsSync(DB_PATH)) {
    log('ℹ️  دیتابیسی برای پشتیبان وجود نداره.', 'yellow');
    return null;
  }

  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, '-')
    .replace('T', '_')
    .split('.')[0];

  const backupPath = path.join(BACKUP_DIR, `anonbox-${timestamp}.db`);

  try {
    fs.copyFileSync(DB_PATH, backupPath);
    log(`💾 پشتیبان ساخته شد:`, 'green');
    log(`   ${backupPath}`, 'cyan');
    return backupPath;
  } catch (error) {
    log(`❌ خطا در پشتیبان‌گیری: ${error.message}`, 'red');
    return null;
  }
}

// ============================================================
//  حذف دیتابیس
// ============================================================

function deleteDatabase() {
  const filesToDelete = [
    DB_PATH,
    `${DB_PATH}-wal`,
    `${DB_PATH}-shm`,
    `${DB_PATH}-journal`,
  ];

  filesToDelete.forEach((file) => {
    if (fs.existsSync(file)) {
      try {
        fs.unlinkSync(file);
        log(`🗑  حذف شد: ${path.basename(file)}`, 'yellow');
      } catch (error) {
        log(`⚠️  خطا در حذف ${file}: ${error.message}`, 'red');
      }
    }
  });
}

// ============================================================
//  ساخت دیتابیس
// ============================================================

function buildDatabase() {
  const Database = require('better-sqlite3');

  let db;
  try {
    db = new Database(DB_PATH);
    log(`💾 دیتابیس باز شد:`, 'cyan');
    log(`   ${DB_PATH}`, 'dim');

    // تنظیمات بهینه
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    db.pragma('synchronous = NORMAL');
    db.pragma('temp_store = MEMORY');
    db.pragma('cache_size = -20000');
    db.pragma('busy_timeout = 5000');

    // اجرای schema.sql
    log('');
    log('⚙️  اجرای schema.sql...', 'cyan');

    const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
    db.exec(schema);

    // مهاجرت‌های v3 (اضافه کردن ستون‌های جدید)
    runMigrations(db);

    // ==========================================================
    //  نمایش نتیجه
    // ==========================================================

    const tables = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
      )
      .all();

    log('');
    log('📊 جدول‌های ساخته‌شده:', 'bright');
    console.log('');

    tables.forEach((t, i) => {
      const count = db
        .prepare(`SELECT COUNT(*) as c FROM ${t.name}`)
        .get().c;
      const num = String(i + 1).padStart(2, ' ');
      const name = t.name.padEnd(25, ' ');
      log(`   ${num}. ${name} (${count} رکورد)`, 'green');
    });

    // ایندکس‌ها
    const indexes = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%'"
      )
      .all();

    log('');
    log(`🔍 ایندکس‌ها: ${indexes.length}`, 'cyan');

    // حجم
    const stats = fs.statSync(DB_PATH);
    const sizeKb = (stats.size / 1024).toFixed(2);
    log(`📦 حجم دیتابیس: ${sizeKb} KB`, 'cyan');

    // Foreign keys check
    const fkErrors = db.prepare('PRAGMA foreign_key_check').all();
    if (fkErrors.length === 0) {
      log(`🔗 Foreign keys: OK`, 'green');
    } else {
      log(`⚠️  Foreign keys: ${fkErrors.length} خطا`, 'yellow');
    }

    // Integrity check
    const integrity = db.prepare('PRAGMA integrity_check').get();
    if (integrity && integrity.integrity_check === 'ok') {
      log(`✅ Integrity: OK`, 'green');
    }

    db.close();
    return true;
  } catch (error) {
    log(`❌ خطا در ساخت دیتابیس:`, 'red');
    log(`   ${error.message}`, 'red');
    if (db) {
      try {
        db.close();
      } catch (e) {
        // ignore
      }
    }
    return false;
  }
}

// ============================================================
//  مهاجرت‌های v3
// ============================================================

function runMigrations(db) {
  log('');
  log('🔧 بررسی مهاجرت‌های v3...', 'cyan');

  let migrated = 0;

  // ---- جدول users ----
  const userColumns = db
    .prepare('PRAGMA table_info(users)')
    .all()
    .map((c) => c.name);

  const userMigrations = [
    {
      name: 'language',
      sql: "ALTER TABLE users ADD COLUMN language TEXT DEFAULT 'fa'",
    },
    {
      name: 'last_seen',
      sql: 'ALTER TABLE users ADD COLUMN last_seen INTEGER',
    },
    {
      name: 'visit_count',
      sql: 'ALTER TABLE users ADD COLUMN visit_count INTEGER DEFAULT 0',
    },
    {
      name: 'package_type',
      sql: 'ALTER TABLE users ADD COLUMN package_type TEXT',
    },
    {
      name: 'reply_package_expires_at',
      sql: 'ALTER TABLE users ADD COLUMN reply_package_expires_at INTEGER',
    },
    {
      name: 'daily_free_used',
      sql: 'ALTER TABLE users ADD COLUMN daily_free_used INTEGER DEFAULT 0',
    },
    {
      name: 'daily_free_reset_at',
      sql: 'ALTER TABLE users ADD COLUMN daily_free_reset_at INTEGER',
    },
  ];

  userMigrations.forEach((m) => {
    if (!userColumns.includes(m.name)) {
      try {
        db.exec(m.sql);
        log(`   ✅ users.${m.name} اضافه شد`, 'green');
        migrated++;
      } catch (e) {
        log(`   ⚠️  خطا در users.${m.name}: ${e.message}`, 'yellow');
      }
    }
  });

  // ---- جدول messages ----
  const messageColumns = db
    .prepare('PRAGMA table_info(messages)')
    .all()
    .map((c) => c.name);

  const messageMigrations = [
    {
      name: 'alias_id',
      sql: 'ALTER TABLE messages ADD COLUMN alias_id INTEGER',
    },
    {
      name: 'is_reply',
      sql: 'ALTER TABLE messages ADD COLUMN is_reply INTEGER DEFAULT 0',
    },
    {
      name: 'original_message_id',
      sql: 'ALTER TABLE messages ADD COLUMN original_message_id INTEGER',
    },
    {
      name: 'file_url',
      sql: 'ALTER TABLE messages ADD COLUMN file_url TEXT',
    },
  ];

  messageMigrations.forEach((m) => {
    if (!messageColumns.includes(m.name)) {
      try {
        db.exec(m.sql);
        log(`   ✅ messages.${m.name} اضافه شد`, 'green');
        migrated++;
      } catch (e) {
        log(`   ⚠️  خطا در messages.${m.name}: ${e.message}`, 'yellow');
      }
    }
  });

  if (migrated === 0) {
    log('   ℹ️  نیازی به مهاجرت نیست', 'dim');
  } else {
    log(`   ✅ ${migrated} مهاجرت انجام شد`, 'green');
  }
}

// ============================================================
//  نمایش وضعیت
// ============================================================

function showStatus() {
  header('وضعیت دیتابیس');

  if (!fs.existsSync(DB_PATH)) {
    log('❌ دیتابیس وجود نداره.', 'red');
    log('');
    log('💡 برای ساخت:', 'yellow');
    log('   node scripts/migrate.js', 'cyan');
    return;
  }

  const stats = fs.statSync(DB_PATH);
  const sizeKb = (stats.size / 1024).toFixed(2);
  const modDate = new Date(stats.mtime).toLocaleString('fa-IR');

  log('📁 مسیر:', 'bright');
  log(`   ${DB_PATH}`, 'cyan');
  log('');
  log('📦 حجم:', 'bright');
  log(`   ${sizeKb} KB`, 'cyan');
  log('');
  log('🕐 آخرین تغییر:', 'bright');
  log(`   ${modDate}`, 'cyan');
  log('');

  try {
    const Database = require('better-sqlite3');
    const db = new Database(DB_PATH, { readonly: true });

    const tables = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
      )
      .all();

    log('📊 جدول‌ها:', 'bright');
    console.log('');

    tables.forEach((t) => {
      const count = db.prepare(`SELECT COUNT(*) as c FROM ${t.name}`).get().c;
      log(`   • ${t.name.padEnd(28)} ${count} رکورد`, 'green');
    });

    // اطلاعات v3
    log('');
    log('💡 اطلاعات v3:', 'bright');

    try {
      const vipCount = db
        .prepare(
          "SELECT COUNT(*) as c FROM users WHERE is_vip = 1 AND vip_expires_at > strftime('%s', 'now')"
        )
        .get().c;
      log(`   💎 VIP فعال: ${vipCount}`, 'cyan');

      const replyCount = db
        .prepare(
          "SELECT COUNT(*) as c FROM users WHERE reply_package_expires_at > strftime('%s', 'now')"
        )
        .get().c;
      log(`   💬 بسته پاسخ فعال: ${replyCount}`, 'cyan');

      const aliasCount = db
        .prepare('SELECT COUNT(*) as c FROM sender_aliases')
        .get().c;
      log(`   🎭 شناسه‌های ناشناس: ${aliasCount}`, 'cyan');

      const visitsCount = db
        .prepare('SELECT COUNT(*) as c FROM visits')
        .get().c;
      log(`   👁  بازدیدها: ${visitsCount}`, 'cyan');

      const onlineCount = db
        .prepare(
          "SELECT COUNT(*) as c FROM users WHERE last_seen > strftime('%s', 'now', '-5 minutes')"
        )
        .get().c;
      log(`   🟢 آنلاین الان: ${onlineCount}`, 'cyan');

      const revenueRow = db
        .prepare(
          "SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'completed'"
        )
        .get();
      log(`   💰 درآمد: ${revenueRow.total} Stars`, 'yellow');
    } catch (e) {
      // ignore
    }

    // Foreign key check
    const fkErrors = db.prepare('PRAGMA foreign_key_check').all();
    log('');
    if (fkErrors.length === 0) {
      log(`🔗 Foreign keys: OK`, 'green');
    } else {
      log(`⚠️  Foreign keys: ${fkErrors.length} خطا`, 'yellow');
    }

    db.close();
  } catch (error) {
    log(`⚠️  خطا: ${error.message}`, 'yellow');
  }

  // پشتیبان‌ها
  if (fs.existsSync(BACKUP_DIR)) {
    const backups = fs
      .readdirSync(BACKUP_DIR)
      .filter((f) => f.endsWith('.db'))
      .sort()
      .reverse();

    if (backups.length > 0) {
      log('');
      log(`💾 پشتیبان‌ها: ${backups.length}`, 'bright');
      backups.slice(0, 5).forEach((b) => {
        const bPath = path.join(BACKUP_DIR, b);
        const bSize = (fs.statSync(bPath).size / 1024).toFixed(2);
        log(`   • ${b} (${bSize} KB)`, 'cyan');
      });
      if (backups.length > 5) {
        log(`   ... و ${backups.length - 5} پشتیبان دیگر`, 'dim');
      }
    }
  }
}

// ============================================================
//  تایید از کاربر
// ============================================================

function confirmReset() {
  return new Promise((resolve) => {
    log('⚠️  حالت reset فعاله — دیتابیس فعلی پاک می‌شه!', 'yellow');
    log('');
    log('برای ادامه، ۵ ثانیه صبر می‌کنم... (Ctrl+C برای لغو)', 'yellow');

    const start = Date.now();
    const wait = () => {
      const elapsed = Math.floor((Date.now() - start) / 1000);
      if (elapsed < 5) {
        process.stdout.write(`\r⏳ ${5 - elapsed} ثانیه...   `);
        setTimeout(wait, 1000);
      } else {
        process.stdout.write('\r                      \n');
        resolve(true);
      }
    };
    wait();
  });
}

// ============================================================
//  Main
// ============================================================

function main() {
  const args = process.argv.slice(2);
  const flags = {
    reset: args.includes('--reset') || args.includes('-r'),
    backup: args.includes('--backup') || args.includes('-b'),
    status: args.includes('--status') || args.includes('-s'),
    help: args.includes('--help') || args.includes('-h'),
    force: args.includes('--force') || args.includes('-f'),
  };

  // راهنما
  if (flags.help) {
    header('راهنما');
    log('استفاده:', 'bright');
    log('  node scripts/migrate.js [options]', 'cyan');
    log('');
    log('گزینه‌ها:', 'bright');
    log('  --reset, -r      پاک کردن و ساخت مجدد', 'cyan');
    log('  --backup, -b     پشتیبان‌گیری قبل از عملیات', 'cyan');
    log('  --status, -s     نمایش وضعیت دیتابیس', 'cyan');
    log('  --force, -f      بدون تاییدیه (خطرناک)', 'cyan');
    log('  --help, -h       نمایش این راهنما', 'cyan');
    log('');
    log('مثال‌ها:', 'bright');
    log('  node scripts/migrate.js', 'cyan');
    log('  node scripts/migrate.js --reset --backup', 'cyan');
    log('  node scripts/migrate.js --status', 'cyan');
    return;
  }

  // نمایش وضعیت
  if (flags.status) {
    showStatus();
    return;
  }

  // بررسی پیش‌نیازها
  checkPrerequisites();

  header('راه‌اندازی دیتابیس v3.0');

  // ---- Reset ----
  if (flags.reset) {
    const doReset = () => {
      log('');

      // پشتیبان
      if (flags.backup || fs.existsSync(DB_PATH)) {
        createBackup();
      }

      log('');
      log('🗑  حذف دیتابیس قدیمی...', 'cyan');
      deleteDatabase();

      log('');
      log('📦 ساخت دیتابیس جدید...', 'cyan');
      const success = buildDatabase();

      line();
      if (success) {
        log('✅ دیتابیس با موفقیت بازسازی شد!', 'green');
        log('');
        log('💡 گام بعدی:', 'yellow');
        log('   npm start', 'cyan');
        log('');
      } else {
        log('❌ خطا در بازسازی دیتابیس.', 'red');
        process.exit(1);
      }
    };

    if (flags.force) {
      doReset();
    } else {
      confirmReset().then(doReset);
    }
    return;
  }

  // ---- معمولی ----
  log('📦 ساخت دیتابیس...', 'cyan');
  const success = buildDatabase();

  line();
  if (success) {
    log('✅ دیتابیس با موفقیت ساخته شد!', 'green');
    log('');
    log('💡 گام بعدی:', 'yellow');
    log('   cd bot && npm start', 'cyan');
    log('');
  } else {
    log('❌ خطا در ساخت دیتابیس.', 'red');
    process.exit(1);
  }
}

// ============================================================
//  اجرا
// ============================================================

try {
  main();
} catch (error) {
  log('');
  log(`💥 خطای غیرمنتظره: ${error.message}`, 'red');
  console.error(error.stack);
  process.exit(1);
}