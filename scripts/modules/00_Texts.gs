/**
 * SMARTBUDGET PRO 2026 — Module 00b: Centralized UI Text Dictionary
 * =============================================================================
 * Phase 2 of the Strategic Refactor Plan.
 *
 * EVERY user-facing string (alerts, menu items, log messages, hyperlink
 * labels) lives here. Cell labels, sheet names, category strings, and
 * formula tokens stay in 00_Config.gs because they are DATA, not UI.
 *
 * STRUCTURE
 * ---------
 *   TEXTS.<lang>.<section>.<key>
 *
 *   <section> groups strings by where they appear:
 *     menu, install, demo, analytics, health, repair, reset, navigation,
 *     welcome, common
 *
 *   <key> is the action-or-state name within that section.
 *
 * USAGE
 * -----
 *   t('install.success')                    -> static string
 *   t('install.successBody', {n: 17, s: 60}) -> templated string
 *
 * Templating uses parameter objects. Functions can also be values:
 *   demo.summary: ({income, expense, secs}) => `${income} ...`
 *
 * I18N READINESS
 * --------------
 * Adding English later = add a TEXTS.en object with the same shape, then
 * add a setLanguage() menu option that flips ACTIVE_LANG. Zero changes
 * needed in any other module.
 *
 * ALPHABETICAL LOAD ORDER
 * -----------------------
 * This file is named 00_Texts.gs (after 00_Config.gs alphabetically) so
 * Apps Script loads it before all helpers / sheet builders / entry points.
 */

// ============================================================================
// ACTIVE LANGUAGE — read at runtime from PropertiesService so the user's
// menu selection persists across sessions. Falls back to 'ar' on first install.
// ============================================================================
const SUPPORTED_LANGS = ['ar', 'en'];
const LANG_PROPERTY_KEY = 'sb_active_lang';

function getActiveLang() {
  try {
    const stored = PropertiesService.getDocumentProperties().getProperty(LANG_PROPERTY_KEY);
    return SUPPORTED_LANGS.indexOf(stored) >= 0 ? stored : 'ar';
  } catch (e) {
    return 'ar';
  }
}

function setActiveLang(lang) {
  if (SUPPORTED_LANGS.indexOf(lang) < 0) return;
  PropertiesService.getDocumentProperties().setProperty(LANG_PROPERTY_KEY, lang);
}

// ============================================================================
// TEXTS DICTIONARY
// ============================================================================
const TEXTS = {
  ar: {
    // ------------------------------------------------------------------
    // Custom menu (06_Core.gs onOpen)
    // ------------------------------------------------------------------
    menu: {
      title:           '💎 SmartBudget',
      freshDemo:       '🚀 تجربة القالب بالبيانات التجريبية',
      navSubmenu:      '🔀 التنقل السريع',
      navWelcome:      '🏠 صفحة الترحيب',
      navDashboard:    '📊 لوحة التحكم',
      navSettings:     '💰 الإعدادات',
      navGoals:        '🎯 الأهداف',
      healthCheck:     '🩺 فحص صحة النظام',
      repairDashboard: '♻️ إعادة بناء اللوحة',
      fillDemo:        '📥 تعبئة بيانات تجريبية',
      clearDemo:       '🧹 مسح البيانات التجريبية',
      reset:           '⚠️ إعادة الضبط الكامل',
      reinstall:       '🛠️ إعادة التثبيت',
      langSubmenu:     '🌐 اللغة',
      langArabic:      '🇸🇦 العربية',
      langEnglish:     '🇬🇧 English',
      verifyFormulas:  '🔍 فحص سلامة الصيغ',
      autoRepair:      '🔧 إصلاح تلقائي للصيغ',
      exportSubmenu:   '📄 تصدير التقارير',
      exportMonth:     '📅 تصدير الشهر الحالي PDF',
      exportDashboard: '📊 تصدير لوحة التحكم PDF',
      exportAnnual:    '📚 تصدير التقرير السنوي PDF',
      onboarding:      '🧙 معالج الإعداد'
    },

    // Onboarding Wizard (Module 09_Onboarding.gs + OnboardingSidebar.html)
    onboarding: {
      // Sidebar shell
      sidebarTitle:     '🧙 معالج إعداد SmartBudget',
      stepLabel:        ({n, total}) => `الخطوة ${n} من ${total}`,
      btnNext:          'التالي ←',
      btnBack:          '→ السابق',
      btnSkip:          'تخطّي',
      btnFinish:        '🎉 إنهاء الإعداد',
      btnLater:         'لاحقاً',

      // Step 1 - Welcome
      step1Title:       'مرحباً بك في SmartBudget Pro',
      step1Sub:         'سنرشدك في 5 خطوات سريعة لإعداد قالبك المالي',
      step1Body:        'هذا القالب يحوي محرّك عملات حيّ، 12 ورقة شهريّة، نظام أهداف ادخار، ' +
                        'لوحة تحكم متقدّمة، ومحرّك تحقّق من سلامة الصيغ. كلّ شيء جاهز للاستخدام بمجرد إكمال الإعداد.',

      // Step 2 - Language
      step2Title:       'اختر لغة الواجهة',
      step2Sub:         'يمكنك تغييرها لاحقاً من قائمة 🌐 اللغة',
      langArOption:     '🇸🇦 العربية',
      langEnOption:     '🇬🇧 English',

      // Step 3 - Main Currency
      step3Title:       'اختر عملتك الرئيسيّة',
      step3Sub:         'كل المبالغ ستُعرض بهذه العملة افتراضياً. يمكنك تبديلها لحظياً من لوحة التحكم.',
      step3Help:        'العملات المدعومة بأسعار حيّة من GOOGLEFINANCE',

      // Step 4 - Demo Data
      step4Title:       'هل ترغب ببيانات تجريبيّة؟',
      step4Sub:         'مفيدة لاكتشاف ميزات القالب قبل إدخال بياناتك الحقيقيّة',
      step4OptionYes:   'نعم — املأ القالب ببيانات تجريبيّة (60 دخل + 60 مصاريف)',
      step4OptionNo:    'لا — أريد قالباً فارغاً جاهزاً لبياناتي الحقيقيّة',

      // Step 5 - Done
      step5Title:       '🎉 الإعداد مكتمل!',
      step5Sub:         'كلّ شيء جاهز. يمكنك البدء الآن.',
      step5Tip1:        '💡 افتح "لوحة التحكم" لمعاينة ملخّصك المالي',
      step5Tip2:        '💡 استخدم قائمة 💎 SmartBudget للتنقّل السريع',
      step5Tip3:        '💡 شغّل "🩺 فحص صحّة النظام" أسبوعياً للتأكّد من سلامة الصيغ',
      step5OpenDash:    '📊 افتح لوحة التحكم',
      step5OpenWelcome: '🏠 ابقَ على صفحة الترحيب',

      // Server-side prompts
      applyTitle:       'تطبيق إعدادات المعالج',
      applyingLang:     'جاري تطبيق اللغة...',
      applyingCurrency: 'جاري تطبيق العملة الرئيسيّة...',
      applyingDemo:     'جاري تعبئة البيانات التجريبيّة... (30-60 ث)',
      applySuccess:     'تمّ تطبيق جميع الإعدادات بنجاح',
      applyError:       ({err}) => `حدث خطأ: ${err}`,

      // Already-completed prompt (shown if user re-opens wizard)
      alreadyDoneTitle: 'تمّ الإعداد سابقاً',
      alreadyDoneBody:  'لقد أكملت معالج الإعداد من قبل. هل تريد إعادة تشغيله؟',

      // Auto-prompt on first open
      firstOpenPrompt:  'مرحباً! يبدو أنّك تستعمل SmartBudget لأوّل مرّة. هل تريد فتح معالج الإعداد لإرشادك؟'
    },

    // Export Engine (Module 08_Export.gs) — Phase 4
    export: {
      pickerTitle:     'اختر الشهر للتصدير',
      pickerPrompt:    'أدخل اسم الشهر تماماً كما يظهر في التبويب (مثال: جانفي):',
      monthNotFound:   ({name}) => `الورقة "${name}" غير موجودة. تحقق من الاسم.`,
      activeNotMonth:  'الورقة النشطة ليست ورقة شهرية. افتح أحد الأشهر (جانفي - ديسمبر) ثم أعد المحاولة.',
      generating:      'جاري إنشاء ملف PDF... قد يستغرق 5-15 ثانية.',
      successTitle:    'تم التصدير بنجاح',
      successBody:     ({fileName, folderName}) =>
        `تم إنشاء التقرير:\n\n${fileName}\n\n` +
        `📁 الموقع في Drive: ${folderName}\n` +
        `يمكنك فتح الملف من Google Drive أو مشاركته عبر الرابط.`,
      successWithLink: ({fileName, folderName, url}) =>
        `تم إنشاء التقرير:\n\n${fileName}\n\n` +
        `📁 الموقع: ${folderName}\n\n` +
        `🔗 رابط مباشر:\n${url}`,
      failureTitle:    'فشل التصدير',
      failureBody:     ({err}) =>
        `حدث خطأ أثناء التصدير:\n\n${err}\n\n` +
        'تأكد من منح الصلاحيات الكاملة لـ Apps Script (Drive + Spreadsheets) وأعد المحاولة.',
      annualConfirm:   'سيتم تصدير 14 ورقة (12 شهر + لوحة التحكم + الأهداف) في PDF واحد. ' +
                       'قد يستغرق العمل 30-60 ثانية. متابعة؟',
      progressMonth:   ({n}) => `جاري تصدير الشهر ${n}/12...`,
      folderName:      'SmartBudget Reports',
      filePrefixMonth: 'SmartBudget_Month',
      filePrefixDash:  'SmartBudget_Dashboard',
      filePrefixAnnual:'SmartBudget_Annual_Report'
    },

    // Formula integrity manifest (Module 07_Manifest.gs)
    integrity: {
      reportTitle:   'تقرير سلامة الصيغ',
      header:        ({timestamp, total}) =>
        `🔍 فحص سلامة الصيغ\nوقت الفحص: ${timestamp}\nإجمالي الصيغ المراقبة: ${total}\n═══════════════════════════\n\n`,
      allHealthy:    '✅ كل الصيغ سليمة. النظام في حالة ممتازة.',
      foundIssues:   ({n}) => `🔴 تم اكتشاف ${n} مشكلة في الصيغ:\n\n`,
      issueRow:      ({sheet, cell, status}) => `  • ${sheet}!${cell} — ${status}\n`,
      statusMissing: 'الصيغة مفقودة (الخلية فارغة)',
      statusAltered: 'الصيغة معدلة عن النسخة الأصلية',
      statusSheetMissing: 'الورقة غير موجودة',
      footerWithIssues: '\nاضغط "إصلاح تلقائي" من قائمة SmartBudget لاستعادة الصيغ.',

      repairTitle:   'الإصلاح التلقائي للصيغ',
      repairConfirm: ({n}) =>
        `سيتم استعادة ${n} صيغة إلى نسختها الأصلية. ` +
        'القيم التي تكتبها في خلايا الإدخال لن تتأثر. متابعة؟',
      repairDoneTitle: 'تم الإصلاح',
      repairDoneBody:  ({n}) =>
        `تم استعادة ${n} صيغة بنجاح. شغل "إعادة بناء اللوحة" إن لزم تحديث الرسوم.`,
      repairNothingTitle: 'لا حاجة للإصلاح',
      repairNothingBody:  'كل الصيغ سليمة بالفعل، لا يوجد ما يستلزم استعادته.',
      repairSheetMissing: ({n}) =>
        `${n} ورقة غير موجودة - شغل "إعادة التثبيت" بدل ذلك.`
    },

    // ------------------------------------------------------------------
    // Common dialog buttons / shared confirmations
    // ------------------------------------------------------------------
    common: {
      warningTitle: 'تحذير',
      sheetMissingTitle: 'الورقة غير موجودة',
      sheetMissingBody: 'الرجاء تشغيل التثبيت أولا من قائمة SmartBudget.'
    },

    // ------------------------------------------------------------------
    // Install entry point (06_Core.gs / installSmartBudgetPro2026)
    // ------------------------------------------------------------------
    install: {
      preflight:        'يبدو أن المصنف يحوي بيانات. الأوراق ذات الأسماء المتطابقة ستستبدل. متابعة؟',
      successTitle:     'SMARTBUDGET PRO 2026 - تم التركيب',
      successBody:      ({sheets, secs}) =>
        `تم تركيب ${sheets} ورقة في ${secs} ثانية.\n\n` +
        'افتح "لوحة التحكم"، اختر السنة في B4 والعملة في D4.\n\n' +
        'دوال إضافية: fillAllMonthsWithDemoData, addMonthlyVisualAnalytics.'
    },

    // ------------------------------------------------------------------
    // Full-demo flow (06_Core.gs / tryFullDemoSmartBudget)
    // ------------------------------------------------------------------
    demo: {
      readyTitle:  'SMARTBUDGET PRO 2026 - النسخة التجريبية جاهزة',
      readyBody:   ({income, expense, secs}) =>
        'تم تركيب القالب بالكامل وتعبئته ببيانات تجريبية:\n\n' +
        '• 12 ورقة شهرية (جانفي - ديسمبر)\n' +
        `• ${income} صف دخل + ${expense} صف مصاريف\n` +
        '• 4 أهداف ادخار في حالات مختلفة\n' +
        '• لوحة تحكم بـ 6 بطاقات KPI + 5 رسوم بيانية\n' +
        '• مخططات شهرية داخل كل ورقة\n' +
        '• محرك تحويل عملات (USD/EUR/SAR/DZD/...)\n\n' +
        `استغرق التنفيذ ${secs} ثانية.\n\n` +
        'الآن: في "لوحة التحكم" غير السنة (B4) والعملة (D4) لرؤية التحديث اللحظي.\n\n' +
        'لاحقا: clearAllDemoData لمسح البيانات التجريبية وبدء الاستخدام الفعلي.',

      menuPromptTitle: 'تجربة القالب بالبيانات التجريبية',
      menuPromptBody:  'سيتم مسح أي بيانات حالية في المصنف ثم بناء النموذج التجريبي الكامل.\n\n' +
                       'الوقت المتوقع: 60-90 ثانية. متابعة؟',

      filledTitle: 'تمت تعبئة البيانات التجريبية',
      filledBody:  ({processed, income, expense, secs}) =>
        `${processed} ورقة، ${income} دخل + ${expense} مصاريف، ${secs} ث.`,

      clearPromptTitle: 'مسح البيانات التجريبية',
      clearPromptBody:  'سيتم مسح صفوف A10:H14 و A33:G37 في كل الأشهر. متابعة؟',
      clearedTitle:     'تم المسح',
      clearedBody:      ({n}) => `${n} ورقة.`
    },

    // ------------------------------------------------------------------
    // Monthly visual analytics (05_Demo_QA.gs)
    // ------------------------------------------------------------------
    analytics: {
      addedTitle:    'تمت إضافة التحليل البصري',
      addedBody:     ({n}) => `${n} ورقة، 2 مخطط لكل منها.`,
      removePrompt:  'سيتم حذف المخططات والبيانات المساعدة من 12 ورقة. متابعة؟',
      removeTitle:   'إزالة التحليل البصري الشهري',
      removedTitle:  'تمت الإزالة',
      removedBody:   ({n}) => `${n} ورقة.`
    },

    // ------------------------------------------------------------------
    // Repair (05_Demo_QA.gs / repairDashboardV2)
    // ------------------------------------------------------------------
    repair: {
      doneTitle: 'تم الإصلاح',
      doneBody:  'أعيد بناء صيغ المحرك والرسوم البيانية.'
    },

    // ------------------------------------------------------------------
    // Nuclear reset (05_Demo_QA.gs / resetWorkbookCompletely)
    // ------------------------------------------------------------------
    reset: {
      promptTitle: 'تحذير: سيتم حذف كل البيانات',
      promptBody:  'سيتم حذف جميع الأوراق والصيغ والبيانات في هذا المصنف. ' +
                   'هذه العملية لا يمكن التراجع عنها. متابعة؟',
      doneTitle:   'تم إعادة الضبط',
      doneBody:    'المصنف نظيف تماما. الآن شغل tryFullDemoSmartBudget لإنشاء القالب من جديد.'
    },

    // ------------------------------------------------------------------
    // System Health Center (06_Core.gs / runHealthCheck)
    // ------------------------------------------------------------------
    health: {
      reportTitle: 'فحص صحة النظام',
      header:      ({timestamp}) =>
        `🩺 تقرير صحة النظام\nوقت الفحص: ${timestamp}\n═══════════════════════════\n\n`,

      sectionErrors:   ({n}) => `🔴 أخطاء حرجة (${n})\n`,
      sectionWarnings: ({n}) => `🟡 تحذيرات (${n})\n`,
      sectionPasses:   ({n}) => `✅ يعمل بشكل صحيح (${n})\n`,

      footer:          '═══════════════════════════\n',
      remedyErrors:    'موصى به: قائمة SmartBudget ← إعادة بناء اللوحة\n' +
                       'إن استمرت المشاكل: قائمة SmartBudget ← إعادة الضبط الكامل',
      remedyWarnings:  'النظام يعمل، لكن راجع التحذيرات أعلاه',
      remedyHealthy:   '🎉 النظام في حالة ممتازة',

      sheetsOK:        '17 ورقة موجودة',
      sheetsMissing:   ({n, list}) => `أوراق ناقصة (${n}): ${list}`,
      namesOK:         '11 نطاق مسمى موجود',
      namesMissing:    ({list}) => `نطاقات ناقصة: ${list}`,
      chartsOK:        ({n}) => `${n} رسم بياني على لوحة التحكم`,
      chartsPartial:   ({n}) => `عدد الرسوم البيانية ناقص: ${n}/5`,
      chartsNone:      'لا توجد رسوم بيانية على لوحة التحكم',
      formulaB4OK:     'صيغة العملة النشطة (XLOOKUP) سليمة',
      formulaB4Bad:    'صيغة الإعدادات B4 محذوفة أو معطلة',
      fxLive:          'محرك العملات الحي (GOOGLEFINANCE) متصل',
      fxFallback:      'محرك العملات يستخدم أسعار ثابتة فقط',
      engineProtected: 'ورقة المحرك محمية',
      engineExposed:   'ورقة المحرك غير محمية - بيانات حساسة معرضة',
      validationsOK:   'قوائم الفئات (dropdown) نشطة على الأوراق الشهرية',
      validationsBad:  ({n}) => `قواعد التحقق ناقصة: ${n}/3 ورقة فحصت`,
      selectorsOK:     ({year, currency}) => `محددات السنة (${year}) والعملة (${currency}) مضبوطة`,
      selectorsEmpty:  'محددات السنة أو العملة فارغة على لوحة التحكم'
    },

    // ------------------------------------------------------------------
    // Welcome page strings (02_Sheets.gs / buildWelcomeV2)
    // ------------------------------------------------------------------
    welcome: {
      ctaLabel:  '🚀  Get Started - ابدأ الإعداد',
      hero:      'SMARTBUDGET PRO 2026',
      subtag:    'Premium Arabic Fintech Template',
      body:      'محرك عملات متعدد، 12 ورقة شهرية، نظام أهداف وادخار، ' +
                 'لوحة تحكم بنظام عابر للسنوات (Evergreen) مع تحويل عملات حي ' +
                 'وعداد صحة مالية تفاعلي.',
      developer: '💎 Developed by: Boulahdid Djamal Eddine',
      contact:   '📩 boulahdiddjamaleddine@gmail.com',
      version:   'SMARTBUDGET PRO 2026 - v2.0',

      cards: [
        { id: '01', title: 'اضبط الإعدادات أولا',
          body: 'افتح ورقة الإعدادات واختر العملة الرئيسية وحدث أسعار الصرف.',
          link: '📘 الإعدادات' },
        { id: '02', title: 'أدخل بياناتك الشهرية',
          body: 'افتح ورقة الشهر الحالي وأدخل المداخيل في A10:H28 والمصاريف في A33:G62.',
          link: '📅 جانفي' },
        { id: '03', title: 'افتح لوحة التحكم',
          body: 'بعد الإدخال، افتح لوحة التحكم. اختر السنة والعملة في الأعلى.',
          link: '📊 لوحة التحكم' }
      ]
    }
  },

  // ====================================================================
  // ENGLISH LANGUAGE PACK — same shape as TEXTS.ar, parallel keys
  // ====================================================================
  en: {
    menu: {
      title:           '💎 SmartBudget',
      freshDemo:       '🚀 Try template with demo data',
      navSubmenu:      '🔀 Quick Navigation',
      navWelcome:      '🏠 Welcome page',
      navDashboard:    '📊 Dashboard',
      navSettings:     '💰 Settings',
      navGoals:        '🎯 Goals',
      healthCheck:     '🩺 System Health Check',
      repairDashboard: '♻️ Rebuild Dashboard',
      fillDemo:        '📥 Fill with demo data',
      clearDemo:       '🧹 Clear demo data',
      reset:           '⚠️ Full Reset',
      reinstall:       '🛠️ Reinstall',
      langSubmenu:     '🌐 Language',
      langArabic:      '🇸🇦 العربية',
      langEnglish:     '🇬🇧 English',
      verifyFormulas:  '🔍 Verify Formula Integrity',
      autoRepair:      '🔧 Auto-Repair Formulas',
      exportSubmenu:   '📄 Export Reports',
      exportMonth:     '📅 Export Current Month as PDF',
      exportDashboard: '📊 Export Dashboard as PDF',
      exportAnnual:    '📚 Export Annual Report as PDF',
      onboarding:      '🧙 Setup Wizard'
    },

    onboarding: {
      sidebarTitle:     '🧙 SmartBudget Setup Wizard',
      stepLabel:        ({n, total}) => `Step ${n} of ${total}`,
      btnNext:          'Next →',
      btnBack:          '← Back',
      btnSkip:          'Skip',
      btnFinish:        '🎉 Finish Setup',
      btnLater:         'Later',

      step1Title:       'Welcome to SmartBudget Pro',
      step1Sub:         'We will guide you through 5 quick steps to set up your financial template',
      step1Body:        'This template includes a live currency engine, 12 monthly sheets, a savings goals ' +
                        'system, an advanced dashboard, and a formula integrity engine. Everything is ready ' +
                        'to use once setup completes.',

      step2Title:       'Choose your interface language',
      step2Sub:         'You can change it later from the 🌐 Language menu',
      langArOption:     '🇸🇦 العربية',
      langEnOption:     '🇬🇧 English',

      step3Title:       'Pick your main currency',
      step3Sub:         'All amounts will display in this currency by default. You can switch live from the dashboard.',
      step3Help:        'Currencies supported with live GOOGLEFINANCE rates',

      step4Title:       'Want demo data?',
      step4Sub:         'Useful for exploring template features before entering your real data',
      step4OptionYes:   'Yes — fill the template with demo data (60 income + 60 expenses)',
      step4OptionNo:    'No — I want an empty template ready for my real data',

      step5Title:       '🎉 Setup complete!',
      step5Sub:         'Everything is ready. You can start now.',
      step5Tip1:        '💡 Open the Dashboard to see your financial summary',
      step5Tip2:        '💡 Use the 💎 SmartBudget menu for quick navigation',
      step5Tip3:        '💡 Run "🩺 System Health Check" weekly to verify formula integrity',
      step5OpenDash:    '📊 Open Dashboard',
      step5OpenWelcome: '🏠 Stay on Welcome page',

      applyTitle:       'Applying wizard settings',
      applyingLang:     'Applying language...',
      applyingCurrency: 'Applying main currency...',
      applyingDemo:     'Filling demo data... (30-60s)',
      applySuccess:     'All settings applied successfully',
      applyError:       ({err}) => `An error occurred: ${err}`,

      alreadyDoneTitle: 'Setup already completed',
      alreadyDoneBody:  'You have already completed the setup wizard. Do you want to run it again?',

      firstOpenPrompt:  'Welcome! It looks like this is your first time using SmartBudget. Want to open the setup wizard to guide you?'
    },

    export: {
      pickerTitle:     'Pick a month to export',
      pickerPrompt:    'Enter the month name exactly as it appears on the tab (e.g. جانفي):',
      monthNotFound:   ({name}) => `Sheet "${name}" not found. Check the name.`,
      activeNotMonth:  'The active sheet is not a monthly sheet. Open one of the months (Jan-Dec) and try again.',
      generating:      'Generating PDF... 5-15 seconds.',
      successTitle:    'Export successful',
      successBody:     ({fileName, folderName}) =>
        `Report created:\n\n${fileName}\n\n` +
        `📁 Drive location: ${folderName}\n` +
        `Open from Google Drive or share via link.`,
      successWithLink: ({fileName, folderName, url}) =>
        `Report created:\n\n${fileName}\n\n` +
        `📁 Location: ${folderName}\n\n` +
        `🔗 Direct link:\n${url}`,
      failureTitle:    'Export failed',
      failureBody:     ({err}) =>
        `An error occurred during export:\n\n${err}\n\n` +
        'Make sure Apps Script has full permissions (Drive + Spreadsheets) and try again.',
      annualConfirm:   '14 sheets (12 months + dashboard + goals) will be exported into a single PDF. ' +
                       'May take 30-60 seconds. Continue?',
      progressMonth:   ({n}) => `Exporting month ${n}/12...`,
      folderName:      'SmartBudget Reports',
      filePrefixMonth: 'SmartBudget_Month',
      filePrefixDash:  'SmartBudget_Dashboard',
      filePrefixAnnual:'SmartBudget_Annual_Report'
    },

    integrity: {
      reportTitle:   'Formula Integrity Report',
      header:        ({timestamp, total}) =>
        `🔍 Formula Integrity Scan\nScan time: ${timestamp}\nFormulas tracked: ${total}\n═══════════════════════════\n\n`,
      allHealthy:    '✅ All tracked formulas intact. System in excellent condition.',
      foundIssues:   ({n}) => `🔴 ${n} formula issue${n === 1 ? '' : 's'} detected:\n\n`,
      issueRow:      ({sheet, cell, status}) => `  • ${sheet}!${cell} — ${status}\n`,
      statusMissing: 'Formula missing (cell is empty)',
      statusAltered: 'Formula has been modified from original',
      statusSheetMissing: 'Parent sheet not found',
      footerWithIssues: '\nClick "Auto-Repair Formulas" from the SmartBudget menu to restore.',

      repairTitle:   'Formula Auto-Repair',
      repairConfirm: ({n}) =>
        `${n} formula${n === 1 ? '' : 's'} will be restored to original. ` +
        'Values you have entered in input cells are NOT affected. Continue?',
      repairDoneTitle: 'Repair complete',
      repairDoneBody:  ({n}) =>
        `${n} formula${n === 1 ? '' : 's'} restored successfully. Run "Rebuild Dashboard" if charts need refreshing.`,
      repairNothingTitle: 'Nothing to repair',
      repairNothingBody:  'All tracked formulas are already intact.',
      repairSheetMissing: ({n}) =>
        `${n} parent sheet${n === 1 ? '' : 's'} missing — run "Reinstall" instead.`
    },

    common: {
      warningTitle:      'Warning',
      sheetMissingTitle: 'Sheet not found',
      sheetMissingBody:  'Please run install first from the SmartBudget menu.'
    },

    install: {
      preflight:    'The workbook appears to contain data. Sheets with matching names will be replaced. Continue?',
      successTitle: 'SMARTBUDGET PRO 2026 - Installed',
      successBody:  ({sheets, secs}) =>
        `Installed ${sheets} sheets in ${secs} seconds.\n\n` +
        'Open "Dashboard", select year in B4 and currency in D4.\n\n' +
        'Optional: fillAllMonthsWithDemoData, addMonthlyVisualAnalytics.'
    },

    demo: {
      readyTitle: 'SMARTBUDGET PRO 2026 - Demo ready',
      readyBody:  ({income, expense, secs}) =>
        'Template installed and populated with demo data:\n\n' +
        '• 12 monthly sheets (Jan - Dec)\n' +
        `• ${income} income rows + ${expense} expense rows\n` +
        '• 4 savings goals in different states\n' +
        '• Dashboard with 6 KPI cards + 5 charts\n' +
        '• Mini charts inside each monthly sheet\n' +
        '• Multi-currency engine (USD/EUR/SAR/DZD/...)\n\n' +
        `Completed in ${secs} seconds.\n\n` +
        'Now: in "Dashboard" change year (B4) and currency (D4) to see live updates.\n\n' +
        'Later: clearAllDemoData wipes demo rows so you can start real entry.',

      menuPromptTitle: 'Try template with demo data',
      menuPromptBody:  'All current data in this workbook will be wiped, then the demo template will be rebuilt.\n\n' +
                       'Estimated time: 60-90 seconds. Continue?',

      filledTitle: 'Demo data filled',
      filledBody:  ({processed, income, expense, secs}) =>
        `${processed} sheets, ${income} income + ${expense} expenses, ${secs}s.`,

      clearPromptTitle: 'Clear demo data',
      clearPromptBody:  'Rows A10:H14 and A33:G37 in every monthly sheet will be cleared. Continue?',
      clearedTitle:     'Cleared',
      clearedBody:      ({n}) => `${n} sheets.`
    },

    analytics: {
      addedTitle:    'Visual analytics added',
      addedBody:     ({n}) => `${n} sheets, 2 charts each.`,
      removeTitle:   'Remove monthly visual analytics',
      removePrompt:  'Charts and helper data will be removed from 12 sheets. Continue?',
      removedTitle:  'Removed',
      removedBody:   ({n}) => `${n} sheets.`
    },

    repair: {
      doneTitle: 'Repair complete',
      doneBody:  'Dashboard engine formulas and charts have been rebuilt.'
    },

    reset: {
      promptTitle: 'Warning: all data will be deleted',
      promptBody:  'All sheets, formulas, and data in this workbook will be deleted. ' +
                   'This cannot be undone. Continue?',
      doneTitle:   'Reset complete',
      doneBody:    'Workbook is fully clean. Now run tryFullDemoSmartBudget to rebuild the template.'
    },

    health: {
      reportTitle: 'System Health Check',
      header:      ({timestamp}) =>
        `🩺 System Health Report\nScan time: ${timestamp}\n═══════════════════════════\n\n`,

      sectionErrors:   ({n}) => `🔴 Critical errors (${n})\n`,
      sectionWarnings: ({n}) => `🟡 Warnings (${n})\n`,
      sectionPasses:   ({n}) => `✅ Working correctly (${n})\n`,

      footer:         '═══════════════════════════\n',
      remedyErrors:   'Recommended: SmartBudget menu -> Rebuild Dashboard\n' +
                      'If problems persist: SmartBudget menu -> Full Reset',
      remedyWarnings: 'System is functional, but review the warnings above',
      remedyHealthy:  '🎉 System is in excellent condition',

      sheetsOK:        '17 sheets present',
      sheetsMissing:   ({n, list}) => `Missing sheets (${n}): ${list}`,
      namesOK:         '11 named ranges defined',
      namesMissing:    ({list}) => `Missing named ranges: ${list}`,
      chartsOK:        ({n}) => `${n} charts on dashboard`,
      chartsPartial:   ({n}) => `Chart count incomplete: ${n}/5`,
      chartsNone:      'No charts on dashboard',
      formulaB4OK:     'Active currency formula (XLOOKUP) intact',
      formulaB4Bad:    'Settings B4 formula deleted or corrupted',
      fxLive:          'Live FX engine (GOOGLEFINANCE) connected',
      fxFallback:      'FX engine using static fallback rates only',
      engineProtected: 'Engine sheet is protected',
      engineExposed:   'Engine sheet not protected - sensitive data exposed',
      validationsOK:   'Category dropdowns active on monthly sheets',
      validationsBad:  ({n}) => `Validations incomplete: ${n}/3 sheets checked`,
      selectorsOK:     ({year, currency}) => `Year (${year}) and currency (${currency}) selectors set`,
      selectorsEmpty:  'Year or currency selector empty on dashboard'
    },

    welcome: {
      ctaLabel:  '🚀  Get Started',
      hero:      'SMARTBUDGET PRO 2026',
      subtag:    'Premium Multi-Currency Fintech Template',
      body:      'Multi-currency engine, 12 monthly budget sheets, savings goals system, ' +
                 'evergreen dashboard with live FX conversion and an interactive financial ' +
                 'health gauge.',
      developer: '💎 Developed by: Boulahdid Djamal Eddine',
      contact:   '📩 boulahdiddjamaleddine@gmail.com',
      version:   'SMARTBUDGET PRO 2026 - v2.0',

      cards: [
        { id: '01', title: 'Configure settings first',
          body: 'Open the Settings sheet, choose your main currency, and update FX rates.',
          link: '📘 Settings' },
        { id: '02', title: 'Enter your monthly data',
          body: 'Open the current month sheet and enter income in A10:H28 and expenses in A33:G62.',
          link: '📅 January' },
        { id: '03', title: 'Open the Dashboard',
          body: 'After data entry, open the Dashboard. Select year and currency at the top.',
          link: '📊 Dashboard' }
      ]
    }
  }
};
function t(path, params) {
  const dict = TEXTS[getActiveLang()];
  if (!dict) {
    Logger.log(`[t] no language pack for ${getActiveLang()}`);
    return path;
  }

  const value = path.split('.').reduce((acc, key) => acc && acc[key], dict);

  if (value === undefined || value === null) {
    Logger.log(`[t] missing key: ${path}`);
    return path;
  }

  if (typeof value === 'function') {
    try { return value(params || {}); }
    catch (e) {
      Logger.log(`[t] template error for ${path}: ${e}`);
      return path;
    }
  }

  return value;
}
