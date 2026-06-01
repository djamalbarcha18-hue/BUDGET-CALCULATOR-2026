/**
 * SMARTBUDGET PRO 2026 - Module 12: Embedded User Guide System
 * =============================================================================
 * Phase 8 of the Strategic Refactor Plan.
 *
 * Three complementary documentation surfaces, each chosen because it solves
 * a different user problem:
 *
 *   1. INTERACTIVE HELP SIDEBAR  (UserGuideSidebar.html)
 *      Opens from the menu, auto-detects the active sheet, displays the
 *      most relevant topic, supports search across all topics. The "I'm
 *      stuck right now" surface.
 *
 *   2. CELL TOOLTIPS  (setNote on key input cells)
 *      Hover-to-see explanations on every important input cell. The
 *      "What does this column mean?" surface. Zero clicks needed.
 *
 *   3. PRINTABLE GUIDE SHEET  (📚 الدليل / 📚 Guide)
 *      A dedicated workbook sheet that mirrors the help content as a
 *      classical printed manual. The "I want to print and share" surface.
 *
 * READ-ONLY GUARANTEE
 * -------------------
 * The Guide sheet and the tooltips are the ONLY writes. No formulas, no
 * dashboard cells, no monthly sheet data is touched.
 *
 * BILINGUAL FROM DAY ONE
 * ----------------------
 * Every visible string flows through t() and getActiveLang(). The user's
 * current language choice (from Phase 2) drives the entire help system.
 */

// ============================================================================
// CONFIGURATION
// ============================================================================
const GUIDE_SHEET_NAME = '📚 الدليل';

// ============================================================================
// PUBLIC ENTRY POINTS — wired into the Help submenu
// ============================================================================

/**
 * Opens the interactive help sidebar. Detects the active sheet and
 * surfaces its topic by default.
 */
function menuOpenHelp() {
  const html = HtmlService
    .createHtmlOutputFromFile('UserGuideSidebar')
    .setTitle(t('help.sidebarTitle'))
    .setWidth(400);
  SpreadsheetApp.getUi().showSidebar(html);
}

/**
 * Builds (or rebuilds) the printable guide sheet.
 * Idempotent — clears + rewrites every cell.
 */
function menuBuildGuideSheet() {
  const ss = SpreadsheetApp.getActive();
  _buildGuideSheet(ss);
  SpreadsheetApp.flush();

  const guide = ss.getSheetByName(GUIDE_SHEET_NAME);
  if (guide) ss.setActiveSheet(guide);

  SpreadsheetApp.getUi().alert(
    t('help.guideBuiltTitle'),
    t('help.guideBuiltBody'),
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

/**
 * Adds setNote() tooltips to every documented input cell across the
 * workbook (Settings, Monthly sheets, Dashboard, Goals).
 */
function menuEnableTooltips() {
  const ss = SpreadsheetApp.getActive();
  const tooltipMap = _buildTooltipMap();
  let count = 0;

  Object.keys(tooltipMap).forEach(sheetName => {
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) return;
    Object.keys(tooltipMap[sheetName]).forEach(cellA1 => {
      try {
        sheet.getRange(cellA1).setNote(tooltipMap[sheetName][cellA1]);
        count++;
      } catch (e) {
        Logger.log(`[Tooltips] failed on ${sheetName}!${cellA1}: ${e}`);
      }
    });
  });

  SpreadsheetApp.flush();
  SpreadsheetApp.getUi().alert(
    t('help.tooltipsAddedTitle'),
    t('help.tooltipsAddedBody', { n: count }),
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

/**
 * Removes every tooltip the help system added. Pure cleanup.
 */
function menuRemoveTooltips() {
  const ss = SpreadsheetApp.getActive();
  const tooltipMap = _buildTooltipMap();

  Object.keys(tooltipMap).forEach(sheetName => {
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) return;
    Object.keys(tooltipMap[sheetName]).forEach(cellA1 => {
      try { sheet.getRange(cellA1).clearNote(); } catch (e) {}
    });
  });

  SpreadsheetApp.flush();
  SpreadsheetApp.getUi().alert(
    t('help.tooltipsRemovedTitle'),
    t('help.tooltipsRemovedBody'),
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

// ============================================================================
// CLIENT-CALLABLE API (used by UserGuideSidebar.html via google.script.run)
// ============================================================================

/**
 * Bootstrap the sidebar with everything it needs in ONE round-trip:
 *   - Active sheet name (so it can auto-select the right topic)
 *   - Localized topics dictionary (already pre-resolved through t())
 *   - Direction (rtl / ltr) and language code
 *   - Static labels (search placeholder, section headers, etc.)
 */
function getHelpBootstrap() {
  const ss = SpreadsheetApp.getActive();
  const lang = getActiveLang();
  const isAr = lang === 'ar';

  // Detect current sheet name
  let activeSheetName = '';
  try { activeSheetName = ss.getActiveSheet().getName(); } catch (e) {}

  // Map active sheet name to a topic key.
  // We need this server-side because monthly sheets have 12 names but share
  // one topic, and SHEET_NAMES values differ from canonical topic keys.
  const topicKey = _resolveTopicForSheet(activeSheetName);

  // Pre-resolve the labels block — flat keys only, no template functions
  const labels = {};
  const helpDict = TEXTS[lang].help;
  Object.keys(helpDict).forEach(k => {
    const v = helpDict[k];
    if (typeof v !== 'function' && typeof v !== 'object') {
      labels[k] = v;
    }
  });

  return {
    lang,
    direction: isAr ? 'rtl' : 'ltr',
    fontFamily: isAr ? 'Cairo' : 'Inter',
    activeSheetName,
    activeTopicKey: topicKey,
    topics: helpDict.topics,   // full nested dictionary
    labels
  };
}

/**
 * Used by the sidebar's "open this sheet" deep-links. Activating the sheet
 * server-side (rather than via gid hyperlink) keeps the sidebar context
 * stable so the user can keep reading while exploring.
 */
function helpJumpToSheet(name) {
  try {
    const ss = SpreadsheetApp.getActive();
    const target = ss.getSheetByName(name);
    if (target) { ss.setActiveSheet(target); return true; }
    return false;
  } catch (e) { return false; }
}

// ============================================================================
// TOPIC RESOLVER
// ----------------------------------------------------------------------------
// Maps a sheet name to one of the 8 documentation topic keys.
// Falls back to 'general' if the active sheet has no specific guide.
// ============================================================================
function _resolveTopicForSheet(sheetName) {
  if (!sheetName) return 'general';

  // Monthly sheets — one topic for all 12
  if (MONTHS.indexOf(sheetName) >= 0) return 'monthly';

  // Direct mappings
  const map = {};
  map[SHEET_NAMES.welcome]   = 'general';
  map[SHEET_NAMES.settings]  = 'settings';
  map[SHEET_NAMES.goals]     = 'goals';
  map[SHEET_NAMES.dashboard] = 'dashboard';
  // Forecast sheet — name has variable emoji prefix
  if (sheetName.indexOf('التوقّعات') >= 0 || sheetName.toLowerCase().indexOf('forecast') >= 0) {
    return 'forecast';
  }
  if (sheetName.indexOf('الدليل') >= 0 || sheetName.toLowerCase().indexOf('guide') >= 0) {
    return 'general';
  }

  return map[sheetName] || 'general';
}

// ============================================================================
// PRINTABLE GUIDE SHEET BUILDER
// ============================================================================
function _buildGuideSheet(ss) {
  const s = getOrCreateSheet(ss, GUIDE_SHEET_NAME);
  s.clear();

  s.getRange(1, 1, 200, 8).setBackground(T.bgPage)
    .setFontColor(T.fgPrimary).setFontFamily(FONT);
  for (let c = 1; c <= 8; c++) s.setColumnWidth(c, 110);

  // ---- Title ----
  mergeAndStyle(s, 'A1:H1', t('help.guideSheetTitle'),
    { bg: T.bgPage, fg: T.fgPrimary, size: 22, bold: true,
      align: 'center', vAlign: 'middle', fontFamily: FONT });
  s.setRowHeight(1, 44);

  mergeAndStyle(s, 'A2:H2', t('help.guideSheetSub'),
    { bg: T.bgPage, fg: T.fgMuted, size: 13, align: 'center', fontFamily: FONT });
  s.setRowHeight(2, 26);

  // ---- TOC ----
  mergeAndStyle(s, 'A4:H4', t('help.tocTitle'),
    { bg: T.bgCardSoft, fg: T.fgPrimary, size: 16, bold: true,
      align: 'center', fontFamily: FONT });
  applyGlassBorder(s.getRange('A4:H4'));
  s.setRowHeight(4, 30);

  const lang = getActiveLang();
  const topics = TEXTS[lang].help.topics;
  const topicKeys = Object.keys(topics);

  // TOC rows (one per topic)
  topicKeys.forEach((key, i) => {
    const row = 5 + i;
    s.getRange(row, 1, 1, 8).setBackground(T.bgCardSoft).setFontFamily(FONT);
    mergeAndStyle(s, `A${row}:H${row}`, `${i + 1}. ${topics[key].title}`,
      { bg: T.bgCardSoft, fg: T.fgPrimary, size: 12,
        align: 'right', fontFamily: FONT });
  });

  // ---- Topic detail sections ----
  let row = 5 + topicKeys.length + 2;

  topicKeys.forEach((key, i) => {
    const topic = topics[key];

    // Topic header
    applyCardSurface(s, `A${row}:H${row}`);
    mergeAndStyle(s, `A${row}:H${row}`, `${i + 1}. ${topic.title}`,
      { bg: T.bgCard, fg: T.income, size: 18, bold: true,
        align: 'right', fontFamily: FONT });
    s.setRowHeight(row, 36);
    row++;

    // Each section (h + p)
    topic.sections.forEach(section => {
      // Section heading
      applyCardSurface(s, `A${row}:H${row}`);
      mergeAndStyle(s, `A${row}:H${row}`, section.h,
        { bg: T.bgCard, fg: T.fgPrimary, size: 14, bold: true,
          align: 'right', fontFamily: FONT });
      s.setRowHeight(row, 28);
      row++;

      // Section body (wrapped, 2-3 lines visually)
      applyCardSurface(s, `A${row}:H${row + 1}`);
      mergeAndStyle(s, `A${row}:H${row + 1}`, section.p,
        { bg: T.bgCard, fg: T.fgMuted, size: 12,
          align: 'right', wrap: true, fontFamily: FONT });
      s.setRowHeight(row, 24);
      s.setRowHeight(row + 1, 24);
      row += 2;
    });

    row += 1; // gap between topics
  });

  s.setFrozenRows(2);
  s.hideGridLines && s.hideGridLines();
}

// ============================================================================
// TOOLTIP MAP — every documented input cell + its hover hint
// ----------------------------------------------------------------------------
// The map is built fresh each call so the user's current language drives
// the strings. Localized via t() -> direct-key lookups (no templates here
// since tooltips are short and static).
// ============================================================================
function _buildTooltipMap() {
  const lang = getActiveLang();
  const isAr = lang === 'ar';

  // Compact tooltip strings — kept inline here (not in TEXTS) because
  // they're 30+ tiny strings and bloating TEXTS with each single-line
  // tooltip would hurt readability of the i18n dictionary.
  const tt = isAr ? {
    settingsB3:    'العملة الرئيسيّة لكل المصنّف. غيّرها لرؤية كل الأرقام بعملة جديدة.',
    settingsB4:    'تنسيق العرض المالي للعملة المختارة (محسوب آلياً).',
    settingsB5:    'سعر الصرف مقابل الدولار (محسوب آلياً من الجدول).',
    settingsF6:    'أضف/احذف فئات الدخل هنا. التغيير ينعكس على كل الأشهر.',
    settingsG6:    'أضف/احذف فئات المصاريف هنا. التغيير ينعكس على كل الأشهر.',
    settingsH6:    'طرق الدفع المستخدمة. تظهر في الـ dropdown على الأوراق الشهريّة.',
    monthlyA9:     'مصدر الدخل (اختياري). مثل: "راتب الشركة"، "عميل التصميم".',
    monthlyB9:     'تاريخ المعاملة. صيغة: dd/mm/yyyy.',
    monthlyC9:     'فئة الدخل. اختر من القائمة المنسدلة.',
    monthlyE9:     'المبلغ المتوقّع للدخل (الميزانيّة).',
    monthlyF9:     'المبلغ الفعلي المُستلَم.',
    monthlyG9:     'الفرق بين المتوقّع والفعلي (محسوب آلياً).',
    monthlyA32:    'تاريخ المصروف. صيغة: dd/mm/yyyy.',
    monthlyB32:    'فئة المصروف. اختر من القائمة المنسدلة.',
    monthlyD32:    'المبلغ المتوقّع للمصروف (الميزانيّة).',
    monthlyE32:    'المبلغ الفعلي المُنفَق.',
    monthlyH32:    'حالة التنبيه (محسوبة آلياً): 🟢 ممتاز، 🟡 اقتراب، 🔴 تجاوز.',
    goalsA6:       'اسم الهدف المالي. مثل: "شراء سيارة"، "صندوق الطوارئ".',
    goalsB6:       'التكلفة الكاملة للهدف.',
    goalsC6:       'المبلغ المدّخَر حالياً نحو هذا الهدف.',
    goalsE6:       'الموعد المستهدَف لاكتمال الهدف.',
    goalsG6:       'القسط الشهري المطلوب (محسوب آلياً).',
    goalsH6:       'حالة الهدف (محسوبة): 🟢 مكتمل، 🟡 قيد الادخار، ⚪ لم يبدأ.',
    dashB4:        'السنة المعروضة في اللوحة. غيّرها لرؤية بيانات سنة مختلفة.',
    dashD4:        'العملة المعروضة في اللوحة. كل الأرقام تتحوّل لحظياً.'
  } : {
    settingsB3:    'Main currency for the entire workbook. Change to see all amounts in a new currency.',
    settingsB4:    'Financial display format for the selected currency (auto-calculated).',
    settingsB5:    'Exchange rate vs USD (auto-calculated from the table).',
    settingsF6:    'Add/remove income categories here. Changes cascade to every month.',
    settingsG6:    'Add/remove expense categories here. Changes cascade to every month.',
    settingsH6:    'Payment methods. Appear in the dropdown on monthly sheets.',
    monthlyA9:     'Revenue source (optional). E.g. "Company salary", "Design client".',
    monthlyB9:     'Transaction date. Format: dd/mm/yyyy.',
    monthlyC9:     'Income category. Pick from the dropdown.',
    monthlyE9:     'Expected income amount (the budget).',
    monthlyF9:     'Actual income received.',
    monthlyG9:     'Difference between expected and actual (auto-calculated).',
    monthlyA32:    'Expense date. Format: dd/mm/yyyy.',
    monthlyB32:    'Expense category. Pick from the dropdown.',
    monthlyD32:    'Expected expense amount (the budget).',
    monthlyE32:    'Actual expense spent.',
    monthlyH32:    'Alert status (auto): 🟢 excellent, 🟡 approaching, 🔴 exceeded.',
    goalsA6:       'Financial goal name. E.g. "Buy a car", "Emergency fund".',
    goalsB6:       'Total goal cost.',
    goalsC6:       'Currently saved amount toward this goal.',
    goalsE6:       'Target completion date.',
    goalsG6:       'Required monthly installment (auto-calculated).',
    goalsH6:       'Goal status (auto): 🟢 complete, 🟡 in progress, ⚪ not started.',
    dashB4:        'Year displayed on the dashboard. Change to view a different year.',
    dashD4:        'Currency displayed on the dashboard. All numbers convert live.'
  };

  // Map each tooltip to its (sheet, cell) coordinate.
  // Returns: { sheetName: { cellA1: tooltipText } }
  const map = {};

  // Settings sheet
  map[SHEET_NAMES.settings] = {
    'B3': tt.settingsB3,
    'B4': tt.settingsB4,
    'B5': tt.settingsB5,
    'F6': tt.settingsF6,
    'G6': tt.settingsG6,
    'H6': tt.settingsH6
  };

  // Goals sheet — header row only (row 6)
  map[SHEET_NAMES.goals] = {
    'A6': tt.goalsA6,
    'B6': tt.goalsB6,
    'C6': tt.goalsC6,
    'E6': tt.goalsE6,
    'G6': tt.goalsG6,
    'H6': tt.goalsH6
  };

  // Dashboard
  map[SHEET_NAMES.dashboard] = {
    'B4': tt.dashB4,
    'D4': tt.dashD4
  };

  // All 12 monthly sheets share the same tooltip layout
  MONTHS.forEach(month => {
    map[month] = {
      'A9':  tt.monthlyA9,
      'B9':  tt.monthlyB9,
      'C9':  tt.monthlyC9,
      'E9':  tt.monthlyE9,
      'F9':  tt.monthlyF9,
      'G9':  tt.monthlyG9,
      'A32': tt.monthlyA32,
      'B32': tt.monthlyB32,
      'D32': tt.monthlyD32,
      'E32': tt.monthlyE32,
      'H32': tt.monthlyH32
    };
  });

  return map;
}
