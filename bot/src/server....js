/**
 * server.js
 * سرور HTTP Express برای WebApp
 * نسخه ۳.۰ — با احراز هویت Telegram، CORS و مسیرهای API
 *
 * ⚠️ فایل‌های وابسته:
 *   - ./config
 *   - ./routes (ایندکس + همه routeها)
 *   - ./middlewares (verifyTelegram, adminOnly)
 */

const express = require('express');
const path = require('path');
const config = require('./config');

// ===== Routes =====
const routes = require('./routes');

// ===== Middlewares =====
const middlewares = require('./middlewares');

// ============================================================
//  ساخت اپ Express
// ============================================================

const app = express();

// ============================================================
//  تنظیمات پایه
// ============================================================

app.disable('x-powered-by');
app.set('trust proxy', 1);

// ============================================================
//  بدنه‌های درخواست
// ============================================================

app.use(
  express.json({
    limit: '2mb',
    verify: (req, res, buf) => {
      // ذخیره بدنه خام (برای بررسی امضا در صورت نیاز)
      req.rawBody = buf.toString('utf8');
    },
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: '2mb',
  })
);

// ============================================================
//  CORS
// ============================================================

app.use((req, res, next) => {
  const origin = req.headers.origin || '*';

  res.header('Access-Control-Allow-Origin', origin);
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Telegram-Init-Data, X-User-Id'
  );
  res.header('Access-Control-Allow-Credentials', 'true');

  // preflight
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
});

// ============================================================
//  لاگ درخواست‌ها (فقط در dev)
// ============================================================

if (config.env.isDev) {
  app.use((req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;
      const emoji = res.statusCode < 400 ? '✅' : '❌';
      const method = req.method.padEnd(6);
      const status = String(res.statusCode).padEnd(3);

      console.log(
        `${emoji} ${method} ${status} ${req.originalUrl} (${duration}ms)`
      );
    });

    next();
  });
}

// ============================================================
//  مسیر سلامت
// ============================================================

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    version: config.app.version,
    timestamp: Math.floor(Date.now() / 1000),
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    version: config.app.version,
    timestamp: Math.floor(Date.now() / 1000),
  });
});

// ============================================================
//  فایل‌های استاتیک WebApp
// ============================================================

const WEBAPP_DIR = path.join(__dirname, '..', '..', 'webapp');
const ASSETS_DIR = path.join(WEBAPP_DIR, 'assets');

// WebApp — cache طولانی در production
app.use(
  '/webapp',
  express.static(WEBAPP_DIR, {
    maxAge: config.env.isProd ? '7d' : '0',
    etag: true,
    index: 'index.html',
  })
);

// Assets — cache خیلی طولانی
app.use(
  '/assets',
  express.static(ASSETS_DIR, {
    maxAge: config.env.isProd ? '30d' : '0',
  })
);

// ============================================================
//  API Routes
// ============================================================

// محافظت‌شده (نیاز به احراز هویت)
app.use('/api/me', middlewares.verifyTelegram, routes.user);
app.use('/api/users', middlewares.verifyTelegram, routes.user);
app.use('/api/slug', middlewares.verifyTelegram, routes.user);

app.use('/api/messages', middlewares.verifyTelegram, routes.message);
app.use('/api/payments', middlewares.verifyTelegram, routes.payment);
app.use('/api/referrals', middlewares.verifyTelegram, routes.referral);

// ادمین (نیاز به احراز هویت + ادمین بودن)
app.use(
  '/api/admin',
  middlewares.verifyTelegram,
  middlewares.adminOnly,
  routes.admin
);

// عمومی (بدون احراز هویت)
app.use('/api/profile', routes.user);
app.use('/api/packages', routes.payment);

// ============================================================
//  ۴۰۴ برای API
// ============================================================

app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'NOT_FOUND',
    message: 'مسیر مورد نظر پیدا نشد.',
    path: req.originalUrl,
  });
});

// ============================================================
//  ریدایرکت روت به WebApp
// ============================================================

app.get('/', (req, res) => {
  res.redirect('/webapp/index.html');
});

// ============================================================
//  مدیریت خطا
// ============================================================

app.use((err, req, res, next) => {
  console.error('❌ خطای سرور:', err);

  // حجم زیاد
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      error: 'PAYLOAD_TOO_LARGE',
      message: 'حجم درخواست بیش از حد مجاز است.',
    });
  }

  // پارس ناموفق
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: 'BAD_REQUEST',
      message: 'فرمت درخواست نامعتبر است.',
    });
  }

  // خطای شناخته‌شده
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      error: err.code || 'ERROR',
      message: err.message || 'خطای سرور',
    });
  }

  // خطای ناشناخته
  res.status(500).json({
    error: 'INTERNAL_ERROR',
    message: config.env.isDev ? err.message : 'خطای داخلی سرور.',
  });
});

// ============================================================
//  راه‌اندازی سرور
// ============================================================

let server = null;

function startServer() {
  return new Promise((resolve, reject) => {
    try {
      server = app.listen(
        config.server.port,
        config.server.host,
        () => {
          console.log('');
          console.log('╔══════════════════════════════════════════════╗');
          console.log('║      🌐 AnonBox HTTP Server v3.0             ║');
          console.log('╚══════════════════════════════════════════════╝');
          console.log(`🚀 آدرس:      http://${config.server.host}:${config.server.port}`);
          console.log(`🌐 WebApp:    ${config.server.webappUrl}/webapp/index.html`);
          console.log(`📁 استاتیک:   ${WEBAPP_DIR}`);
          console.log('');
          resolve(server);
        }
      );

      server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          console.error('');
          console.error(`❌ پورت ${config.server.port} در حال استفاده است.`);
          console.error('💡 پورت دیگه‌ای تو .env تنظیم کن یا پروسه قبلی رو ببند.');
          console.error('');
        } else {
          console.error('❌ خطا در راه‌اندازی سرور:', err);
        }
        reject(err);
      });
    } catch (error) {
      reject(error);
    }
  });
}

// ============================================================
//  توقف سرور
// ============================================================

function stopServer() {
  return new Promise((resolve) => {
    if (!server) return resolve();

    server.close(() => {
      server = null;
      resolve();
    });
  });
}

// ============================================================
//  خروجی
// ============================================================

module.exports = {
  app,
  startServer,
  stopServer,
};