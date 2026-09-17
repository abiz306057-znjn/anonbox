<div align="center">

# 🎭 AnonBox — صندوق راز

**ربات پیام ناشناس تلگرام با WebApp مدرن، چندزبانه و پشتیبانی از Telegram Stars**

[![Version](https://img.shields.io/badge/version-3.0.0-blue.svg)](https://github.com/yourusername/anonbox/releases)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org/)
[![Telegram](https://img.shields.io/badge/Telegram-Bot-blue.svg)](https://t.me/AnonBoxBot)
[![SQLite](https://img.shields.io/badge/SQLite-3-orange.svg)](https://sqlite.org/)

[معرفی](#-معرفی) •
[امکانات](#-امکانات) •
[نصب](#-نصب-و-راه‌اندازی) •
[استفاده](#-استفاده) •
[ساختار](#-ساختار-پروژه) •
[مستندات](#-مستندات)

</div>

---

## 🎯 معرفی

**AnonBox (صندوق راز)** یه بستر کامل برای دریافت و ارسال پیام‌های ناشناس در تلگرامه. با **Telegram WebApp** یه تجربه کاربری مدرن، سریع و دلنشین فراهم می‌کنه و از **Telegram Stars** برای پرداخت‌های درون‌برنامه‌ای پشتیبانی می‌کنه.

### ✨ ویژگی‌های نسخه ۳

| ویژگی | توضیح |
|-------|-------|
| 🎭 **ناشناسی کامل** | هویت فرستنده هیچ‌وقت فاش نمی‌شه |
| 🎯 **شناسه ناشناس** | «🦊 ناشناس #۱» برای هر فرستنده |
| 🌐 **سه‌زبانه** | فارسی، انگلیسی، عربی با RTL/LTR خودکار |
| 📱 **SPA** | تک‌فایل HTML با Router سریع |
| 💰 **۴ بسته** | هفتگی، ماهانه، سالانه، پاسخ |
| 🆓 **رایگان روزانه** | ۱۰ پیام رایگان هر روز |
| 🎁 **دعوت تکرارپذیر** | پاداش هر بار تکرار می‌شه |
| 🎵 **موسیقی + افکت** | تجربه صوتی کامل |
| 🎨 **دو تم** | روشن و تاریک |
| 📊 **داشبورد ادمین** | آمار زنده + گزارش تبلیغاتی |

### 🆚 چرا AnonBox؟

- 🚀 **سریع:** بدون reload، بدون فلش سفید
- 🎨 **زیبا:** طراحی مدرن با گرادیانت بنفش/صورتی
- 📱 **PWA:** قابل نصب روی موبایل
- 🔒 **امن:** HMAC-SHA256 + Escape HTML
- 🌍 **فارسی‌زبان:** RTL کامل
- 💎 **درآمدزا:** با Telegram Stars

---

## 📸 نمای پروژه

```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   صفحه اصلی    │  │   صندوق پیام    │  │   خرید بسته     │
│                 │  │                 │  │                 │
│   🎭 📬 🎁      │  │   🦊 ناشناس #۱  │  │   📅 ۴۰ ⭐️      │
│   💎 ⚙️ ❓      │  │   🐼 ناشناس #۲  │  │   📆 ۱۲۰ ⭐️     │
│                 │  │                 │  │   🗓 ۱۰۰۰ ⭐️    │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

---

## 🚀 نصب و راه‌اندازی

### پیش‌نیازها

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- یه اکانت تلگرام

### گام ۱: کلون

```bash
git clone https://github.com/yourusername/anonbox.git
cd anonbox
```

### گام ۲: نصب پکیج‌ها

```bash
npm run install:bot
```

یا:

```bash
cd bot
npm install
```

### گام ۳: ساخت ربات

1. برو به [@BotFather](https://t.me/BotFather)
2. دستور `/newbot` رو بزن
3. اسم و یوزرنیم انتخاب کن
4. **توکن** رو کپی کن

### گام ۴: تنظیم محیط

```bash
cp bot/.env.example bot/.env
```

فایل `bot/.env` رو باز کن و مقادیر رو پر کن:

```env
BOT_TOKEN=توکن_رباتت
BOT_USERNAME=یوزرنیم_رباتت
ADMIN_ID=آیدی_عددی_خودت
```

> 💡 آیدی عددی خودت رو از [@userinfobot](https://t.me/userinfobot) بگیر

### گام ۵: ساخت دیتابیس

```bash
npm run migrate
```

### گام ۶: اجرا

**Development (auto-reload):**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

**راه‌اندازی کامل با یه دستور:**
```bash
npm run setup && npm start
```

### دسترسی

- **WebApp:** `http://localhost:3000/webapp/index.html`
- **Health:** `http://localhost:3000/health`

---

## 📖 استفاده

### دستورات ربات

| دستور | توضیح |
|-------|-------|
| `/start` | شروع + لینک اختصاصی |
| `/inbox` | صندوق پیام |
| `/settings` | تنظیمات |
| `/language` | تغییر زبان (fa/en/ar) |
| `/help` | راهنما |
| `/admin` | پنل مدیریت (فقط ادمین) |

### چطور کار می‌کنه؟

1. **لینک بگیر** — با `/start` لینک اختصاصی دریافت کن
2. **اشتراک بذار** — لینک رو تو بیو یا استوری بذار
3. **پیام بگیر** — دوستات ناشناس پیام می‌فرستن
4. **باز کن** — با بسته یا رایگان روزانه
5. **پاسخ بده** — با بسته پاسخ
6. **دعوت کن** — پاداش بگیر

### 💰 بسته‌ها

| بسته | قیمت | مدت |
|------|:---:|:---:|
| 📅 هفتگی | ۴۰ ⭐️ | ۷ روز |
| 📆 ماهانه | ۱۲۰ ⭐️ | ۳۰ روز |
| 🗓 سالانه | ۱۰۰۰ ⭐️ | ۳۶۵ روز |
| 💬 پاسخ ناشناس | ۴۰۰ ⭐️ | ۳۰ روز |

### 🎁 پاداش دعوت (تکرارپذیر)

| رخداد | پاداش |
|-------|:---:|
| هر ۱ دعوت | +۲۴ ساعت |
| هر ۳ دعوت | +۱ هفته |
| هر ۱۰ دعوت | +۱ ماه |
| هر ۱۰ دعوت | + بسته پاسخ ۱ ماهه |

**مثال:** ۱۰ دعوت = ۱۰ روز + ۱ هفته + ۱ ماه + بسته پاسخ

---

## 🗂 ساختار پروژه

```
anonbox-v3/
│
├── bot/                          🔧 بک‌اند ربات
│   ├── src/
│   │   ├── index.js              ← راه‌انداز
│   │   ├── config.js             ← تنظیمات
│   │   ├── server.js             ← سرور HTTP
│   │   ├── middlewares.js        ← میان‌افزارها
│   │   ├── actions.js            ← کیبورد + callback
│   │   ├── utils.js              ← ابزارها
│   │   ├── i18n.js               ← ترجمه ربات
│   │   ├── handlers/             ← ۵ فایل
│   │   ├── routes/               ← ۶ فایل
│   │   ├── db/                   ← ۸ فایل
│   │   └── services/             ← ۸ فایل
│   ├── data/                     ← دیتابیس
│   └── package.json
│
├── webapp/                       🎨 فرانت SPA
│   ├── index.html                ← تنها HTML
│   ├── manifest.json             ← PWA
│   ├── css/                      ← ۶ فایل
│   ├── js/                       ← ۵ فایل
│   └── assets/
│       ├── images/
│       └── sounds/
│
├── shared/                       🔗 مشترک
│   ├── constants.js
│   └── locales.js
│
├── scripts/
│   └── migrate.js                ← ساخت دیتابیس
│
├── docs/
│   ├── README.md
│   └── API.md
│
├── .gitignore
├── package.json
└── README.md
```

---

## 🛠 تکنولوژی‌ها

### بک‌اند
| فناوری | کاربرد |
|--------|--------|
| **Node.js 18+** | محیط اجرا |
| **Grammy** | فریمورک ربات |
| **Express** | سرور HTTP |
| **better-sqlite3** | دیتابیس |
| **dotenv** | مدیریت env |

### فرانت‌اند
| فناوری | کاربرد |
|--------|--------|
| **HTML5** | ساختار |
| **CSS3** | استایل (بدون فریمورک) |
| **Vanilla JS** | منطق SPA |
| **Telegram WebApp SDK** | اتصال |
| **i18n** | چندزبانه |

---

## 📊 آمار پروژه

| بخش | تعداد فایل |
|------|:---:|
| بک‌اند (`bot/`) | ۳۵ |
| فرانت CSS | ۶ |
| فرانت JS | ۵ |
| HTML | ۱ |
| Manifest | ۱ |
| مشترک (`shared/`) | ۲ |
| اسکریپت | ۱ |
| مستندات | ۲ |
| روت + روت bot | ۶ |
| **📦 مجموع** | **~۵۹** |

---

## 🧪 تست

```bash
# وضعیت دیتابیس
npm run migrate:status

# ریست کامل
npm run migrate:reset

# پشتیبان‌گیری
npm run backup

# راه‌اندازی از صفر
npm run fresh
```

---

## 🚀 انتشار

### Railway

```bash
npm i -g @railway/cli
railway login
railway up
```

### VPS با systemd

```bash
sudo nano /etc/systemd/system/anonbox.service
```

```ini
[Unit]
Description=AnonBox Bot v3
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/anonbox
ExecStart=/usr/bin/node bot/src/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable anonbox
sudo systemctl start anonbox
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN cd bot && npm install --production
EXPOSE 3000
CMD ["node", "bot/src/index.js"]
```

```bash
docker build -t anonbox .
docker run -d -p 3000:3000 --name anonbox anonbox
```

---

## 📚 مستندات

- 📡 [**API.md**](docs/API.md) — همه endpointها
- 📖 [**docs/README.md**](docs/README.md) — مستندات کامل

---

## 🐛 عیب‌یابی

### ربات بالا نمیاد

- ✅ توکن درست رو چک کن
- ✅ `ADMIN_ID` عددی باشه
- ✅ فایل `.env` تو `bot/` باشه
- ✅ پورت ۳۰۰۰ آزاد باشه

### خطای دیتابیس

```bash
npm run migrate:reset
```

### خطای نصب

```bash
npm run clean
npm run install:bot
```

---

## 🤝 مشارکت

1. **Fork** کن
2. **Branch** بساز (`git checkout -b feature/amazing`)
3. **Commit** کن (`git commit -m 'Add amazing'`)
4. **Push** کن (`git push origin feature/amazing`)
5. **Pull Request** باز کن

---

## 📜 لایسنس

MIT © 2024 AnonBox

---

## 💖 حمایت

اگه این پروژه بهت کمک کرد:

- ⭐ **Star** بده
- 🐛 **Bug** گزارش بده
- 💡 **ایده** بده
- 📢 **معرفی** کن به دوستات

---

## 🙏 تشکر

- [Grammy](https://grammy.dev) — فریمورک ربات
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) — دیتابیس
- [Express](https://expressjs.com) — سرور
- [Vazirmatn](https://github.com/rastikerdar/vazirmatn) — فونت فارسی
- [Telegram](https://telegram.org) — پلتفرم

---

<div align="center">

**ساخته شده با ❤️ برای جامعه فارسی‌زبان تلگرام**

🎭 **صندوق راز — پیام‌های ناشناس، بدون مرز**

[⬆ برگشت به بالا](#-anonbox--صندوق-راز)

</div>