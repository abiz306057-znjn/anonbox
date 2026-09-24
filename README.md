<div align="center">

# 🎭 AnonBox — The Secret Box

**Anonymous Telegram messaging bot with a modern WebApp, multilingual support, and Telegram Stars integration**

[![Version](https://img.shields.io/badge/version-3.0.0-blue.svg)](https://github.com/abiz306057-znjn/anonbox)
[![License](https://img.shields.io/badge/license-All%20Rights%20Reserved-red.svg)](#-license)
[![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org/)
[![Telegram](https://img.shields.io/badge/Telegram-Bot-blue.svg)](https://t.me/AnonBoxBot)
[![SQLite](https://img.shields.io/badge/SQLite-3-orange.svg)](https://sqlite.org/)

[Introduction](#-introduction) •
[Features](#-features) •
[Usage](#-usage) •
[Structure](#-project-structure) •
[Docs](#-documentation) •
[Purchase](#-purchase)

</div>

---

## 🎯 Introduction

**AnonBox (The Secret Box)** is a complete platform for receiving and sending anonymous messages on Telegram. With the **Telegram WebApp**, it provides a modern, fast, and delightful user experience and supports in-app payments via **Telegram Stars**.

### ✨ Version 3 Features

| Feature | Description |
|-------|-------|
| 🎭 **Full Anonymity** | Sender identity is never revealed |
| 🎯 **Anonymous ID** | "🦊 Anonymous #1" for each sender |
| 🌐 **Trilingual** | Persian, English, Arabic with automatic RTL/LTR |
| 📱 **SPA** | Single HTML file with fast router |
| 💰 **4 Packages** | Weekly, Monthly, Yearly, Reply |
| 🆓 **Daily Free** | 10 free messages per day |
| 🎁 **Repeatable Invites** | Rewards are given every time |
| 🎵 **Music + Effects** | Complete audio experience |
| 🎨 **Two Themes** | Light and Dark |
| 📊 **Admin Dashboard** | Live stats + advertising reports |

### 🆚 Why AnonBox?

- 🚀 **Fast:** No reload, no white flash
- 🎨 **Beautiful:** Modern design with purple/pink gradient
- 📱 **PWA:** Installable on mobile
- 🔒 **Secure:** HMAC-SHA256 + HTML Escape
- 🌍 **Multilingual:** Full RTL support
- 💎 **Monetizable:** With Telegram Stars

---

## 📸 Project Preview

┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ Home Page │ │ Message Box │ │ Buy Package │
│ │ │ │ │ │
│ 🎭 📬 🎁 │ │ 🦊 Anon #1 │ │ 📅 40 ⭐️ │
│ 💎 ⚙️ ❓ │ │ 🐼 Anon #2 │ │ 📆 120 ⭐️ │
│ │ │ │ │ 🗓 1000 ⭐️ │
└─────────────────┘ └─────────────────┘ └─────────────────┘


---

## 📖 Usage

### Bot Commands

| Command | Description |
|-------|-------|
| `/start` | Start + get your exclusive link |
| `/inbox` | Message inbox |
| `/settings` | Settings |
| `/language` | Change language (fa/en/ar) |
| `/help` | Help |
| `/admin` | Admin panel (admin only) |

### How It Works

1. **Get your link** — Use `/start` to receive your exclusive link
2. **Share it** — Put the link in your bio or story
3. **Receive messages** — Friends send you anonymous messages
4. **Unlock** — With a package or daily free quota
5. **Reply** — With a reply package
6. **Invite** — Get rewards

### 💰 Packages

| Package | Price | Duration |
|------|:---:|:---:|
| 📅 Weekly | 40 ⭐️ | 7 days |
| 📆 Monthly | 120 ⭐️ | 30 days |
| 🗓 Yearly | 1000 ⭐️ | 365 days |
| 💬 Anonymous Reply | 400 ⭐️ | 30 days |

### 🎁 Invite Rewards (Repeatable)

| Event | Reward |
|-------|:---:|
| Every 1 invite | +24 hours |
| Every 3 invites | +1 week |
| Every 10 invites | +1 month |
| Every 10 invites | + 1-month reply package |

**Example:** 10 invites = 10 days + 1 week + 1 month + reply package

---

## 🗂 Project Structure

anonbox-v3/
│
├── bot/ 🔧 Bot Backend
│ ├── src/
│ │ ├── index.js ← Entry point
│ │ ├── config.js ← Configuration
│ │ ├── server.js ← HTTP Server
│ │ ├── middlewares.js ← Middlewares
│ │ ├── actions.js ← Keyboard + callbacks
│ │ ├── utils.js ← Utilities
│ │ ├── i18n.js ← Bot translations
│ │ ├── handlers/ ← 5 files
│ │ ├── routes/ ← 6 files
│ │ ├── db/ ← 8 files
│ │ └── services/ ← 8 files
│ ├── data/ ← Database
│ └── package.json
│
├── webapp/ 🎨 Frontend SPA
│ ├── index.html ← Single HTML
│ ├── manifest.json ← PWA
│ ├── css/ ← 6 files
│ ├── js/ ← 5 files
│ └── assets/
│ ├── images/
│ └── sounds/
│
├── shared/ 🔗 Shared
│ ├── constants.js
│ └── locales.js
│
├── scripts/
│ └── migrate.js ← Database builder
│
├── docs/
│ ├── README.md
│ └── API.md
│
├── .gitignore
├── package.json
└── README.md


---

## 🛠 Technologies

### Backend
| Technology | Purpose |
|--------|--------|
| **Node.js 18+** | Runtime |
| **Grammy** | Bot framework |
| **Express** | HTTP server |
| **better-sqlite3** | Database |
| **dotenv** | Env management |

### Frontend
| Technology | Purpose |
|--------|--------|
| **HTML5** | Structure |
| **CSS3** | Styling (no framework) |
| **Vanilla JS** | SPA logic |
| **Telegram WebApp SDK** | Integration |
| **i18n** | Multilingual |

---

## 📊 Project Stats

| Section | File Count |
|------|:---:|
| Backend (`bot/`) | 35 |
| Frontend CSS | 6 |
| Frontend JS | 5 |
| HTML | 1 |
| Manifest | 1 |
| Shared (`shared/`) | 2 |
| Scripts | 1 |
| Docs | 2 |
| Routes + bot routes | 6 |
| **📦 Total** | **~59** |

---

## 📚 Documentation

- 📡 [**API.md**](docs/API.md) — All endpoints
- 📖 [**docs/README.md**](docs/README.md) — Full documentation

---

## 💼 Purchase

This project is available for sale. For more information, pricing, live demo, and negotiation:

📧 **Email:** [ab.iz306057@gmail.com](mailto:ab.iz306057@gmail.com)

Please use the subject **"AnonBox Project Purchase"** in your email for a faster response.

---

## 📜 License

**All Rights Reserved** © 2026 abiz306057-znjn

This project and its source code are the exclusive property of the author. No part of this project may be copied, modified, distributed, or used in any form without explicit written permission from the author.

---

## 💖 Support

If this project helped you:

- ⭐ **Star** it
- 💡 **Share** ideas
- 📢 **Tell** your friends

---

## 🙏 Credits

- [Grammy](https://grammy.dev) — Bot framework
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) — Database
- [Express](https://expressjs.com) — Server
- [Vazirmatn](https://github.com/rastikerdar/vazirmatn) — Persian font
- [Telegram](https://telegram.org) — Platform

---

<div align="center">

**Made with ❤️ for the Persian-speaking Telegram community**

🎭 **The Secret Box — Anonymous messages, without borders**

[⬆ Back to top](#-anonbox--the-secret-box)

</div>

