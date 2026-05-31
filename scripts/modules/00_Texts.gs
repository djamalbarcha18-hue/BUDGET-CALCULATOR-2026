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
// ACTIVE LANGUAGE — change this single value to switch UI language globally
// ============================================================================
const ACTIVE_LANG = 'ar';

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
      reinstall:       '🛠️ إعادة التثبيت'
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
  }
};

// ============================================================================
// t() — string lookup with template substitution
// ----------------------------------------------------------------------------
//   t('install.successTitle')                -> static string
//   t('install.successBody', {sheets, secs}) -> calls the function
// ----------------------------------------------------------------------------
function t(path, params) {
  const dict = TEXTS[ACTIVE_LANG];
  if (!dict) {
    Logger.log(`[t] no language pack for ${ACTIVE_LANG}`);
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
