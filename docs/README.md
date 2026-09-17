# 🎭 AnonBox v3 — مستندات پروژه

مستندات کامل پروژه AnonBox نسخه ۳.۰

---

## 📖 فهرست

- [معرفی](#-معرفی)
- [معماری](#-معماری)
- [نصب](#-نصب)
- [ساختار پروژه](#-ساختار-پروژه)
- [بک‌اند](#-بک‌اند)
- [فرانت‌اند](#-فرانت‌اند)
- [دیتابیس](#-دیتابیس)
- [API](#-api)
- [جریان کاربر](#-جریان-کاربر)
- [دیباگ](#-دیباگ)

---

## 🎯 معرفی

**AnonBox** یه ربات تلگرام پیام ناشناس با WebApp مدرنه.

### ✨ ویژگی‌های اصلی v3

| ویژگی | توضیح |
|-------|-------|
| 🎭 **ناشناسی کامل** | هویت فرستنده هیچ‌وقت فاش نمی‌شه |
| 🎯 **شناسه ناشناس** | «🦊 ناشناس #۱» برای هر فرستنده |
| 🌐 **چندزبانه** | فارسی، انگلیسی، عربی |
| 📱 **SPA** | تک‌فایل HTML با Router |
| 💰 **۴ بسته** | هفتگی، ماهانه، سالانه، پاسخ |
| 🆓 **رایگان روزانه** | ۱۰ پیام رایگان |
| 🎁 **دعوت تکرارپذیر** | پاداش هر بار تکرار می‌شه |
| 🎵 **موسیقی + افکت** | تجربه صوتی |
| 🎨 **دو تم** | روشن/تاریک |
| 📊 **داشبورد ادمین** | آمار زنده |

### 🎯 هدف پروژه

- **سادگی:** کاربر بدون آموزش بفهمه
- **سرعت:** لود سریع، بدون reload
- **امنیت:** HMAC-SHA256 برای WebApp
- **قابل نگهداری:** کد تمیز و مستند

---

## 🏗 معماری

```
┌──────────────────────────────────────────────┐
│              Telegram                        │
│   ┌────────────┐      ┌──────────────┐      │
│   │  Bot       │      │  WebApp      │      │
│   │  Commands  │      │  (SPA)       │      │
│   └─────┬──────┘      └──────┬───────┘      │
└─────────┼──────────────────────┼─────────────┘
          │                      │
          ▼                      ▼
┌──────────────────────────────────────────────┐
│         Node.js Backend                      │
│   ┌──────────────┐   ┌───────────────┐      │
│   │  Grammy      │   │  Express      │      │
│   │  (handlers)  │   │  (routes)     │      │
│   └──────┬───────┘   └───────┬───────┘      │
│          └───────┬───────────┘               │
│                  ▼                            │
│          ┌───────────────┐                    │
│          │  Services     │                    │
│          └───────┬───────┘                    │
│                  ▼                            │
│          ┌───────────────┐                    │
│          │  SQLite DB    │                    │
│          └───────────────┘                    │
└──────────────────────────────────────────────┘
```

### 🔧 تکنولوژی‌ها

| بخش | تکنولوژی |
|-----|----------|
| **بک‌اند** | Node.js + Grammy + Express |
| **دیتابیس** | SQLite با WAL |
| **فرانت** | Vanilla JS + CSS |
| **PWA** | manifest.json |
| **پرداخت** | Telegram Stars |

---

## 🚀 نصب

### پیش‌نیازها

- Node.js >= 18
- npm >= 9
- اکانت تلگرام

### گام ۱: کلون

```bash
git clone <repo-url>
cd anonbox-v3
```

### گام ۲: نصب بک‌اند

```bash
cd bot
npm install
```

### گام ۳: ساخت ربات

1. برو [@BotFather](https://t.me/BotFather)
2. `/newbot`
3. توکن رو ذخیره کن

### گام ۴: تنظیم `.env`

```bash
cp .env.example .env
```

ویرایش کن:
```env
BOT_TOKEN=your_token_here
BOT_USERNAME=YourBotUsername
ADMIN_ID=your_telegram_id
```

### گام ۵: ساخت دیتابیس

```bash
cd ..
node scripts/migrate.js
```

### گام ۶: اجرا

```bash
cd bot
npm start
```

**دسترسی:**
- WebApp: `http://localhost:3000/webapp/index.html`

---

## 📁 ساختار پروژه

```
anonbox-v3/
│
├── bot/                          🔧 بک‌اند
│   ├── src/
│   │   ├── index.js              ← راه‌انداز ربات
│   │   ├── config.js             ← تنظیمات
│   │   ├── server.js             ← سرور HTTP
│   │   ├── middlewares.js        ← میان‌افزارها
│   │   ├── actions.js            ← کیبورد + callback
│   │   ├── utils.js              ← ابزارها
│   │   ├── i18n.js               ← ترجمه ربات
│   │   ├── handlers/             ← ۵ هندلر
│   │   ├── routes/               ← ۶ API route
│   │   ├── db/                   ← ۸ فایل دیتابیس
│   │   └── services/             ← ۸ سرویس
│   ├── data/                     ← دیتابیس
│   ├── .env
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   └── README.md
│
├── webapp/                       🎨 فرانت SPA
│   ├── index.html                ← تنها HTML
│   ├── manifest.json             ← PWA
│   ├── css/
│   │   ├── variables.css
│   │   ├── base.css
│   │   ├── components.css
│   │   ├── layout.css
│   │   ├── pages.css
│   │   └── responsive.css
│   ├── js/
│   │   ├── core.js               ← telegram+api+ui+theme+audio
│   │   ├── i18n.js               ← ترجمه فرانت
│   │   ├── router.js             ← مسیریاب
│   │   ├── pages.js              ← ۸ صفحه
│   │   └── app.js                ← راه‌انداز
│   └── assets/
│       ├── images/               ← لوگو
│       └── sounds/               ← صداها
│
├── shared/                       🔗 مشترک
│   ├── constants.js              ← ثابت‌ها
│   └── locales.js                ← ترجمه‌ها
│
├── scripts/
│   └── migrate.js                ← ساخت دیتابیس
│
├── docs/
│   ├── README.md                 ← این فایل
│   └── API.md                    ← مستندات API
│
├── .gitignore
├── package.json
└── README.md
```

---

## 🔧 بک‌اند

### 📌 `bot/src/index.js`

راه‌انداز ربات:
- اتصال به Grammy
- Session middleware
- ترتیب: `banCheck → auth → rateLimit`
- راه‌اندازی سرور HTTP موازی
- Shutdown نرم

### 📌 `bot/src/server.js`

سرور Express:
- CORS
- Body parsers
- Static files (`webapp/`, `assets/`)
- همه routes با `/api` mount
- مدیریت خطا

### 📌 `middlewares.js`

| میان‌افزار | کار |
|-----------|-----|
| `verifyTelegram` | احراز هویت HMAC |
| `adminOnly` | فقط ادمین |
| `auth` | کاربر ربات |
| `banCheck` | چک بن |
| `rateLimit` | ضد اسپم |

### 📌 `actions.js`

همه کیبوردها + callback:
- `mainMenuKeyboard`
- `inboxKeyboard`
- `upgradeKeyboard`
- `languageKeyboard`
- `adminKeyboard`

### 📌 `handlers/`

| فایل | کار |
|------|-----|
| `index.js` | ایندکس |
| `user.js` | start, settings, language, help |
| `message.js` | send, inbox, reply |
| `payment.js` | pre_checkout, successful |
| `admin.js` | دستورات ادمین |

### 📌 `routes/`

| فایل | مسیر |
|------|------|
| `index.js` | ایندکس |
| `user.js` | `/me`, `/profile`, `/slug` |
| `message.js` | `/messages` |
| `payment.js` | `/payments`, `/packages` |
| `referral.js` | `/referrals` |
| `admin.js` | `/admin`, `/stats` |

### 📌 `db/`

| فایل | جدول |
|------|------|
| `index.js` | اتصال + مهاجرت |
| `schema.sql` | ساختار ۱۱ جدول |
| `users.js` | کاربران |
| `messages.js` | پیام‌ها + بلاک + گزارش |
| `payments.js` | پرداخت‌ها |
| `aliases.js` | شناسه‌ها |
| `visits.js` | بازدیدها |
| `packages.js` | فعال‌سازی‌ها + پاداش‌ها |

### 📌 `services/`

| فایل | منطق |
|------|------|
| `user.js` | کاربر (بسته، رایگان) |
| `message.js` | پیام (دسترسی، بلاک) |
| `payment.js` | پرداخت |
| `package.js` | بسته‌ها |
| `alias.js` | شناسه ناشناس |
| `referral.js` | دعوت (تکرارپذیر) |
| `reply.js` | پاسخ ناشناس |
| `stats.js` | آمار |

---

## 🎨 فرانت‌اند

### 📌 `index.html`

تنها فایل HTML:
- هدر (لوگو + LA + تم)
- `<main id="app-content">` (Router)
- منوی پایین ثابت (۵ آیتم)
- Toast + Loader + Modal

### 📌 `js/core.js`

| ماژول | کار |
|-------|-----|
| **TelegramApp** | SDK تلگرام |
| **API** | همه درخواست‌ها |
| **UI** | Toast, Modal, Loader |
| **Theme** | روشن/تاریک |
| **Audio** | موسیقی + افکت |

### 📌 `js/router.js`

- Hash-based: `#/home`, `#/inbox?filter=unread`
- History stack
- Auto-interception لینک‌ها
- 8 route

### 📌 `js/pages.js`

| صفحه | فایل‌ها |
|------|--------|
| `home` | لینک + آمار |
| `inbox` | لیست + فیلتر + مودال |
| `referral` | لینک دعوت + پاداش |
| `upgrade` | ۴ پلن + FAQ |
| `settings` | پروفایل + زبان + تم |
| `profile` | پروفایل عمومی |
| `help` | راهنما |
| `admin` | داشبورد |

### 📌 `js/app.js`

- راه‌اندازی i18n، API
- Load user data
- Auto-refresh (۹۰ ثانیه)
- مدیریت رویدادها

---

## 💾 دیتابیس

### ۱۱ جدول

| جدول | کار |
|------|-----|
| `users` | کاربران |
| `sender_aliases` | شناسه‌های ناشناس |
| `messages` | پیام‌ها |
| `payments` | پرداخت‌ها |
| `reports` | گزارش‌ها |
| `blocks` | بلاک‌ها |
| `visits` | بازدیدها |
| `package_activations` | لاگ فعال‌سازی |
| `referral_rewards` | لاگ پاداش |
| `daily_free_log` | لاگ رایگان |
| `admins` | ادمین‌ها |

### ستون‌های کلیدی `users`

| ستون | توضیح |
|------|-------|
| `language` | زبان (fa/en/ar) |
| `is_vip` | VIP فعال |
| `vip_expires_at` | انقضای VIP |
| `reply_package_expires_at` | انقضای بسته پاسخ |
| `daily_free_used` | مصرف رایگان |
| `last_seen` | آخرین بازدید |
| `visit_count` | تعداد بازدید |

### دستورات دیتابیس

```bash
# ساخت
node scripts/migrate.js

# وضعیت
node scripts/migrate.js --status

# ریست
node scripts/migrate.js --reset --backup

# پشتیبان
node scripts/migrate.js --backup
```

---

## 📡 API

مستندات کامل: [API.md](./API.md)

### نمونه

```http
GET /api/me
X-Telegram-Init-Data: query_id=...&user=...&hash=...
```

```json
{
  "telegram_id": 123456789,
  "first_name": "علی",
  "is_vip": true,
  "package": {
    "id": "monthly",
    "days_left": 15
  },
  "daily_free": {
    "limit": 10,
    "used": 3,
    "remaining": 7
  }
}
```

---

## 🔄 جریان کاربر

### ۱. کاربر جدید

```
لینک ربات
    ↓
/start → auth middleware
    ↓
کاربر جدید؟
    ↓
ساخت اسلاگ + زبان
    ↓
بررسی payload (ref_, slug)
    ↓
نمایش خوش‌آمد + لینک
```

### ۲. ارسال پیام ناشناس

```
کلیک روی لینک دوست
    ↓
/start با payload slug
    ↓
نوشتن پیام
    ↓
send handler:
  - چک بلاک
  - چک محدودیت
  - getOrCreateAlias
    ↓
ذخیره با alias_id
    ↓
اطلاع به گیرنده
```

### ۳. دریافت پیام

```
/inbox
    ↓
نمایش آمار + لینک WebApp
    ↓
SPA Router → inbox
    ↓
API: GET /messages
    ↓
سرور چک می‌کنه:
  - بسته فعال؟
  - یا رایگان روزانه؟
    ↓
نمایش لیست
```

### ۴. خرید بسته

```
صفحه upgrade
    ↓
انتخاب پلن
    ↓
مودال تایید
    ↓
POST /payments/package
    ↓
sendInvoice (XTR)
    ↓
پرداخت
    ↓
successful_payment
    ↓
activatePackage
```

### ۵. دعوت دوستان

```
صفحه referral
    ↓
کپی لینک: ref_slug
    ↓
دوست کلیک می‌کنه
    ↓
/start با ref_
    ↓
registerReferral
    ↓
applyReferralRewards:
  - هر ۱: +۲۴ ساعت
  - هر ۳: +۱ هفته
  - هر ۱۰: +۱ ماه + بسته پاسخ
```

---

## 🐛 دیباگ

### ربات بالا نمیاد

```bash
# چک .env
cat bot/.env

# چک توکن
curl "https://api.telegram.org/bot${BOT_TOKEN}/getMe"

# چک پورت
lsof -i :3000
```

### دیتابیس خطا

```bash
node scripts/migrate.js --status
node scripts/migrate.js --reset --backup
```

### فرانت کار نمی‌کنه

1. `F12` → Console
2. چک خطاها
3. چک Network
4. `Ctrl+Shift+R` (hard refresh)

### لاگ‌ها

```bash
# لاگ ربات
tail -f bot/data/anonbox.db-wal

# سیستم
journalctl -u anonbox -f
```

---

## 📊 معیارها

| متریک | هدف v3 |
|-------|:---:|
| کاربر فعال | ۱٬۰۰۰ |
| VIP | ۱۵٪ |
| رضایت | ۴/۵ |
| زمان لود | < 2s |

---

## 🗺 نسخه بعدی

- [ ] اعلان push
- [ ] آواتار سفارشی
- [ ] گیمیفیکیشن
- [ ] اپ مستقل

---

## 📝 لایسنس

MIT © AnonBox

---

**آخرین بروزرسانی:** ۱۴۰۳/۰۷/۱۵