-- ============================================================
--  AnonBox v3.0 — Database Schema
--  ساختار کامل دیتابیس با ۱۱ جدول
-- ============================================================

-- ============================================================
--  جدول ۱: users — کاربران
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  telegram_id INTEGER UNIQUE NOT NULL,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  language_code TEXT DEFAULT 'fa',
  language TEXT DEFAULT 'fa' NOT NULL,

  -- لینک اختصاصی
  link_slug TEXT UNIQUE NOT NULL,

  -- پروفایل
  bio TEXT DEFAULT '',
  avatar_file_id TEXT,

  -- وضعیت
  is_banned INTEGER DEFAULT 0,
  ban_reason TEXT,
  is_vip INTEGER DEFAULT 0,
  vip_expires_at INTEGER,
  package_type TEXT,
  reply_package_expires_at INTEGER,

  -- سیستم رایگان روزانه
  daily_free_used INTEGER DEFAULT 0,
  daily_free_reset_at INTEGER,

  -- آمار
  total_received INTEGER DEFAULT 0,
  total_sent INTEGER DEFAULT 0,
  total_revealed INTEGER DEFAULT 0,
  stars_balance INTEGER DEFAULT 0,
  stars_spent INTEGER DEFAULT 0,

  -- دعوت
  referred_by INTEGER,
  referral_count INTEGER DEFAULT 0,

  -- آمار بازدید
  visit_count INTEGER DEFAULT 0,
  last_seen INTEGER,

  -- زمان‌ها
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  last_active_at INTEGER DEFAULT (strftime('%s', 'now')),

  FOREIGN KEY (referred_by) REFERENCES users(telegram_id)
);

CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_users_link_slug ON users(link_slug);
CREATE INDEX IF NOT EXISTS idx_users_referred_by ON users(referred_by);
CREATE INDEX IF NOT EXISTS idx_users_language ON users(language);
CREATE INDEX IF NOT EXISTS idx_users_last_seen ON users(last_seen);
CREATE INDEX IF NOT EXISTS idx_users_vip ON users(is_vip, vip_expires_at);
CREATE INDEX IF NOT EXISTS idx_users_reply_pkg ON users(reply_package_expires_at);
CREATE INDEX IF NOT EXISTS idx_users_banned ON users(is_banned);

-- ============================================================
--  جدول ۲: sender_aliases — شناسه‌های ناشناس
-- ============================================================

CREATE TABLE IF NOT EXISTS sender_aliases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sender_id INTEGER NOT NULL,
  receiver_id INTEGER NOT NULL,
  emoji TEXT NOT NULL,
  alias_number INTEGER NOT NULL,
  alias_label TEXT NOT NULL,
  message_count INTEGER DEFAULT 0,
  last_message_at INTEGER,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),

  UNIQUE(sender_id, receiver_id),
  FOREIGN KEY (sender_id) REFERENCES users(telegram_id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(telegram_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_aliases_sender ON sender_aliases(sender_id);
CREATE INDEX IF NOT EXISTS idx_aliases_receiver ON sender_aliases(receiver_id);
CREATE INDEX IF NOT EXISTS idx_aliases_unique ON sender_aliases(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_aliases_receiver_count ON sender_aliases(receiver_id, message_count DESC);

-- ============================================================
--  جدول ۳: messages — پیام‌های ناشناس
-- ============================================================

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  receiver_id INTEGER NOT NULL,
  sender_id INTEGER,
  sender_telegram_id INTEGER,
  alias_id INTEGER,

  -- محتوا
  content_type TEXT DEFAULT 'text',
  content TEXT,
  file_id TEXT,
  file_url TEXT,
  caption TEXT,

  -- پاسخ ناشناس
  is_reply INTEGER DEFAULT 0,
  original_message_id INTEGER,

  -- وضعیت
  is_read INTEGER DEFAULT 0,
  is_revealed INTEGER DEFAULT 0,
  is_deleted INTEGER DEFAULT 0,
  is_reported INTEGER DEFAULT 0,

  -- زمان‌ها
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  read_at INTEGER,

  FOREIGN KEY (receiver_id) REFERENCES users(telegram_id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(telegram_id) ON DELETE SET NULL,
  FOREIGN KEY (alias_id) REFERENCES sender_aliases(id) ON DELETE SET NULL,
  FOREIGN KEY (original_message_id) REFERENCES messages(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_alias ON messages(alias_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_created ON messages(receiver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(receiver_id, is_read);
CREATE INDEX IF NOT EXISTS idx_messages_reported ON messages(is_reported);
CREATE INDEX IF NOT EXISTS idx_messages_reply ON messages(original_message_id);

-- ============================================================
--  جدول ۴: payments — تراکنش‌ها
-- ============================================================

CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  telegram_payment_id TEXT UNIQUE,

  -- نوع: package_weekly, package_monthly, package_yearly, package_reply
  type TEXT NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'XTR',

  -- وضعیت
  status TEXT DEFAULT 'pending',
  payload TEXT,
  message_id INTEGER,

  -- زمان‌ها
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  completed_at INTEGER,

  FOREIGN KEY (user_id) REFERENCES users(telegram_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_tg_id ON payments(telegram_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_type ON payments(type);
CREATE INDEX IF NOT EXISTS idx_payments_completed ON payments(completed_at DESC);

-- ============================================================
--  جدول ۵: reports — گزارش‌های تخلف
-- ============================================================

CREATE TABLE IF NOT EXISTS reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reporter_id INTEGER NOT NULL,
  message_id INTEGER NOT NULL,
  reason TEXT,
  is_reviewed INTEGER DEFAULT 0,
  reviewed_by INTEGER,
  reviewed_at INTEGER,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),

  FOREIGN KEY (reporter_id) REFERENCES users(telegram_id) ON DELETE CASCADE,
  FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_reports_message ON reports(message_id);
CREATE INDEX IF NOT EXISTS idx_reports_reviewed ON reports(is_reviewed);
CREATE INDEX IF NOT EXISTS idx_reports_created ON reports(created_at DESC);

-- ============================================================
--  جدول ۶: blocks — بلاک‌ها
-- ============================================================

CREATE TABLE IF NOT EXISTS blocks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  blocker_id INTEGER NOT NULL,
  blocked_id INTEGER NOT NULL,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),

  UNIQUE(blocker_id, blocked_id),
  FOREIGN KEY (blocker_id) REFERENCES users(telegram_id) ON DELETE CASCADE,
  FOREIGN KEY (blocked_id) REFERENCES users(telegram_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_blocks_blocker ON blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocked ON blocks(blocked_id);

-- ============================================================
--  جدول ۷: visits — بازدیدهای WebApp
-- ============================================================

CREATE TABLE IF NOT EXISTS visits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  ip_hash TEXT,
  user_agent TEXT,
  page TEXT,
  platform TEXT,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),

  FOREIGN KEY (user_id) REFERENCES users(telegram_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_visits_user ON visits(user_id);
CREATE INDEX IF NOT EXISTS idx_visits_created ON visits(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_visits_date ON visits(date(created_at, 'unixepoch'));
CREATE INDEX IF NOT EXISTS idx_visits_page ON visits(page);

-- ============================================================
--  جدول ۸: package_activations — لاگ فعال‌سازی بسته‌ها
-- ============================================================

CREATE TABLE IF NOT EXISTS package_activations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  package_type TEXT NOT NULL,
  source TEXT NOT NULL,

  -- مدت
  duration_days INTEGER NOT NULL,
  started_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,

  -- ارجاع
  payment_id INTEGER,
  referral_count_at_activation INTEGER,

  created_at INTEGER DEFAULT (strftime('%s', 'now')),

  FOREIGN KEY (user_id) REFERENCES users(telegram_id) ON DELETE CASCADE,
  FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_pkg_act_user ON package_activations(user_id);
CREATE INDEX IF NOT EXISTS idx_pkg_act_type ON package_activations(package_type);
CREATE INDEX IF NOT EXISTS idx_pkg_act_source ON package_activations(source);
CREATE INDEX IF NOT EXISTS idx_pkg_act_expires ON package_activations(expires_at);
CREATE INDEX IF NOT EXISTS idx_pkg_act_created ON package_activations(created_at DESC);

-- ============================================================
--  جدول ۹: referral_rewards — لاگ پاداش‌های دعوت
-- ============================================================

CREATE TABLE IF NOT EXISTS referral_rewards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  reward_type TEXT NOT NULL,
  reward_value INTEGER NOT NULL,
  awarded_at INTEGER NOT NULL,
  threshold_reached INTEGER NOT NULL,
  is_consumed INTEGER DEFAULT 0,
  consumed_at INTEGER,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),

  FOREIGN KEY (user_id) REFERENCES users(telegram_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_rewards_user ON referral_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_rewards_type ON referral_rewards(reward_type);
CREATE INDEX IF NOT EXISTS idx_rewards_created ON referral_rewards(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rewards_consumed ON referral_rewards(is_consumed);

-- ============================================================
--  جدول ۱۰: daily_free_log — لاگ رایگان روزانه
-- ============================================================

CREATE TABLE IF NOT EXISTS daily_free_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  message_id INTEGER NOT NULL,
  used_at INTEGER DEFAULT (strftime('%s', 'now')),
  day_date TEXT,

  FOREIGN KEY (user_id) REFERENCES users(telegram_id) ON DELETE CASCADE,
  FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_free_log_user ON daily_free_log(user_id);
CREATE INDEX IF NOT EXISTS idx_free_log_date ON daily_free_log(day_date);
CREATE INDEX IF NOT EXISTS idx_free_log_user_date ON daily_free_log(user_id, day_date);

-- ============================================================
--  جدول ۱۱: admins — ادمین‌های اضافی
-- ============================================================

CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  telegram_id INTEGER UNIQUE NOT NULL,
  role TEXT DEFAULT 'moderator',
  added_by INTEGER,
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_admins_tg_id ON admins(telegram_id);
CREATE INDEX IF NOT EXISTS idx_admins_role ON admins(role);