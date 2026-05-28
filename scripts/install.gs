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

// Algerian / Maghrebi Arabic month names. This is the single source of truth
// for every monthly sheet name AND every cross-sheet formula token in the
// engine (e.g. `'${m}'!E10:E28`). Changing this array re-localises the entire
// workbook on the next install run; no other constant needs to be touched.
const MONTHS = [
  'جانفي', 'فيفري', 'مارس', 'أفريل', 'ماي', 'جوان',
  'جويلية', 'أوت', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
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
  for (let i = 0; i < MONTHS.length; i++) buildMonth(ss, MONTHS[i]);
  buildDashboard(ss);          // <-- moved BEFORE the engine: card cells now exist
  buildDashboardEngine(ss);    //     so engine refs to dashboard B5/F5/J5 resolve cleanly.
  buildAnnualColumnChart(ss);  // <-- AFTER the engine: chart reads cols A/B/C/E from it.
  buildVisualInsights(ss);     // <-- AFTER the engine: comparison + category donut.
  _buildWelcomePage(ss);       // <-- SmartBudget welcome cover (replaces buildWelcome).

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

  // Optional: offer to populate the 12 monthly sheets with realistic demo
  // data so the user can see the dashboard light up immediately. Skipped on
  // 'No' — the workbook is ready to use either way.
  const wantDemo = ui.alert(
    'بيانات تجريبية (اختياري)',
    'هل تريد ملء الأشهر بـ 12 شهراً من البيانات التجريبية الواقعية لاختبار اللوحة فوراً؟\n\n' +
    'يمكنك دائماً تشغيل _populateDemoData لاحقاً، أو حذف البيانات يدوياً متى شئت.',
    ui.ButtonSet.YES_NO);
  if (wantDemo === ui.Button.YES) {
    _populateDemoData(ss, { skipCheck: true });
  }
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

  // 4) Re-render the 6 KPI cards via the extracted module — one call covers
  //    big-number formulas, trend cells, the new vs-last-year sub-label,
  //    border framing, and CF on trend arrows. Idempotent: re-running over
  //    the legacy B4:Y8 layout cleanly migrates to B5:Y10.
  const rules = dash.getConditionalFormatRules();
  _buildKpiCards(dash, rules);
  dash.setConditionalFormatRules(rules);

  // 6) Re-bind the four chart named ranges (idempotent — safe to re-run).
  ss.setNamedRange('rng_dash_monthly_grid',     engine.getRange('A1:E13'));
  ss.setNamedRange('rng_dash_waterfall',        engine.getRange('F1:G7'));
  ss.setNamedRange('rng_dash_doughnut_income',  engine.getRange('I1:J9'));
  ss.setNamedRange('rng_dash_doughnut_expense', engine.getRange('L1:M13'));

  // 7) Re-insert the programmatic annual COLUMN chart (idempotent).
  buildAnnualColumnChart(ss);

  // 8) Re-insert the Visual Insights pair (Comparison + Donut). Idempotent.
  buildVisualInsights(ss);

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
// MONTHLY AESTHETICS — modular, defensive, expandable
// ----------------------------------------------------------------------------
// Mirrors the design language already established in install.gs:
//   * reads colours from the central `T` palette
//   * applies to every monthly sheet listed in `MONTHS`
//   * fails closed (logs + skips) instead of aborting the installer
//
// HISTORY: the original ad-hoc aesthetic block called the non-existent
// `Sheet.setHideGridlines(...)` and threw `TypeError` mid-install. The fix is
// the correct API `setHiddenGridlines(true)`, plus a defensive duck-typed
// guard so a wrong-typed argument can never re-introduce the same crash.
// ============================================================================

/**
 * Duck-typed Sheet check. Apps Script does not export the Sheet constructor,
 * so `instanceof` is unusable; we instead verify the methods we intend to
 * call are present. This single check kills the
 *   `TypeError: s.setXxx is not a function`
 * family of crashes — including the original `setHideGridlines` typo.
 */
function _isSheet(s) {
  return !!s
      && typeof s.getRange           === 'function'
      && typeof s.setHiddenGridlines === 'function'
      && typeof s.getSheetId         === 'function';
}

/**
 * Invoke a Sheet method by name with full diagnostics.
 * Returns true on success, false on any kind of failure, and writes a
 * structured line to the execution log so the failing step is identifiable
 * without re-running the whole installer.
 */
function _safeApply(s, methodName, ...args) {
  if (!_isSheet(s) || typeof s[methodName] !== 'function') {
    Logger.log('[aesthetics] skipped ' + methodName +
               ' — target is not a Sheet or method is unavailable in this runtime.');
    return false;
  }
  try {
    s[methodName].apply(s, args);
    return true;
  } catch (err) {
    Logger.log('[aesthetics] ' + methodName + ' threw: ' + (err && err.message));
    return false;
  }
}

// ---- Atomic aesthetic steps ------------------------------------------------
// Each helper does ONE thing on ONE sheet. New visual rules are added by
// writing a new `_step*` function and appending it to the pipeline in
// `_applyMonthlyAesthetics` below. Existing steps stay untouched.

const T_DATE_FADED = '#CCCCCC';   // light grey — faded date cells (subtle metadata)

// 12 subtle, professional pastels (Material-Design "lightest" tints) cycled
// against the MONTHS array so each monthly sheet carries its own visual
// identity within a unified premium aesthetic. Index 0 → جانفي, … index 11
// → ديسمبر, matching the canonical January-to-December order.
const MONTH_PASTELS = [
  '#F8F9FA',   //  جانفي  — neutral whisper
  '#E8F5E9',   //  فيفري  — green tint
  '#E3F2FD',   //  مارس   — blue tint
  '#FFF3E0',   //  أفريل  — orange tint
  '#FCE4EC',   //  ماي    — pink tint
  '#F3E5F5',   //  جوان   — violet tint
  '#E0F7FA',   //  جويلية — cyan tint
  '#FFFDE7',   //  أوت    — yellow tint
  '#FBE9E7',   //  سبتمبر — coral tint
  '#ECEFF1',   //  أكتوبر — slate tint
  '#F1F8E9',   //  نوفمبر — lime tint
  '#E1F5FE',   //  ديسمبر — sky tint
];

function _stepHideGridlines(s) {
  // FIX: the correct Apps Script API is `setHiddenGridlines(hidden)`. The
  // previous `setHideGridlines` does not exist on the Sheet class.
  return _safeApply(s, 'setHiddenGridlines', true);
}

function _stepPaintBackground(s) {
  if (!_isSheet(s)) return false;
  s.getRange(1, 1, s.getMaxRows(), s.getMaxColumns())
    .setBackground(T.bgPage)
    .setFontColor(T.fgPrimary);
  return true;
}

function _stepEnableRtl(s)        { return _safeApply(s, 'setRightToLeft', true); }
function _stepFreezeKpiHeader(s)  { return _safeApply(s, 'setFrozenRows', 6); }

/**
 * Format every date cell on a monthly sheet to the international ISO
 * standard `yyyy-mm-dd` and mute its colour to a faded grey, so calendar
 * metadata recedes visually behind the primary financial figures (cols B-G).
 *
 * Date cells live in column A of the income block (A10:A28) and the expense
 * block (A33:A62). Both ranges share the same format and colour.
 *
 * RTL note: ISO dates are numeric and Bidi-renders left-to-right inside the
 * cell regardless of sheet direction. We explicitly right-align the cells so
 * the date hugs the leading edge in an RTL sheet (rightmost in the cell),
 * matching the natural reading flow of the surrounding Arabic content. The
 * alignment is also a sensible default in LTR mode, so the step does not
 * need to branch on direction. Each range is wrapped individually so a
 * failure on one block does not skip the other.
 */
function _stepFormatDates(s) {
  if (!_isSheet(s)) return false;
  const dateRanges = ['A10:A28', 'A33:A62'];   // income dates, expense dates
  let success = true;
  dateRanges.forEach(a1 => {
    try {
      s.getRange(a1)
        .setNumberFormat('yyyy-mm-dd')
        .setFontColor(T_DATE_FADED)
        .setHorizontalAlignment('right');
    } catch (err) {
      Logger.log('[aesthetics] _stepFormatDates(' + a1 + ') threw: ' + (err && err.message));
      success = false;
    }
  });
  return success;
}

/**
 * Pastel-tint the body of a single monthly sheet with one of the 12 colours
 * from `MONTH_PASTELS`. The colour is selected by matching the sheet name
 * against `MONTHS` and looking up the same index in `MONTH_PASTELS`.
 *
 * Painting is restricted to the user-facing layout (cols A-H, data rows
 * only) so that:
 *   1. Header bands (row 9 = income header, row 32 = expense header) keep
 *      their explicit dark fill from `buildMonth`, providing strong contrast
 *      against the pastel content rows.
 *   2. Empty rows beyond row 63 stay tinted by `_stepPaintBackground`'s
 *      dark theme, so newly-added user rows show the workbook frame instead
 *      of "leaking" pastel.
 *   3. Cell editability and protection state are completely untouched —
 *      `setBackground` is a pure-cosmetic call. The sheet stays editable
 *      and expandable (the user can add rows past row 63 without inheriting
 *      pastel formatting).
 *
 * RTL: the step uses A1-style ranges that are layout-agnostic; the sheet's
 * `setRightToLeft` flag (applied by `_stepEnableRtl`) handles visual
 * mirroring without any special handling here.
 *
 * Each body sub-range is wrapped in its own try/catch so a failure on one
 * group does not skip the others — consistent with `_safeApply` semantics.
 */
function _stepApplyMonthPastel(s) {
  if (!_isSheet(s)) return false;
  const idx = MONTHS.indexOf(s.getName ? s.getName() : '');
  if (idx < 0) return false;                       // not a monthly sheet → silent skip
  const color = MONTH_PASTELS[idx];
  if (!color) return false;

  // Body row groups for the standard monthly layout (per docs/03 §2):
  //    1- 8 : title + KPI panel + breathing space
  //   10-29 : income block + totals (row 9 header excluded)
  //   30-31 : spacer
  //   33-63 : expense block + totals (row 32 header excluded)
  const bodyRanges = ['A1:H8', 'A10:H29', 'A30:H31', 'A33:H63'];
  let success = true;
  bodyRanges.forEach(a1 => {
    try {
      s.getRange(a1).setBackground(color);
    } catch (err) {
      Logger.log('[aesthetics] _stepApplyMonthPastel(' +
                 (s.getName && s.getName()) + '/' + a1 + ') threw: ' +
                 (err && err.message));
      success = false;
    }
  });
  return success;
}

/**
 * Apply the full aesthetic pass on a single monthly sheet.
 * The orchestrator is intentionally a thin pipeline of single-purpose steps
 * so future polish (banded ranges, custom row heights, header tinting, …) can
 * be added by appending one entry to the array below — existing logic and
 * its defensive guards stay untouched.
 *
 * @param {GoogleAppsScript.Spreadsheet.Sheet} s — a live monthly sheet.
 * @return {{applied:number, skipped:number}} per-run summary for diagnostics.
 */
function _applyMonthlyAesthetics(s) {
  if (!_isSheet(s)) {
    Logger.log('[aesthetics] _applyMonthlyAesthetics called with a non-Sheet — abort.');
    return { applied: 0, skipped: 0 };
  }

  // Pipeline of single-purpose steps. APPEND new aesthetics here.
  // ORDER MATTERS:
  //   * `_stepPaintBackground` lays the dark theme on every cell first
  //     (the "void" outside the data region).
  //   * `_stepApplyMonthPastel` then paints the per-month pastel ON TOP of
  //     the body rows only, leaving header bands (rows 9 / 32) and the
  //     empty grid (rows 64+) dark.
  const pipeline = [
    _stepHideGridlines,
    _stepPaintBackground,
    _stepApplyMonthPastel,
    _stepEnableRtl,
    _stepFreezeKpiHeader,
    _stepFormatDates,
  ];

  let applied = 0, skipped = 0;
  pipeline.forEach(step => { step(s) ? applied++ : skipped++; });
  return { applied, skipped };
}

/**
 * Convenience: run the aesthetic pass across all 12 monthly sheets, cycling
 * the per-month pastel from `MONTH_PASTELS` as we go. The cycling itself is
 * driven by `_stepApplyMonthPastel` (which looks the colour up by sheet
 * name) — this orchestrator surfaces it in the diagnostic summary so the
 * operator can see at a glance which tint was applied to which month.
 *
 * Safe to call repeatedly: every step in `_applyMonthlyAesthetics` is
 * idempotent (re-painting an identical colour is a no-op).
 *
 * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} [ss] — defaults to the
 *        active spreadsheet.
 * @return {{applied:number, skipped:number, missing:string[], pastels:Object}}
 */
function applyAestheticsToAllMonths(ss) {
  ss = ss || SpreadsheetApp.getActive();
  const summary = { applied: 0, skipped: 0, missing: [], pastels: {} };
  MONTHS.forEach((m, idx) => {
    const s = ss.getSheetByName(m);
    if (!_isSheet(s)) { summary.missing.push(m); return; }
    const r = _applyMonthlyAesthetics(s);
    summary.applied   += r.applied;
    summary.skipped   += r.skipped;
    summary.pastels[m] = MONTH_PASTELS[idx] || null;   // cycle log: month → tint
  });
  Logger.log('[aesthetics] summary: ' + JSON.stringify(summary));
  return summary;
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

  s.autoResizeColumns(1, 8);

  // Final visual passes — both fail closed, neither aborts the install:
  //   1) modular aesthetic pipeline (gridlines / dark page / RTL / freeze)
  //   2) modular per-sheet analytics (Column + Pie). Stashes data in cols
  //      Q-S and inserts charts at J5 and J20.
  _applyMonthlyAesthetics(s);
  addMonthlyCharts(s);
}

// ============================================================================
// PHASE 4: HIDDEN _DashboardEngine SHEET
// ============================================================================
function buildDashboardEngine(ss) {
  const s = getOrCreateSheet(ss, SHEET_NAMES.engine);

  // A:E - Monthly comparison grid (per docs/07 section 8.1)
  // Column E (الادخار) is the new dedicated savings series for the annual
  // column chart. It mirrors column D mathematically (income - expense), but
  // exposing it as its own column lets the chart legend read "الادخار"
  // directly from the header cell — without overloading the existing
  // "صافي الربح" semantics that O5 and I5 still depend on.
  s.getRange('A1:E1').setValues([['الشهر', 'الدخل الفعلي', 'المصروف الفعلي', 'صافي الربح', 'الادخار']])
    .setFontWeight('bold').setBackground('#374151').setFontColor(T.fgPrimary);
  for (let i = 0; i < 12; i++) {
    const m = MONTHS[i];
    const row = i + 2;
    s.getRange('A' + row).setValue(m);
    s.getRange('B' + row).setFormula(`=SUM('${m}'!E10:E28)`);
    s.getRange('C' + row).setFormula(`=SUM('${m}'!E33:E62)`);
    s.getRange('D' + row).setFormula(`=B${row}-C${row}`);
    s.getRange('E' + row).setFormula(`=B${row}-C${row}`);   // الادخار (savings series)
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

  // P1:P7 — Last-year snapshot for the dashboard's vs-last-year sub-label.
  // Empty by default — the user populates these manually on workbook
  // rollover (or via PropertiesService at end-of-Dec). Empty cells trigger
  // the neutral "— مقابل العام الماضي" branch in `buildVsLastYearFormula`.
  // Layout mirrors the H column 1:1 so the operator can copy-paste.
  s.getRange('P1').setValue('السنة الماضية')
    .setFontWeight('bold').setBackground('#374151').setFontColor(T.fgPrimary);

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
// DASHBOARD CHARTS — programmatic, defensive, idempotent
// ----------------------------------------------------------------------------
// Until now the dashboard has been shipped with manual chart anchors so the
// user could pick palette + subtotal flags in the native chart editor. This
// module replaces Chart 1 (the annual income / expense / savings comparison)
// with a programmatic VERTICAL COLUMN chart that respects the project theme.
//
// Design rules:
//   * Every chart / formatting call is wrapped in `_safeRun` so a single
//     Spreadsheet quirk (protection, filter, locale, transient flush) cannot
//     abort the installer mid-build. The `setHideGridlines` TypeError class
//     of bug is impossible here by construction — we never call deprecated
//     or non-existent Sheet APIs.
//   * Idempotent: any pre-existing chart with the same title is removed
//     before insertion so re-runs of the installer do not accumulate
//     duplicate charts.
//   * Theme-aware: column colours come from the central `T` palette plus
//     one new sky-blue token for the savings series.
// ============================================================================

const T_SAVINGS_BAR    = '#87CEEB';                                   // Sky Blue — savings series
const CHART_TITLE_ANNUAL = 'المقارنة الشهرية: الدخل / المصروف / الادخار';

/**
 * Run an arbitrary Spreadsheet operation with full error capture. Returns the
 * function's result on success, undefined on failure. Failures are logged
 * with a `[charts]` tag so the operator can grep the execution log when
 * something silently degrades.
 */
function _safeRun(label, fn) {
  try {
    return fn();
  } catch (err) {
    Logger.log('[charts] ' + label + ' failed: ' + (err && err.message));
    return undefined;
  }
}

/**
 * Remove any existing chart on `sheet` whose title matches `title`.
 * Lets `installBudgetCalculator2026` and `repairDashboard2026` be re-run
 * without piling up duplicate charts.
 */
function _removeChartByTitle(sheet, title) {
  if (!sheet || typeof sheet.getCharts !== 'function') return 0;
  let removed = 0;
  sheet.getCharts().forEach(c => {
    _safeRun('removeChart', () => {
      const opts = c.getOptions && c.getOptions();
      const t    = opts && opts.get && opts.get('title');
      if (t === title) { sheet.removeChart(c); removed++; }
    });
  });
  return removed;
}

/**
 * Build the vertical COLUMN chart for the annual comparison.
 *   X axis  : months (engine column A)
 *   Series 0: الدخل الفعلي    (engine column B)  — green (T.accentIncome)
 *   Series 1: المصروف الفعلي  (engine column C)  — red   (T.accentExpense)
 *   Series 2: الادخار         (engine column E)  — sky blue (#87CEEB)
 *
 * Engine column D (صافي الربح) is intentionally excluded from the chart to
 * keep the legend legible; it remains computed for `O5` and `I5`.
 *
 * The chart anchors at row 11 / column B (the existing "Chart 1" stub on
 * the dashboard sheet) so the dark card background already painted there
 * shows through any transparent gaps.
 */
function buildAnnualColumnChart(ss) {
  const dash   = ss.getSheetByName(SHEET_NAMES.dashboard);
  const engine = ss.getSheetByName(SHEET_NAMES.engine);
  if (!dash || !engine) {
    Logger.log('[charts] buildAnnualColumnChart: dashboard or engine missing — skipped.');
    return;
  }

  // Idempotency: drop any prior copy of this exact chart.
  _safeRun('removeStaleAnnualChart', () => _removeChartByTitle(dash, CHART_TITLE_ANNUAL));

  _safeRun('insertAnnualColumnChart', () => {
    const builder = dash.newChart()
      .asColumnChart()                                        // ← vertical Column chart
      .addRange(engine.getRange('A1:A13'))                    // months (with header)
      .addRange(engine.getRange('B1:B13'))                    // الدخل الفعلي
      .addRange(engine.getRange('C1:C13'))                    // المصروف الفعلي
      .addRange(engine.getRange('E1:E13'))                    // الادخار
      .setNumHeaders(1)
      .setOption('title',           CHART_TITLE_ANNUAL)
      .setOption('titleTextStyle',  { color: T.fgPrimary, bold: true, fontSize: 14 })
      .setOption('backgroundColor', T.bgCard)
      .setOption('legend',          { position: 'bottom', textStyle: { color: T.fgPrimary } })
      .setOption('hAxis',           { textStyle: { color: T.fgPrimary }, slantedText: true, slantedTextAngle: 30 })
      .setOption('vAxis',           { textStyle: { color: T.fgPrimary }, gridlines: { color: T.gridline } })
      .setOption('series', {
        0: { color: T.accentIncome  },                        // الدخل
        1: { color: T.accentExpense },                        // المصروف
        2: { color: T_SAVINGS_BAR   },                        // الادخار — Sky Blue #87CEEB
      })
      .setPosition(11, 2, 0, 0)                               // anchor at B11 (the Chart 1 stub)
      .build();

    dash.insertChart(builder);
  });

  // Commit the chart + any concurrent formula writes before the next phase
  // touches the same sheet (named-range binding, protection, sheet hide).
  _safeRun('flushAnnualChart', () => SpreadsheetApp.flush());
}

// ============================================================================
// VISUAL INSIGHTS — Comparison + Category Donut (programmatic, idempotent)
// ----------------------------------------------------------------------------
// Replaces the two manual "Chart 3" and "Chart 4" doughnut stubs at
// B29:G44 and H29:M44 with a pair of side-by-side analytical charts that
// consume `getAnnualData()` and the engine's category aggregates:
//
//   * _createComparisonChart  — vertical Column chart at B29 — comparing
//     Total Income to the Top 3 expense categories (income in emerald,
//     expense bars in soft coral; deliberately NO bright red).
//   * _createCategoryDonut    — Donut (Pie with hole) at H29 — full
//     percentage breakdown of all 12 expense categories. Slice colours
//     are pulled from MONTH_PASTELS so the dashboard inherits the same
//     premium palette already cycling on the monthly sheets.
//
// Both reuse the robustness primitives `_safeRun` and `_removeChartByTitle`
// from the DASHBOARD CHARTS module. Re-running install or repair drops any
// prior chart with the same title and re-inserts at the same anchor →
// fully idempotent.
//
// Live-update behaviour: the Comparison chart's category SET is captured
// at install time (the top-3 categories on that day). Their VALUES are
// refreshed live via VLOOKUP into the engine sheet, so day-to-day data
// edits keep the chart current without needing a re-install. Re-running
// install picks a new top-3 if the spending mix has shifted significantly.
// The Donut chart binds straight to engine `L1:M13` so it auto-refreshes
// on every category change.
// ============================================================================

const T_CORAL          = '#FB7185';   // soft coral — Tailwind rose-400, no bright red
const T_AXIS           = '#9CA3AF';   // axis labels / muted chart text — Tailwind gray-400
const T_PANEL_DARK     = '#111827';   // chart panel bg — Tailwind gray-900

const CHART_TITLE_COMPARISON = 'الدخل مقابل أعلى 3 فئات إنفاق';
const CHART_TITLE_DONUT      = 'توزيع المصاريف حسب الفئة';

/**
 * Write the data stash for the Comparison chart.
 *
 * Layout: AA1:AE2 (5 cols × 2 rows), well outside the visible dashboard
 * grid (which uses cols A-Y), so the user never accidentally sees or
 * edits the stash.
 *
 *   Row 1 (headers / series names): ['', 'الدخل', cat1, cat2, cat3]
 *   Row 2 (single x-axis category): ['السنة الحالية', incomeSum, v1, v2, v3]
 *
 * The chart binds to AA1:AE2 with setNumHeaders(1), giving 4 series with
 * one data point each — that lets us colour each bar independently via
 * the `series` option (single-series charts cannot do per-bar colours).
 */
function _writeComparisonStash(s, top3Names) {
  if (!_isSheet(s)) return false;
  const safe = function (i) { return (top3Names && top3Names[i]) ? top3Names[i] : '—'; };

  s.getRange('AA1:AE1')
    .setValues([['', 'الدخل', safe(0), safe(1), safe(2)]])
    .setFontWeight('bold').setBackground('#374151').setFontColor(T.fgPrimary);

  s.getRange('AA2').setValue('السنة الحالية');
  s.getRange('AB2').setFormula(`=IFERROR(${SHEET_NAMES.engine}!H2, 0)`);   // Total income (engine H2)

  const cells = ['AC2', 'AD2', 'AE2'];
  for (let i = 0; i < 3; i++) {
    const cat = safe(i);
    if (cat === '—') {
      s.getRange(cells[i]).setValue(0);
    } else {
      // Look up the category's current annual sum in engine's L:M expense
      // doughnut block (already populated by buildDashboardEngine).
      s.getRange(cells[i]).setFormula(
        `=IFERROR(VLOOKUP("${cat}", ${SHEET_NAMES.engine}!L2:M13, 2, FALSE), 0)`);
    }
  }
  return true;
}

/**
 * Insert the Income-vs-Top-3-Expenses Column chart at B29.
 * Anchored over the legacy "Chart 3" stub (which was a manual doughnut).
 *
 * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} ss
 */
function _createComparisonChart(ss) {
  const dash = ss.getSheetByName(SHEET_NAMES.dashboard);
  if (!_isSheet(dash)) {
    Logger.log('[charts] _createComparisonChart: dashboard sheet missing — skipped.');
    return;
  }

  // Determine the current top-3 expense categories from the JS engine.
  // Falls back to '—' placeholders if the engine is unreachable.
  let top3 = ['—', '—', '—'];
  _safeRun('getAnnualData:comparison', () => {
    if (typeof getAnnualData !== 'function') return;
    const data = getAnnualData();
    const sorted = Object.keys(data.categoryTotals)
      .map(function (k) { return [k, data.categoryTotals[k]]; })
      .sort(function (a, b) { return b[1] - a[1]; });
    top3 = [
      (sorted[0] && sorted[0][0]) || '—',
      (sorted[1] && sorted[1][0]) || '—',
      (sorted[2] && sorted[2][0]) || '—',
    ];
  });

  _safeRun('removeStaleComparison', () => _removeChartByTitle(dash, CHART_TITLE_COMPARISON));
  _safeRun('writeComparisonStash', () => _writeComparisonStash(dash, top3));

  _safeRun('insertComparisonChart', () => {
    const chart = dash.newChart()
      .asColumnChart()                                          // ← vertical Column
      .addRange(dash.getRange('AA1:AE2'))
      .setNumHeaders(1)
      .setOption('title',           CHART_TITLE_COMPARISON)
      .setOption('titleTextStyle',  { color: T.fgPrimary, bold: true, fontSize: 13 })
      .setOption('backgroundColor', T_PANEL_DARK)
      .setOption('legend',          { position: 'bottom', textStyle: { color: T_AXIS } })
      .setOption('hAxis',           { textStyle: { color: T_AXIS } })
      .setOption('vAxis',           { textStyle: { color: T_AXIS }, gridlines: { color: T.gridline } })
      .setOption('series', {
        0: { color: T.accentIncome },     // الدخل  — soft emerald
        1: { color: T_CORAL         },     // top cat 1 — soft coral
        2: { color: T_CORAL         },     // top cat 2
        3: { color: T_CORAL         },     // top cat 3
      })
      .setPosition(29, 2, 0, 0)                                 // anchor at B29
      .build();
    dash.insertChart(chart);
  });

  _safeRun('flushComparison', () => SpreadsheetApp.flush());
}

/**
 * Insert the expense-category Donut chart at H29.
 * Binds straight to engine L1:M13 so the chart auto-refreshes whenever
 * any monthly expense changes (no per-edit re-install needed).
 *
 * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} ss
 */
function _createCategoryDonut(ss) {
  const dash   = ss.getSheetByName(SHEET_NAMES.dashboard);
  const engine = ss.getSheetByName(SHEET_NAMES.engine);
  if (!_isSheet(dash) || !_isSheet(engine)) {
    Logger.log('[charts] _createCategoryDonut: dashboard or engine missing — skipped.');
    return;
  }

  _safeRun('removeStaleDonut', () => _removeChartByTitle(dash, CHART_TITLE_DONUT));

  _safeRun('insertCategoryDonut', () => {
    const chart = dash.newChart()
      .asPieChart()
      .addRange(engine.getRange('L1:M13'))                       // categories + sums
      .setNumHeaders(1)
      .setOption('title',             CHART_TITLE_DONUT)
      .setOption('titleTextStyle',    { color: T.fgPrimary, bold: true, fontSize: 13 })
      .setOption('backgroundColor',   T_PANEL_DARK)
      .setOption('legend',            { position: 'right',
                                        alignment: 'center',
                                        textStyle: { color: T_AXIS } })
      .setOption('pieHole',           0.5)                        // ← donut hole
      .setOption('pieSliceText',      'percentage')
      .setOption('pieSliceTextStyle', { color: T.white, fontSize: 11 })
      .setOption('colors',            MONTH_PASTELS)              // 12 pastels for 12 cats
      .setPosition(29, 8, 0, 0)                                   // anchor at H29
      .build();
    dash.insertChart(chart);
  });

  _safeRun('flushDonut', () => SpreadsheetApp.flush());
}

/**
 * Orchestrator: insert both Visual Insights charts. Called once during
 * install (after buildDashboardEngine) and once during repairDashboard2026.
 * Fully idempotent — safe to call repeatedly.
 *
 * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} ss
 */
function buildVisualInsights(ss) {
  _createComparisonChart(ss);
  _createCategoryDonut(ss);
}

// ============================================================================
// MONTHLY CHARTS — per-sheet column + pie analytics
// ----------------------------------------------------------------------------
// Two analytical charts on every monthly sheet:
//   * Chart 1 (Column) at J5  — المصروفات vs الادخار side by side
//   * Chart 2 (Pie)    at J20 — توزيع المصاريف حسب الفئة (SUMIF aggregated)
//
// Both share the robustness primitives `_safeRun` and `_removeChartByTitle`
// from the DASHBOARD CHARTS module. Re-running install or `addMonthlyCharts`
// removes any prior chart with the same title before re-inserting → fully
// idempotent. Failures inside any single step log with a `[charts]` tag and
// do NOT abort the install pipeline.
//
// Data stashes for the charts live in columns Q-S (well outside the visible
// monthly layout, which uses A-H). Formulas update dynamically as the user
// edits the monthly grid.
// ============================================================================

const CHART_TITLE_MONTH_BARS = 'المصروفات مقابل الادخار';
const CHART_TITLE_MONTH_PIE  = 'توزيع المصاريف حسب الفئة';

/**
 * Write the two small data stashes the monthly charts read from. Idempotent:
 * re-writing identical formulas over identical cells is a no-op.
 *
 *   Q1:S2          — column-chart data (Expenses + Savings as 2 series)
 *   Q5:R(5+N)      — pie-chart data (N expense categories + SUMIF amounts)
 */
function _writeMonthlyChartStashes(s) {
  if (!_isSheet(s)) return false;

  // Column-chart stash: one category row, two value columns.
  // Two SERIES so each bar can carry its own colour via `series` options.
  s.getRange('Q1:S1').setValues([['', 'المصروفات', 'الادخار']])
    .setFontWeight('bold').setBackground('#374151').setFontColor(T.fgPrimary);
  s.getRange('Q2').setValue('الشهر الحالي');
  s.getRange('R2').setFormula('=IFERROR(D4, 0)');         // total actual expenses (KPI cell)
  s.getRange('S2').setFormula('=IFERROR(B5, 0)');         // net surplus = income - expense

  // Pie-chart stash: one row per expense category, with SUMIF over the
  // current monthly expense block (B33:E62).
  s.getRange('Q5:R5').setValues([['الفئة', 'إجمالي المصروف']])
    .setFontWeight('bold').setBackground('#374151').setFontColor(T.fgPrimary);
  for (let i = 0; i < EXPENSE_CATEGORIES.length; i++) {
    const row = 6 + i;
    s.getRange('Q' + row).setValue(EXPENSE_CATEGORIES[i]);
    s.getRange('R' + row).setFormula(`=IFERROR(SUMIF(B33:B62, Q${row}, E33:E62), 0)`);
  }

  return true;
}

/**
 * Add the two analytical charts to a single monthly sheet.
 *
 *   Chart 1 — vertical Column chart at J5  (Expenses vs Savings)
 *   Chart 2 — Pie chart at J20             (Expense Distribution by Category)
 *
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet — a live monthly sheet.
 */
function addMonthlyCharts(sheet) {
  if (!_isSheet(sheet)) {
    Logger.log('[charts] addMonthlyCharts: target is not a Sheet — skipped.');
    return;
  }
  const tag = (sheet.getName && sheet.getName()) || '?';

  // 1) Stage data the charts read from. Errors log + skip; we still attempt
  //    chart insertion so partial failures degrade gracefully.
  _safeRun('stash:' + tag, () => _writeMonthlyChartStashes(sheet));

  // 2) Idempotency: drop any prior copies of these exact charts.
  _safeRun('removeStaleBars:' + tag, () => _removeChartByTitle(sheet, CHART_TITLE_MONTH_BARS));
  _safeRun('removeStalePie:'  + tag, () => _removeChartByTitle(sheet, CHART_TITLE_MONTH_PIE));

  // 3) Chart 1 — vertical Column: Expenses vs Savings (2 series → 2 bars).
  _safeRun('insertBars:' + tag, () => {
    const chart = sheet.newChart()
      .asColumnChart()                                          // ← vertical Column chart
      .addRange(sheet.getRange('Q1:S2'))
      .setNumHeaders(1)
      .setOption('title',           CHART_TITLE_MONTH_BARS)
      .setOption('titleTextStyle',  { color: T.fgPrimary, bold: true, fontSize: 13 })
      .setOption('backgroundColor', T.bgCard)
      .setOption('legend',          { position: 'bottom', textStyle: { color: T.fgPrimary } })
      .setOption('hAxis',           { textStyle: { color: T.fgPrimary } })
      .setOption('vAxis',           { textStyle: { color: T.fgPrimary }, gridlines: { color: T.gridline } })
      .setOption('series', {
        0: { color: T.accentExpense },                          // المصروفات (red)
        1: { color: T_SAVINGS_BAR   },                          // الادخار   (#87CEEB sky blue)
      })
      .setOption('width',  480)
      .setOption('height', 280)
      .setPosition(5, 10, 0, 0)                                 // anchor at J5
      .build();
    sheet.insertChart(chart);
  });

  // 4) Chart 2 — Pie: Expense Distribution by Category.
  _safeRun('insertPie:' + tag, () => {
    const lastRow = 5 + EXPENSE_CATEGORIES.length;              // header row 5 + N cats
    const chart = sheet.newChart()
      .asPieChart()
      .addRange(sheet.getRange('Q5:R' + lastRow))
      .setNumHeaders(1)
      .setOption('title',             CHART_TITLE_MONTH_PIE)
      .setOption('titleTextStyle',    { color: T.fgPrimary, bold: true, fontSize: 13 })
      .setOption('backgroundColor',   T.bgCard)
      .setOption('legend',            { position: 'right', textStyle: { color: T.fgPrimary } })
      .setOption('pieSliceTextStyle', { color: T.white })
      .setOption('width',  480)
      .setOption('height', 320)
      .setPosition(20, 10, 0, 0)                                // anchor at J20
      .build();
    sheet.insertChart(chart);
  });

  // 5) Flush so charts + their underlying formulas commit before any later
  //    step (protection, named-range binding, sheet hide) touches the sheet.
  _safeRun('flush:' + tag, () => SpreadsheetApp.flush());
}

// ============================================================================
// PHASE 4: DASHBOARD SHEET
// ============================================================================
function buildDashboard(ss) {
  const s = getOrCreateSheet(ss, SHEET_NAMES.dashboard);

  // Page background
  s.getRange(1, 1, 60, 25).setBackground(T.bgPage).setFontColor(T.fgPrimary);

  // Title row
  mergeAndStyle(s, 'B2:Y2', 'اللوحة الرئيسية والتقرير السنوي - نظام مالي ذكي متكامل',
    { bg: T.bgPage, fg: T.fgPrimary, size: 18, bold: true, align: 'center' });

  // ---- Module 1: Six KPI cards ----
  // SOURCE OF TRUTH: every KPI now reads from `_DashboardEngine` so the
  // dashboard sheet stays a pure presentation layer. The engine in turn reads
  // from the 12 monthly sheets and the goals sheet. This removes the duplicate
  // SUM(…12 months…) blocks that used to live on the dashboard, eliminates an
  // entire class of "the engine and the card disagree" bugs, and keeps every
  // formula short enough to fit in one log line during debugging.
  //
  // The card layout has been extracted into `_buildKpiCards` so the same
  // 6-card strip can be re-rendered (e.g. by a "refresh dashboard" entry
  // point) without re-running the entire `buildDashboard` pipeline.
  const rules = s.getConditionalFormatRules();
  _buildKpiCards(s, rules);

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

  // ---- Module 4: Annual Performance Matrix (replaces Latest Transactions) ----
  // Three side-by-side panels in the bottom strip (rows 47-60):
  //   * B47:I60 — كفاءة الادخار الشهرية   (savings sparkline)
  //   * J47:Q60 — ملخّص الصحّة المالية    (avg income / avg expense / surplus)
  //   * R47:Y60 — النظرة المستقبلية       (months-of-runway projection)
  // Layout is rendered by a dedicated builder for separation of concerns;
  // CF rules for the verdict text are appended to the in-flight `rules`
  // array and committed in one batch immediately afterwards.
  buildAnnualPerformanceMatrix(s, rules);
  s.setConditionalFormatRules(rules);

  // Stub anchors for the four charts (visible card backgrounds the user can drop charts onto).
  // Insert each chart via Insert → Chart and bind it to the matching NAMED RANGE
  // (defined in defineNamedRanges) instead of typing the engine A1 ranges by hand.
  // The named ranges are stable across rebuilds, so the chart never needs to be
  // re-bound when the engine sheet is rebuilt or moved.
  paintCard(s, 'B11:M26');
  mergeAndStyle(s, 'B11:M11', 'Chart 1: المقارنة الشهريّة (يُدرَج آلياً عبر buildAnnualColumnChart — لا حاجة لإدراج يدوي)',
    { bg: T.bgCard, fg: T.fgMuted, size: 10, align: 'center', wrap: true });
  paintCard(s, 'N11:Y26');
  mergeAndStyle(s, 'N11:Y11', 'Chart 2: Waterfall - تدفّق النقد (أدرجه يدوياً من النطاق المُسمَّى rng_dash_waterfall)',
    { bg: T.bgCard, fg: T.fgMuted, size: 10, align: 'center', wrap: true });
  paintCard(s, 'B29:G44');
  mergeAndStyle(s, 'B29:G29',
    'Chart 3: مقارنة الدخل بأعلى الفئات (يُدرَج آلياً عبر _createComparisonChart)',
    { bg: T.bgCard, fg: T.fgMuted, size: 10, align: 'center', wrap: true });
  paintCard(s, 'H29:M44');
  mergeAndStyle(s, 'H29:M29',
    'Chart 4: توزيع المصاريف (يُدرَج آلياً عبر _createCategoryDonut)',
    { bg: T.bgCard, fg: T.fgMuted, size: 10, align: 'center', wrap: true });
}

// ============================================================================
// KPI CARDS — extracted module that owns the 6-card top strip (B5:Y10).
// ----------------------------------------------------------------------------
// Each card mirrors one field of `getAnnualData()` from engine.gs, so the
// JS-side aggregation and the on-sheet presentation stay in lockstep:
//
//   Card 1 — إجمالي الدخل           → engine!H2 ↔ getAnnualData().totalIncome
//   Card 2 — إجمالي المصروفات        → engine!H3 ↔ getAnnualData().totalExpenses
//   Card 3 — صافي الربح              → engine!H4 ↔ getAnnualData().netProfit
//   Card 4 — إجمالي الأصول           → engine!H5 ↔ getAnnualData().totalAssets
//   Card 5 — إجمالي الالتزامات       → engine!H6 ↔ getAnnualData().totalLiabilities
//   Card 6 — معدل الادخار %          → engine!H7 ↔ getAnnualData().savingsRate
//
// Each card has SIX rows (5..10) + four merged columns:
//   row 5  — title (small, muted, T.fgMuted 11pt)
//   rows 6-7 — big number (large, bold, T.fgPrimary 26pt) bound to engine!H_n
//   row 8  — short-term trend "▲ x%" / "▼ x%" / "—" (period-over-period
//            within the current year, fed by engine!I_n)
//   row 9  — vs-last-year sub-label (NEW). Reads engine!P_n which the user
//            populates manually with last-year totals on workbook rollover.
//            Empty cell → neutral indicator "— مقابل العام الماضي".
//   row 10 — description caption (small grey, 9pt)
//
// The cards bind to engine cells via formulas (live updates) rather than
// baked setValue() calls, so day-to-day data edits flow through to the
// dashboard without any re-install. JS-side consumers (sidebar widgets,
// exports, integration tests) should call `getAnnualData()` instead — both
// pipelines reach the same underlying monthly cells, so the numbers are
// guaranteed identical.
//
// VISUAL NOTE on rounded corners: Apps Script has no native rounded-corner
// API for spreadsheet cells (cells are always rectangles). The closest
// premium-card approximation is a thin solid border in T.gridline (#334155)
// around each card's full range, which `_buildKpiCards` applies after paint.
// ============================================================================

const _KPI_CARD_SPECS = [
  { range: 'B5:E10', col: 'B', endCol: 'E', title: 'إجمالي الدخل',         engineCell: 'H2', priCell: 'I2', lyCell: 'P2', desc: 'إجمالي الدخل الفعلي السنوي عبر 12 شهراً.',     percent: false },
  { range: 'F5:I10', col: 'F', endCol: 'I', title: 'إجمالي المصروفات',     engineCell: 'H3', priCell: 'I3', lyCell: 'P3', desc: 'إجمالي المصروف الفعلي السنوي عبر 12 شهراً.',  percent: false },
  { range: 'J5:M10', col: 'J', endCol: 'M', title: 'صافي الربح',           engineCell: 'H4', priCell: 'I4', lyCell: 'P4', desc: 'الفرق بين إجمالي الدخل وإجمالي المصروفات.',     percent: false },
  { range: 'N5:Q10', col: 'N', endCol: 'Q', title: 'إجمالي الأصول',        engineCell: 'H5', priCell: 'I5', lyCell: 'P5', desc: 'المبالغ المدّخرة في الأهداف + الفائض المتراكم.', percent: false },
  { range: 'R5:U10', col: 'R', endCol: 'U', title: 'إجمالي الالتزامات',    engineCell: 'H6', priCell: 'I6', lyCell: 'P6', desc: 'الأقساط الشهريّة المطلوبة × 12 (تقدير سنوي).',  percent: false },
  { range: 'V5:Y10', col: 'V', endCol: 'Y', title: 'معدل الادخار %',       engineCell: 'H7', priCell: 'I7', lyCell: 'P7', desc: '(الدخل - المصروفات) / الدخل.',                  percent: true  },
];

/**
 * Build the cell formula for the "vs last year" sub-label.
 * Reads engine!P_n (manually populated last-year snapshot, blank by default).
 * Empty / zero cells return the neutral indicator "— مقابل العام الماضي" so
 * first-time users never see a misleading 100% drop or div-by-zero spike.
 *
 * @param {string} curCell — current-period engine cell (e.g. 'H2')
 * @param {string} lyCell  — last-year snapshot engine cell (e.g. 'P2')
 * @return {string} the cell formula
 */
function buildVsLastYearFormula(curCell, lyCell) {
  const cur = `IFERROR(${SHEET_NAMES.engine}!${curCell}+0, 0)`;
  const ly  = `IFERROR(${SHEET_NAMES.engine}!${lyCell}+0, 0)`;
  return (
    '=IFERROR(LET(' +
    `cur, ${cur}, ` +
    `ly, ${ly}, ` +
    'IF(ly=0, "— مقابل العام الماضي", ' +
      'IF(cur >= ly, "▲ ", "▼ ") & TEXT((cur-ly)/ly, "0.0%") & " مقابل العام الماضي")), ' +
    '"— مقابل العام الماضي")'
  );
}

/**
 * Render the 6-card KPI strip across the top of the dashboard (B5:Y10).
 *
 * Idempotency contract: the function is safe to re-run over any prior
 * layout. Before painting, it un-merges and clears the FULL super-region
 * `B4:Y10` (covers both the legacy B4:Y8 layout and the current B5:Y10
 * layout) so re-installs over old workbooks never leave orphaned merges,
 * stale labels on row 4, or dangling formulas.
 *
 * @param {GoogleAppsScript.Spreadsheet.Sheet} s     dashboard sheet
 * @param {Array}                              rules CF-rule accumulator (mutated)
 */
function _buildKpiCards(s, rules) {
  // ---- Idempotent guard ----
  // breakApart() is a no-op on un-merged cells per Apps Script docs, so the
  // call is safe whether we're installing fresh or re-installing over an
  // older B4:Y8 layout.
  const guardRange = s.getRange('B4:Y10');
  guardRange.breakApart();
  guardRange.clearContent();

  _KPI_CARD_SPECS.forEach(function (c) {
    paintCard(s, c.range);

    // Soft "rounded card" simulation: thin solid border in T.gridline
    // around the full card range (Apps Script has no native rounded
    // corners on cells, this is the closest visual approximation).
    s.getRange(c.range).setBorder(
      true, true, true, true, false, false,
      T.gridline, SpreadsheetApp.BorderStyle.SOLID);

    // Row 5 — title (small, muted, RTL leading-edge aligned)
    mergeAndStyle(s, c.col + '5:' + c.endCol + '5', c.title,
      { bg: T.bgCard, fg: T.fgMuted, size: 11, align: 'right' });

    // Rows 6-7 — big number (large, bold). Live formula bound to engine!H_n.
    mergeAndStyle(s, c.col + '6:' + c.endCol + '7', '',
      { bg: T.bgCard, fg: T.fgPrimary, size: 26, bold: true, align: 'right' });
    const valueCell = s.getRange(c.col + '6')
      .setFormula('=IFERROR(' + SHEET_NAMES.engine + '!' + c.engineCell + ', 0)');
    if (c.percent) valueCell.setNumberFormat('0.0%');

    // Row 8 — short-term trend (period-over-period within current data)
    mergeAndStyle(s, c.col + '8:' + c.endCol + '8', '',
      { bg: T.bgCard, size: 12, align: 'right' });
    s.getRange(c.col + '8').setFormula(buildTrendFormula(c.engineCell, c.priCell));

    // Row 9 — vs-last-year sub-label (NEW). Falls back to neutral indicator
    // when engine!P_n is empty (the default state — user opts in by
    // populating last-year totals on workbook rollover).
    mergeAndStyle(s, c.col + '9:' + c.endCol + '9', '',
      { bg: T.bgCard, fg: T.fgMuted, size: 10, align: 'right' });
    s.getRange(c.col + '9').setFormula(buildVsLastYearFormula(c.engineCell, c.lyCell));

    // Row 10 — description (small caption)
    mergeAndStyle(s, c.col + '10:' + c.endCol + '10', c.desc,
      { bg: T.bgCard, fg: T.fgMuted, size: 9, align: 'right' });

    // CF on the trend cell — green for ▲, red for ▼ (existing visual contract)
    const trendCell  = c.col + '8';
    const trendRange = s.getRange(trendCell);
    rules.push(
      SpreadsheetApp.newConditionalFormatRule()
        .whenFormulaSatisfied('=LEFT($' + trendCell + ',1)="▲"')
        .setBackground(T.accentIncome).setFontColor(T.white).setRanges([trendRange]).build(),
      SpreadsheetApp.newConditionalFormatRule()
        .whenFormulaSatisfied('=LEFT($' + trendCell + ',1)="▼"')
        .setBackground(T.accentTrendDown).setFontColor(T.white).setRanges([trendRange]).build());
  });
}

function paintCard(s, a1) {
  s.getRange(a1).setBackground(T.bgCard).setFontColor(T.fgPrimary);
}

// ============================================================================
// ANNUAL PERFORMANCE MATRIX — three-panel summary that replaces the legacy
// "Latest Transactions" ledger.
// ----------------------------------------------------------------------------
// PALETTE: a deliberately narrow Premium-Fintech subset with NO bright red:
//   * NAVY    — T.bgPage   #0F172A   page / header band
//   * CARD    — T.bgCard   #1F2937   panel surface
//   * EMERALD — #34D399    soft emerald (Tailwind emerald-400) for positives
//   * COOL    — T.fgMuted  #94A3B8   cool-gray for muted labels / negatives
//   * GRID    — T.gridline #334155   thin module borders
//
// LAYOUT (bottom strip rows 47-60, three side-by-side cards):
//   B47:I60 — Module 1 — كفاءة الادخار الشهرية (savings rate sparkline)
//   J47:Q60 — Module 2 — ملخّص الصحّة المالية   (avg income / expense / surplus)
//   R47:Y60 — Module 3 — النظرة المستقبلية      (months-of-runway projection)
//
// All numeric aggregates are computed inline against `_DashboardEngine!B/C/D`
// (12 monthly rows already populated by `buildDashboardEngine`). No new
// engine cells are required, which keeps the engine surface unchanged.
// ============================================================================
function buildAnnualPerformanceMatrix(s, rules) {
  const NAVY    = T.bgPage;
  const CARD    = T.bgCard;
  const EMERALD = '#34D399';
  const COOL    = T.fgMuted;
  const GRID    = T.gridline;

  // -- Module 1 — Savings Efficiency --------------------------------------
  // Inline SPARKLINE column chart that reads engine D/B per month.
  // `negcolor` paints any negative-savings month in cool-gray (instead of
  // red) to satisfy the no-bright-red constraint while still being legible.
  paintCard(s, 'B47:I60');
  s.getRange('B47:I60').setBorder(true, true, true, true, false, false,
                                  GRID, SpreadsheetApp.BorderStyle.SOLID);
  mergeAndStyle(s, 'B47:I48', 'كفاءة الادخار الشهرية',
    { bg: CARD, fg: T.fgPrimary, size: 14, bold: true, align: 'center', vAlign: 'middle' });
  mergeAndStyle(s, 'B49:I49', 'نسبة الادخار لكل شهر عبر 12 شهراً',
    { bg: CARD, fg: COOL, size: 10, align: 'center' });
  mergeAndStyle(s, 'B50:I57', '', { bg: CARD });
  s.getRange('B50').setFormula(
    `=SPARKLINE(ARRAYFORMULA(IFERROR(${SHEET_NAMES.engine}!D2:D13 / ${SHEET_NAMES.engine}!B2:B13, 0)), ` +
    `{"charttype","column"; "color1","${EMERALD}"; "negcolor","${COOL}"; "empty","zero"})`);
  mergeAndStyle(s, 'B58:I60',
    'الأعمدة الرماديّة تشير إلى أشهر سالبة الادخار (مصروف يفوق الدخل).',
    { bg: CARD, fg: COOL, size: 9, align: 'center', wrap: true, vAlign: 'top' });

  // -- Module 2 — Financial Health Summary --------------------------------
  // Three-row table: avg income, avg expense, net surplus. Labels on the
  // RTL-leading edge (right) in cool-gray; values centred in emerald.
  paintCard(s, 'J47:Q60');
  s.getRange('J47:Q60').setBorder(true, true, true, true, false, false,
                                  GRID, SpreadsheetApp.BorderStyle.SOLID);
  mergeAndStyle(s, 'J47:Q48', 'ملخّص الصحّة المالية',
    { bg: CARD, fg: T.fgPrimary, size: 14, bold: true, align: 'center', vAlign: 'middle' });

  // Header band
  mergeAndStyle(s, 'J50:M51', 'البيان',
    { bg: NAVY, fg: COOL, size: 11, bold: true, align: 'right',  vAlign: 'middle' });
  mergeAndStyle(s, 'N50:Q51', 'القيمة',
    { bg: NAVY, fg: COOL, size: 11, bold: true, align: 'center', vAlign: 'middle' });

  // Row 1 — متوسط الدخل الشهري
  mergeAndStyle(s, 'J52:M53', 'متوسط الدخل الشهري',
    { bg: CARD, fg: T.fgPrimary, size: 11, align: 'right',  vAlign: 'middle' });
  mergeAndStyle(s, 'N52:Q53', '',
    { bg: CARD, fg: EMERALD,     size: 13, bold: true, align: 'center', vAlign: 'middle' });
  s.getRange('N52').setFormula(`=IFERROR(AVERAGE(${SHEET_NAMES.engine}!B2:B13), 0)`);

  // Row 2 — متوسط المصروف الشهري
  mergeAndStyle(s, 'J54:M55', 'متوسط المصروف الشهري',
    { bg: CARD, fg: T.fgPrimary, size: 11, align: 'right',  vAlign: 'middle' });
  mergeAndStyle(s, 'N54:Q55', '',
    { bg: CARD, fg: T.fgPrimary, size: 13, bold: true, align: 'center', vAlign: 'middle' });
  s.getRange('N54').setFormula(`=IFERROR(AVERAGE(${SHEET_NAMES.engine}!C2:C13), 0)`);

  // Row 3 — الفائض الصافي
  mergeAndStyle(s, 'J56:M57', 'الفائض الصافي',
    { bg: CARD, fg: T.fgPrimary, size: 11, align: 'right',  vAlign: 'middle' });
  mergeAndStyle(s, 'N56:Q57', '',
    { bg: CARD, fg: EMERALD,     size: 13, bold: true, align: 'center', vAlign: 'middle' });
  s.getRange('N56').setFormula('=IFERROR(N52-N54, 0)');

  mergeAndStyle(s, 'J58:Q60',
    'متوسطات حسابية على الـ 12 شهراً النشطة.',
    { bg: CARD, fg: COOL, size: 9, align: 'center', wrap: true, vAlign: 'top' });

  // -- Module 3 — Financial Outlook ---------------------------------------
  // Big number = months of runway (TotalSavings / AvgExpense). Verdict text
  // is emerald for "high stability", cool-gray for "needs optimization" —
  // explicitly avoiding red, as required by the brief.
  paintCard(s, 'R47:Y60');
  s.getRange('R47:Y60').setBorder(true, true, true, true, false, false,
                                  GRID, SpreadsheetApp.BorderStyle.SOLID);
  mergeAndStyle(s, 'R47:Y48', 'النظرة المستقبلية',
    { bg: CARD, fg: T.fgPrimary, size: 14, bold: true, align: 'center', vAlign: 'middle' });

  // Months-of-runway big number
  mergeAndStyle(s, 'R50:Y52', '',
    { bg: CARD, fg: EMERALD, size: 28, bold: true, align: 'center', vAlign: 'middle' });
  s.getRange('R50').setFormula(
    `=IFERROR(ROUND(${SHEET_NAMES.engine}!O5 / IFERROR(AVERAGE(${SHEET_NAMES.engine}!C2:C13), 1), 1) ` +
    `& " شهر", "—")`);

  // Verdict text (CF-driven colour). The cell text itself carries the
  // semantic state; CF then paints emerald or cool-gray accordingly.
  mergeAndStyle(s, 'R53:Y55', '',
    { bg: CARD, fg: T.fgPrimary, size: 14, bold: true, align: 'center', vAlign: 'middle' });
  s.getRange('R53').setFormula(
    `=IF(IFERROR(${SHEET_NAMES.engine}!O5 / IFERROR(AVERAGE(${SHEET_NAMES.engine}!C2:C13), 1), 0) > 6, ` +
    `"استقرار مالي مرتفع", "بحاجة إلى تحسين")`);

  const verdictRange = s.getRange('R53:Y55');
  rules.push(
    SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied('=$R$53="استقرار مالي مرتفع"')
      .setFontColor(EMERALD).setBackground(CARD).setBold(true)
      .setRanges([verdictRange]).build(),
    SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied('=$R$53="بحاجة إلى تحسين"')
      .setFontColor(COOL).setBackground(CARD).setBold(true)
      .setRanges([verdictRange]).build());

  mergeAndStyle(s, 'R56:Y60',
    'الاستقرار المرتفع: إجمالي الادخار يغطّي 6 أشهر من المصروفات أو أكثر.',
    { bg: CARD, fg: COOL, size: 9, align: 'center', wrap: true, vAlign: 'top' });
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
// ----------------------------------------------------------------------------
// `_buildWelcomePage` is the SmartBudget welcome cover. It owns the entire
// landing layout (hero, tagline, "Why SmartBudget?", Quick Start, credits)
// and is fully idempotent — `breakApart()` + `clear()` at the top wipe any
// prior state, so re-installs over an old workbook never leave stale merges
// or labels behind.
//
// PALETTE (Premium Fintech, deep dark mode):
//   * PAGE_BG  = #111827   page background (deeper than T.bgPage)
//   * CARD_BG  = T.bgCard  card surface
//   * TEXT     = T.fgPrimary
//   * MUTED    = T.fgMuted
//   * ACCENT   = T.accentNet  cyan, used for section headers
//   * EMERALD  = T.accentIncome, used for icons / step numbers
//   * BORDER   = T.gridline
//
// LAYOUT (rows 1-40, cols A-P; cards span B..P with A and Q-onwards as
// breathing margins):
//   3-6   Hero header   B3:P6     "SmartBudget — الميزانية الذكية"
//   8-10  Tagline       B8:P10    'نظامك المالي المتكامل لإدارة أصولك…'
//   12-13 Section 1     B12:P13   "لماذا الميزانية الذكية؟"
//   14-19 3 feature cards (5-col each: B-F / G-K / L-P)
//   21-22 Section 2     B21:P22   "كيف تبدأ في 3 خطوات بسيطة؟"
//   23-28 3 step cards  + HYPERLINK to the relevant sheet
//   31-34 Credits card  B31:P34   developer + email
//
// SECURITY: `_applySecurity(s, ranges)` is called at the end to protect every
// branded region of this sheet (warning-only protection — users can still
// edit if absolutely needed). The user's data-entry sheets stay open.
// ============================================================================

function _buildWelcomePage(ss) {
  const s = getOrCreateSheet(ss, SHEET_NAMES.welcome);

  // ---- Idempotency: clear everything before re-building. ----
  // `breakApart()` is a no-op on un-merged cells, so it's safe whether we're
  // installing fresh or re-installing over a prior layout.
  const fullRange = s.getRange(1, 1, Math.max(s.getMaxRows(), 40), Math.max(s.getMaxColumns(), 16));
  fullRange.breakApart();
  s.clear();

  // ---- Palette ----
  const PAGE_BG = '#111827';            // deep navy (one shade darker than T.bgPage)
  const CARD_BG = T.bgCard;             // #1F2937
  const TEXT    = T.fgPrimary;          // #F1F5F9
  const MUTED   = T.fgMuted;            // #94A3B8
  const ACCENT  = T.accentNet;          // #06B6D4 (cyan)
  const EMERALD = T.accentIncome;       // #10B981
  const BORDER  = T.gridline;           // #334155

  // ---- Page background + row sizing ----
  s.getRange(1, 1, 40, 16).setBackground(PAGE_BG).setFontColor(TEXT);
  for (let i = 1; i <= 40; i++) s.setRowHeight(i, 24);
  // Taller rows for the hero so the title gets its premium presence.
  for (let i = 3; i <= 6; i++) s.setRowHeight(i, 36);

  // ---- 1. Hero header (SmartBudget — الميزانية الذكية) ----
  paintCard(s, 'B3:P6');
  s.getRange('B3:P6').setBorder(true, true, true, true, false, false,
                                BORDER, SpreadsheetApp.BorderStyle.SOLID);
  mergeAndStyle(s, 'B3:P6',
    'SmartBudget — الميزانية الذكية',
    { bg: CARD_BG, fg: TEXT, size: 28, bold: true,
      align: 'center', vAlign: 'middle' });

  // ---- 2. Tagline ----
  paintCard(s, 'B8:P10');
  s.getRange('B8:P10').setBorder(true, true, true, true, false, false,
                                 BORDER, SpreadsheetApp.BorderStyle.SOLID);
  mergeAndStyle(s, 'B8:P10',
    'نظامك المالي المتكامل لإدارة أصولك وعملاتك بذكاء.',
    { bg: CARD_BG, fg: MUTED, size: 14,
      align: 'center', vAlign: 'middle', wrap: true });

  // ---- 3. Section 1 — Why SmartBudget? ----
  mergeAndStyle(s, 'B12:P13',
    '◆ لماذا الميزانية الذكية؟',
    { bg: PAGE_BG, fg: ACCENT, size: 16, bold: true,
      align: 'center', vAlign: 'middle' });

  const whyCards = [
    { col: 'B', endCol: 'F', icon: '⚡',  title: 'أتمتة كاملة',
      body: 'معالجة بياناتك لحظياً وبدقة عالية دون أخطاء يدوية.' },
    { col: 'G', endCol: 'K', icon: '🌙',  title: 'تصميم Fintech',
      body: 'واجهة مظلمة مريحة للعين، مصممة للتركيز التام.' },
    { col: 'L', endCol: 'P', icon: '📊',  title: 'رؤية شاملة',
      body: 'تحليلات دقيقة لمصاريفك عبر مختلف الفئات والعملات.' },
  ];

  whyCards.forEach(function (c) {
    const range = c.col + '14:' + c.endCol + '19';
    paintCard(s, range);
    s.getRange(range).setBorder(true, true, true, true, false, false,
                                BORDER, SpreadsheetApp.BorderStyle.SOLID);
    mergeAndStyle(s, c.col + '14:' + c.endCol + '15', c.icon + '  ' + c.title,
      { bg: CARD_BG, fg: EMERALD, size: 14, bold: true,
        align: 'center', vAlign: 'middle' });
    mergeAndStyle(s, c.col + '16:' + c.endCol + '19', c.body,
      { bg: CARD_BG, fg: TEXT, size: 11,
        align: 'center', vAlign: 'middle', wrap: true });
  });

  // ---- 4. Section 2 — Quick Start Guide ----
  mergeAndStyle(s, 'B21:P22',
    '◆ كيف تبدأ في 3 خطوات بسيطة؟',
    { bg: PAGE_BG, fg: ACCENT, size: 16, bold: true,
      align: 'center', vAlign: 'middle' });

  // Note: target sheet names use the actual workbook structure (Maghrebi
  // months from PR #15, settings as the initial-setup entry point — the
  // "DashboardEngine" referenced in the brief is hidden by design and is
  // not where the user enters initial balance).
  const steps = [
    { col: 'B', endCol: 'F', n: '01', title: 'الإعدادات',
      body: 'ادخل رصيدك الابتدائي في ورقة \'الإعدادات\'.',
      target: SHEET_NAMES.settings,
      link: '📘 افتح ورقة الإعدادات' },
    { col: 'G', endCol: 'K', n: '02', title: 'الأشهر',
      body: 'سجل مصاريفك اليومية في أوراق الأشهر (من جانفي إلى ديسمبر).',
      target: 'جانفي',
      link: '📅 افتح ورقة جانفي' },
    { col: 'L', endCol: 'P', n: '03', title: 'اللوحة الرئيسية',
      body: 'افتح صفحة \'اللوحة الرئيسية\' لمشاهدة الرسوم البيانية ومؤشرات النمو التلقائية.',
      target: SHEET_NAMES.dashboard,
      link: '📊 افتح اللوحة الرئيسية' },
  ];

  steps.forEach(function (step) {
    const range = step.col + '23:' + step.endCol + '28';
    paintCard(s, range);
    s.getRange(range).setBorder(true, true, true, true, false, false,
                                BORDER, SpreadsheetApp.BorderStyle.SOLID);

    // Step number — large accent
    mergeAndStyle(s, step.col + '23:' + step.endCol + '24', step.n,
      { bg: CARD_BG, fg: ACCENT, size: 24, bold: true,
        align: 'center', vAlign: 'middle' });

    // Step title
    mergeAndStyle(s, step.col + '25:' + step.endCol + '25', step.title,
      { bg: CARD_BG, fg: TEXT, size: 12, bold: true, align: 'center' });

    // Step description
    mergeAndStyle(s, step.col + '26:' + step.endCol + '27', step.body,
      { bg: CARD_BG, fg: MUTED, size: 10,
        align: 'center', wrap: true });

    // Hyperlink — resolves to the live sheet's gid at install time so the
    // link survives sheet-rename / position changes.
    const target = ss.getSheetByName(step.target);
    if (target) {
      const gid = target.getSheetId();
      mergeAndStyle(s, step.col + '28:' + step.endCol + '28', '',
        { bg: CARD_BG, align: 'center' });
      s.getRange(step.col + '28')
        .setFormula('=HYPERLINK("#gid=' + gid + '", "' + step.link + '")')
        .setFontColor(EMERALD).setFontSize(11);
    }
  });

  // ---- 5. Developer credits ----
  paintCard(s, 'B31:P34');
  s.getRange('B31:P34').setBorder(true, true, true, true, false, false,
                                  BORDER, SpreadsheetApp.BorderStyle.SOLID);
  mergeAndStyle(s, 'B31:P32',
    '💎 تم التطوير بواسطة: BOULAHDID DJAMAL EDDINE',
    { bg: CARD_BG, fg: TEXT, size: 13, bold: true,
      align: 'center', vAlign: 'middle' });
  mergeAndStyle(s, 'B33:P34',
    '📩 للتواصل: boulahdiddjamaleddine@gmail.com',
    { bg: CARD_BG, fg: MUTED, size: 11,
      align: 'center', vAlign: 'middle' });

  // ---- 6. Apply security to the welcome page (warning-only protection
  //         on every branded region; entry-cell sheets stay fully open). ----
  _applySecurity(s, [
    'B3:P6',     // Hero header
    'B8:P10',    // Tagline
    'B12:P19',   // "Why SmartBudget?" header + 3 feature cards
    'B21:P28',   // "Quick Start" header + 3 step cards
    'B31:P34',   // Developer credits
  ]);
}

/**
 * Generic protection helper. Applies warning-only `protect()` to a list of
 * A1 ranges on a single sheet, with full error capture so a corrupt range
 * cannot abort the installer mid-build.
 *
 * "warning-only" means edits prompt a confirmation dialog but are still
 * allowed — entry-cell sheets remain open while branded UI regions are
 * protected from accidental modification.
 *
 * @param {GoogleAppsScript.Spreadsheet.Sheet} s     target sheet
 * @param {Array<string>}                      ranges  A1 ranges to protect
 */
function _applySecurity(s, ranges) {
  if (!s || !Array.isArray(ranges)) return;
  ranges.forEach(function (a1) {
    try {
      s.getRange(a1).protect()
        .setDescription(WARN_BRANDING)
        .setWarningOnly(true);
    } catch (err) {
      Logger.log('[security] protect(' + a1 + ') threw: ' + (err && err.message));
    }
  });
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
  setEng('rng_dash_monthly_grid',     'A1:E13');   // Chart 1 - Column (income / expense / savings)
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

  // Welcome branding regions are protected directly by `_applySecurity`
  // inside `_buildWelcomePage` — keeping the ownership of the welcome
  // sheet's protection rules co-located with its layout builder.
  // (Previous direct calls on B2:O4 / B26:O29 referenced the legacy
  // pre-SmartBudget layout and have been removed.)

  // Dashboard regions (KPI cards + chart anchors + ledger)
  const dash = ss.getSheetByName(SHEET_NAMES.dashboard);
  ['B5:E10', 'F5:I10', 'J5:M10', 'N5:Q10', 'R5:U10', 'V5:Y10',
   'B11:M26', 'N11:Y26', 'B29:G44', 'H29:M44',
   'N29:S44', 'T29:Y44',
   'B47:I60', 'J47:Q60', 'R47:Y60'].forEach(r => {
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


// ============================================================================
// DEMO DATA — populate the 12 monthly sheets with realistic dummy entries
// ----------------------------------------------------------------------------
// Used at the end of `installBudgetCalculator2026` (only if the user opts in
// via the post-install prompt) AND as a standalone utility runnable from the
// Apps Script editor function dropdown.
//
// Design rules:
//   * Writes ONLY to user-editable cells: A:E + G of the income block
//     (rows 10..28) and A:E + G of the expense block (rows 33..62).
//     Column F (the ARRAYFORMULA difference) and column H (per-row alert
//     formulas) are deliberately skipped so the live calculations stay
//     intact.
//   * Categories are drawn from the canonical INCOME_CATEGORIES /
//     EXPENSE_CATEGORIES lists so existing data validation passes.
//   * Per-month variation comes from a deterministic offset (`monthIdx`
//     drives the multipliers) so re-running produces identical output —
//     no flickering numbers, no noisy diffs.
//   * Numbers are baseline-USD-friendly: ~$5.5k income / ~$3.5k expense
//     per month → ~35% savings rate. The Annual Performance Matrix's
//     "High Stability" verdict (>6 months runway) trips reliably.
//   * Re-runs check for pre-existing user data unless `opts.skipCheck` is
//     true; the skip flag is set when called from inside the install
//     pipeline (where sheets are guaranteed empty).
// ============================================================================

/**
 * Populate the 12 monthly sheets with realistic demo data.
 *
 * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} [ss]   defaults to active
 * @param {{skipCheck?: boolean}}                    [opts] omit to enable
 *                                                          the existing-data
 *                                                          confirmation prompt
 * @return {{monthsPopulated:number, incomeRows:number, expenseRows:number,
 *           missingMonths:string[]}}
 */
function _populateDemoData(ss, opts) {
  ss   = ss   || SpreadsheetApp.getActive();
  opts = opts || {};

  const summary = {
    monthsPopulated: 0,
    incomeRows:      0,
    expenseRows:     0,
    missingMonths:   [],
  };

  if (typeof MONTHS === 'undefined' || !Array.isArray(MONTHS)) {
    Logger.log('[demo] MONTHS constant unavailable — aborting.');
    return summary;
  }

  // ---- Existing-data guard ----
  // Skipped when called immediately after install (sheets are empty).
  // Otherwise: scan every monthly sheet's income+expense entry zone and
  // prompt the user before overwriting.
  if (!opts.skipCheck) {
    const hasExistingData = MONTHS.some(function (m) {
      const sheet = ss.getSheetByName(m);
      if (!sheet) return false;
      const rows = sheet.getRange('A10:E28').getValues()
        .concat(sheet.getRange('A33:E62').getValues());
      return rows.some(function (r) {
        // a row counts as "user data" if category (B), expected (D), or
        // actual (E) is non-empty. Date-only rows are tolerated.
        return (r[1] != null && String(r[1]).trim() !== '')
            || (r[3] != null && String(r[3]).trim() !== '')
            || (r[4] != null && String(r[4]).trim() !== '');
      });
    });
    if (hasExistingData) {
      try {
        const ui = SpreadsheetApp.getUi();
        const r = ui.alert(
          'تحذير — توجد بيانات',
          'الأشهر تحتوي بالفعل على بيانات. هل تريد استبدالها ببيانات تجريبية؟',
          ui.ButtonSet.YES_NO);
        if (r !== ui.Button.YES) return summary;
      } catch (err) {
        // No UI context (e.g. headless test) — bail safely instead of
        // overwriting silently.
        Logger.log('[demo] existing data detected and no UI to confirm — aborting.');
        return summary;
      }
    }
  }

  // ---- Income skeleton (5 rows / month, well within the 19-row block) ----
  // Each tuple: [category, description, baseExpected, actualMultiplier]
  const incomeSeed = [
    ['راتب أساسي',     'الراتب الشهري',         5000, 1.00],
    ['مكافآت وحوافز',  'مكافأة أداء ربعية',       600, 1.00],
    ['عمل حر',         'مشروع تصميم عن بُعد',    800, 0.95],
    ['دخل استثماري',   'أرباح أسهم / فوائد',      200, 1.05],
    ['أخرى',           'دخل متفرق',                150, 1.00],
  ];
  const incomePay = ['تحويل الكتروني', 'بطاقة بنكية', 'تحويل الكتروني', 'تحويل الكتروني', 'نقداً'];

  // ---- Expense skeleton (11 rows / month, fits in the 30-row block) ----
  // Each tuple: [category, description, baseExpected]
  const expenseSeed = [
    ['السكن',         'إيجار / قسط البيت',          1500],
    ['الطعام',        'مشتريات أسبوعية',             350],
    ['الطعام',        'مطاعم خارجية',                180],
    ['النقل',         'وقود / مواصلات',              220],
    ['الفواتير',      'كهرباء / ماء / غاز',           180],
    ['الفواتير',      'إنترنت + هاتف',                80],
    ['الاشتراكات',    'خدمات بثّ ومنصات',              45],
    ['الصحة',         'استشارة / دواء',              120],
    ['التسوق',        'ملابس / مستلزمات شخصية',      200],
    ['الترفيه',       'سينما / خروجات',              150],
    ['التعليم',       'كتب / كورسات',                100],
  ];
  const expensePay = ['بطاقة بنكية', 'بطاقة بنكية', 'نقداً', 'بطاقة بنكية', 'تحويل الكتروني',
                     'تحويل الكتروني', 'بطاقة بنكية', 'نقداً', 'بطاقة بنكية', 'نقداً', 'تحويل الكتروني'];

  const YEAR = (new Date()).getFullYear();   // current year, defaults to 2026 in this template

  MONTHS.forEach(function (monthName, monthIdx) {
    const sheet = ss.getSheetByName(monthName);
    if (!sheet) {
      summary.missingMonths.push(monthName);
      return;
    }

    // Deterministic per-month multipliers so charts show realistic but
    // stable variation (re-runs produce byte-identical output).
    const incomeMult  = 0.95 + (monthIdx % 5) * 0.05;   // 0.95 → 1.15 cycle
    const expenseMult = 0.85 + (monthIdx % 8) * 0.05;   // 0.85 → 1.20 cycle

    // ---- Income block: cols A-E (5 cols) and G separately ----
    const incomeAtoE = incomeSeed.map(function (seed, i) {
      const day      = Math.min(1 + i * 5, 28);              // days 1, 6, 11, 16, 21
      const date     = new Date(YEAR, monthIdx, day);
      const expected = Math.round(seed[2] * incomeMult);
      const actual   = Math.round(expected * seed[3]);
      return [date, seed[0], seed[1], expected, actual];
    });
    sheet.getRange(10, 1, incomeAtoE.length, 5).setValues(incomeAtoE);
    const incomeG = incomeSeed.map(function (_, i) { return [incomePay[i % incomePay.length]]; });
    sheet.getRange(10, 7, incomeG.length, 1).setValues(incomeG);
    summary.incomeRows += incomeAtoE.length;

    // ---- Expense block: cols A-E (5 cols) and G separately ----
    const expenseAtoE = expenseSeed.map(function (seed, i) {
      const day            = Math.min(2 + i * 3, 28);        // days 2, 5, 8, 11, …
      const date           = new Date(YEAR, monthIdx, day);
      const expected       = Math.round(seed[2] * expenseMult);
      // Actual varies more (0.90 → 1.10×) to simulate spending discipline.
      const actualMult     = 0.90 + ((monthIdx + i) % 5) * 0.05;
      const actual         = Math.round(expected * actualMult);
      return [date, seed[0], seed[1], expected, actual];
    });
    sheet.getRange(33, 1, expenseAtoE.length, 5).setValues(expenseAtoE);
    const expenseG = expenseSeed.map(function (_, i) { return [expensePay[i % expensePay.length]]; });
    sheet.getRange(33, 7, expenseG.length, 1).setValues(expenseG);
    summary.expenseRows += expenseAtoE.length;

    summary.monthsPopulated += 1;
  });

  // Force recompute so all derived numbers (engine sums, KPI cards, charts)
  // light up immediately rather than waiting for the next view.
  SpreadsheetApp.flush();

  Logger.log('[demo] populated: ' + JSON.stringify(summary));
  return summary;
}
