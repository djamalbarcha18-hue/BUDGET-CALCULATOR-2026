/**
 * BUDGET-CALCULATOR-2026 / نظام مالي ذكي متكامل
 * Single-click Google Apps Script installer
 *
 * USAGE
 * -----
 * 1. Open https://sheets.new (a fresh empty Google Sheet)
 * 2. File -> Settings -> Locale = Saudi Arabia (or any Arabic locale)
 * 3. Extensions -> Apps Script
 * 4. Delete the placeholder `function myFunction() {}` and paste this entire file
 * 5. Save (Ctrl+S), give the project any name
 * 6. From the function dropdown at the top, pick `installBudgetCalculator2026`
 * 7. Click Run. Authorize when Google prompts (the script needs permission to
 *    edit the active spreadsheet only).
 * 8. Wait ~30-60 seconds. A success alert will appear.
 * 9. Close the Apps Script tab and return to the sheet. You will land on the
 *    welcome tab `📖 دليل الاستخدام والترحيب`.
 *
 * WHAT THIS INSTALLS
 * ------------------
 * - Phase 1: ورقة "الإعدادات وأسعار الصرف" with 14 currencies + categories +
 *   payment methods + 11 named ranges (`rng_*`) wired across the workbook.
 * - Phase 2: 12 monthly sheets (يناير → ديسمبر) with full RTL layout, alert
 *   engine on column H, KPI panel formulas, validation, and conditional
 *   formatting.
 * - Phase 3: ورقة "الأهداف المالية والادخار" with 4 baseline goals, status
 *   engine (🟢/🟡/⚪), and the smart-recommendation IFS that embeds the active
 *   currency via `TEXT(G7, rng_ActiveFormat)`.
 * - Phase 4: ورقة "اللوحة الرئيسية والتقرير السنوي" + hidden `_DashboardEngine`.
 *   Six KPI cards, three SPARKLINE progress bars, latest-5 transactions QUERY,
 *   composite health score formula, soft-lock protection layer.
 * - Phase 5: ورقة "📖 دليل الاستخدام والترحيب" at tab position 1, with the
 *   bilingual hero header, three accent-bordered Quick Start cards (with
 *   HYPERLINKs that resolve to the live sheet IDs at install time), and the
 *   developer-signature card RESTRICTED exclusively to this sheet.
 *
 * MANUAL FOLLOW-UP
 * ----------------
 * Apps Script can insert charts, but the Combo / Waterfall / Doughnut / Gauge
 * configuration in the dashboard requires visual tuning (palette per series,
 * subtotal flag on the Waterfall, gauge band ranges) that's faster in the
 * native chart editor. The data anchors (`_DashboardEngine!A1:D13`,
 * `F1:G7`, `I1:J9`, `L1:M13`, `O2`) are populated and ready. Insert the five
 * charts from the GUI per docs/07 sections 4 and 5.
 *
 * RE-RUNNING
 * ----------
 * Safe. The script asks for confirmation if it detects pre-existing content.
 * It will not overwrite a sheet that already exists (it skips silently).
 *
 * Sheet name: this file is named `install.gs` for clarity but you can paste it
 * into any `.gs` file in your Apps Script project; the entry point is
 * `installBudgetCalculator2026`.
 */

// ============================================================================
// THEME PALETTE - mirrors data/dashboard/theme_palette.csv
// ============================================================================
const T = {
  bgPage:           '#0F172A',
  bgCard:           '#1F2937',
  fgPrimary:        '#F1F5F9',
  fgMuted:          '#94A3B8',
  accentIncome:     '#10B981',
  accentExpense:    '#DC2626',
  accentNet:        '#06B6D4',
  accentTrendDown:  '#EF4444',
  gridline:         '#334155',
  paletteOrange:    '#F97316',
  paletteBlue:      '#3B82F6',
  palettePurple:    '#8B5CF6',
  palettePink:      '#EC4899',
  gaugeAmber:       '#F59E0B',
  gaugeLightGreen:  '#84CC16',
  white:            '#FFFFFF',
};

// ============================================================================
// SEED DATA - mirrors data/*.csv
// ============================================================================
const CURRENCIES = [
  ['DZD', 'الدينار الجزائري',  134.5000, '#,##0.00 "د.ج"'],
  ['SAR', 'الريال السعودي',     3.7500,  '#,##0.00 "ر.س"'],
  ['AED', 'الدرهم الإماراتي',   3.6725,  '#,##0.00 "د.إ"'],
  ['QAR', 'الريال القطري',      3.6400,  '#,##0.00 "ر.ق"'],
  ['KWD', 'الدينار الكويتي',    0.3100,  '#,##0.000 "د.ك"'],
  ['BHD', 'الدينار البحريني',   0.3760,  '#,##0.000 "د.ب"'],
  ['OMR', 'الريال العماني',     0.3845,  '#,##0.000 "ر.ع"'],
  ['EGP', 'الجنيه المصري',     48.0000, '#,##0.00 "ج.م"'],
  ['JOD', 'الدينار الأردني',    0.7090,  '#,##0.00 "د.أ"'],
  ['TND', 'الدينار التونسي',    3.1500,  '#,##0.000 "د.ت"'],
  ['MAD', 'الدرهم المغربي',     9.9500,  '#,##0.00 "د.م"'],
  ['EUR', 'اليورو',             0.9200,  '#,##0.00 €'],
  ['USD', 'الدولار الأمريكي',   1.0000,  '#,##0.00 $'],
  ['GBP', 'الجنيه الإسترليني',  0.7900,  '#,##0.00 £'],
];

const INCOME_CATEGORIES = [
  'راتب أساسي', 'مكافآت وحوافز', 'عمل حر', 'دخل استثماري',
  'إيجارات', 'أرباح تجارية', 'هدايا', 'أخرى',
];

const EXPENSE_CATEGORIES = [
  'الطعام', 'النقل', 'السكن', 'الفواتير', 'الصحة', 'التعليم',
  'التسوق', 'الترفيه', 'الاشتراكات', 'السفر', 'الطوارئ', 'أخرى',
];

const PAYMENT_METHODS = ['نقداً', 'بطاقة بنكية', 'تحويل الكتروني', 'أخرى'];

const MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

const GOALS_SEED = [
  ['شراء سيارة',         80000,   12000, '', new Date('2027-12-31'), '', '', '', ''],
  ['شراء منزل',        1200000,   50000, '', new Date('2030-12-31'), '', '', '', ''],
  ['صندوق الطوارئ',      60000,   15000, '', new Date('2026-12-31'), '', '', '', ''],
  ['السفر والاستثمار',   25000,    5000, '', new Date('2026-08-31'), '', '', '', ''],
];

const SHEET_NAMES = {
  welcome:  '📖 دليل الاستخدام والترحيب',
  settings: 'الإعدادات وأسعار الصرف',
  goals:    'الأهداف المالية والادخار',
  dashboard: 'اللوحة الرئيسية والتقرير السنوي',
  engine:   '_DashboardEngine',
};

const WARN_BRANDING   = 'هذه الكتلة جزء من الهويّة البصريّة للقالب. التعديل غير مرغوب.';
const WARN_SETTINGS   = 'هذه الورقة هي مصدر الحقيقة الوحيد للإعدادات. التعديل قد يكسر كل المصنّف.';
const WARN_CALC_CELL  = 'هذه الخلية محسوبة آلياً، لا تُعدَّل يدوياً.';
const WARN_ENGINE     = 'هذه الورقة جزء من المحرك الخلفي للوحة المعلومات. التعديل قد يكسر الصيغ والرسوم البيانية.';

// ============================================================================
// MAIN ENTRY POINT
// ============================================================================
function installBudgetCalculator2026() {
  const ss = SpreadsheetApp.getActive();
  const ui = SpreadsheetApp.getUi();

  // Pre-flight: confirm if workbook is non-empty
  const sheets = ss.getSheets();
  const nonEmpty = sheets.some(s => s.getLastRow() > 0 || s.getLastColumn() > 1);
  if (sheets.length > 1 || nonEmpty) {
    const r = ui.alert(
      'تحذير',
      'يبدو أن المصنف يحوي بيانات. هل تريد المتابعة؟ الأوراق الموجودة بنفس الأسماء ستُتجاوَز بصمت.',
      ui.ButtonSet.YES_NO);
    if (r !== ui.Button.YES) return;
  }

  // PRE-FLIGHT: create every sheet as an empty stub BEFORE any formula is written.
  // This guarantees that every cross-sheet reference (e.g. `'اللوحة الرئيسية والتقرير
  // السنوي'!B5` written from the engine builder) can be resolved by Apps Script at
  // setFormula() time. Without this, formulas referencing sheets that don't yet
  // exist get persisted as #REF! and never recover — the "ghost reference" bug.
  precreateAllSheetStubs(ss);

  // Build in canonical order (settings first because everything else references it).
  buildSettings(ss);
  buildGoals(ss);
  buildDebtsLedger(ss);        // <-- Phase 3b: جدول السلف والديون في ورقة الأهداف
  for (let i = 0; i < MONTHS.length; i++) buildMonth(ss, MONTHS[i]);
  buildDashboard(ss);          // <-- moved BEFORE the engine: card cells now exist
  buildDashboardEngine(ss);    //     so engine refs to dashboard B5/F5/J5 resolve cleanly.
  buildWelcome(ss);
  buildDemoData2025(ss);       // <-- Phase 6: حقن بيانات 2025 التجريبية (Onboarding)

  defineNamedRanges(ss);
  applyProtection(ss);
  reorderTabs(ss);

  // Hide engine sheet last (after all references resolve).
  ss.getSheetByName(SHEET_NAMES.engine).hideSheet();

  // Land the user on the welcome tab.
  const welcome = ss.getSheetByName(SHEET_NAMES.welcome);
  ss.setActiveSheet(welcome);

  ui.alert(
    'تم تركيب القالب بنجاح',
    'كل الأوراق والصيغ والنطاقات المُسماة جاهزة.\n\n' +
    'الخطوة الاختيارية المتبقية: أدرج الرسوم البيانية الخمسة في ورقة \"اللوحة الرئيسية والتقرير السنوي\" (Insert → Chart) واربطها بالنطاقات المُسمَّاة rng_dash_monthly_grid / rng_dash_waterfall / rng_dash_doughnut_income / rng_dash_doughnut_expense — لا تستخدم مراجع A1 يدوية حتى تتحدّث الرسوم تلقائياً عند أيّ تعديل.',
    ui.ButtonSet.OK);
}

// ============================================================================
// REPAIR ENTRY POINT - rewrites broken formulas WITHOUT rebuilding the workbook
// ============================================================================
/**
 * Use this on an existing workbook that already shows #REF! and #VALUE! on the
 * dashboard. It rewrites only the formulas — KPI cards, trend cells, the
 * `_DashboardEngine` engine columns G/H/I/O — and re-binds the four chart
 * named ranges. User-entered data in the monthly sheets and the goals sheet is
 * never touched.
 *
 * From the Apps Script editor function dropdown, pick `repairDashboard2026`
 * and click Run. A confirmation alert appears when the rewrite is complete.
 */
function repairDashboard2026() {
  const ss = SpreadsheetApp.getActive();
  const ui = SpreadsheetApp.getUi();

  const engine = ss.getSheetByName(SHEET_NAMES.engine);
  const dash   = ss.getSheetByName(SHEET_NAMES.dashboard);
  if (!engine || !dash) {
    ui.alert('لم يتم العثور على الأوراق المطلوبة',
      'تأكّد أنّ ورقتَي \"' + SHEET_NAMES.engine + '\" و \"' + SHEET_NAMES.dashboard +
      '\" موجودتان قبل تشغيل أداة الإصلاح.', ui.ButtonSet.OK);
    return;
  }

  // 1) Rewrite the engine cells that previously held ghost dashboard refs.
  engine.getRange('G2').setFormula('=IFERROR(H2, 0)');
  engine.getRange('G6').setFormula('=IFERROR(-1 * (H3 + G3 + G4 + G5), 0)');
  engine.getRange('G7').setFormula('=IFERROR(SUM(G2:G6), 0)');

  // 2) Rewrite engine H/I trend feeders with IFERROR armor.
  engine.getRange('H2').setFormula('=IFERROR(SUM(B2:B13), 0)');
  engine.getRange('I2').setFormula('=IFERROR(SUM(B2:B12), 0)');
  engine.getRange('H3').setFormula('=IFERROR(SUM(C2:C13), 0)');
  engine.getRange('I3').setFormula('=IFERROR(SUM(C2:C12), 0)');
  engine.getRange('H4').setFormula('=IFERROR(H2-H3, 0)');
  engine.getRange('I4').setFormula('=IFERROR(I2-I3, 0)');
  engine.getRange('H5').setFormula(`=IFERROR('${SHEET_NAMES.goals}'!D2 + O5, 0)`);
  engine.getRange('I5').setFormula(`=IFERROR('${SHEET_NAMES.goals}'!D2 + SUM(D2:D12), 0)`);
  engine.getRange('H6').setFormula(`=IFERROR('${SHEET_NAMES.goals}'!B3 * 12, 0)`);
  engine.getRange('I6').setFormula(`=IFERROR('${SHEET_NAMES.goals}'!B3 * 11, 0)`);
  engine.getRange('H7').setFormula('=IFERROR((H2-H3)/H2, 0)');
  engine.getRange('I7').setFormula('=IFERROR((I2-I3)/I2, 0)');

  // 3) Rewrite the composite health score with the engine-internal version.
  const monthlyExpectedExpenseSum = MONTHS.map(m => `'${m}'!D33:D62`).join(', ');
  engine.getRange('O2').setFormula(
    `=ROUND(40 * MAX(0, MIN(1, IFERROR((H2 - H3) / H2, 0))) + 30 * MAX(0, MIN(1, IFERROR(1 - (H3 / SUM(${monthlyExpectedExpenseSum})), 0))) + 30 * IFERROR('${SHEET_NAMES.goals}'!F2, 0), 0)`);

  // 4) Repoint the dashboard KPI big-numbers at the engine.
  dash.getRange('B5').setFormula(`=IFERROR(${SHEET_NAMES.engine}!H2, 0)`);
  dash.getRange('F5').setFormula(`=IFERROR(${SHEET_NAMES.engine}!H3, 0)`);
  dash.getRange('J5').setFormula(`=IFERROR(${SHEET_NAMES.engine}!H4, 0)`);
  dash.getRange('N5').setFormula(`=IFERROR(${SHEET_NAMES.engine}!H5, 0)`);
  dash.getRange('R5').setFormula(`=IFERROR(${SHEET_NAMES.engine}!H6, 0)`);
  dash.getRange('V5').setFormula(`=IFERROR(${SHEET_NAMES.engine}!H7, 0)`).setNumberFormat('0.0%');

  // 5) Rewrite the six trend cells with the bulletproof formula.
  dash.getRange('B7').setFormula(buildTrendFormula('H2', 'I2'));
  dash.getRange('F7').setFormula(buildTrendFormula('H3', 'I3'));
  dash.getRange('J7').setFormula(buildTrendFormula('H4', 'I4'));
  dash.getRange('N7').setFormula(buildTrendFormula('H5', 'I5'));
  dash.getRange('R7').setFormula(buildTrendFormula('H6', 'I6'));
  dash.getRange('V7').setFormula(buildTrendFormula('H7', 'I7'));

  // 6) Re-bind the four chart named ranges (idempotent — safe to re-run).
  ss.setNamedRange('rng_dash_monthly_grid',     engine.getRange('A1:D13'));
  ss.setNamedRange('rng_dash_waterfall',        engine.getRange('F1:G7'));
  ss.setNamedRange('rng_dash_doughnut_income',  engine.getRange('I1:J9'));
  ss.setNamedRange('rng_dash_doughnut_expense', engine.getRange('L1:M13'));

  SpreadsheetApp.flush();
  ui.alert(
    'تم إصلاح اللوحة',
    'أُعيدت كتابة جميع صيغ المحرّك وبطاقات المؤشّرات بإصدار محصَّن ضدّ الأخطاء، ' +
    'وأُعيد ربط النطاقات المُسمَّاة الأربعة للرسوم البيانية. ' +
    'افتح ورقة \"' + SHEET_NAMES.dashboard + '\" — يجب أن تختفي رسائل #REF! و #VALUE! ' +
    'وتظهر الأسهم الخضراء/الحمراء على بطاقات الاتجاه.',
    ui.ButtonSet.OK);
}

// ============================================================================
// HELPERS
// ============================================================================
function getOrCreateSheet(ss, name) {
  let s = ss.getSheetByName(name);
  if (!s) s = ss.insertSheet(name);
  s.setRightToLeft(true);
  return s;
}

/**
 * Creates an empty stub for every sheet the workbook will contain BEFORE any
 * builder writes a formula. This is what prevents the "ghost reference" bug:
 * Apps Script binds the sheet-name token in a formula at setFormula() time, so
 * if the referenced sheet does not exist yet, the formula is persisted as a
 * `#REF!` and never recovers — even after the sheet is later created.
 *
 * Called as the FIRST step of `installBudgetCalculator2026()`.
 */
function precreateAllSheetStubs(ss) {
  const all = [
    SHEET_NAMES.welcome,
    SHEET_NAMES.settings,
    SHEET_NAMES.goals,
    ...MONTHS,
    SHEET_NAMES.dashboard,
    SHEET_NAMES.engine,
  ];
  all.forEach(name => getOrCreateSheet(ss, name));
}

function paintSheet(s, fg, bg) {
  s.getRange(1, 1, s.getMaxRows(), s.getMaxColumns())
    .setBackground(bg).setFontColor(fg);
}

function mergeAndStyle(s, a1, value, opts) {
  const r = s.getRange(a1);
  r.merge();
  if (value !== undefined && value !== null) r.setValue(value);
  if (opts) {
    if (opts.bg)         r.setBackground(opts.bg);
    if (opts.fg)         r.setFontColor(opts.fg);
    if (opts.size)       r.setFontSize(opts.size);
    if (opts.bold)       r.setFontWeight('bold');
    if (opts.align)      r.setHorizontalAlignment(opts.align);
    if (opts.vAlign)     r.setVerticalAlignment(opts.vAlign);
    if (opts.wrap)       r.setWrap(true);
    if (opts.fontFamily) r.setFontFamily(opts.fontFamily);
  }
  return r;
}

// ============================================================================
// PHASE 1: SETTINGS SHEET
// ============================================================================
function buildSettings(ss) {
  const s = getOrCreateSheet(ss, SHEET_NAMES.settings);

  // Title
  mergeAndStyle(s, 'A1:D1', 'نظام مالي ذكي متكامل - الإعدادات وأسعار الصرف',
    { bold: true, size: 14, align: 'center' });
  mergeAndStyle(s, 'A2:D2',
    'يجب تحديث أسعار الصرف يدوياً أو عبر دالة GOOGLEFINANCE قبل بدء كل شهر مالي.',
    { fg: T.fgMuted, size: 10, align: 'center' });

  // Main currency selector + active format + active rate
  s.getRange('A3').setValue('العملة الرئيسية للعرض');
  s.getRange('B3').setValue('USD');
  s.getRange('A4').setValue('تنسيق العملة النشط');
  s.getRange('B4').setFormula('=XLOOKUP(B3, A7:A20, D7:D20)');
  s.getRange('A5').setValue('سعر صرف العملة الرئيسية مقابل الدولار');
  s.getRange('B5').setFormula('=XLOOKUP(B3, A7:A20, C7:C20)');

  // Currency table header
  const header = ['رمز العملة', 'اسم العملة', 'سعر الصرف مقابل الدولار USD', 'التنسيق المالي الافتراضي'];
  s.getRange('A6:D6').setValues([header])
    .setFontWeight('bold').setBackground('#374151').setFontColor(T.fgPrimary);

  // 14 currencies
  s.getRange(7, 1, CURRENCIES.length, 4).setValues(CURRENCIES);

  // Income categories at F6:F14
  s.getRange('F6').setValue('فئات الدخل').setFontWeight('bold').setBackground('#374151').setFontColor(T.fgPrimary);
  s.getRange(7, 6, INCOME_CATEGORIES.length, 1)
    .setValues(INCOME_CATEGORIES.map(v => [v]));

  // Expense categories at G6:G18
  s.getRange('G6').setValue('فئات المصاريف').setFontWeight('bold').setBackground('#374151').setFontColor(T.fgPrimary);
  s.getRange(7, 7, EXPENSE_CATEGORIES.length, 1)
    .setValues(EXPENSE_CATEGORIES.map(v => [v]));

  // Payment methods at H6:H10
  s.getRange('H6').setValue('طرق الدفع').setFontWeight('bold').setBackground('#374151').setFontColor(T.fgPrimary);
  s.getRange(7, 8, PAYMENT_METHODS.length, 1)
    .setValues(PAYMENT_METHODS.map(v => [v]));

  // Validate B3 against rng_Currencies (we'll set the real validation after named ranges exist;
  // here we use a direct range reference because rng_Currencies isn't defined yet).
  const dvCur = SpreadsheetApp.newDataValidation()
    .requireValueInRange(s.getRange('A7:A20'), true)
    .setAllowInvalid(false).build();
  s.getRange('B3').setDataValidation(dvCur);

  // Auto-resize for legibility.
  s.autoResizeColumns(1, 8);
}

// ============================================================================
// PHASE 3: GOALS SHEET
// ============================================================================
function buildGoals(ss) {
  const s = getOrCreateSheet(ss, SHEET_NAMES.goals);

  // Title
  mergeAndStyle(s, 'A1:I1', 'الأهداف المالية والادخار - نظام مالي ذكي متكامل',
    { bold: true, size: 16, align: 'center' });

  // Summary panel rows 2-4 (cell-by-cell from docs/05 section 3.1)
  s.getRange('A2').setValue('إجمالي تكلفة الأهداف');
  s.getRange('B2').setFormula('=SUM(B7:B26)');
  s.getRange('C2').setValue('إجمالي المدخر');
  s.getRange('D2').setFormula('=SUM(C7:C26)');
  s.getRange('E2').setValue('نسبة الإنجاز الكلية');
  s.getRange('F2').setFormula('=IFERROR(SUM(C7:C26)/SUM(B7:B26), 0)').setNumberFormat('0.0%');

  s.getRange('A3').setValue('إجمالي القسط الشهري المطلوب');
  s.getRange('B3').setFormula('=SUMIF(H7:H26, "🟡 قيد الادخار", G7:G26)');
  s.getRange('C3').setValue('أهداف مكتملة');
  s.getRange('D3').setFormula('=COUNTIF(H7:H26, "🟢 مكتمل")');
  s.getRange('E3').setValue('أهداف قيد الادخار');
  s.getRange('F3').setFormula('=COUNTIF(H7:H26, "🟡 قيد الادخار")');

  s.getRange('A4').setValue('أهداف لم تبدأ');
  s.getRange('B4').setFormula('=COUNTIF(H7:H26, "⚪ لم يبدأ بعد")');

  // Goals table header at row 6
  const goalHeader = ['الهدف', 'التكلفة التقديرية', 'المبلغ المدخر حالياً',
    'نسبة الإنجاز', 'الموعد المستهدف', 'الأشهر المتبقية',
    'القسط الشهري المطلوب', 'الحالة', 'التوصية الذكية'];
  s.getRange('A6:I6').setValues([goalHeader])
    .setFontWeight('bold').setBackground('#374151').setFontColor(T.fgPrimary)
    .setHorizontalAlignment('center');

  // 4 baseline goals (cols A, B, C, E)
  s.getRange(7, 1, GOALS_SEED.length, 9).setValues(GOALS_SEED);
  s.getRange(7, 5, GOALS_SEED.length, 1).setNumberFormat('yyyy-mm-dd');

  // Per-row formulas for D, F, G, H, I across rows 7..26 (write each row to keep refs).
  for (let r = 7; r <= 26; r++) {
    s.getRange('D' + r).setFormula(`=IFERROR(C${r}/B${r}, 0)`).setNumberFormat('0.0%');
    s.getRange('F' + r).setFormula(`=IFERROR(MAX(0, DATEDIF(TODAY(), E${r}, "M")), 0)`);
    s.getRange('G' + r).setFormula(`=IF(C${r}>=B${r}, 0, IFERROR((B${r}-C${r})/F${r}, 0))`);
    s.getRange('H' + r).setFormula(
      `=IFS(B${r}="", "", IFERROR(C${r}/B${r}, 0) >= 1, "🟢 مكتمل", IFERROR(C${r}/B${r}, 0) >= 0.01, "🟡 قيد الادخار", TRUE, "⚪ لم يبدأ بعد")`);
    s.getRange('I' + r).setFormula(
      `=IFS(B${r}="", "", IFERROR(C${r}/B${r}, 0) >= 1, "🎉 الهدف محقق بالكامل، يمكن إعادة توجيه القسط لهدف جديد.", F${r} = 0, "⚠️ الموعد المستهدف انتهى دون اكتمال الهدف، يجب تمديد المدة أو زيادة الادخار.", F${r} > 24, "⏳ لديك وقت كافٍ، خصص " & TEXT(G${r}, rng_ActiveFormat) & " شهرياً للوصول للهدف خلال " & F${r} & " شهراً.", F${r} > 6, "🟡 الزمن متوسط، التزم بـ " & TEXT(G${r}, rng_ActiveFormat) & " شهرياً ولا تؤجّل الادخار.", TRUE, "🔴 الموعد قريب جداً، يلزم ادخار " & TEXT(G${r}, rng_ActiveFormat) & " شهرياً وقد يتطلب الأمر مراجعة الأولويات.")`);
  }

  // Conditional formatting on H7:H26 for status colors
  const rules = s.getConditionalFormatRules();
  const hRange = s.getRange('H7:H26');
  rules.push(
    SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied('=$H7="🟢 مكتمل"')
      .setBackground('#27AE60').setFontColor(T.white).setRanges([hRange]).build(),
    SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied('=$H7="🟡 قيد الادخار"')
      .setBackground('#F1C40F').setFontColor('#000000').setRanges([hRange]).build(),
    SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied('=$H7="⚪ لم يبدأ بعد"')
      .setBackground('#BDC3C7').setFontColor('#000000').setRanges([hRange]).build());
  s.setConditionalFormatRules(rules);

  s.setFrozenRows(6);
  s.autoResizeColumns(1, 9);
}

// ============================================================================
// PHASE 3b: DEBTS LEDGER (مفكرة السلف والديون - دائن ومدين)
// ============================================================================
/**
 * يُنشئ جدول "مفكرة السلف والديون" داخل ورقة الأهداف المالية والادخار.
 * يبدأ الجدول من الصف 29 (عنوان فرعي) مع رأس في الصف 30 وبيانات في 31:50.
 *
 * الأعمدة (A-I):
 *   A: اسم الشخص
 *   B: نوع العملية (أعطيته سلف / أخذت منه سلف)
 *   C: المبلغ الكلي
 *   D: العملة
 *   E: تاريخ المعاملة
 *   F: تاريخ السداد المتوقع
 *   G: المبلغ المسدد
 *   H: الرصيد المتبقي (معادلة تلقائية = C - G)
 *   I: الحالة (مؤشر لوني: مكتمل / مسدد جزئياً / غير مسدد)
 *
 * التصميم: Fintech Dark Mode مطابق لباقي القالب.
 * الأرقام: لاتينية حصراً (1,2,3) — التنسيق يُفرض عبر setNumberFormat.
 */
function buildDebtsLedger(ss) {
  const s = ss.getSheetByName(SHEET_NAMES.goals);

  // --- عنوان القسم الفرعي (صف 29) ---
  mergeAndStyle(s, 'A29:I29', '📒 مفكرة السلف والديون الشخصية (دائن ومدين)', {
    bg: T.bgPage, fg: T.accentNet, size: 14, bold: true, align: 'center'
  });

  // --- رأس الجدول (صف 30) - Dark fintech header ---
  const debtHeader = [
    'اسم الشخص',           // A
    'نوع العملية',          // B
    'المبلغ الكلي',         // C
    'العملة',              // D
    'تاريخ المعاملة',       // E
    'تاريخ السداد المتوقع', // F
    'المبلغ المسدد',        // G
    'الرصيد المتبقي',       // H
    'الحالة'               // I
  ];
  s.getRange('A30:I30').setValues([debtHeader])
    .setFontWeight('bold')
    .setBackground('#374151')
    .setFontColor(T.fgPrimary)
    .setHorizontalAlignment('center')
    .setFontSize(11);

  // --- بيانات أولية (3 سجلات نموذجية) للتوضيح ---
  const DEBTS_SEED = [
    ['أحمد محمد',   'أعطيته سلف', 5000,  'USD', new Date('2026-01-15'), new Date('2026-06-15'), 2000, '', ''],
    ['سارة علي',    'أخذت منه سلف', 3000, 'USD', new Date('2026-02-01'), new Date('2026-07-01'), 1000, '', ''],
    ['خالد يوسف',   'أعطيته سلف', 10000, 'USD', new Date('2025-11-01'), new Date('2026-12-31'), 0,    '', ''],
  ];
  s.getRange(31, 1, DEBTS_SEED.length, 9).setValues(DEBTS_SEED);

  // --- تنسيق التواريخ بالأرقام اللاتينية (yyyy-mm-dd) ---
  s.getRange('E31:E50').setNumberFormat('yyyy-mm-dd');
  s.getRange('F31:F50').setNumberFormat('yyyy-mm-dd');

  // --- تنسيق المبالغ بالأرقام اللاتينية ---
  s.getRange('C31:C50').setNumberFormat('#,##0.00');
  s.getRange('G31:G50').setNumberFormat('#,##0.00');
  s.getRange('H31:H50').setNumberFormat('#,##0.00');

  // --- معادلات تلقائية للصفوف 31 إلى 50 ---
  for (let r = 31; r <= 50; r++) {
    // H: الرصيد المتبقي = المبلغ الكلي - المبلغ المسدد
    s.getRange('H' + r).setFormula(
      `=IF(C${r}="", "", C${r} - G${r})`
    );

    // I: الحالة بمؤشر لوني ذكي
    // 🟢 مسدد بالكامل | 🟡 مسدد جزئياً | 🔴 غير مسدد
    s.getRange('I' + r).setFormula(
      `=IFS(C${r}="", "", IFERROR(G${r}/C${r}, 0) >= 1, "🟢 مسدد بالكامل", IFERROR(G${r}/C${r}, 0) > 0, "🟡 مسدد جزئياً", TRUE, "🔴 غير مسدد")`
    );
  }

  // --- قائمة منسدلة لعمود "نوع العملية" (B31:B50) ---
  const dvType = SpreadsheetApp.newDataValidation()
    .requireValueInList(['أعطيته سلف', 'أخذت منه سلف'], true)
    .setAllowInvalid(false)
    .build();
  s.getRange('B31:B50').setDataValidation(dvType);

  // --- قائمة منسدلة لعمود "العملة" (D31:D50) ---
  // تستخدم نفس قائمة العملات من ورقة الإعدادات
  const dvCurrency = SpreadsheetApp.newDataValidation()
    .requireValueInRange(ss.getSheetByName(SHEET_NAMES.settings).getRange('A7:A20'), true)
    .setAllowInvalid(false)
    .build();
  s.getRange('D31:D50').setDataValidation(dvCurrency);

  // --- التنسيق الشرطي لعمود الحالة (I31:I50) - Fintech Dark Mode ---
  const rules = s.getConditionalFormatRules();
  const iRange = s.getRange('I31:I50');

  rules.push(
    // 🟢 مسدد بالكامل → أخضر
    SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied('=$I31="🟢 مسدد بالكامل"')
      .setBackground('#27AE60').setFontColor(T.white)
      .setRanges([iRange]).build(),
    // 🟡 مسدد جزئياً → أصفر/ذهبي
    SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied('=$I31="🟡 مسدد جزئياً"')
      .setBackground('#F59E0B').setFontColor('#000000')
      .setRanges([iRange]).build(),
    // 🔴 غير مسدد → أحمر
    SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied('=$I31="🔴 غير مسدد"')
      .setBackground('#DC2626').setFontColor(T.white)
      .setRanges([iRange]).build()
  );
  s.setConditionalFormatRules(rules);

  // --- لوحة ملخص السلف والديون (صفوف 52-55) ---
  mergeAndStyle(s, 'A52:I52', '📊 ملخص السلف والديون', {
    bg: T.bgCard, fg: T.accentNet, size: 12, bold: true, align: 'center'
  });

  // صف 53: عناوين الملخص
  s.getRange('A53').setValue('إجمالي المبالغ المستحقة لي (دائن)')
    .setFontWeight('bold').setFontColor(T.fgPrimary).setBackground(T.bgCard);
  s.getRange('C53').setValue('إجمالي المبالغ المستحقة علي (مدين)')
    .setFontWeight('bold').setFontColor(T.fgPrimary).setBackground(T.bgCard);
  s.getRange('E53').setValue('عدد السلف النشطة')
    .setFontWeight('bold').setFontColor(T.fgPrimary).setBackground(T.bgCard);
  s.getRange('G53').setValue('أقرب موعد سداد قادم')
    .setFontWeight('bold').setFontColor(T.fgPrimary).setBackground(T.bgCard);

  // صف 54: المعادلات التلخيصية
  // إجمالي المستحق لي = مجموع الرصيد المتبقي حيث نوع العملية = "أعطيته سلف"
  s.getRange('A54').setFormula(
    '=IFERROR(SUMIFS(H31:H50, B31:B50, "أعطيته سلف", I31:I50, "<>🟢 مسدد بالكامل"), 0)'
  ).setFontColor(T.accentIncome).setFontSize(14).setFontWeight('bold')
   .setBackground(T.bgCard).setNumberFormat('#,##0.00');

  // إجمالي المستحق علي = مجموع الرصيد المتبقي حيث نوع العملية = "أخذت منه سلف"
  s.getRange('C54').setFormula(
    '=IFERROR(SUMIFS(H31:H50, B31:B50, "أخذت منه سلف", I31:I50, "<>🟢 مسدد بالكامل"), 0)'
  ).setFontColor(T.accentExpense).setFontSize(14).setFontWeight('bold')
   .setBackground(T.bgCard).setNumberFormat('#,##0.00');

  // عدد السلف النشطة (غير مسددة بالكامل)
  s.getRange('E54').setFormula(
    '=IFERROR(COUNTIFS(C31:C50, "<>", I31:I50, "<>🟢 مسدد بالكامل"), 0)'
  ).setFontColor(T.paletteOrange).setFontSize(14).setFontWeight('bold')
   .setBackground(T.bgCard);

  // أقرب موعد سداد قادم (أقل تاريخ مستقبلي في F31:F50 حيث الحالة ليست مكتملة)
  s.getRange('G54').setFormula(
    '=IFERROR(TEXT(MINIFS(F31:F50, F31:F50, ">"&TODAY(), I31:I50, "<>🟢 مسدد بالكامل"), "yyyy-mm-dd"), "لا يوجد")'
  ).setFontColor(T.gaugeAmber).setFontSize(14).setFontWeight('bold')
   .setBackground(T.bgCard);

  // --- تنسيق منطقة البيانات (الخلفية الداكنة) ---
  s.getRange('A31:I50').setBackground(T.bgPage).setFontColor(T.fgPrimary);
  s.getRange('A53:I54').setBackground(T.bgCard);

  // توسيع الأعمدة لتلائم المحتوى
  s.autoResizeColumns(1, 9);
}

// ============================================================================
// PHASE 2: A SINGLE MONTHLY SHEET
// ============================================================================
function buildMonth(ss, monthName) {
  const s = getOrCreateSheet(ss, monthName);

  // Title row
  mergeAndStyle(s, 'A1:G1', `ميزانية شهر ${monthName} - نظام مالي ذكي متكامل`,
    { bold: true, size: 14, align: 'center' });

  // KPI panel labels rows 2-5 (per docs/03 section 2.2)
  s.getRange('A2').setValue('العملة الرئيسية للعرض');
  s.getRange('B2').setFormula(`=IFERROR(rng_MainCurrency, "USD")`);
  s.getRange('C2').setValue('الشهر');
  s.getRange('D2').setValue(monthName);
  s.getRange('E2').setValue('مؤشر التنبيه الذكي');
  s.getRange('F2').setFormula(
    '=IF(OR(D3="", D4="", D3=0), "", IF(D4 > D3, "🔴 تجاوز الميزانية", IF(D4 >= 0.9 * D3, "🟡 اقتراب من الحد", "🟢 أداء مالي ممتاز")))');

  s.getRange('A3').setValue('إجمالي الدخل المتوقع');
  s.getRange('B3').setFormula('=SUM(D10:D28)');
  s.getRange('C3').setValue('إجمالي المصروف المتوقع');
  s.getRange('D3').setFormula('=SUM(D33:D62)');
  s.getRange('E3').setValue('نسبة الادخار');
  s.getRange('F3').setFormula('=IFERROR((B4-D4)/B4, 0)').setNumberFormat('0.0%');

  s.getRange('A4').setValue('إجمالي الدخل الفعلي');
  s.getRange('B4').setFormula('=SUM(E10:E28)');
  s.getRange('C4').setValue('إجمالي المصروف الفعلي');
  s.getRange('D4').setFormula('=SUM(E33:E62)');
  s.getRange('E4').setValue('نسبة الإنفاق');
  s.getRange('F4').setFormula('=IFERROR(D4/B4, 0)').setNumberFormat('0.0%');

  s.getRange('A5').setValue('صافي الفائض/العجز');
  s.getRange('B5').setFormula('=B4-D4');
  s.getRange('C5').setValue('أعلى فئة استنزاف');
  s.getRange('D5').setFormula(
    '=IFERROR(XLOOKUP(MAX(ARRAYFORMULA(SUMIF(B33:B62, rng_ExpenseCategories, E33:E62))), ARRAYFORMULA(SUMIF(B33:B62, rng_ExpenseCategories, E33:E62)), rng_ExpenseCategories), "")');
  s.getRange('E5').setValue('مبلغ أعلى فئة استنزاف');
  s.getRange('F5').setFormula(
    '=IFERROR(MAX(ARRAYFORMULA(SUMIF(B33:B62, rng_ExpenseCategories, E33:E62))), 0)');

  // Income block header row 9
  const incomeHdr = ['التاريخ', 'الفئة', 'الوصف', 'الدخل المتوقع', 'الدخل الفعلي', 'الفرق', 'طريقة الدفع'];
  s.getRange('A9:G9').setValues([incomeHdr])
    .setFontWeight('bold').setBackground('#374151').setFontColor(T.fgPrimary)
    .setHorizontalAlignment('center');

  // Income difference column F10:F28 (ARRAYFORMULA in F10)
  s.getRange('F10').setFormula(
    '=ARRAYFORMULA(IF((D10:D28="")+(E10:E28="")>0, "", E10:E28 - D10:D28))');

  // Income totals row 29
  s.getRange('A29').setValue('الإجمالي').setFontWeight('bold');
  s.getRange('D29').setFormula('=SUM(D10:D28)');
  s.getRange('E29').setFormula('=SUM(E10:E28)');
  s.getRange('F29').setFormula('=E29-D29');

  // Expense block header row 32
  const expenseHdr = ['التاريخ', 'الفئة', 'الوصف', 'المصروف المتوقع', 'المصروف الفعلي', 'الفرق', 'طريقة الدفع', 'حالة التنبيه'];
  s.getRange('A32:H32').setValues([expenseHdr])
    .setFontWeight('bold').setBackground('#374151').setFontColor(T.fgPrimary)
    .setHorizontalAlignment('center');

  // Expense difference column F33:F62 (ARRAYFORMULA in F33)
  s.getRange('F33').setFormula(
    '=ARRAYFORMULA(IF((D33:D62="")+(E33:E62="")>0, "", D33:D62 - E33:E62))');

  // Per-row alert column H33:H62 (one formula per row to keep IF chain clean)
  for (let r = 33; r <= 62; r++) {
    s.getRange('H' + r).setFormula(
      `=IF(OR(D${r}="", E${r}=""), "", IF(E${r} > D${r}, "🔴 تجاوز الميزانية", IF(E${r} >= 0.9 * D${r}, "🟡 اقتراب من الحد", "🟢 أداء مالي ممتاز")))`);
  }

  // Expense totals row 63
  s.getRange('A63').setValue('الإجمالي').setFontWeight('bold');
  s.getRange('D63').setFormula('=SUM(D33:D62)');
  s.getRange('E63').setFormula('=SUM(E33:E62)');
  s.getRange('F63').setFormula('=D63-E63');

  // Conditional formatting on H33:H62 (alert states)
  const rules = s.getConditionalFormatRules();
  const hRange = s.getRange('H33:H62');
  rules.push(
    SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied('=$H33="🔴 تجاوز الميزانية"')
      .setBackground('#C0392B').setFontColor(T.white).setRanges([hRange]).build(),
    SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied('=$H33="🟡 اقتراب من الحد"')
      .setBackground('#F1C40F').setFontColor('#000000').setRanges([hRange]).build(),
    SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied('=$H33="🟢 أداء مالي ممتاز"')
      .setBackground('#27AE60').setFontColor(T.white).setRanges([hRange]).build());
  s.setConditionalFormatRules(rules);

  s.setFrozenRows(6);
  s.autoResizeColumns(1, 8);
}

// ============================================================================
// PHASE 4: HIDDEN _DashboardEngine SHEET
// ============================================================================
function buildDashboardEngine(ss) {
  const s = getOrCreateSheet(ss, SHEET_NAMES.engine);

  // A:D - Monthly comparison grid (per docs/07 section 8.1)
  s.getRange('A1:D1').setValues([['الشهر', 'الدخل الفعلي', 'المصروف الفعلي', 'صافي الربح']])
    .setFontWeight('bold').setBackground('#374151').setFontColor(T.fgPrimary);
  for (let i = 0; i < 12; i++) {
    const m = MONTHS[i];
    const row = i + 2;
    s.getRange('A' + row).setValue(m);
    s.getRange('B' + row).setFormula(`=SUM('${m}'!E10:E28)`);
    s.getRange('C' + row).setFormula(`=SUM('${m}'!E33:E62)`);
    s.getRange('D' + row).setFormula(`=B${row}-C${row}`);
  }

  // O5: cumulative net surplus (used by Card K4)
  s.getRange('O5').setFormula('=SUM(D2:D13)');

  // F:G - Waterfall data (per docs/07 section 4.2.1).
  // REFACTOR: column G is now 100% engine-internal. Previously G2/G6/G7 read
  // from the dashboard sheet, but if the engine was ever rebuilt before the
  // dashboard existed those references were locked into #REF!. The engine now
  // computes the waterfall purely from its own H column (which is in turn
  // derived from the 12 monthly sheets), so there is no chance of a ghost ref.
  s.getRange('F1:G1').setValues([['العنصر', 'المبلغ']])
    .setFontWeight('bold').setBackground('#374151').setFontColor(T.fgPrimary);
  s.getRange('F2').setValue('إجمالي الدخل');
  s.getRange('G2').setFormula('=IFERROR(H2, 0)');                 // total income (engine-internal)
  s.getRange('F3').setValue('السكن');
  s.getRange('G3').setFormula(buildCategorySumFormula('السكن', /*expense=*/true, /*negate=*/true));
  s.getRange('F4').setValue('الطعام');
  s.getRange('G4').setFormula(buildCategorySumFormula('الطعام', true, true));
  s.getRange('F5').setValue('المواصلات');
  s.getRange('G5').setFormula(buildCategorySumFormula('النقل', true, true)); // canonical category is النقل
  s.getRange('F6').setValue('باقي المصاريف');
  // Remainder = -(total expense + already-negative G3 + G4 + G5).
  s.getRange('G6').setFormula('=IFERROR(-1 * (H3 + G3 + G4 + G5), 0)');
  s.getRange('F7').setValue('صافي الربح');
  s.getRange('G7').setFormula('=IFERROR(SUM(G2:G6), 0)');         // subtotal of the waterfall

  // H:I - Trend current/prior (per docs/07 section 8.3).
  // REFACTOR: every cell is wrapped with IFERROR so that a single broken
  // upstream value (an empty goals!D2, a zero goals!B3, a SUM that hits a
  // text cell, etc.) cannot poison the trend strings on the dashboard cards.
  // The trend formulas in row 7 of the dashboard read these values directly,
  // so robustness here is what kills the #VALUE! cascade end-to-end.
  s.getRange('H2').setFormula('=IFERROR(SUM(B2:B13), 0)');     // Total income (current)
  s.getRange('I2').setFormula('=IFERROR(SUM(B2:B12), 0)');     // Total income (prior, last 11 months)
  s.getRange('H3').setFormula('=IFERROR(SUM(C2:C13), 0)');     // Total expense (current)
  s.getRange('I3').setFormula('=IFERROR(SUM(C2:C12), 0)');     // Total expense (prior)
  s.getRange('H4').setFormula('=IFERROR(H2-H3, 0)');           // Net profit (current)
  s.getRange('I4').setFormula('=IFERROR(I2-I3, 0)');           // Net profit (prior)
  s.getRange('H5').setFormula(`=IFERROR('${SHEET_NAMES.goals}'!D2 + O5, 0)`);                     // Assets (current)
  s.getRange('I5').setFormula(`=IFERROR('${SHEET_NAMES.goals}'!D2 + SUM(D2:D12), 0)`);            // Assets (prior)
  s.getRange('H6').setFormula(`=IFERROR('${SHEET_NAMES.goals}'!B3 * 12, 0)`);                     // Liabilities (current)
  s.getRange('I6').setFormula(`=IFERROR('${SHEET_NAMES.goals}'!B3 * 11, 0)`);                     // Liabilities (prior)
  s.getRange('H7').setFormula('=IFERROR((H2-H3)/H2, 0)');                                         // Savings rate (current)
  s.getRange('I7').setFormula('=IFERROR((I2-I3)/I2, 0)');                                         // Savings rate (prior)

  // I:J - Income source doughnut (per docs/07 section 4.3)
  s.getRange('I1:J1').setValues([['فئة الدخل', 'الإجمالي']])
    .setFontWeight('bold').setBackground('#374151').setFontColor(T.fgPrimary);
  for (let i = 0; i < INCOME_CATEGORIES.length; i++) {
    s.getRange(2 + i, 9).setValue(INCOME_CATEGORIES[i]);
    s.getRange(2 + i, 10).setFormula(buildCategorySumFormula('', /*expense=*/false, /*negate=*/false, `I${2 + i}`));
  }

  // L:M - Expense category doughnut (per docs/07 section 4.4)
  s.getRange('L1:M1').setValues([['فئة المصاريف', 'الإجمالي']])
    .setFontWeight('bold').setBackground('#374151').setFontColor(T.fgPrimary);
  for (let i = 0; i < EXPENSE_CATEGORIES.length; i++) {
    s.getRange(2 + i, 12).setValue(EXPENSE_CATEGORIES[i]);
    s.getRange(2 + i, 13).setFormula(buildCategorySumFormula('', true, false, `L${2 + i}`));
  }

  // O2 - Composite health score (40 savings + 30 budget discipline + 30 goal progress).
  // REFACTOR: previously this formula referenced the dashboard sheet's B5 and
  // F5. Because the engine used to be built before the dashboard, those refs
  // were captured as #REF! and propagated into the final score. The score now
  // reads `H2` (total income) and `H3` (total expense) from the engine itself,
  // so it is always self-consistent and survives any rebuild order.
  const monthlyExpectedExpenseSum = MONTHS.map(m => `'${m}'!D33:D62`).join(', ');
  s.getRange('O2').setFormula(
    `=ROUND(40 * MAX(0, MIN(1, IFERROR((H2 - H3) / H2, 0))) + 30 * MAX(0, MIN(1, IFERROR(1 - (H3 / SUM(${monthlyExpectedExpenseSum})), 0))) + 30 * IFERROR('${SHEET_NAMES.goals}'!F2, 0), 0)`);
  s.getRange('O3').setFormula('=IFS(O2>=90, "ممتاز", O2>=75, "جيد", O2>=60, "مقبول", TRUE, "يحتاج إلى تحسين")');

  // Q:W - Stacked transactions for ledger (we keep this as a SIMPLER variant: just the
  // current 12-month income+expense rows via 24 separate ARRAYFORMULA blocks).
  s.getRange('Q1:W1').setValues([['الشهر', 'التاريخ', 'النوع', 'الفئة', 'الوصف', 'المبلغ', 'طريقة الدفع']])
    .setFontWeight('bold').setBackground('#374151').setFontColor(T.fgPrimary);

  // Income blocks: 12 months × 19 rows = rows 2..(2 + 12*19 -1) = 2..229
  // Expense blocks: rows 230..(230 + 12*30 -1) = 230..589
  // Approach: write per-month ARRAYFORMULAs so each row is dynamic.
  let row = 2;
  for (let i = 0; i < MONTHS.length; i++) {
    const m = MONTHS[i];
    s.getRange('Q' + row).setFormula(`=ARRAYFORMULA(IF('${m}'!A10:A28="", "", "${m}"))`);
    s.getRange('R' + row).setFormula(`=ARRAYFORMULA('${m}'!A10:A28)`);
    s.getRange('S' + row).setFormula(`=ARRAYFORMULA(IF('${m}'!A10:A28="", "", "دخل"))`);
    s.getRange('T' + row).setFormula(`=ARRAYFORMULA('${m}'!B10:B28)`);
    s.getRange('U' + row).setFormula(`=ARRAYFORMULA('${m}'!C10:C28)`);
    s.getRange('V' + row).setFormula(`=ARRAYFORMULA('${m}'!E10:E28)`);
    s.getRange('W' + row).setFormula(`=ARRAYFORMULA('${m}'!G10:G28)`);
    row += 19;
  }
  for (let i = 0; i < MONTHS.length; i++) {
    const m = MONTHS[i];
    s.getRange('Q' + row).setFormula(`=ARRAYFORMULA(IF('${m}'!A33:A62="", "", "${m}"))`);
    s.getRange('R' + row).setFormula(`=ARRAYFORMULA('${m}'!A33:A62)`);
    s.getRange('S' + row).setFormula(`=ARRAYFORMULA(IF('${m}'!A33:A62="", "", "مصروف"))`);
    s.getRange('T' + row).setFormula(`=ARRAYFORMULA('${m}'!B33:B62)`);
    s.getRange('U' + row).setFormula(`=ARRAYFORMULA('${m}'!C33:C62)`);
    s.getRange('V' + row).setFormula(`=ARRAYFORMULA('${m}'!E33:E62)`);
    s.getRange('W' + row).setFormula(`=ARRAYFORMULA('${m}'!G33:G62)`);
    row += 30;
  }
}

function buildCategorySumFormula(category, expense, negate, refCell) {
  // If refCell is provided, the formula references that cell for the category;
  // otherwise it inlines the category as a string literal.
  const catRef = refCell || `"${category}"`;
  const cats = expense ? 'B33:B62' : 'B10:B28';
  const amts = expense ? 'E33:E62' : 'E10:E28';
  const parts = MONTHS.map(m => `SUMIF('${m}'!${cats}, ${catRef}, '${m}'!${amts})`);
  let f = '=' + parts.join(' + ');
  if (negate) f = '=-1 * (' + parts.join(' + ') + ')';
  return f;
}

// ============================================================================
// PHASE 4: DASHBOARD SHEET
// ============================================================================
function buildDashboard(ss) {
  const s = getOrCreateSheet(ss, SHEET_NAMES.dashboard);

  // Page background (expanded to row 70 to accommodate debts summary + year selector)
  s.getRange(1, 1, 70, 25).setBackground(T.bgPage).setFontColor(T.fgPrimary);

  // Title row
  mergeAndStyle(s, 'B2:Y2', 'اللوحة الرئيسية والتقرير السنوي - نظام مالي ذكي متكامل',
    { bg: T.bgPage, fg: T.fgPrimary, size: 18, bold: true, align: 'center' });

  // ---- Year Selector (قائمة اختيار السنة) ----
  // تُتيح للمستخدم التبديل بين سنوات 2025-2035 (2025 = سنة تجريبية)
  s.getRange('V3').setValue('السنة المالية:')
    .setFontWeight('bold').setFontColor(T.fgPrimary).setBackground(T.bgCard)
    .setHorizontalAlignment('left').setFontSize(10);
  s.getRange('X3').setValue(2025)
    .setFontWeight('bold').setFontColor(T.accentNet).setBackground(T.bgCard)
    .setHorizontalAlignment('center').setFontSize(12)
    .setNumberFormat('0');  // أرقام لاتينية حصراً - بدون فواصل عشرية
  // القائمة المنسدلة: 2025 → 2035
  const dvYear = SpreadsheetApp.newDataValidation()
    .requireValueInList([
      '2025', '2026', '2027', '2028', '2029', '2030',
      '2031', '2032', '2033', '2034', '2035'
    ], true)
    .setAllowInvalid(false)
    .build();
  s.getRange('X3').setDataValidation(dvYear);
  // ملاحظة توضيحية
  s.getRange('V3').setNote('سنة 2025 = بيانات تجريبية (Demo) لاستعراض قوة القالب.');

  // ---- Module 1: Six KPI cards ----
  // SOURCE OF TRUTH: every KPI now reads from `_DashboardEngine` so the
  // dashboard sheet stays a pure presentation layer. The engine in turn reads
  // from the 12 monthly sheets and the goals sheet. This removes the duplicate
  // SUM(…12 months…) blocks that used to live on the dashboard, eliminates an
  // entire class of "the engine and the card disagree" bugs, and keeps every
  // formula short enough to fit in one log line during debugging.
  //
  // Card 1: إجمالي الدخل (B4:E8)
  paintCard(s, 'B4:E8');
  mergeAndStyle(s, 'B4:E4', 'إجمالي الدخل', { bg: T.bgCard, fg: T.fgMuted, size: 11, align: 'right' });
  mergeAndStyle(s, 'B5:E6', '', { bg: T.bgCard, fg: T.fgPrimary, size: 24, bold: true, align: 'right' });
  s.getRange('B5').setFormula(`=IFERROR(${SHEET_NAMES.engine}!H2, 0)`);
  mergeAndStyle(s, 'B7:E7', '', { bg: T.bgCard, size: 12, align: 'right' });
  s.getRange('B7').setFormula(buildTrendFormula('H2', 'I2'));
  mergeAndStyle(s, 'B8:E8', 'إجمالي الدخل الفعلي السنوي عبر 12 شهراً.',
    { bg: T.bgCard, fg: T.fgMuted, size: 9, align: 'right' });

  // Card 2: إجمالي المصروفات (F4:I8)
  paintCard(s, 'F4:I8');
  mergeAndStyle(s, 'F4:I4', 'إجمالي المصروفات', { bg: T.bgCard, fg: T.fgMuted, size: 11, align: 'right' });
  mergeAndStyle(s, 'F5:I6', '', { bg: T.bgCard, fg: T.fgPrimary, size: 24, bold: true, align: 'right' });
  s.getRange('F5').setFormula(`=IFERROR(${SHEET_NAMES.engine}!H3, 0)`);
  mergeAndStyle(s, 'F7:I7', '', { bg: T.bgCard, size: 12, align: 'right' });
  s.getRange('F7').setFormula(buildTrendFormula('H3', 'I3'));
  mergeAndStyle(s, 'F8:I8', 'إجمالي المصروف الفعلي السنوي عبر 12 شهراً.',
    { bg: T.bgCard, fg: T.fgMuted, size: 9, align: 'right' });

  // Card 3: صافي الربح (J4:M8)
  paintCard(s, 'J4:M8');
  mergeAndStyle(s, 'J4:M4', 'صافي الربح', { bg: T.bgCard, fg: T.fgMuted, size: 11, align: 'right' });
  mergeAndStyle(s, 'J5:M6', '', { bg: T.bgCard, fg: T.fgPrimary, size: 24, bold: true, align: 'right' });
  s.getRange('J5').setFormula(`=IFERROR(${SHEET_NAMES.engine}!H4, 0)`);
  mergeAndStyle(s, 'J7:M7', '', { bg: T.bgCard, size: 12, align: 'right' });
  s.getRange('J7').setFormula(buildTrendFormula('H4', 'I4'));
  mergeAndStyle(s, 'J8:M8', 'الفرق بين إجمالي الدخل وإجمالي المصروفات.',
    { bg: T.bgCard, fg: T.fgMuted, size: 9, align: 'right' });

  // Card 4: إجمالي الأصول (N4:Q8)
  paintCard(s, 'N4:Q8');
  mergeAndStyle(s, 'N4:Q4', 'إجمالي الأصول', { bg: T.bgCard, fg: T.fgMuted, size: 11, align: 'right' });
  mergeAndStyle(s, 'N5:Q6', '', { bg: T.bgCard, fg: T.fgPrimary, size: 24, bold: true, align: 'right' });
  s.getRange('N5').setFormula(`=IFERROR(${SHEET_NAMES.engine}!H5, 0)`);
  mergeAndStyle(s, 'N7:Q7', '', { bg: T.bgCard, size: 12, align: 'right' });
  s.getRange('N7').setFormula(buildTrendFormula('H5', 'I5'));
  mergeAndStyle(s, 'N8:Q8', 'المبالغ المدّخرة في الأهداف + الفائض المتراكم.',
    { bg: T.bgCard, fg: T.fgMuted, size: 9, align: 'right' });

  // Card 5: إجمالي الالتزامات (R4:U8)
  paintCard(s, 'R4:U8');
  mergeAndStyle(s, 'R4:U4', 'إجمالي الالتزامات', { bg: T.bgCard, fg: T.fgMuted, size: 11, align: 'right' });
  mergeAndStyle(s, 'R5:U6', '', { bg: T.bgCard, fg: T.fgPrimary, size: 24, bold: true, align: 'right' });
  s.getRange('R5').setFormula(`=IFERROR(${SHEET_NAMES.engine}!H6, 0)`);
  mergeAndStyle(s, 'R7:U7', '', { bg: T.bgCard, size: 12, align: 'right' });
  s.getRange('R7').setFormula(buildTrendFormula('H6', 'I6'));
  mergeAndStyle(s, 'R8:U8', 'الأقساط الشهريّة المطلوبة × 12 (تقدير سنوي).',
    { bg: T.bgCard, fg: T.fgMuted, size: 9, align: 'right' });

  // Card 6: معدل الادخار % (V4:Y8)
  paintCard(s, 'V4:Y8');
  mergeAndStyle(s, 'V4:Y4', 'معدل الادخار %', { bg: T.bgCard, fg: T.fgMuted, size: 11, align: 'right' });
  mergeAndStyle(s, 'V5:Y6', '', { bg: T.bgCard, fg: T.fgPrimary, size: 24, bold: true, align: 'right' });
  s.getRange('V5').setFormula(`=IFERROR(${SHEET_NAMES.engine}!H7, 0)`).setNumberFormat('0.0%');
  mergeAndStyle(s, 'V7:Y7', '', { bg: T.bgCard, size: 12, align: 'right' });
  s.getRange('V7').setFormula(buildTrendFormula('H7', 'I7'));
  mergeAndStyle(s, 'V8:Y8', '(الدخل - المصروفات) / الدخل.',
    { bg: T.bgCard, fg: T.fgMuted, size: 9, align: 'right' });

  // Conditional formatting on trend cells (▲ green / ▼ red)
  const rules = s.getConditionalFormatRules();
  ['B7', 'F7', 'J7', 'N7', 'R7', 'V7'].forEach(cell => {
    const rng = s.getRange(cell);
    rules.push(
      SpreadsheetApp.newConditionalFormatRule()
        .whenFormulaSatisfied(`=LEFT($${cell},1)="▲"`)
        .setBackground(T.accentIncome).setFontColor(T.white).setRanges([rng]).build(),
      SpreadsheetApp.newConditionalFormatRule()
        .whenFormulaSatisfied(`=LEFT($${cell},1)="▼"`)
        .setBackground(T.accentTrendDown).setFontColor(T.white).setRanges([rng]).build());
  });

  // ---- Module 3: Health gauge display (text under where the chart goes) ----
  paintCard(s, 'N29:S44');
  mergeAndStyle(s, 'N29:S29', 'درجة الصحّة المالية', { bg: T.bgCard, fg: T.fgMuted, size: 11, align: 'center' });
  mergeAndStyle(s, 'N31:S38', '', { bg: T.bgCard, fg: T.fgPrimary, size: 36, bold: true, align: 'center' });
  s.getRange('N31').setFormula(`=${SHEET_NAMES.engine}!O2 & "/100"`);
  mergeAndStyle(s, 'N40:S40', '', { bg: T.bgCard, fg: T.fgPrimary, size: 14, align: 'center' });
  s.getRange('N40').setFormula(`=${SHEET_NAMES.engine}!O3`);
  mergeAndStyle(s, 'N43:S43', 'يُحدَّد مقياس الصحّة من نسبة الادخار + الانضباط الميزاني + تقدّم الأهداف.',
    { bg: T.bgCard, fg: T.fgMuted, size: 9, align: 'center', wrap: true });

  // ---- Module 3: Three SPARKLINE progress bars ----
  paintCard(s, 'T29:Y44');
  mergeAndStyle(s, 'T29:Y29', 'تقدّم الأهداف الرئيسيّة', { bg: T.bgCard, fg: T.fgMuted, size: 11, align: 'center' });

  const goalNames = ['صندوق الطوارئ', 'شراء منزل', 'صندوق التقاعد'];
  const barRows = [31, 34, 37];
  for (let i = 0; i < goalNames.length; i++) {
    const g = goalNames[i];
    const rr = barRows[i];
    s.getRange('Y' + rr).setValue(g).setFontColor(T.fgPrimary).setBackground(T.bgCard).setFontSize(11);
    // Sparkline merged across V..X
    mergeAndStyle(s, `V${rr}:X${rr}`, '', { bg: T.bgCard });
    const goalLookup = `IFERROR(XLOOKUP("${g}", '${SHEET_NAMES.goals}'!A7:A26, '${SHEET_NAMES.goals}'!D7:D26), 0)`;
    s.getRange(`V${rr}`).setFormula(
      `=SPARKLINE(${goalLookup}, {"charttype","bar"; "max",1; "color1", IF(${goalLookup} < 0.33, "${T.accentExpense}", IF(${goalLookup} < 0.66, "${T.gaugeAmber}", "${T.accentIncome}")); "empty","zero"})`);
    s.getRange('U' + rr).setFormula(`=TEXT(${goalLookup}, "0.0%")`)
      .setFontColor(T.fgPrimary).setBackground(T.bgCard).setFontSize(11)
      .setHorizontalAlignment('center');
  }

  // ---- Module 3: Latest 5 transactions ledger ----
  paintCard(s, 'H47:N56');
  const ledgerHdr = ['الشهر', 'التاريخ', 'النوع', 'الفئة', 'الوصف', 'المبلغ', 'طريقة الدفع'];
  s.getRange('H47:N47').setValues([ledgerHdr])
    .setFontWeight('bold').setBackground('#374151').setFontColor(T.fgPrimary)
    .setHorizontalAlignment('center');
  s.getRange('H48').setFormula(
    `=IFERROR(QUERY(${SHEET_NAMES.engine}!Q2:W, "select * where Col2 is not null order by Col2 desc limit 5", 0), "")`);

  // CF on the type column (J48:J52)
  const jRange = s.getRange('J48:J52');
  rules.push(
    SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied('=$J48="دخل"')
      .setBackground(T.accentIncome).setFontColor(T.white).setRanges([jRange]).build(),
    SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied('=$J48="مصروف"')
      .setBackground(T.accentExpense).setFontColor(T.white).setRanges([jRange]).build());
  // ---- Module 4: ملخص السلف والديون (بطاقة تلخيصية) ----
  // تسحب البيانات مباشرةً من جدول السلف في ورقة الأهداف (صفوف 31:50)
  paintCard(s, 'B58:Y64');
  mergeAndStyle(s, 'B58:Y58', '📒 ملخص السلف والديون الشخصية', {
    bg: T.bgCard, fg: T.accentNet, size: 13, bold: true, align: 'center'
  });

  // صف 60: ثلاث بطاقات KPI مصغرة للديون
  // بطاقة 1: إجمالي المبالغ المستحقة لي (دائن)
  mergeAndStyle(s, 'B60:G60', 'إجمالي المبالغ المستحقة لي (دائن)', {
    bg: T.bgCard, fg: T.fgMuted, size: 10, align: 'center'
  });
  mergeAndStyle(s, 'B61:G61', '', {
    bg: T.bgCard, fg: T.accentIncome, size: 18, bold: true, align: 'center'
  });
  s.getRange('B61').setFormula(
    `=IFERROR(SUMIFS('${SHEET_NAMES.goals}'!H31:H50, '${SHEET_NAMES.goals}'!B31:B50, "أعطيته سلف", '${SHEET_NAMES.goals}'!I31:I50, "<>🟢 مسدد بالكامل"), 0)`
  ).setNumberFormat('#,##0.00');

  // بطاقة 2: إجمالي المبالغ المستحقة علي (مدين)
  mergeAndStyle(s, 'J60:O60', 'إجمالي المبالغ المستحقة علي (مدين)', {
    bg: T.bgCard, fg: T.fgMuted, size: 10, align: 'center'
  });
  mergeAndStyle(s, 'J61:O61', '', {
    bg: T.bgCard, fg: T.accentExpense, size: 18, bold: true, align: 'center'
  });
  s.getRange('J61').setFormula(
    `=IFERROR(SUMIFS('${SHEET_NAMES.goals}'!H31:H50, '${SHEET_NAMES.goals}'!B31:B50, "أخذت منه سلف", '${SHEET_NAMES.goals}'!I31:I50, "<>🟢 مسدد بالكامل"), 0)`
  ).setNumberFormat('#,##0.00');

  // بطاقة 3: أقرب موعد سداد قادم (تنبيه)
  mergeAndStyle(s, 'R60:Y60', '⏰ أقرب موعد سداد قادم', {
    bg: T.bgCard, fg: T.fgMuted, size: 10, align: 'center'
  });
  mergeAndStyle(s, 'R61:Y61', '', {
    bg: T.bgCard, fg: T.gaugeAmber, size: 18, bold: true, align: 'center'
  });
  s.getRange('R61').setFormula(
    `=IFERROR(TEXT(MINIFS('${SHEET_NAMES.goals}'!F31:F50, '${SHEET_NAMES.goals}'!F31:F50, ">"&TODAY(), '${SHEET_NAMES.goals}'!I31:I50, "<>🟢 مسدد بالكامل"), "yyyy-mm-dd"), "لا يوجد مواعيد قادمة")`
  );

  // صف 63: صف توضيحي
  mergeAndStyle(s, 'B63:Y63', 'تُسحب هذه البيانات تلقائياً من جدول السلف في ورقة "الأهداف المالية والادخار" — لا تُعدَّل يدوياً.',
    { bg: T.bgCard, fg: T.fgMuted, size: 9, align: 'center' });

  // حماية منطقة ملخص الديون
  s.getRange('B58:Y64').protect().setDescription(WARN_CALC_CELL).setWarningOnly(true);

  s.setConditionalFormatRules(rules);

  // Stub anchors for the four charts (visible card backgrounds the user can drop charts onto).
  // Insert each chart via Insert → Chart and bind it to the matching NAMED RANGE
  // (defined in defineNamedRanges) instead of typing the engine A1 ranges by hand.
  // The named ranges are stable across rebuilds, so the chart never needs to be
  // re-bound when the engine sheet is rebuilt or moved.
  paintCard(s, 'B11:M26');
  mergeAndStyle(s, 'B11:M11', 'Chart 1: المقارنة الشهريّة (أدرجه يدوياً من النطاق المُسمَّى rng_dash_monthly_grid)',
    { bg: T.bgCard, fg: T.fgMuted, size: 10, align: 'center', wrap: true });
  paintCard(s, 'N11:Y26');
  mergeAndStyle(s, 'N11:Y11', 'Chart 2: Waterfall - تدفّق النقد (أدرجه يدوياً من النطاق المُسمَّى rng_dash_waterfall)',
    { bg: T.bgCard, fg: T.fgMuted, size: 10, align: 'center', wrap: true });
  paintCard(s, 'B29:G44');
  mergeAndStyle(s, 'B29:G29', 'Chart 3: دونات الدخل (أدرجه يدوياً من النطاق المُسمَّى rng_dash_doughnut_income)',
    { bg: T.bgCard, fg: T.fgMuted, size: 10, align: 'center', wrap: true });
  paintCard(s, 'H29:M44');
  mergeAndStyle(s, 'H29:M29', 'Chart 4: دونات المصاريف (أدرجه يدوياً من النطاق المُسمَّى rng_dash_doughnut_expense)',
    { bg: T.bgCard, fg: T.fgMuted, size: 10, align: 'center', wrap: true });
}

function paintCard(s, a1) {
  s.getRange(a1).setBackground(T.bgCard).setFontColor(T.fgPrimary);
}

function buildAnnualSum(income) {
  const block = income ? 'E10:E28' : 'E33:E62';
  return '=SUM(' + MONTHS.map(m => `'${m}'!${block}`).join(', ') + ')';
}

function buildTrendFormula(curCell, priCell) {
  // Bulletproof trend formula. The previous version did naked arithmetic on
  // `_DashboardEngine!H/I` cells, so a single text/blank value upstream
  // produced #VALUE! that bled all the way to the card. This version:
  //
  //   1. Coerces both operands to numbers via `IFERROR(<ref>+0, 0)`. Adding
  //      zero to a number is a no-op; adding zero to text returns #VALUE!,
  //      which the inner IFERROR catches and replaces with 0. This is the
  //      safest numeric-coercion idiom in Sheets — N() does NOT trap
  //      propagated errors, so it cannot be used here.
  //
  //   2. Wraps the entire expression in an outer IFERROR so any arithmetic
  //      surprise (division by zero, locale-related TEXT failure, etc.)
  //      degrades gracefully to a single em-dash "—" instead of #VALUE!.
  //
  //   3. Returns a clean em-dash for the "no prior data" branch, matching
  //      the visual language used everywhere else in the dashboard.
  const cur = `IFERROR(${SHEET_NAMES.engine}!${curCell}+0, 0)`;
  const pri = `IFERROR(${SHEET_NAMES.engine}!${priCell}+0, 0)`;
  // We compute the delta once via LET to keep the formula readable.
  return (
    '=IFERROR(LET(' +
    `cur, ${cur}, ` +
    `pri, ${pri}, ` +
    'IF(pri=0, "—", ' +
      'IF(cur >= pri, ' +
        '"▲ " & TEXT((cur-pri)/pri, "0.0%"), ' +
        '"▼ " & TEXT((cur-pri)/pri, "0.0%")))), ' +
    '"—")'
  );
}

// ============================================================================
// PHASE 5: WELCOME / ONBOARDING SHEET
// ============================================================================
function buildWelcome(ss) {
  const s = getOrCreateSheet(ss, SHEET_NAMES.welcome);

  // Page background and increase row heights
  s.getRange(1, 1, 40, 16).setBackground(T.bgPage).setFontColor(T.fgPrimary);
  for (let i = 1; i <= 40; i++) s.setRowHeight(i, 24);
  for (let i = 2; i <= 4; i++) s.setRowHeight(i, 60);

  // Hero header
  const hero = s.getRange('B2:O4');
  hero.merge();
  hero.setValue('نظام ميزان المالي الذكي\nBUDGET CALCULATOR 2026')
    .setBackground(T.bgCard).setFontColor(T.fgPrimary)
    .setFontSize(20).setFontWeight('bold')
    .setHorizontalAlignment('center').setVerticalAlignment('middle')
    .setWrap(true);

  // Tagline
  mergeAndStyle(s, 'B6:O9',
    'نظام ميزان المالي الذكي قالب فنتك عربي احترافي مبني على Google Sheets، يجمع محرّك عملات متعدّد، 12 ورقة شهريّة بمحرّك تنبيهات ذكي، نظام أهداف وادّخار مع توصيات آليّة، ولوحة معلومات فاخرة بوضع داكن وتحليلات سنويّة.',
    { bg: T.bgPage, fg: T.fgMuted, size: 13, align: 'center', wrap: true });

  // Quick start cards (3 columns of 5 each)
  const cards = [
    { id: '01', title: 'اضبط الإعدادات أوّلاً', body: 'افتح ورقة الإعدادات وأسعار الصرف، اختر العملة الرئيسيّة من B3، حدِّث أسعار الصرف، وراجع قوائم الفئات وطرق الدفع.', target: SHEET_NAMES.settings, accent: T.accentNet, link: '📘 افتح ورقة الإعدادات' },
    { id: '02', title: 'أدخل بياناتك الشهريّة', body: 'انتقل لورقة الشهر الحالي وأدخل صفوف الدخل في A10:G28 وصفوف المصاريف في A33:G62. الفرق ومحرّك التنبيهات يُحسبان آلياً.', target: 'يناير', accent: T.accentIncome, link: '📅 افتح ورقة يناير' },
    { id: '03', title: 'اقرأ اللوحة الرئيسيّة بأمان', body: 'بعد تراكم البيانات افتح ورقة اللوحة الرئيسيّة. ستجد ست بطاقات KPI وأربعة رسوم وسجلّ المعاملات. لا تُحرِّر الخلايا المحميّة.', target: SHEET_NAMES.dashboard, accent: T.paletteOrange, link: '📊 افتح اللوحة الرئيسيّة' },
  ];

  const cardCols = [['B', 'F'], ['G', 'K'], ['L', 'P']];
  for (let i = 0; i < cards.length; i++) {
    const c = cards[i];
    const [colStart, colEnd] = cardCols[i];
    paintCard(s, `${colStart}11:${colEnd}23`);
    // Top accent border (Apps Script doesn't expose top-only-border with custom width well, so use a narrow row)
    s.getRange(`${colStart}11:${colEnd}11`).setBackground(c.accent);
    mergeAndStyle(s, `${colStart}12:${colEnd}13`, c.id,
      { bg: T.bgCard, fg: c.accent, size: 30, bold: true, align: 'right' });
    mergeAndStyle(s, `${colStart}14:${colEnd}15`, c.title,
      { bg: T.bgCard, fg: T.fgPrimary, size: 16, bold: true, align: 'right' });
    mergeAndStyle(s, `${colStart}16:${colEnd}22`, c.body,
      { bg: T.bgCard, fg: T.fgMuted, size: 11, align: 'right', wrap: true });
    // Hyperlink
    const target = ss.getSheetByName(c.target);
    if (target) {
      const gid = target.getSheetId();
      mergeAndStyle(s, `${colStart}23:${colEnd}23`, '', { bg: T.bgCard, align: 'right' });
      s.getRange(`${colStart}23`).setFormula(`=HYPERLINK("#gid=${gid}", "${c.link}")`)
        .setFontColor(T.accentIncome).setFontSize(11);
    }
  }

  // Developer signature card
  paintCard(s, 'B26:O29');
  mergeAndStyle(s, 'B26:O27', '💎 تم التطوير والهندسة بواسطة: Boulahdid Djamal Eddine - المهندس',
    { bg: T.bgCard, fg: T.fgPrimary, size: 14, bold: true, align: 'center', vAlign: 'middle' });
  mergeAndStyle(s, 'B28:O29', '📩 للتواصل والدعم الفني: boulahdiddjamaleddine',
    { bg: T.bgCard, fg: T.fgMuted, size: 12, align: 'center', vAlign: 'middle' });

  // Footer
  mergeAndStyle(s, 'B32:O32', 'الإصدار: 1.0.0 (Phase 6/13 - Apps Script Installer) - مايو 2026',
    { bg: T.bgPage, fg: T.fgMuted, size: 10, align: 'center' });
  mergeAndStyle(s, 'B33:O33',
    'قالب احترافي مفتوح للتخصيص. أسعار الصرف مؤشّرات إرشاديّة - يجب على المستخدم تحديثها قبل أيّ استخدام محاسبي فعلي.',
    { bg: T.bgPage, fg: T.fgMuted, size: 10, align: 'center' });
  mergeAndStyle(s, 'B34:O34',
    'Premium Arabic Fintech Template - All formulas built for Google Sheets compatibility (XLOOKUP, ARRAYFORMULA, IFS, QUERY, SPARKLINE).',
    { bg: T.bgPage, fg: T.fgMuted, size: 9, align: 'center' });
}

// ============================================================================
// PHASE 6: DEMO DATA 2025 (بيانات تجريبية واقعية لسنة 2025)
// ============================================================================
/**
 * يحقن بيانات تجريبية واقعية في كل الأوراق الشهريّة (يناير→ديسمبر) لسنة 2025.
 * الهدف: إبراز قوة القالب للمستخدم الجديد عبر بيانات متنوّعة تُظهر:
 *   - مداخيل متعددة المصادر (راتب + عمل حر + استثمار)
 *   - مصاريف واقعية تغطي جميع الفئات مع تنوع في التنبيهات
 *   - أهداف ادخار بنسب إنجاز مختلفة (مكتمل / قيد الادخار / لم يبدأ)
 *   - سجلات سلف وديون تُفعّل المؤشرات اللونية الثلاثة
 *
 * المعايير:
 *   ✅ أرقام لاتينية (1,2,3) حصراً
 *   ✅ تواريخ بتنسيق yyyy-mm-dd
 *   ✅ واجهة عربية بالكامل
 *   ✅ Fintech Dark Mode
 */
function buildDemoData2025(ss) {
  // ---------- بيانات الدخل الشهرية (لكل شهر) ----------
  // كل صف: [تاريخ, فئة, وصف, دخل متوقع, دخل فعلي, (فارق=تلقائي), طريقة الدفع]
  // (العمود F محسوب بـ ARRAYFORMULA — لا نكتبه)

  const demoIncome = {
    'يناير':   [
      [new Date('2025-01-01'), 'راتب أساسي',   'راتب شهر يناير',        12000, 12000, '', 'تحويل الكتروني'],
      [new Date('2025-01-10'), 'عمل حر',       'مشروع تصميم واجهة',     3500,  4200, '', 'تحويل الكتروني'],
      [new Date('2025-01-15'), 'دخل استثماري', 'أرباح محفظة أسهم',      1200,  980,  '', 'تحويل الكتروني'],
    ],
    'فبراير':  [
      [new Date('2025-02-01'), 'راتب أساسي',   'راتب شهر فبراير',       12000, 12000, '', 'تحويل الكتروني'],
      [new Date('2025-02-08'), 'مكافآت وحوافز','مكافأة أداء Q4-2024',    5000,  5000, '', 'تحويل الكتروني'],
      [new Date('2025-02-20'), 'عمل حر',       'استشارة تقنية',         2000,  2000, '', 'بطاقة بنكية'],
    ],
    'مارس':    [
      [new Date('2025-03-01'), 'راتب أساسي',   'راتب شهر مارس',         12000, 12000, '', 'تحويل الكتروني'],
      [new Date('2025-03-12'), 'عمل حر',       'تطوير تطبيق ويب',       6000,  5500, '', 'تحويل الكتروني'],
      [new Date('2025-03-25'), 'إيجارات',      'إيجار عقار تجاري',      3000,  3000, '', 'نقداً'],
    ],
    'أبريل':   [
      [new Date('2025-04-01'), 'راتب أساسي',   'راتب شهر أبريل',        12000, 12500, '', 'تحويل الكتروني'],
      [new Date('2025-04-10'), 'أرباح تجارية', 'أرباح متجر الكتروني',   4500,  4800, '', 'تحويل الكتروني'],
      [new Date('2025-04-18'), 'دخل استثماري', 'توزيعات صندوق عقاري',   1800,  1800, '', 'تحويل الكتروني'],
    ],
    'مايو':    [
      [new Date('2025-05-01'), 'راتب أساسي',   'راتب شهر مايو',         12000, 12000, '', 'تحويل الكتروني'],
      [new Date('2025-05-14'), 'عمل حر',       'تدريب فريق برمجة',      3000,  3200, '', 'نقداً'],
      [new Date('2025-05-22'), 'هدايا',        'هدية عيد من العائلة',   1000,  1500, '', 'نقداً'],
    ],
    'يونيو':   [
      [new Date('2025-06-01'), 'راتب أساسي',   'راتب شهر يونيو',        12000, 12000, '', 'تحويل الكتروني'],
      [new Date('2025-06-10'), 'مكافآت وحوافز','مكافأة نصف سنوية',      8000,  8000, '', 'تحويل الكتروني'],
      [new Date('2025-06-20'), 'إيجارات',      'إيجار عقار تجاري',      3000,  3000, '', 'نقداً'],
      [new Date('2025-06-28'), 'عمل حر',       'مشروع API متكامل',      5000,  4700, '', 'تحويل الكتروني'],
    ],
    'يوليو':   [
      [new Date('2025-07-01'), 'راتب أساسي',   'راتب شهر يوليو',        12000, 12000, '', 'تحويل الكتروني'],
      [new Date('2025-07-15'), 'دخل استثماري', 'أرباح أسهم تقنية',      2200,  2800, '', 'تحويل الكتروني'],
      [new Date('2025-07-20'), 'عمل حر',       'تصميم هوية بصرية',      4000,  4000, '', 'بطاقة بنكية'],
    ],
    'أغسطس':   [
      [new Date('2025-08-01'), 'راتب أساسي',   'راتب شهر أغسطس',        12000, 12000, '', 'تحويل الكتروني'],
      [new Date('2025-08-10'), 'أرباح تجارية', 'مبيعات متجر موسم الصيف', 7000, 7500, '', 'تحويل الكتروني'],
      [new Date('2025-08-25'), 'إيجارات',      'إيجار عقار تجاري',      3000,  3000, '', 'نقداً'],
    ],
    'سبتمبر':  [
      [new Date('2025-09-01'), 'راتب أساسي',   'راتب شهر سبتمبر',       12000, 12000, '', 'تحويل الكتروني'],
      [new Date('2025-09-08'), 'عمل حر',       'ورشة تدريب أونلاين',    2500,  2500, '', 'تحويل الكتروني'],
      [new Date('2025-09-18'), 'دخل استثماري', 'عوائد سندات حكومية',    1500,  1500, '', 'تحويل الكتروني'],
    ],
    'أكتوبر':  [
      [new Date('2025-10-01'), 'راتب أساسي',   'راتب شهر أكتوبر',       12000, 12000, '', 'تحويل الكتروني'],
      [new Date('2025-10-12'), 'مكافآت وحوافز','مكافأة مشروع ناجح',     3000,  3000, '', 'تحويل الكتروني'],
      [new Date('2025-10-20'), 'عمل حر',       'برمجة لوحة تحكم',       5500,  5000, '', 'تحويل الكتروني'],
    ],
    'نوفمبر':  [
      [new Date('2025-11-01'), 'راتب أساسي',   'راتب شهر نوفمبر',       12000, 12000, '', 'تحويل الكتروني'],
      [new Date('2025-11-10'), 'إيجارات',      'إيجار عقار تجاري',      3000,  3000, '', 'نقداً'],
      [new Date('2025-11-22'), 'أرباح تجارية', 'أرباح حملة Black Friday', 9000, 11000,'', 'تحويل الكتروني'],
    ],
    'ديسمبر':  [
      [new Date('2025-12-01'), 'راتب أساسي',   'راتب شهر ديسمبر',       12000, 12000, '', 'تحويل الكتروني'],
      [new Date('2025-12-10'), 'مكافآت وحوافز','مكافأة نهاية السنة',    10000, 10000, '', 'تحويل الكتروني'],
      [new Date('2025-12-18'), 'عمل حر',       'مشروع ختام السنة',      4000,  3800, '', 'تحويل الكتروني'],
      [new Date('2025-12-25'), 'هدايا',        'هدية رأس السنة',        500,   800,  '', 'نقداً'],
    ],
  };

  // ---------- بيانات المصاريف الشهرية ----------
  const demoExpenses = {
    'يناير':   [
      [new Date('2025-01-02'), 'السكن',      'إيجار الشقة',            4500, 4500, '', 'تحويل الكتروني', ''],
      [new Date('2025-01-03'), 'الفواتير',    'كهرباء + ماء + غاز',    800,  920,  '', 'بطاقة بنكية', ''],
      [new Date('2025-01-05'), 'الطعام',      'مشتريات السوبرماركت',   2000, 2350, '', 'بطاقة بنكية', ''],
      [new Date('2025-01-08'), 'النقل',       'وقود + صيانة سيارة',   1200, 1100, '', 'نقداً', ''],
      [new Date('2025-01-12'), 'الاشتراكات',  'انترنت + نتفلكس + Spotify', 350, 350, '', 'بطاقة بنكية', ''],
      [new Date('2025-01-15'), 'الصحة',       'فحص طبي دوري',          500,  500,  '', 'نقداً', ''],
      [new Date('2025-01-20'), 'التعليم',     'كورس أونلاين - AWS',    400,  400,  '', 'بطاقة بنكية', ''],
    ],
    'فبراير':  [
      [new Date('2025-02-02'), 'السكن',      'إيجار الشقة',            4500, 4500, '', 'تحويل الكتروني', ''],
      [new Date('2025-02-03'), 'الفواتير',    'كهرباء + ماء',          700,  680,  '', 'بطاقة بنكية', ''],
      [new Date('2025-02-06'), 'الطعام',      'مشتريات أسبوعية',       1800, 1900, '', 'بطاقة بنكية', ''],
      [new Date('2025-02-10'), 'النقل',       'وقود السيارة',          900,  850,  '', 'نقداً', ''],
      [new Date('2025-02-14'), 'الترفيه',     'عشاء عيد الحب',         600,  750,  '', 'بطاقة بنكية', ''],
      [new Date('2025-02-20'), 'التسوق',      'ملابس شتوية',           1500, 1800, '', 'بطاقة بنكية', ''],
    ],
    'مارس':    [
      [new Date('2025-03-02'), 'السكن',      'إيجار الشقة',            4500, 4500, '', 'تحويل الكتروني', ''],
      [new Date('2025-03-04'), 'الفواتير',    'فواتير الخدمات',        750,  800,  '', 'بطاقة بنكية', ''],
      [new Date('2025-03-07'), 'الطعام',      'بقالة + مطاعم',         2200, 2100, '', 'نقداً', ''],
      [new Date('2025-03-10'), 'النقل',       'صيانة دورية للسيارة',   2000, 2500, '', 'نقداً', ''],
      [new Date('2025-03-15'), 'الصحة',       'أدوية + زيارة طبيب',    350,  350,  '', 'نقداً', ''],
      [new Date('2025-03-22'), 'الاشتراكات',  'اشتراكات رقمية',        350,  350,  '', 'بطاقة بنكية', ''],
      [new Date('2025-03-28'), 'الطوارئ',     'إصلاح جهاز لابتوب',     800,  1200, '', 'بطاقة بنكية', ''],
    ],
    'أبريل':   [
      [new Date('2025-04-02'), 'السكن',      'إيجار الشقة',            4500, 4500, '', 'تحويل الكتروني', ''],
      [new Date('2025-04-04'), 'الفواتير',    'كهرباء + ماء + انترنت', 900,  880,  '', 'بطاقة بنكية', ''],
      [new Date('2025-04-06'), 'الطعام',      'مشتريات + توصيل طعام',  2000, 2200, '', 'بطاقة بنكية', ''],
      [new Date('2025-04-10'), 'النقل',       'وقود + غسيل سيارة',    1000, 950,  '', 'نقداً', ''],
      [new Date('2025-04-15'), 'التعليم',     'كتب تطوير ذات',         300,  300,  '', 'بطاقة بنكية', ''],
      [new Date('2025-04-25'), 'السفر',       'رحلة نهاية أسبوع',      3000, 3500, '', 'بطاقة بنكية', ''],
    ],
    'مايو':    [
      [new Date('2025-05-02'), 'السكن',      'إيجار الشقة',            4500, 4500, '', 'تحويل الكتروني', ''],
      [new Date('2025-05-03'), 'الفواتير',    'فواتير مايو',           750,  720,  '', 'بطاقة بنكية', ''],
      [new Date('2025-05-06'), 'الطعام',      'مشتريات غذائية',        1800, 1750, '', 'نقداً', ''],
      [new Date('2025-05-09'), 'النقل',       'وقود + مواقف',          1100, 1100, '', 'نقداً', ''],
      [new Date('2025-05-15'), 'الترفيه',     'اشتراك نادي رياضي',     500,  500,  '', 'بطاقة بنكية', ''],
      [new Date('2025-05-20'), 'هدايا',       'هدية عيد الأم',          800,  800,  '', 'نقداً', ''],
      [new Date('2025-05-28'), 'التسوق',      'أجهزة إلكترونية',       2500, 2500, '', 'بطاقة بنكية', ''],
    ],
    'يونيو':   [
      [new Date('2025-06-02'), 'السكن',      'إيجار الشقة',            4500, 4500, '', 'تحويل الكتروني', ''],
      [new Date('2025-06-04'), 'الفواتير',    'كهرباء (موسم حرارة)',   1200, 1400, '', 'بطاقة بنكية', ''],
      [new Date('2025-06-07'), 'الطعام',      'بقالة ومطاعم',          2300, 2500, '', 'بطاقة بنكية', ''],
      [new Date('2025-06-10'), 'النقل',       'وقود السيارة',          1000, 1000, '', 'نقداً', ''],
      [new Date('2025-06-15'), 'الصحة',       'تأمين صحي ربع سنوي',   2000, 2000, '', 'تحويل الكتروني', ''],
      [new Date('2025-06-20'), 'الاشتراكات',  'اشتراكات + تخزين سحابي', 400, 400, '', 'بطاقة بنكية', ''],
      [new Date('2025-06-28'), 'الترفيه',     'سينما + كافيه',         350,  450,  '', 'نقداً', ''],
    ],
    'يوليو':   [
      [new Date('2025-07-02'), 'السكن',      'إيجار الشقة',            4500, 4500, '', 'تحويل الكتروني', ''],
      [new Date('2025-07-04'), 'الفواتير',    'فواتير يوليو',          1100, 1250, '', 'بطاقة بنكية', ''],
      [new Date('2025-07-06'), 'الطعام',      'مشتريات + حفلة شواء',   2500, 2800, '', 'نقداً', ''],
      [new Date('2025-07-10'), 'النقل',       'وقود + تأمين سيارة',   1800, 1800, '', 'تحويل الكتروني', ''],
      [new Date('2025-07-18'), 'السفر',       'إجازة صيفية (فندق+طيران)', 8000, 9200, '', 'بطاقة بنكية', ''],
      [new Date('2025-07-25'), 'التسوق',      'مشتريات إجازة',         1500, 1500, '', 'بطاقة بنكية', ''],
    ],
    'أغسطس':   [
      [new Date('2025-08-02'), 'السكن',      'إيجار الشقة',            4500, 4500, '', 'تحويل الكتروني', ''],
      [new Date('2025-08-04'), 'الفواتير',    'كهرباء (ذروة الصيف)',   1500, 1650, '', 'بطاقة بنكية', ''],
      [new Date('2025-08-07'), 'الطعام',      'بقالة شهرية',           2000, 1950, '', 'بطاقة بنكية', ''],
      [new Date('2025-08-10'), 'النقل',       'وقود + إطارات جديدة',  2200, 2200, '', 'نقداً', ''],
      [new Date('2025-08-15'), 'التعليم',     'دورة PMP تحضيرية',      1500, 1500, '', 'بطاقة بنكية', ''],
      [new Date('2025-08-22'), 'الاشتراكات',  'اشتراكات شهرية',        350,  350,  '', 'بطاقة بنكية', ''],
    ],
    'سبتمبر':  [
      [new Date('2025-09-02'), 'السكن',      'إيجار الشقة',            4500, 4500, '', 'تحويل الكتروني', ''],
      [new Date('2025-09-03'), 'الفواتير',    'فواتير سبتمبر',         850,  850,  '', 'بطاقة بنكية', ''],
      [new Date('2025-09-06'), 'الطعام',      'بقالة + مطاعم',         2000, 2150, '', 'نقداً', ''],
      [new Date('2025-09-09'), 'النقل',       'وقود + مواصلات عامة',  1000, 1050, '', 'نقداً', ''],
      [new Date('2025-09-14'), 'التعليم',     'كتب + أدوات تعلّم',     600,  600,  '', 'بطاقة بنكية', ''],
      [new Date('2025-09-20'), 'الصحة',       'فحوصات مخبرية',         400,  400,  '', 'نقداً', ''],
      [new Date('2025-09-28'), 'الترفيه',     'حفلة + خروجات',         700,  900,  '', 'نقداً', ''],
    ],
    'أكتوبر':  [
      [new Date('2025-10-02'), 'السكن',      'إيجار الشقة',            4500, 4500, '', 'تحويل الكتروني', ''],
      [new Date('2025-10-04'), 'الفواتير',    'كهرباء + ماء + غاز',   800,  780,  '', 'بطاقة بنكية', ''],
      [new Date('2025-10-07'), 'الطعام',      'بقالة أسبوعية',         1900, 2000, '', 'بطاقة بنكية', ''],
      [new Date('2025-10-10'), 'النقل',       'وقود السيارة',          1000, 1000, '', 'نقداً', ''],
      [new Date('2025-10-15'), 'التسوق',      'ملابس موسم الخريف',     2000, 2200, '', 'بطاقة بنكية', ''],
      [new Date('2025-10-22'), 'الاشتراكات',  'اشتراكات + VPN',        380,  380,  '', 'بطاقة بنكية', ''],
    ],
    'نوفمبر':  [
      [new Date('2025-11-02'), 'السكن',      'إيجار الشقة',            4500, 4500, '', 'تحويل الكتروني', ''],
      [new Date('2025-11-04'), 'الفواتير',    'فواتير نوفمبر',         750,  750,  '', 'بطاقة بنكية', ''],
      [new Date('2025-11-07'), 'الطعام',      'مشتريات غذائية',        2200, 2100, '', 'نقداً', ''],
      [new Date('2025-11-10'), 'النقل',       'وقود + غسيل',           900,  900,  '', 'نقداً', ''],
      [new Date('2025-11-15'), 'التسوق',      'تخفيضات Black Friday',  5000, 6500, '', 'بطاقة بنكية', ''],
      [new Date('2025-11-22'), 'الترفيه',     'ألعاب فيديو + أفلام',   400,  400,  '', 'بطاقة بنكية', ''],
      [new Date('2025-11-28'), 'الطوارئ',     'إصلاح سباكة منزلية',    600,  600,  '', 'نقداً', ''],
    ],
    'ديسمبر':  [
      [new Date('2025-12-02'), 'السكن',      'إيجار الشقة',            4500, 4500, '', 'تحويل الكتروني', ''],
      [new Date('2025-12-04'), 'الفواتير',    'كهرباء + تدفئة',       1000, 1100, '', 'بطاقة بنكية', ''],
      [new Date('2025-12-06'), 'الطعام',      'مشتريات + حلويات العيد', 3000, 3200, '', 'نقداً', ''],
      [new Date('2025-12-10'), 'النقل',       'وقود + صيانة شتوية',   1500, 1500, '', 'نقداً', ''],
      [new Date('2025-12-15'), 'هدايا',       'هدايا رأس السنة',       3000, 3500, '', 'بطاقة بنكية', ''],
      [new Date('2025-12-20'), 'الاشتراكات',  'تجديد سنوي كل الخدمات', 1200, 1200, '', 'بطاقة بنكية', ''],
      [new Date('2025-12-28'), 'السفر',       'رحلة رأس السنة',        5000, 5500, '', 'بطاقة بنكية', ''],
    ],
  };

  // ---------- حقن البيانات في الأوراق الشهرية ----------
  for (const month of MONTHS) {
    const s = ss.getSheetByName(month);
    if (!s) continue;

    // حقن الدخل (A10:G28) - الأعمدة: تاريخ، فئة، وصف، متوقع، فعلي، [فارق=تلقائي]، طريقة
    const incRows = demoIncome[month] || [];
    if (incRows.length > 0) {
      s.getRange(10, 1, incRows.length, 7).setValues(incRows);
      s.getRange(10, 1, incRows.length, 1).setNumberFormat('yyyy-mm-dd');
      s.getRange(10, 4, incRows.length, 2).setNumberFormat('#,##0.00');
    }

    // حقن المصاريف (A33:H62) - الأعمدة: تاريخ، فئة، وصف، متوقع، فعلي، [فارق=تلقائي]، طريقة، [تنبيه=تلقائي]
    const expRows = demoExpenses[month] || [];
    if (expRows.length > 0) {
      s.getRange(33, 1, expRows.length, 8).setValues(expRows);
      s.getRange(33, 1, expRows.length, 1).setNumberFormat('yyyy-mm-dd');
      s.getRange(33, 4, expRows.length, 2).setNumberFormat('#,##0.00');
    }
  }

  // ---------- حقن أهداف ادخار متنوعة (بدلاً من الأهداف الافتراضية) ----------
  const goalsSheet = ss.getSheetByName(SHEET_NAMES.goals);
  const DEMO_GOALS = [
    // [الهدف, التكلفة, المدخر, (نسبة=تلقائي), الموعد, (أشهر=تلقائي), (قسط=تلقائي), (حالة=تلقائي), (توصية=تلقائي)]
    ['صندوق الطوارئ',      60000,   60000, '', new Date('2025-12-31'), '', '', '', ''],   // 🟢 مكتمل 100%
    ['شراء سيارة جديدة',   80000,   45000, '', new Date('2027-06-30'), '', '', '', ''],   // 🟡 قيد الادخار 56%
    ['شراء منزل',         1200000, 180000, '', new Date('2030-12-31'), '', '', '', ''],   // 🟡 قيد الادخار 15%
    ['صندوق التقاعد',     500000,  75000,  '', new Date('2045-12-31'), '', '', '', ''],   // 🟡 قيد الادخار 15%
    ['رحلة الحج',          35000,   35000, '', new Date('2025-09-01'), '', '', '', ''],   // 🟢 مكتمل 100%
    ['تعليم الأبناء',     200000,  20000,  '', new Date('2035-09-01'), '', '', '', ''],   // 🟡 قيد الادخار 10%
    ['مشروع تجاري خاص',   150000,      0, '', new Date('2028-12-31'), '', '', '', ''],   // ⚪ لم يبدأ بعد
    ['السفر والاستثمار',    25000,  12000, '', new Date('2026-08-31'), '', '', '', ''],   // 🟡 قيد الادخار 48%
  ];
  goalsSheet.getRange(7, 1, DEMO_GOALS.length, 9).setValues(DEMO_GOALS);
  goalsSheet.getRange(7, 5, DEMO_GOALS.length, 1).setNumberFormat('yyyy-mm-dd');

  // ---------- حقن بيانات السلف والديون التجريبية ----------
  const DEMO_DEBTS = [
    // [اسم, نوع, مبلغ, عملة, تاريخ معاملة, تاريخ سداد, مسدد, (رصيد=تلقائي), (حالة=تلقائي)]
    ['أحمد بن محمد',    'أعطيته سلف',  15000, 'USD', new Date('2025-01-10'), new Date('2025-07-10'), 15000, '', ''],  // 🟢 مسدد بالكامل
    ['سارة العلي',      'أخذت منه سلف', 8000,  'USD', new Date('2025-02-15'), new Date('2025-08-15'), 5000,  '', ''],  // 🟡 مسدد جزئياً
    ['خالد يوسف',       'أعطيته سلف',  25000, 'USD', new Date('2025-03-01'), new Date('2026-03-01'), 10000, '', ''],  // 🟡 مسدد جزئياً
    ['فاطمة الزهراء',   'أخذت منه سلف', 5000,  'USD', new Date('2025-04-20'), new Date('2025-10-20'), 5000,  '', ''],  // 🟢 مسدد بالكامل
    ['محمد الأمين',     'أعطيته سلف',  12000, 'USD', new Date('2025-06-01'), new Date('2026-06-01'), 0,     '', ''],  // 🔴 غير مسدد
    ['نورة حسين',       'أخذت منه سلف', 3500,  'USD', new Date('2025-07-15'), new Date('2026-01-15'), 1000,  '', ''],  // 🟡 مسدد جزئياً
    ['عبد الرحمن',      'أعطيته سلف',  7000,  'USD', new Date('2025-09-01'), new Date('2026-03-01'), 7000,  '', ''],  // 🟢 مسدد بالكامل
    ['ليلى بوعلام',     'أخذت منه سلف', 20000, 'USD', new Date('2025-10-10'), new Date('2026-10-10'), 0,     '', ''],  // 🔴 غير مسدد
  ];
  goalsSheet.getRange(31, 1, DEMO_DEBTS.length, 9).setValues(DEMO_DEBTS);
  goalsSheet.getRange(31, 5, DEMO_DEBTS.length, 1).setNumberFormat('yyyy-mm-dd');
  goalsSheet.getRange(31, 6, DEMO_DEBTS.length, 1).setNumberFormat('yyyy-mm-dd');
  goalsSheet.getRange(31, 3, DEMO_DEBTS.length, 1).setNumberFormat('#,##0.00');
  goalsSheet.getRange(31, 7, DEMO_DEBTS.length, 1).setNumberFormat('#,##0.00');
}

// ============================================================================
// NAMED RANGES - wires the workbook together
// ============================================================================
function defineNamedRanges(ss) {
  const settings = ss.getSheetByName(SHEET_NAMES.settings);
  const set = (name, a1) => ss.setNamedRange(name, settings.getRange(a1));

  set('rng_MainCurrency',     'B3');
  set('rng_ActiveFormat',     'B4');
  set('rng_MainRate',          'B5');
  set('rng_Currencies',       'A7:A20');
  set('rng_CurrencyNames',    'B7:B20');
  set('rng_CurrencyRates',    'C7:C20');
  set('rng_FormatStrings',    'D7:D20');
  set('rng_CurrencyTable',    'A7:D20');
  set('rng_IncomeCategories', 'F7:F14');
  set('rng_ExpenseCategories', 'G7:G18');
  set('rng_PaymentMethods',   'H7:H10');

  // Dynamic chart ranges. Charts on the dashboard should be configured to read
  // from these named ranges instead of hard-coded `_DashboardEngine!A1:D13`
  // anchors. As long as the engine layout stays stable, every chart redraws
  // automatically the moment a monthly sheet, a goal, or an exchange rate is
  // edited — no manual rewiring of chart sources needed.
  const engine = ss.getSheetByName(SHEET_NAMES.engine);
  const setEng = (name, a1) => ss.setNamedRange(name, engine.getRange(a1));
  setEng('rng_dash_monthly_grid',     'A1:D13');   // Chart 1 - Combo (monthly comparison)
  setEng('rng_dash_waterfall',        'F1:G7');    // Chart 2 - Waterfall (cash flow)
  setEng('rng_dash_doughnut_income',  'I1:J9');    // Chart 3 - Doughnut (income sources)
  setEng('rng_dash_doughnut_expense', 'L1:M13');   // Chart 4 - Doughnut (expense categories)

  // Now apply data validations that depend on named ranges (categories, payment methods)
  applyMonthlyValidations(ss);
}

function applyMonthlyValidations(ss) {
  const incomeCatDv = SpreadsheetApp.newDataValidation()
    .requireValueInRange(ss.getRangeByName('rng_IncomeCategories'), true)
    .setAllowInvalid(false).build();
  const expenseCatDv = SpreadsheetApp.newDataValidation()
    .requireValueInRange(ss.getRangeByName('rng_ExpenseCategories'), true)
    .setAllowInvalid(false).build();
  const payDv = SpreadsheetApp.newDataValidation()
    .requireValueInRange(ss.getRangeByName('rng_PaymentMethods'), true)
    .setAllowInvalid(false).build();

  for (const m of MONTHS) {
    const s = ss.getSheetByName(m);
    s.getRange('B10:B28').setDataValidation(incomeCatDv);
    s.getRange('B33:B62').setDataValidation(expenseCatDv);
    s.getRange('G10:G28').setDataValidation(payDv);
    s.getRange('G33:G62').setDataValidation(payDv);
  }
}

// ============================================================================
// PROTECTION (Soft-Lock layer)
// ============================================================================
function applyProtection(ss) {
  // Engine sheet (whole-sheet protection)
  const engine = ss.getSheetByName(SHEET_NAMES.engine);
  engine.protect().setDescription(WARN_ENGINE).setWarningOnly(true);

  // Welcome branding regions
  const welcome = ss.getSheetByName(SHEET_NAMES.welcome);
  welcome.getRange('B2:O4').protect().setDescription(WARN_BRANDING).setWarningOnly(true);
  welcome.getRange('B26:O29').protect().setDescription(WARN_BRANDING).setWarningOnly(true);

  // Dashboard regions (KPI cards + chart anchors + ledger)
  const dash = ss.getSheetByName(SHEET_NAMES.dashboard);
  ['B4:E8', 'F4:I8', 'J4:M8', 'N4:Q8', 'R4:U8', 'V4:Y8',
   'B11:M26', 'N11:Y26', 'B29:G44', 'H29:M44',
   'N29:S44', 'T29:Y44', 'H47:N56'].forEach(r => {
    dash.getRange(r).protect().setDescription(WARN_CALC_CELL).setWarningOnly(true);
  });

  // Settings sheet - protect everything except B3 + C7:C20 + F7:H18
  const settings = ss.getSheetByName(SHEET_NAMES.settings);
  const settingsProtect = settings.protect()
    .setDescription(WARN_SETTINGS).setWarningOnly(true);
  // Allow editing within these ranges
  settingsProtect.setUnprotectedRanges([
    settings.getRange('B3'),
    settings.getRange('C7:C20'),
    settings.getRange('F7:F14'),
    settings.getRange('G7:G18'),
    settings.getRange('H7:H10'),
  ]);

  // Goals sheet - protect calculated columns (D, F, G, H, I from rows 7..26)
  const goals = ss.getSheetByName(SHEET_NAMES.goals);
  ['D7:D26', 'F7:F26', 'G7:G26', 'H7:H26', 'I7:I26'].forEach(r => {
    goals.getRange(r).protect().setDescription(WARN_CALC_CELL).setWarningOnly(true);
  });

  // Debts ledger - protect computed columns (H31:H50 الرصيد المتبقي, I31:I50 الحالة)
  // and summary panel (A52:I54)
  ['H31:H50', 'I31:I50', 'A52:I54'].forEach(r => {
    goals.getRange(r).protect().setDescription(WARN_CALC_CELL).setWarningOnly(true);
  });

  // Monthly sheets - protect KPI panel + alert column + totals
  for (const m of MONTHS) {
    const s = ss.getSheetByName(m);
    ['A1:G6', 'F10:F28', 'H33:H62', 'A29:G29', 'A63:H63'].forEach(r => {
      s.getRange(r).protect().setDescription(WARN_CALC_CELL).setWarningOnly(true);
    });
  }
}

// ============================================================================
// TAB ORDER - welcome first, engine last (and hidden)
// ============================================================================
function reorderTabs(ss) {
  const order = [
    SHEET_NAMES.welcome,
    SHEET_NAMES.settings,
    SHEET_NAMES.goals,
    ...MONTHS,
    SHEET_NAMES.dashboard,
    SHEET_NAMES.engine,
  ];

  for (let i = 0; i < order.length; i++) {
    const sheet = ss.getSheetByName(order[i]);
    if (sheet) {
      ss.setActiveSheet(sheet);
      ss.moveActiveSheet(i + 1); // 1-based position
    }
  }
}
