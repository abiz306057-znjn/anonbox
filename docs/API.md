# 📡 مستندات API

API کامل برای ارتباط WebApp با بک‌اند.

---

## 📖 فهرست

- [مبانی](#-مبانی)
- [احراز هویت](#-احراز-هویت)
- [کاربران](#-کاربران)
- [پیام‌ها](#-پیام‌ها)
- [بسته‌ها](#-بسته‌ها)
- [پرداخت](#-پرداخت)
- [دعوت](#-دعوت)
- [Aliases](#-aliases)
- [آمار ادمین](#-آمار-ادمین)
- [کدهای خطا](#-کدهای-خطا)

---

## 🌐 مبانی

**Base URL:**
```
Production:  https://yourdomain.com/api
Development: http://localhost:3000/api
```

**Content-Type:** `application/json`

**Auth Header:** `X-Telegram-Init-Data`

---

## 🔐 احراز هویت

### هدرها

```http
Content-Type: application/json
X-Telegram-Init-Data: query_id=...&user=...&auth_date=...&hash=...
X-User-Id: 123456789
```

### Verify در سرور

```javascript
const secretKey = crypto
  .createHmac('sha256', 'WebAppData')
  .update(BOT_TOKEN)
  .digest();

const expectedHash = crypto
  .createHmac('sha256', secretKey)
  .update(dataCheckString)
  .digest('hex');

if (expectedHash !== hash) throw new Error('INVALID_HASH');
```

### خطای احراز هویت

```json
{
  "error": "UNAUTHORIZED",
  "message": "احراز هویت نامعتبر است."
}
```

---

## 📋 کدهای HTTP

| کد | توضیح |
|----|-------|
| 200 | موفق |
| 201 | ساخته شد |
| 204 | بدون محتوا |
| 400 | درخواست نامعتبر |
| 401 | احراز هویت ناموفق |
| 403 | دسترسی ندارید |
| 404 | پیدا نشد |
| 409 | تناقض |
| 413 | حجم زیاد |
| 429 | محدودیت نرخ |
| 500 | خطای سرور |

---

## 👤 کاربران

### `GET /api/me`

اطلاعات کامل کاربر.

**پاسخ:**
```json
{
  "telegram_id": 123456789,
  "username": "ali_teh",
  "first_name": "علی",
  "last_name": null,
  "bio": "عاشق موسیقی",
  "link_slug": "ali_2024",
  "language": "fa",

  "is_banned": false,
  "is_vip": true,
  "vip_expires_at": 1735689600,
  "package_type": "monthly",

  "package": {
    "id": "monthly",
    "name": "ماهانه",
    "expires_at": 1735689600,
    "days_left": 15
  },

  "has_reply_package": true,
  "reply_package_expires_at": 1735689600,
  "reply_days_left": 30,

  "total_received": 45,
  "total_sent": 120,
  "total_revealed": 20,
  "referral_count": 8,
  "stars_spent": 450,
  "visit_count": 45,

  "unread_count": 3,
  "blocked_count": 2,

  "daily_free": {
    "limit": 10,
    "used": 3,
    "remaining": 7
  },

  "created_at": 1700000000,
  "last_active_at": 1700100000
}
```

---

### `GET /api/me/stats`

آمار جداگانه.

**پاسخ:**
```json
{
  "total_received": 45,
  "total_sent": 120,
  "unread": 3,
  "revealed": 20,
  "referrals": 8,
  "stars_spent": 450,
  "visit_count": 45,
  "package": {
    "id": "monthly",
    "name": "ماهانه",
    "days_left": 15
  },
  "daily_free": {
    "limit": 10,
    "used": 3,
    "remaining": 7
  },
  "joined_days_ago": 30,
  "is_online": true
}
```

---

### `GET /api/me/vip`

وضعیت بسته.

**پاسخ:**
```json
{
  "has_package": true,
  "is_active": true,
  "package_id": "monthly",
  "package_name": "ماهانه",
  "expires_at": 1735689600,
  "days_remaining": 15,
  "has_reply_package": true,
  "reply_expires_at": 1735689600,
  "reply_days_remaining": 30
}
```

---

### `GET /api/me/blocks`

لیست بلاک‌شده‌ها.

**پاسخ:**
```json
{
  "blocks": [
    {
      "telegram_id": 987654321,
      "first_name": "محمد",
      "username": "mohammad",
      "blocked_at": 1700000000
    }
  ]
}
```

---

### `GET /api/me/aliases`

لیست aliasها (گیرنده).

**پاسخ:**
```json
{
  "aliases": [
    {
      "id": 1,
      "label": "🦊 ناشناس #۱",
      "emoji": "🦊",
      "number": 1,
      "message_count": 5,
      "last_message_at": 1700000000,
      "created_at": 1699000000
    }
  ],
  "total": 3
}
```

---

### `GET /api/me/aliases/:id`

جزئیات یه alias.

---

### `PATCH /api/me`

آپدیت پروفایل.

**بدنه:**
```json
{
  "first_name": "علی رضایی",
  "bio": "توضیح جدید",
  "link_slug": "ali_new",
  "language": "en"
}
```

**پاسخ:**
```json
{
  "success": true,
  "user": { ... }
}
```

---

### `PATCH /api/me/bio`

**بدنه:**
```json
{ "bio": "توضیح جدید" }
```

---

### `PATCH /api/me/name`

**بدنه:**
```json
{ "first_name": "علی رضایی" }
```

---

### `PATCH /api/me/slug`

**بدنه:**
```json
{ "slug": "ali_new" }
```

**خطای 409:**
```json
{
  "error": "SLUG_TAKEN",
  "message": "این اسلاگ قبلاً گرفته شده."
}
```

---

### `PATCH /api/me/language`

**بدنه:**
```json
{ "language": "en" }
```

**پاسخ:**
```json
{
  "success": true,
  "language": "en",
  "language_name": "English"
}
```

---

### `DELETE /api/me`

حذف حساب.

**پاسخ:**
```json
{
  "success": true,
  "message": "حساب حذف شد."
}
```

---

### `DELETE /api/me/blocks/:telegramId`

آنبلاک.

---

### `GET /api/slug/check?slug=ali_2024`

چک اسلاگ.

**پاسخ:**
```json
{
  "available": true,
  "slug": "ali_2024"
}
```

---

### `GET /api/profile/:slug`

پروفایل عمومی.

**پاسخ:**
```json
{
  "telegram_id": 123456789,
  "first_name": "علی",
  "username": "ali_teh",
  "bio": "عاشق موسیقی",
  "link_slug": "ali_2024",
  "total_received": 45,
  "is_vip": true,
  "member_since": 1700000000
}
```

---

### `GET /api/users/:id`

اطلاعات کاربر (ادمین یا خود).

---

## 📬 پیام‌ها

### `GET /api/messages`

**پارامترها:**
- `filter`: `all` | `unread` | `revealed`
- `limit`: ۲۰ (پیش‌فرض)
- `offset`: ۰

**پاسخ:**
```json
{
  "messages": [
    {
      "id": 1,
      "content_type": "text",
      "content": "سلام! خوبی؟",
      "preview": "سلام! خوبی؟",
      "caption": null,
      "file_url": null,
      "is_read": false,
      "is_revealed": false,
      "is_reported": false,
      "is_reply": false,
      "requires_payment": false,
      "can_view": true,
      "alias": {
        "id": 1,
        "label": "🦊 ناشناس #۱",
        "emoji": "🦊",
        "number": 1
      },
      "created_at": 1700000000
    }
  ],
  "total": 45,
  "has_more": true,
  "has_unlimited": false,
  "daily_free": {
    "limit": 10,
    "used": 3,
    "remaining": 7
  }
}
```

---

### `GET /api/messages/stats`

**پاسخ:**
```json
{
  "total": 45,
  "unread": 3,
  "revealed": 20,
  "package": { ... },
  "has_reply_package": true,
  "daily_free": { ... }
}
```

---

### `GET /api/messages/:id`

**پاسخ:**
```json
{
  "id": 1,
  "content_type": "text",
  "content": "سلام!",
  "is_read": true,
  "is_revealed": true,
  "is_reported": false,
  "is_reply": false,
  "requires_payment": false,
  "can_view": true,
  "can_reply": true,
  "has_sender": true,
  "alias": { ... },
  "created_at": 1700000000,
  "read_at": 1700000100
}
```

---

### `POST /api/messages/:id/read`

مصرف رایگان + علامت.

**پاسخ:**
```json
{
  "success": true,
  "can_view": true,
  "reason": "FREE_QUOTA",
  "content": "متن",
  "caption": null,
  "file_url": null
}
```

**خطا:**
```json
{
  "error": "FREE_LIMIT_REACHED",
  "message": "به سقف رایگان امروز رسیدید."
}
```

---

### `POST /api/messages/read-all`

علامت‌گذاری همه.

---

### `POST /api/messages/:id/report`

**بدنه:**
```json
{ "reason": "اسپم" }
```

---

### `POST /api/messages/:id/block`

بلاک فرستنده.

---

### `POST /api/messages/:id/reply`

پاسخ ناشناس.

**بدنه:**
```json
{ "content": "سلام! ممنون" }
```

**خطا (بدون بسته):**
```json
{
  "error": "NO_REPLY_PACKAGE",
  "message": "بسته پاسخ لازم است."
}
```

---

### `DELETE /api/messages/:id`

حذف پیام.

---

## 📦 بسته‌ها

### `GET /api/packages?lang=fa`

**پاسخ:**
```json
{
  "packages": [
    {
      "id": "weekly",
      "name": "یک هفته‌ای",
      "price": 40,
      "days": 7,
      "icon": "📅",
      "features": [
        "باز کردن نامحدود پیام‌ها",
        "نشان VIP",
        "پشتیبانی اولویت‌دار"
      ]
    },
    {
      "id": "monthly",
      "price": 120,
      "days": 30,
      "popular": true
    },
    {
      "id": "yearly",
      "price": 1000,
      "days": 365,
      "bestValue": true
    },
    {
      "id": "reply",
      "price": 400,
      "days": 30,
      "isReply": true
    }
  ],
  "currency": "XTR",
  "language": "fa"
}
```

---

### `GET /api/packages/:id`

جزئیات یه بسته.

---

### `GET /api/packages/prices`

**پاسخ:**
```json
{
  "weekly": 40,
  "monthly": 120,
  "yearly": 1000,
  "reply": 400,
  "free_daily": 10,
  "currency": "XTR"
}
```

---

### `GET /api/packages/compare?lang=fa`

جدول مقایسه.

---

### `GET /api/packages/referral-info`

اطلاعات پاداش.

**پاسخ:**
```json
{
  "reward_per_invite": { "hours": 24 },
  "three_invites": { "reward": "weekly", "days": 7 },
  "ten_invites": { "reward": "monthly", "days": 30 },
  "ten_invites_reply": { "reward": "reply", "days": 30 }
}
```

---

### `GET /api/packages/user/current`

بسته فعلی کاربر.

---

### `GET /api/packages/check/:id`

چک دسترسی.

---

## 💳 پرداخت

### `GET /api/payments?limit=20`

تاریخچه.

**پاسخ:**
```json
{
  "payments": [
    {
      "id": 1,
      "type": "package_monthly",
      "amount": 120,
      "currency": "XTR",
      "status": "completed",
      "created_at": 1700000000,
      "completed_at": 1700000100
    }
  ]
}
```

---

### `GET /api/payments/summary`

خلاصه خریدها.

**پاسخ:**
```json
{
  "total_payments": 3,
  "total_spent": 520,
  "currency": "XTR",
  "by_type": {
    "package_monthly": { "count": 2, "total": 240 }
  },
  "last_payment_at": 1700000000
}
```

---

### `POST /api/payments/package`

درخواست خرید.

**بدنه:**
```json
{ "package_id": "monthly" }
```

**پاسخ:**
```json
{
  "success": true,
  "invoice": {
    "title": "ماهانه",
    "description": "30 روز",
    "payload": "package_monthly:123456789",
    "currency": "XTR",
    "prices": [
      { "label": "ماهانه", "amount": 120 }
    ]
  },
  "package": {
    "id": "monthly",
    "name": "ماهانه",
    "price": 120,
    "days": 30,
    "icon": "📆"
  }
}
```

---

## 🎁 دعوت

### `GET /api/referrals/stats`

**پاسخ:**
```json
{
  "total": 8,
  "active": 5,
  "rewards": 2,
  "reward_breakdown": {
    "hours24": 8,
    "weeks": 2,
    "months": 0,
    "reply_packages": 0,
    "total_days": 22
  },
  "next_rewards": {
    "to_next_week": 1,
    "to_next_month": 2,
    "to_next_reply": 2
  }
}
```

---

### `GET /api/referrals?limit=20`

لیست دعوت‌شده‌ها.

---

### `GET /api/referrals/rewards`

لیست پاداش‌ها.

---

### `GET /api/referrals/link`

لینک دعوت.

**پاسخ:**
```json
{
  "link": "https://t.me/AnonBoxBot?start=ref_ali_2024",
  "slug": "ali_2024",
  "bot_username": "AnonBoxBot"
}
```

---

### `GET /api/referrals/leaderboard?limit=10`

**پاسخ:**
```json
{
  "leaderboard": [
    {
      "rank": 1,
      "first_name": "سارا",
      "username": "sara_m",
      "referral_count": 45,
      "is_vip": true
    }
  ]
}
```

---

## 🎭 Aliases

### `GET /api/aliases`

لیست همه aliasها.

### `GET /api/aliases/:id`

جزئیات.

### `GET /api/aliases/:id/messages`

پیام‌های یه alias.

### `GET /api/aliases/stats/summary`

**پاسخ:**
```json
{
  "total_aliases": 5,
  "total_messages": 23,
  "most_active": { ... },
  "average_per_alias": 5
}
```

---

## 📊 آمار ادمین

### `GET /api/stats/overview`

**پاسخ:**
```json
{
  "totalUsers": 1234,
  "activePackages": 234,
  "bannedUsers": 12,
  "totalMessages": 8901,
  "todayMessages": 123,
  "totalPayments": 456,
  "totalRevenue": 12345,
  "pendingReports": 5,
  "totalVisits": 5678,
  "newUsersToday": 23,
  "online_now": 45
}
```

---

### `GET /api/stats/online`

**پاسخ:**
```json
{
  "online_count": 45,
  "threshold_minutes": 5,
  "timestamp": 1700000000
}
```

---

### `GET /api/stats/today`

**پاسخ:**
```json
{
  "newUsers": 23,
  "messages": 123,
  "visits": 456,
  "uniqueVisits": 234,
  "revenue": 480,
  "activations": 8,
  "replies": 34
}
```

---

### `GET /api/stats/week`

---

### `GET /api/stats/chart/visits?days=7`

**پاسخ:**
```json
{
  "days": 7,
  "data": [
    {
      "date": "2024-01-01",
      "label": "۱ ژانویه",
      "value": 123,
      "unique_users": 89
    }
  ]
}
```

---

### `GET /api/stats/chart/users?days=7`

---

### `GET /api/stats/chart/revenue?days=7`

---

### `GET /api/stats/chart/messages?days=7`

---

### `GET /api/stats/languages`

**پاسخ:**
```json
{
  "languages": [
    { "code": "fa", "name": "فارسی", "count": 890 },
    { "code": "en", "name": "English", "count": 234 }
  ]
}
```

---

### `GET /api/stats/packages`

---

### `GET /api/stats/revenue`

---

### `GET /api/stats/top-users?type=referrals&limit=10`

**انواع:** `referrals`, `messages`, `spent`, `visits`

---

### `GET /api/stats/advertising-report?days=30`

**پاسخ:**
```json
{
  "period_days": 30,
  "summary": {
    "total_visits": 12345,
    "unique_visits": 6789,
    "total_new_users": 456,
    "total_messages": 2340,
    "avg_daily_visits": 411,
    "avg_daily_users": 15,
    "growth_rate_percent": 25
  },
  "charts": {
    "visits": [...],
    "users": [...],
    "messages": [...]
  },
  "best_hours": [
    { "hour": 21, "label": "21:00", "count": 1234 }
  ],
  "platforms": [
    { "platform": "android", "count": 5678 }
  ],
  "pages": [
    { "page": "inbox", "count": 3456 }
  ]
}
```

---

## 🔧 ادمین

### `GET /api/admin/dashboard`

**پاسخ:**
```json
{
  "overview": { ... },
  "today": { ... },
  "server": {
    "uptime": 123456,
    "memory": { ... },
    "node_version": "v18.17.0"
  }
}
```

---

### `GET /api/admin/users`

**پارامترها:**
- `limit`: ۵۰
- `offset`: ۰
- `filter`: `all` | `vip` | `banned` | `active`

---

### `GET /api/admin/users/:id`

جزئیات کاربر.

---

### `POST /api/admin/users/:id/ban`

**بدنه:**
```json
{ "reason": "اسپم" }
```

---

### `POST /api/admin/users/:id/unban`

---

### `POST /api/admin/users/:id/gift-package`

**بدنه:**
```json
{ "package_id": "monthly" }
```

---

### `GET /api/admin/reports`

**پارامتر:** `status`: `pending` | `all`

---

### `POST /api/admin/reports/:id/resolve`

---

### `GET /api/admin/payments`

---

### `GET /api/admin/messages`

---

### `GET /api/admin/system`

**پاسخ:**
```json
{
  "system": {
    "node_version": "v18.17.0",
    "platform": "linux",
    "uptime": 123456,
    "memory": { "rss": 145, "heapUsed": 67 }
  },
  "database": {
    "size": 524288,
    "size_human": "512 KB"
  }
}
```

---

### `POST /api/admin/maintenance`

**بدنه:**
```json
{ "action": "cleanup" }
```

**Actions:** `cleanup`, `vacuum`, `analyze`, `backup`

---

## 🚨 کدهای خطا

| کد | توضیح |
|----|-------|
| `UNAUTHORIZED` | احراز هویت نامعتبر |
| `FORBIDDEN` | دسترسی ندارید |
| `NOT_FOUND` | پیدا نشد |
| `BAD_REQUEST` | درخواست نامعتبر |
| `RATE_LIMITED` | محدودیت نرخ |
| `BANNED` | حساب مسدود |
| `INVALID_INPUT` | ورودی نامعتبر |
| `BLOCKED` | کاربر بلاک شده |
| `DAILY_LIMIT` | سقف روزانه |
| `HOURLY_LIMIT` | سقف ساعتی |
| `RECEIVER_NOT_FOUND` | گیرنده پیدا نشد |
| `MESSAGE_NOT_FOUND` | پیام پیدا نشد |
| `SLUG_TAKEN` | اسلاگ گرفته شده |
| `INVALID_PACKAGE` | بسته نامعتبر |
| `INVALID_AMOUNT` | مبلغ نامعتبر |
| `NO_REPLY_PACKAGE` | بدون بسته پاسخ |
| `FREE_LIMIT_REACHED` | سقف رایگان |
| `NEED_PACKAGE` | نیاز به بسته |

---

## 📝 نمونه کد Frontend

```javascript
const response = await fetch('/api/messages?filter=unread', {
  headers: {
    'X-Telegram-Init-Data': window.Telegram.WebApp.initData,
    'X-User-Id': window.Telegram.WebApp.initDataUnsafe.user.id,
  },
});

const data = await response.json();
console.log(data.messages);
```

---

**آخرین بروزرسانی:** ۱۴۰۳/۰۷/۱۵
**نسخه API:** v3.0