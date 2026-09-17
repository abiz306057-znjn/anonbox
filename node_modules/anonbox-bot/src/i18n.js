/**
 * i18n.js
 * سیستم چندزبانه ربات
 * نسخه ۳.۰ — فارسی، انگلیسی، عربی
 *
 * شامل:
 *   - TRANSLATIONS: همه متن‌ها در ۳ زبان
 *   - getTranslator(lang): تابع ترجمه
 *   - detectLanguage(code): تشخیص زبان
 *   - getLanguageName(lang): اسم زبان
 *   - formatDate(timestamp, lang): فرمت تاریخ
 */

const config = require('./config');

// ============================================================
//  همه ترجمه‌ها
// ============================================================

const TRANSLATIONS = {
  // ==========================================================
  //  فارسی
  // ==========================================================
  fa: {
    // ---- عمومی ----
    'labels.user': 'کاربر',
    'labels.anonymous': 'ناشناس',
    'labels.empty': 'خالی',
    'labels.name': 'نام',
    'labels.bio': 'بیو',
    'labels.link': 'لینک',
    'labels.language': 'زبان',
    'labels.received': 'دریافتی',
    'labels.sent': 'ارسالی',
    'labels.referrals': 'دعوت‌شده',
    'labels.package': 'بسته',
    'labels.noPackage': 'بدون بسته',
    'labels.daysLeft': 'روز باقی‌مونده',

    // ---- خطاها ----
    'errors.general': 'خطایی رخ داد. لطفاً دوباره تلاش کن.',
    'errors.notRegistered': 'ابتدا /start بزن.',
    'errors.banned': 'حساب شما مسدود شده است.',
    'errors.invalidInput': 'ورودی نامعتبر.',
    'errors.tooLong': 'متن خیلی طولانیه.',
    'errors.notFound': 'پیدا نشد.',
    'errors.paymentFailed': 'خطا در پرداخت.',
    'errors.paymentInvalid': 'درخواست پرداخت نامعتبر.',
    'errors.bannedReason': 'نقض قوانین',
    'errors.bannedFull': '🚫 <b>شما بن شده‌اید.</b>\n\n📝 دلیل: {reason}\n\nاگه فکر می‌کنی اشتباهی رخ داده، با پشتیبانی تماس بگیر.',
    'errors.bannedShort': '🚫 بن شده‌اید',
    'errors.rateLimited': '⏱ <b>کمی آروم‌تر!</b>\n\n{seconds} ثانیه صبر کن.',
    'errors.rateLimitedShort': '⏱ {seconds} ثانیه',
    'errors.sendRateLimited': '⏱ <b>حداکثر ۵ پیام در دقیقه.</b>\n\n{seconds} ثانیه صبر کن.',
    'errors.replyRateLimited': '⏱ {seconds} ثانیه صبر کن.',

    // ---- start ----
    'start.welcomeNew': `🎭 <b>به صندوق راز خوش اومدی!</b>

یه جای امن برای دریافت پیام‌های ناشناس.

🔗 <b>لینک اختصاصی تو:</b>
<code>{link}</code>

این لینک رو تو بیو یا استوری بذار تا بقیه بتونن بهت پیام ناشناس بدن 👇`,

    'start.welcomeBack': `👋 <b>خوش برگشتی!</b>

🔗 <b>لینک اختصاصی تو:</b>
<code>{link}</code>

برای اشتراک‌گذاری از دکمه‌های زیر استفاده کن 👇`,

    'start.mainMenuHint': `💡 <b>نکته:</b>
با دکمه‌های زیر می‌تونی صندوق پیام، تنظیمات و دعوت دوستان رو مدیریت کنی.`,

    // ---- دکمه‌ها ----
    'buttons.shareLink': 'اشتراک‌گذاری لینک',
    'buttons.copyLink': 'کپی لینک',
    'buttons.openInbox': 'صندوق پیام',
    'buttons.openInboxWithCount': 'صندوق پیام ({count} جدید)',
    'buttons.settings': 'تنظیمات',
    'buttons.referral': 'دعوت دوستان',
    'buttons.buyPackage': 'خرید بسته',
    'buttons.language': 'تغییر زبان',
    'buttons.changeLanguage': 'تغییر زبان',
    'buttons.help': 'راهنما',
    'buttons.refresh': 'بروزرسانی',
    'buttons.back': 'بازگشت',
    'buttons.cancel': 'انصراف',
    'buttons.editBio': 'ویرایش بیو',
    'buttons.editName': 'ویرایش نام',
    'buttons.changeSlug': 'تغییر لینک',
    'buttons.privacy': 'حریم خصوصی',
    'buttons.blockList': 'لیست بلاک',
    'buttons.deleteAccount': 'حذف حساب',
    'buttons.sendAnother': 'ارسال پیام دیگه',
    'buttons.myOwnLink': 'لینک خودم',
    'buttons.freeWithInvites': 'رایگان با دعوت',
    'buttons.buyReplyPackage': 'خرید بسته پاسخ',
    'buttons.shareToFriends': 'اشتراک با دوستان',
    'buttons.copyInviteLink': 'کپی لینک دعوت',
    'buttons.referralStats': 'آمار دعوت',
    'buttons.viewRewards': 'مشاهده پاداش',
    'buttons.confirmPurchase': 'تایید خرید ({price} ⭐️)',
    'buttons.useSuggested': 'استفاده از «{slug}»',
    'buttons.enterCustomSlug': 'وارد کردن دستی',
    'buttons.yesDelete': 'بله، حذف کن',

    // ---- اشتراک ----
    'share.defaultText': '🎭 به من پیام ناشناس بده!',
    'share.referralText': '🎭 بیا تو صندوق راز! یه جای باحال برای پیام‌های ناشناس.',

    // ---- send ----
    'send.askForMessage': `✍️ <b>پیام خودت رو بنویس</b>

می‌خوای به <b>{name}</b> چی بگی؟
می‌تونی متن، عکس، ویدیو یا ویس بفرستی.`,
    'send.targetNotFound': '❌ کاربر مورد نظر پیدا نشد یا لینکش غیرفعاله.',
    'send.cantSendToSelf': '🤦 نمی‌تونی به خودت پیام ناشناس بفرستی!',
    'send.blocked': '🚫 این کاربر تو رو بلاک کرده.',
    'send.dailyLimitReached': '⏱ <b>به سقف ارسال روزانه رسیدی.</b>\n\nفردا دوباره امتحان کن.',
    'send.hourlyLimitReached': '⏱ <b>کمی صبر کن!</b>\n\nبه سقف ساعتی رسیدی.',
    'send.tooLong': '📏 <b>پیامت خیلی طولانیه.</b>\n\nحداکثر {max} کاراکتر مجازه.',
    'send.unsupportedContent': '❌ این نوع محتوا پشتیبانی نمی‌شه.\n\nمتن، عکس، ویدیو یا ویس بفرست.',
    'send.success': `✅ <b>پیام تو با موفقیت فرستاده شد!</b>

هویتت فاش نخواهد شد 😉`,
    'send.newMessageNotification': `🔔 <b>یه پیام ناشناس جدید داری!</b>

برای دیدنش برو به /inbox`,

    // ---- inbox ----
    'inbox.header': 'صندوق پیام تو',
    'inbox.totalMessages': '📨 کل پیام‌ها: <b>{count}</b>',
    'inbox.unreadMessages': '🔵 خوانده‌نشده: <b>{count}</b>',
    'inbox.activePackage': '💎 عضویت ویژه فعال',
    'inbox.daysLeft': '{count} روز باقی‌مونده',
    'inbox.freeToday': '🆓 امروز {remaining} پیام رایگان داری',
    'inbox.usedToday': '📊 امروز {used} از {limit} مصرف شده',
    'inbox.messageDeleted': '🗑 پیام حذف شد.',

    // ---- reply ----
    'reply.needPackage': `💬 <b>برای پاسخ دادن، بسته پاسخ لازمه.</b>

با خرید بسته «پاسخ ناشناس» می‌تونی به فرستنده‌ها پاسخ بدی.`,
    'reply.cantReply': 'به این پیام نمی‌تونی پاسخ بدی.',
    'reply.askForReply': `↩️ <b>پاسخ ناشناس خودت رو بنویس</b>

پاسخت بدون فاش شدن هویتت فرستاده می‌شه.`,
    'reply.success': '✅ پاسخ ناشناس فرستاده شد.',
    'reply.newReplyNotification': '💬 یه پاسخ ناشناس جدید دریافت کردی!',

    // ---- settings ----
    'settings.header': '⚙️ <b>تنظیمات حساب</b>',
    'settings.enterBio': `📝 <b>بیوی جدیدت رو بنویس</b>

این متن توی پروفایل عمومیت نشون داده می‌شه. (حداکثر ۲۰۰ کاراکتر)`,
    'settings.enterName': `👤 <b>نام نمایشی جدیدت رو بنویس</b>

این نام تو پیام‌های دریافتی به فرستنده نشون داده می‌شه.`,
    'settings.bioSaved': '✅ بیو با موفقیت ذخیره شد.',
    'settings.nameSaved': '✅ نام با موفقیت ذخیره شد.',
    'settings.changeSlug': `🔗 <b>تغییر لینک اختصاصی</b>

لینک فعلی: <code>{current}</code>

می‌تونی از پیشنهاد زیر استفاده کنی یا خودت یه لینک جدید بنویسی.`,
    'settings.enterCustomSlug': `✏️ <b>لینک جدیدت رو بنویس</b>

فقط حروف کوچک انگلیسی، عدد و _ (بین ۳ تا ۳۲ کاراکتر).
مثال: <code>ali_2024</code>`,
    'settings.slugChanged': '✅ لینک تو تغییر کرد به:\n\n<code>{slug}</code>',
    'settings.slugTaken': '❌ این اسلاگ قبلاً گرفته شده.',
    'settings.slugInvalid': '❌ اسلاگ نامعتبر.',
    'settings.privacyText': `🔒 <b>حریم خصوصی</b>

🔐 <b>پیام‌ها:</b>
پیام‌های ناشناس شما امن ذخیره می‌شن.

🎭 <b>هویت فرستنده:</b>
به‌طور پیش‌فرض هیچ‌کس نمی‌تونه هویت فرستنده رو ببینه.

🚫 <b>بلاک:</b>
می‌تونی هر کاربری رو بلاک کنی.

⚠️ <b>گزارش:</b>
اگه پیام آزاردهنده‌ای گرفتی، گزارش بده.

🗑 <b>حذف حساب:</b>
هر زمان بخوای، همه‌ی اطلاعاتت پاک می‌شه.`,
    'settings.deleteAccountWarning': `⚠️ <b>هشدار!</b>

با حذف حساب:
• همه پیام‌هات پاک می‌شن
• لینکت غیرفعال می‌شه
• این عمل <b>برگشت‌پذیر نیست</b>

مطمئنی می‌خوای حسابت رو حذف کنی؟`,
    'settings.accountDeleted': '✅ حسابت حذف شد.\n\nبرای شروع دوباره /start بزن.',

    // ---- language ----
    'language.header': '🌐 تغییر زبان',
    'language.current': 'زبان فعلی:',
    'language.chooseNew': 'زبان جدید رو انتخاب کن:',
    'language.changed': '✅ زبان تغییر کرد',
    'language.applied': 'حالا ربات و WebApp به این زبانن.',
    'language.alreadySet': 'همین زبان قبلاً انتخابه.',

    // ---- help ----
    'help.text': `📖 <b>راهنمای صندوق راز</b>

🔗 <b>لینک اختصاصی خودت:</b>
با /start لینکت رو بگیر و تو بیو یا استوری به اشتراک بذار.

📬 <b>صندوق پیام:</b>
با /inbox پیام‌های ناشناسی که دریافت کردی رو ببین.

⚙️ <b>تنظیمات:</b>
با /settings پروفایل، بیو و حریم خصوصی‌ات رو مدیریت کن.

🌐 <b>زبان:</b>
با /language زبان ربات و WebApp رو عوض کن.

💎 <b>خرید بسته:</b>
با /inbox یا دکمه‌های منو، بسته‌ها رو ببین.

🚫 <b>گزارش تخلف:</b>
روی هر پیام دکمه گزارش هست.

❓ <b>سوالی داری؟</b>
به ادمین پیام بده.`,

    // ---- upgrade ----
    'upgrade.header': `💎 <b>عضویت ویژه (VIP)</b>

با خرید بسته، همه پیام‌ها رو نامحدود باز کن.

👇 یکی از بسته‌ها رو انتخاب کن:`,

    // ---- packages ----
    'packages.weekly': 'یک هفته‌ای',
    'packages.monthly': 'ماهانه',
    'packages.yearly': 'سالانه',
    'packages.reply': 'پاسخ ناشناس',
    'packages.needMessageForReply': 'برای خرید بسته پاسخ، ابتدا باید پیامی دریافت کنی.',
    'packages.referralRewardsTitle': '🎁 پاداش‌های دعوت',
    'packages.referralRewards': `• هر ۱ دعوت: +۲۴ ساعت نامحدود
• هر ۳ دعوت: +۱ هفته نامحدود
• هر ۱۰ دعوت: +۱ ماه نامحدود
• هر ۱۰ دعوت: + بسته پاسخ ۱ ماهه

💡 همه پاداش‌ها خودکار و تکرارپذیرن.`,

    // ---- referral ----
    'referral.header': '🎁 <b>دعوت دوستان</b>',
    'referral.yourLink': '🔗 <b>لینک دعوت تو:</b>',
    'referral.totalInvited': 'کل دعوت‌شده‌ها',
    'referral.active': 'فعال',
    'referral.rewardsEarned': 'پاداش‌ها',
    'referral.statsHeader': '📊 <b>آمار دعوت‌های تو</b>',
    'referral.rewardsTitle': '🎁 <b>پاداش‌های تو</b>',
    'referral.rewardsNote': '💡 پاداش‌ها خودکار فعال می‌شن.',

    // ---- report/block ----
    'report.success': '✅ گزارش ثبت شد. ممنون از همکاریت!',
    'block.empty': '📭 لیست بلاکت خالیه.',
    'block.listHeader': '🚫 <b>لیست کاربران بلاک‌شده</b>\n\nبرای آنبلاک، روی اسمشون بزن:',
    'block.success': '🚫 کاربر بلاک شد.',
    'block.unblockSuccess': '✅ کاربر آنبلاک شد.',

    // ---- payment ----
    'payment.success': 'پرداخت موفق!',
    'payment.packageActivated': 'بسته فعال شد',
    'payment.validFor': 'اعتبار: {days} روز',
    'payment.expiresAt': 'تاریخ انقضا: {date}',
    'payment.packageInvalid': 'بسته نامعتبر.',
  },

  // ==========================================================
  //  English
  // ==========================================================
  en: {
    // ---- General ----
    'labels.user': 'User',
    'labels.anonymous': 'Anonymous',
    'labels.empty': 'empty',
    'labels.name': 'Name',
    'labels.bio': 'Bio',
    'labels.link': 'Link',
    'labels.language': 'Language',
    'labels.received': 'Received',
    'labels.sent': 'Sent',
    'labels.referrals': 'Referrals',
    'labels.package': 'Package',
    'labels.noPackage': 'No package',
    'labels.daysLeft': 'days left',

    // ---- Errors ----
    'errors.general': 'An error occurred. Please try again.',
    'errors.notRegistered': 'Use /start first.',
    'errors.banned': 'Your account is banned.',
    'errors.invalidInput': 'Invalid input.',
    'errors.tooLong': 'Text is too long.',
    'errors.notFound': 'Not found.',
    'errors.paymentFailed': 'Payment failed.',
    'errors.paymentInvalid': 'Invalid payment request.',
    'errors.bannedReason': 'Rules violation',
    'errors.bannedFull': '🚫 <b>You are banned.</b>\n\n📝 Reason: {reason}\n\nContact support if you think it\'s a mistake.',
    'errors.bannedShort': '🚫 Banned',
    'errors.rateLimited': '⏱ <b>Slow down!</b>\n\nWait {seconds}s.',
    'errors.rateLimitedShort': '⏱ {seconds}s',
    'errors.sendRateLimited': '⏱ <b>Max 5/min.</b>\n\nWait {seconds}s.',
    'errors.replyRateLimited': '⏱ Wait {seconds}s.',

    // ---- start ----
    'start.welcomeNew': `🎭 <b>Welcome to AnonBox!</b>

A safe place for anonymous messages.

🔗 <b>Your unique link:</b>
<code>{link}</code>

Share this in your bio or story 👇`,

    'start.welcomeBack': `👋 <b>Welcome back!</b>

🔗 <b>Your unique link:</b>
<code>{link}</code>

Use the buttons below to share 👇`,

    'start.mainMenuHint': `💡 <b>Tip:</b>
Use the buttons below to manage your inbox, settings, and referrals.`,

    // ---- Buttons ----
    'buttons.shareLink': 'Share link',
    'buttons.copyLink': 'Copy link',
    'buttons.openInbox': 'Inbox',
    'buttons.openInboxWithCount': 'Inbox ({count} new)',
    'buttons.settings': 'Settings',
    'buttons.referral': 'Refer friends',
    'buttons.buyPackage': 'Buy package',
    'buttons.language': 'Change language',
    'buttons.changeLanguage': 'Change language',
    'buttons.help': 'Help',
    'buttons.refresh': 'Refresh',
    'buttons.back': 'Back',
    'buttons.cancel': 'Cancel',
    'buttons.editBio': 'Edit bio',
    'buttons.editName': 'Edit name',
    'buttons.changeSlug': 'Change link',
    'buttons.privacy': 'Privacy',
    'buttons.blockList': 'Block list',
    'buttons.deleteAccount': 'Delete account',
    'buttons.sendAnother': 'Send another',
    'buttons.myOwnLink': 'My link',
    'buttons.freeWithInvites': 'Free with invites',
    'buttons.buyReplyPackage': 'Buy reply package',
    'buttons.shareToFriends': 'Share with friends',
    'buttons.copyInviteLink': 'Copy invite link',
    'buttons.referralStats': 'Referral stats',
    'buttons.viewRewards': 'View rewards',
    'buttons.confirmPurchase': 'Confirm ({price} ⭐️)',
    'buttons.useSuggested': 'Use «{slug}»',
    'buttons.enterCustomSlug': 'Enter custom',
    'buttons.yesDelete': 'Yes, delete',

    // ---- Share ----
    'share.defaultText': '🎭 Send me an anonymous message!',
    'share.referralText': '🎭 Join AnonBox! A cool place for anonymous messages.',

    // ---- send ----
    'send.askForMessage': `✍️ <b>Write your message</b>

What do you want to say to <b>{name}</b>?
You can send text, photo, video, or voice.`,
    'send.targetNotFound': '❌ User not found or link is inactive.',
    'send.cantSendToSelf': "🤦 You can't send a message to yourself!",
    'send.blocked': '🚫 This user has blocked you.',
    'send.dailyLimitReached': '⏱ <b>Daily sending limit reached.</b>\n\nTry again tomorrow.',
    'send.hourlyLimitReached': '⏱ <b>Slow down!</b>\n\nHourly limit reached.',
    'send.tooLong': '📏 <b>Message is too long.</b>\n\nMax {max} characters.',
    'send.unsupportedContent': '❌ This content type is not supported.\n\nSend text, photo, video, or voice.',
    'send.success': `✅ <b>Your message has been sent!</b>

Your identity will remain hidden 😉`,
    'send.newMessageNotification': `🔔 <b>You have a new anonymous message!</b>

Use /inbox to view it.`,

    // ---- inbox ----
    'inbox.header': 'Your inbox',
    'inbox.totalMessages': '📨 Total: <b>{count}</b>',
    'inbox.unreadMessages': '🔵 Unread: <b>{count}</b>',
    'inbox.activePackage': '💎 Active subscription',
    'inbox.daysLeft': '{count} days left',
    'inbox.freeToday': '🆓 You have {remaining} free messages today',
    'inbox.usedToday': '📊 {used} of {limit} used today',
    'inbox.messageDeleted': '🗑 Message deleted.',

    // ---- reply ----
    'reply.needPackage': `💬 <b>Reply package required.</b>

Buy the "Anonymous Reply" package to reply to senders.`,
    'reply.cantReply': 'Cannot reply to this message.',
    'reply.askForReply': `↩️ <b>Write your anonymous reply</b>

Your reply will be sent without revealing your identity.`,
    'reply.success': '✅ Anonymous reply sent.',
    'reply.newReplyNotification': '💬 You received a new anonymous reply!',

    // ---- settings ----
    'settings.header': '⚙️ <b>Account settings</b>',
    'settings.enterBio': `📝 <b>Write your new bio</b>

This text will be shown on your public profile. (Max 200 characters)`,
    'settings.enterName': `👤 <b>Write your new display name</b>

This name will be shown to senders.`,
    'settings.bioSaved': '✅ Bio saved successfully.',
    'settings.nameSaved': '✅ Name saved successfully.',
    'settings.changeSlug': `🔗 <b>Change unique link</b>

Current: <code>{current}</code>

You can use the suggestion below or write your own.`,
    'settings.enterCustomSlug': `✏️ <b>Write your new link</b>

Only lowercase English letters, numbers, and _ (3-32 chars).
Example: <code>ali_2024</code>`,
    'settings.slugChanged': '✅ Your link changed to:\n\n<code>{slug}</code>',
    'settings.slugTaken': '❌ This slug is taken.',
    'settings.slugInvalid': '❌ Invalid slug.',
    'settings.privacyText': `🔒 <b>Privacy Policy</b>

🔐 <b>Messages:</b>
Your anonymous messages are stored securely.

🎭 <b>Sender identity:</b>
By default, no one can see who sent a message.

🚫 <b>Block:</b>
You can block any user.

⚠️ <b>Report:</b>
Report any abusive messages.

🗑 <b>Delete account:</b>
Delete your account anytime.`,
    'settings.deleteAccountWarning': `⚠️ <b>Warning!</b>

Deleting your account will:
• Erase all your messages
• Deactivate your link
• <b>Cannot be undone</b>

Are you sure?`,
    'settings.accountDeleted': '✅ Account deleted.\n\nUse /start to begin again.',

    // ---- language ----
    'language.header': '🌐 Change language',
    'language.current': 'Current language:',
    'language.chooseNew': 'Choose new language:',
    'language.changed': '✅ Language changed',
    'language.applied': 'The bot and WebApp are now in this language.',
    'language.alreadySet': 'This language is already set.',

    // ---- help ----
    'help.text': `📖 <b>AnonBox Help</b>

🔗 <b>Your unique link:</b>
Use /start to get your link and share it in your bio or story.

📬 <b>Inbox:</b>
Use /inbox to view your received anonymous messages.

⚙️ <b>Settings:</b>
Use /settings to manage your profile, bio, and privacy.

🌐 <b>Language:</b>
Use /language to change the bot and WebApp language.

💎 <b>Buy package:</b>
Use /inbox or menu buttons to view packages.

🚫 <b>Report:</b>
Each message has a report button.

❓ <b>Questions?</b>
Message the admin.`,

    // ---- upgrade ----
    'upgrade.header': `💎 <b>Premium (VIP)</b>

Unlock all messages with a package.

👇 Choose a package:`,

    // ---- packages ----
    'packages.weekly': 'Weekly',
    'packages.monthly': 'Monthly',
    'packages.yearly': 'Yearly',
    'packages.reply': 'Anonymous Reply',
    'packages.needMessageForReply': 'To buy the reply package, you need to receive a message first.',
    'packages.referralRewardsTitle': '🎁 Referral rewards',
    'packages.referralRewards': `• Every 1 invite: +24h unlimited
• Every 3 invites: +1 week unlimited
• Every 10 invites: +1 month unlimited
• Every 10 invites: + 1-month reply package

💡 All rewards auto and repeatable.`,

    // ---- referral ----
    'referral.header': '🎁 <b>Refer friends</b>',
    'referral.yourLink': '🔗 <b>Your referral link:</b>',
    'referral.totalInvited': 'Total invited',
    'referral.active': 'Active',
    'referral.rewardsEarned': 'Rewards',
    'referral.statsHeader': '📊 <b>Your referral stats</b>',
    'referral.rewardsTitle': '🎁 <b>Your rewards</b>',
    'referral.rewardsNote': '💡 Rewards activate automatically.',

    // ---- report/block ----
    'report.success': '✅ Report submitted. Thanks!',
    'block.empty': '📭 Your block list is empty.',
    'block.listHeader': '🚫 <b>Blocked users</b>\n\nTap a name to unblock:',
    'block.success': '🚫 User blocked.',
    'block.unblockSuccess': '✅ User unblocked.',

    // ---- payment ----
    'payment.success': 'Payment successful!',
    'payment.packageActivated': 'Package activated',
    'payment.validFor': 'Valid for: {days} days',
    'payment.expiresAt': 'Expires: {date}',
    'payment.packageInvalid': 'Invalid package.',
  },

  // ==========================================================
  //  العربية
  // ==========================================================
  ar: {
    // ---- عام ----
    'labels.user': 'مستخدم',
    'labels.anonymous': 'مجهول',
    'labels.empty': 'فارغ',
    'labels.name': 'الاسم',
    'labels.bio': 'النبذة',
    'labels.link': 'الرابط',
    'labels.language': 'اللغة',
    'labels.received': 'مستلمة',
    'labels.sent': 'مرسلة',
    'labels.referrals': 'المدعوون',
    'labels.package': 'الباقة',
    'labels.noPackage': 'بدون باقة',
    'labels.daysLeft': 'يوم متبقي',

    // ---- الأخطاء ----
    'errors.general': 'حدث خطأ. حاول مرة أخرى.',
    'errors.notRegistered': 'استخدم /start أولاً.',
    'errors.banned': 'حسابك محظور.',
    'errors.invalidInput': 'إدخال غير صحيح.',
    'errors.tooLong': 'النص طويل جداً.',
    'errors.notFound': 'غير موجود.',
    'errors.paymentFailed': 'فشل الدفع.',
    'errors.paymentInvalid': 'طلب دفع غير صالح.',
    'errors.bannedReason': 'مخالفة القواعد',
    'errors.bannedFull': '🚫 <b>أنت محظور.</b>\n\n📝 السبب: {reason}\n\nتواصل مع الدعم إذا كنت تعتقد أنه خطأ.',
    'errors.bannedShort': '🚫 محظور',
    'errors.rateLimited': '⏱ <b>تمهل!</b>\n\nانتظر {seconds} ثانية.',
    'errors.rateLimitedShort': '⏱ {seconds}s',
    'errors.sendRateLimited': '⏱ <b>حد أقصى 5/دقيقة.</b>\n\nانتظر {seconds}s.',
    'errors.replyRateLimited': '⏱ انتظر {seconds}s.',

    // ---- start ----
    'start.welcomeNew': `🎭 <b>مرحباً بك في صندوق السر!</b>

مكان آمن للرسائل المجهولة.

🔗 <b>رابطك الخاص:</b>
<code>{link}</code>

شاركه في البايو أو القصة 👇`,

    'start.welcomeBack': `👋 <b>مرحباً بعودتك!</b>

🔗 <b>رابطك الخاص:</b>
<code>{link}</code>

استخدم الأزرار أدناه 👇`,

    'start.mainMenuHint': `💡 <b>نصيحة:</b>
استخدم الأزرار أدناه لإدارة الصندوق والإعدادات والدعوات.`,

    // ---- الأزرار ----
    'buttons.shareLink': 'مشاركة الرابط',
    'buttons.copyLink': 'نسخ الرابط',
    'buttons.openInbox': 'الصندوق',
    'buttons.openInboxWithCount': 'الصندوق ({count} جديد)',
    'buttons.settings': 'الإعدادات',
    'buttons.referral': 'دعوة الأصدقاء',
    'buttons.buyPackage': 'شراء باقة',
    'buttons.language': 'تغيير اللغة',
    'buttons.changeLanguage': 'تغيير اللغة',
    'buttons.help': 'مساعدة',
    'buttons.refresh': 'تحديث',
    'buttons.back': 'رجوع',
    'buttons.cancel': 'إلغاء',
    'buttons.editBio': 'تعديل النبذة',
    'buttons.editName': 'تعديل الاسم',
    'buttons.changeSlug': 'تغيير الرابط',
    'buttons.privacy': 'الخصوصية',
    'buttons.blockList': 'قائمة الحظر',
    'buttons.deleteAccount': 'حذف الحساب',
    'buttons.sendAnother': 'أرسل أخرى',
    'buttons.myOwnLink': 'رابطي',
    'buttons.freeWithInvites': 'مجاناً بالدعوات',
    'buttons.buyReplyPackage': 'شراء باقة الرد',
    'buttons.shareToFriends': 'شارك مع الأصدقاء',
    'buttons.copyInviteLink': 'نسخ رابط الدعوة',
    'buttons.referralStats': 'إحصائيات الدعوة',
    'buttons.viewRewards': 'عرض المكافآت',
    'buttons.confirmPurchase': 'تأكيد ({price} ⭐️)',
    'buttons.useSuggested': 'استخدم «{slug}»',
    'buttons.enterCustomSlug': 'مخصص',
    'buttons.yesDelete': 'نعم، احذف',

    // ---- المشاركة ----
    'share.defaultText': '🎭 أرسل لي رسالة مجهولة!',
    'share.referralText': '🎭 انضم لصندوق السر! مكان رائع للرسائل المجهولة.',

    // ---- send ----
    'send.askForMessage': `✍️ <b>اكتب رسالتك</b>

ماذا تريد أن تقول لـ <b>{name}</b>؟
يمكنك إرسال نص أو صورة أو فيديو أو صوت.`,
    'send.targetNotFound': '❌ المستخدم غير موجود أو الرابط غير نشط.',
    'send.cantSendToSelf': '🤦 لا يمكنك إرسال رسالة لنفسك!',
    'send.blocked': '🚫 هذا المستخدم حظرك.',
    'send.dailyLimitReached': '⏱ <b>تم الوصول للحد اليومي.</b>\n\nحاول غداً.',
    'send.hourlyLimitReached': '⏱ <b>تمهل!</b>\n\nتم الوصول للحد الساعي.',
    'send.tooLong': '📏 <b>الرسالة طويلة جداً.</b>\n\nالحد الأقصى {max} حرف.',
    'send.unsupportedContent': '❌ هذا النوع غير مدعوم.\n\nأرسل نص أو صورة أو فيديو أو صوت.',
    'send.success': `✅ <b>تم إرسال رسالتك!</b>

هويتك ستبقى مجهولة 😉`,
    'send.newMessageNotification': `🔔 <b>لديك رسالة مجهولة جديدة!</b>

استخدم /inbox لعرضها.`,

    // ---- inbox ----
    'inbox.header': 'صندوقك',
    'inbox.totalMessages': '📨 الإجمالي: <b>{count}</b>',
    'inbox.unreadMessages': '🔵 غير مقروءة: <b>{count}</b>',
    'inbox.activePackage': '💎 اشتراك نشط',
    'inbox.daysLeft': '{count} يوم متبقي',
    'inbox.freeToday': '🆓 لديك {remaining} رسالة مجانية اليوم',
    'inbox.usedToday': '📊 {used} من {limit} مستخدمة اليوم',
    'inbox.messageDeleted': '🗑 تم حذف الرسالة.',

    // ---- reply ----
    'reply.needPackage': `💬 <b>تحتاج باقة الرد.</b>

اشترِ باقة «الرد المجهول» للرد على المرسلين.`,
    'reply.cantReply': 'لا يمكن الرد على هذه الرسالة.',
    'reply.askForReply': `↩️ <b>اكتب ردك المجهول</b>

سيتم إرسال ردك دون كشف هويتك.`,
    'reply.success': '✅ تم إرسال الرد المجهول.',
    'reply.newReplyNotification': '💬 استقبلت رداً مجهولاً جديداً!',

    // ---- settings ----
    'settings.header': '⚙️ <b>إعدادات الحساب</b>',
    'settings.enterBio': `📝 <b>اكتب نبذتك الجديدة</b>

سيظهر هذا النص في ملفك العام. (حد أقصى 200 حرف)`,
    'settings.enterName': `👤 <b>اكتب اسمك الجديد</b>

سيظهر هذا الاسم للمرسلين.`,
    'settings.bioSaved': '✅ تم حفظ النبذة.',
    'settings.nameSaved': '✅ تم حفظ الاسم.',
    'settings.changeSlug': `🔗 <b>تغيير الرابط الخاص</b>

الحالي: <code>{current}</code>

يمكنك استخدام الاقتراح أدناه أو كتابة رابطك الخاص.`,
    'settings.enterCustomSlug': `✏️ <b>اكتب رابطك الجديد</b>

فقط حروف إنجليزية صغيرة وأرقام و _ (3-32 حرف).
مثال: <code>ali_2024</code>`,
    'settings.slugChanged': '✅ تم تغيير رابطك إلى:\n\n<code>{slug}</code>',
    'settings.slugTaken': '❌ هذا الرابط محجوز.',
    'settings.slugInvalid': '❌ رابط غير صالح.',
    'settings.privacyText': `🔒 <b>سياسة الخصوصية</b>

🔐 <b>الرسائل:</b>
رسائلك المجهولة محفوظة بأمان.

🎭 <b>هوية المرسل:</b>
لا أحد يستطيع رؤية من أرسل الرسالة.

🚫 <b>الحظر:</b>
يمكنك حظر أي مستخدم.

⚠️ <b>الإبلاغ:</b>
أبلغ عن أي رسالة مسيئة.

🗑 <b>حذف الحساب:</b>
احذف حسابك في أي وقت.`,
    'settings.deleteAccountWarning': `⚠️ <b>تحذير!</b>

حذف حسابك سيؤدي إلى:
• مسح كل رسائلك
• تعطيل رابطك
• <b>لا يمكن التراجع</b>

هل أنت متأكد؟`,
    'settings.accountDeleted': '✅ تم حذف الحساب.\n\nاستخدم /start للبدء من جديد.',

    // ---- language ----
    'language.header': '🌐 تغيير اللغة',
    'language.current': 'اللغة الحالية:',
    'language.chooseNew': 'اختر لغة جديدة:',
    'language.changed': '✅ تغيّرت اللغة',
    'language.applied': 'البوت والتطبيق بهذه اللغة الآن.',
    'language.alreadySet': 'هذه اللغة محددة مسبقاً.',

    // ---- help ----
    'help.text': `📖 <b>مساعدة صندوق السر</b>

🔗 <b>رابطك الخاص:</b>
استخدم /start للحصول على رابطك.

📬 <b>الصندوق:</b>
استخدم /inbox لعرض رسائلك المجهولة.

⚙️ <b>الإعدادات:</b>
استخدم /settings لإدارة ملفك وخصوصيتك.

🌐 <b>اللغة:</b>
استخدم /language لتغيير اللغة.

💎 <b>شراء باقة:</b>
من الصندوق أو القائمة.

🚫 <b>الإبلاغ:</b>
كل رسالة لديها زر إبلاغ.

❓ <b>أسئلة؟</b>
راسل الإدارة.`,

    // ---- upgrade ----
    'upgrade.header': `💎 <b>الاشتراك المميز</b>

افتح كل الرسائل بباقة.

👇 اختر باقة:`,

    // ---- packages ----
    'packages.weekly': 'أسبوعي',
    'packages.monthly': 'شهري',
    'packages.yearly': 'سنوي',
    'packages.reply': 'الرد المجهول',
    'packages.needMessageForReply': 'لاستخدام باقة الرد، يجب استقبال رسالة أولاً.',
    'packages.referralRewardsTitle': '🎁 مكافآت الدعوة',
    'packages.referralRewards': `• كل 1 دعوة: +24 ساعة
• كل 3 دعوات: +أسبوع
• كل 10 دعوات: +شهر
• كل 10 دعوات: + باقة الرد شهر

💡 كل المكافآت تلقائية وقابلة للتكرار.`,

    // ---- referral ----
    'referral.header': '🎁 <b>دعوة الأصدقاء</b>',
    'referral.yourLink': '🔗 <b>رابط دعوتك:</b>',
    'referral.totalInvited': 'الإجمالي',
    'referral.active': 'نشط',
    'referral.rewardsEarned': 'المكافآت',
    'referral.statsHeader': '📊 <b>إحصائيات دعواتك</b>',
    'referral.rewardsTitle': '🎁 <b>مكافآتك</b>',
    'referral.rewardsNote': '💡 تُفعّل المكافآت تلقائياً.',

    // ---- report/block ----
    'report.success': '✅ تم إرسال الإبلاغ. شكراً!',
    'block.empty': '📭 قائمة الحظر فارغة.',
    'block.listHeader': '🚫 <b>المستخدمون المحظورون</b>\n\nاضغط على اسم لإلغاء الحظر:',
    'block.success': '🚫 تم حظر المستخدم.',
    'block.unblockSuccess': '✅ تم إلغاء الحظر.',

    // ---- payment ----
    'payment.success': 'تم الدفع بنجاح!',
    'payment.packageActivated': 'تم تفعيل الباقة',
    'payment.validFor': 'صالح لـ: {days} يوم',
    'payment.expiresAt': 'ينتهي: {date}',
    'payment.packageInvalid': 'باقة غير صالحة.',
  },
};

// ============================================================
//  تشخیص زبان
// ============================================================

/**
 * تشخیص زبان از کد تلگرام
 */
function detectLanguage(telegramLangCode) {
  if (!telegramLangCode) return config.languages.default;

  const code = String(telegramLangCode).toLowerCase().split('-')[0];

  if (config.languages.supported.includes(code)) {
    return code;
  }

  return config.languages.default;
}

// ============================================================
//  اسم زبان
// ============================================================

/**
 * اسم زبان به زبان خودش
 */
function getLanguageName(lang) {
  const names = {
    fa: 'فارسی',
    en: 'English',
    ar: 'العربية',
  };
  return names[lang] || names[config.languages.default];
}

/**
 * پرچم زبان
 */
function getLanguageFlag(lang) {
  const flags = {
    fa: '🇮🇷',
    en: '🇬🇧',
    ar: '🇸🇦',
  };
  return flags[lang] || '🌐';
}

/**
 * جهت زبان
 */
function getLanguageDir(lang) {
  return config.languages.rtl.includes(lang) ? 'rtl' : 'ltr';
}

// ============================================================
//  جایگزینی متغیرها
// ============================================================

function replaceVars(text, vars) {
  if (typeof text !== 'string') return text;

  let result = text;
  for (const [key, value] of Object.entries(vars)) {
    result = result.split(`{${key}}`).join(String(value));
  }
  return result;
}

// ============================================================
//  ترجمه
// ============================================================

/**
 * ترجمه یه کلید
 */
function translate(lang, key, vars = {}) {
  // زبان نامعتبر
  if (!config.languages.supported.includes(lang)) {
    lang = config.languages.default;
  }

  // جستجو در زبان انتخابی
  let value = TRANSLATIONS[lang]?.[key];

  // fallback به پیش‌فرض
  if (value === undefined && lang !== config.languages.default) {
    value = TRANSLATIONS[config.languages.default]?.[key];
  }

  // پیدا نشد → خود کلید
  if (value === undefined) {
    return key;
  }

  // جایگزینی متغیرها
  if (typeof value === 'string' && Object.keys(vars).length > 0) {
    return replaceVars(value, vars);
  }

  return value;
}

/**
 * دریافت تابع ترجمه برای یه زبان
 */
function getTranslator(lang) {
  return (key, vars = {}) => translate(lang, key, vars);
}

// ============================================================
//  فرمت تاریخ و اعداد
// ============================================================

/**
 * فرمت تاریخ بر اساس زبان
 */
function formatDate(timestamp, lang = 'fa', options = {}) {
  if (!timestamp) return '';

  const date = new Date(timestamp * 1000);

  try {
    const locale = {
      fa: 'fa-IR',
      en: 'en-US',
      ar: 'ar-SA',
    }[lang] || 'fa-IR';

    const formatter = new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...options,
    });

    return formatter.format(date);
  } catch (error) {
    return date.toLocaleDateString();
  }
}

/**
 * فرمت ساعت
 */
function formatTime(timestamp, lang = 'fa') {
  if (!timestamp) return '';

  const date = new Date(timestamp * 1000);

  try {
    const locale = {
      fa: 'fa-IR',
      en: 'en-US',
      ar: 'ar-SA',
    }[lang] || 'fa-IR';

    return new Intl.DateTimeFormat(locale, {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch (error) {
    return date.toLocaleTimeString();
  }
}

/**
 * فرمت عدد بر اساس زبان
 */
function formatNumber(num, lang = 'fa') {
  if (num === null || num === undefined) return '0';

  try {
    const locale = {
      fa: 'fa-IR',
      en: 'en-US',
      ar: 'ar-SA',
    }[lang] || 'fa-IR';

    return new Intl.NumberFormat(locale).format(num);
  } catch (error) {
    return String(num);
  }
}

/**
 * زمان نسبی
 */
function timeAgo(timestamp, lang = 'fa') {
  if (!timestamp) return '';

  const now = Math.floor(Date.now() / 1000);
  const diff = now - timestamp;

  const t = getTranslator(lang);

  if (diff < 60) return t('time.justNow') || 'همین حالا';
  if (diff < 3600) return `${Math.floor(diff / 60)} دقیقه پیش`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ساعت پیش`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} روز پیش`;
  if (diff < 2592000) return `${Math.floor(diff / 604800)} هفته پیش`;
  if (diff < 31536000) return `${Math.floor(diff / 2592000)} ماه پیش`;
  return `${Math.floor(diff / 31536000)} سال پیش`;
}

// ============================================================
//  اطلاعات همه زبان‌ها
// ============================================================

function getAllLanguages() {
  return config.languages.supported.map((code) => ({
    code,
    name: getLanguageName(code),
    flag: getLanguageFlag(code),
    dir: getLanguageDir(code),
    isRtl: config.languages.rtl.includes(code),
  }));
}

// ============================================================
//  خروجی
// ============================================================

module.exports = {
  // ترجمه
  translate,
  t: translate,
  getTranslator,

  // تشخیص
  detectLanguage,
  getLanguageName,
  getLanguageFlag,
  getLanguageDir,

  // RTL
  isRtl: (lang) => config.languages.rtl.includes(lang),

  // فرمت
  formatDate,
  formatTime,
  formatNumber,
  timeAgo,

  // اطلاعات
  getAllLanguages,

  // ابزار
  replaceVars,

  // Data
  TRANSLATIONS,
};