/**
 * SMARTBUDGET PRO 2026 - Consolidated Installer v2.0
 * =============================================================================
 * Single file. Paste into Apps Script. Run installSmartBudgetPro2026.
 *
 * ENTRY POINTS (Apps Script function dropdown):
 *   installSmartBudgetPro2026()    main installer
 *   fillAllMonthsWithDemoData()    populate 5 income + 5 expense per month
 *   clearAllDemoData()             wipe demo rows
 *   addMonthlyVisualAnalytics()    add column + doughnut inside each month
 *   removeMonthlyVisualAnalytics() remove them
 *   repairDashboardV2()            rewrite engine + charts without rebuild
 */

// ============================================================================
// 1. THEME PALETTE
// ============================================================================
var T = {
  bgPage:        '#0F172A',  bgCard:        '#1E293B',
  bgCardSoft:    '#243042',  glassBorder:   '#334155',
  fgPrimary:     '#F1F5F9',  fgMuted:       '#94A3B8',
  white:         '#FFFFFF',  income:        '#10B981',
  expense:       '#DC2626',  netCyan:       '#06B6D4',
  trendDown:     '#EF4444',  warnAmber:     '#F59E0B',
  paletteOrange: '#F97316',  paletteBlue:   '#3B82F6',
  palettePurple: '#8B5CF6',  palettePink:   '#EC4899',
  paletteLime:   '#84CC16',  gridline:      '#334155'
};

var TINT_FG = '#000000';
var TINT_BORDER = '#FFFFFF';
var FONT = 'Cairo';

// ============================================================================
// 2. SEED DATA
// ============================================================================
var CURRENCIES = [
  ['DZD','الدينار الجزائري', 134.5,   '#,##0.00 "DZD"'],
  ['SAR','الريال السعودي',   3.75,    '#,##0.00 "SAR"'],
  ['AED','الدرهم الإماراتي', 3.6725,  '#,##0.00 "AED"'],
  ['QAR','الريال القطري',    3.64,    '#,##0.00 "QAR"'],
  ['KWD','الدينار الكويتي',  0.31,    '#,##0.000 "KWD"'],
  ['BHD','الدينار البحريني', 0.376,   '#,##0.000 "BHD"'],
  ['OMR','الريال العماني',   0.3845,  '#,##0.000 "OMR"'],
  ['EGP','الجنيه المصري',    48.0,    '#,##0.00 "EGP"'],
  ['JOD','الدينار الأردني',  0.709,   '#,##0.00 "JOD"'],
  ['TND','الدينار التونسي',  3.15,    '#,##0.000 "TND"'],
  ['MAD','الدرهم المغربي',   9.95,    '#,##0.00 "MAD"'],
  ['EUR','اليورو',           0.92,    '#,##0.00 "EUR"'],
  ['USD','الدولار الأمريكي', 1.0,     '#,##0.00 "USD"'],
  ['GBP','الجنيه الإسترليني',0.79,    '#,##0.00 "GBP"']
];

var INCOME_CATEGORIES = [
  'راتب أساسي','مكافآت وحوافز','عمل حر','دخل استثماري',
  'إيجارات','أرباح تجارية','هدايا','أخرى'
];

var EXPENSE_CATEGORIES = [
  'الطعام','النقل','السكن','الفواتير','الصحة','التعليم',
  'التسوق','الترفيه','الاشتراكات','السفر','الطوارئ','أخرى'
];

var PAYMENT_METHODS = ['نقدا','بطاقة بنكية','تحويل الكتروني','أخرى'];

var MONTHS = [
  'جانفي','فيفري','مارس','أفريل','ماي','جوان',
  'جويلية','أوت','سبتمبر','أكتوبر','نوفمبر','ديسمبر'
];

var MONTH_TINTS = [
  '#E3F2FD','#E8EAF6','#E0F2F1','#E8F5E9','#F1F8E9','#FFFDE7',
  '#FFF8E1','#FFF3E0','#FBE9E7','#FCE4EC','#F3E5F5','#EDE7F6'
];

var GOALS_SEED = [
  ['شراء سيارة',         80000,    80000, '', new Date('2026-12-31'), '','','',''],
  ['شراء منزل',         1200000,  200000, '', new Date('2030-12-31'), '','','',''],
  ['صندوق الطوارئ',      60000,    25000, '', new Date('2026-12-31'), '','','',''],
  ['السفر والاستثمار',   25000,        0, '', new Date('2027-08-31'), '','','','']
];

var FX_FALLBACK = {
  DZD:134.5, SAR:3.75, AED:3.6725, QAR:3.64, KWD:0.31, BHD:0.376,
  OMR:0.3845, EGP:48.0, JOD:0.709, TND:3.15, MAD:9.95,
  EUR:0.92, USD:1.0, GBP:0.79
};

var YEARS_LIST     = [2024, 2025, 2026, 2027, 2028, 2029, 2030];
var CURRENCY_CODES = ['DZD','SAR','AED','QAR','KWD','BHD','OMR',
                      'EGP','JOD','TND','MAD','EUR','USD','GBP'];

var DOUGHNUT_COLORS = [
  '#F97316','#3B82F6','#DC2626','#F59E0B','#84CC16','#8B5CF6',
  '#EC4899','#06B6D4','#10B981','#94A3B8','#EF4444','#F1F5F9'
];

var SHEET_NAMES = {
  welcome:   'SMARTBUDGET PRO 2026',
  settings:  'الإعدادات وأسعار الصرف',
  goals:     'الأهداف المالية والادخار',
  dashboard: 'لوحة التحكم',
  engine:    '_DashboardEngine',
  fx:        '_FxRates'
};

var WARN_ENGINE   = 'هذه الورقة جزء من المحرك الخلفي. التعديل يكسر اللوحة.';
var WARN_BRANDING = 'هذه الكتلة جزء من الهوية البصرية. التعديل غير مرغوب.';
var WARN_CALC     = 'هذه الخلية محسوبة آليا، لا تعدل يدويا.';
var WARN_SETTINGS = 'هذه الورقة هي مصدر الحقيقة الوحيد للإعدادات.';

var DEMO_INCOME_FIXED = [
  ['راتب شركة الأمل','راتب أساسي','راتب الشهر',6500,'تحويل الكتروني'],
  ['مشروع تصميم','عمل حر','تصميم موقع',1500,'بطاقة بنكية']
];
var DEMO_INCOME_ROTATING = [
  ['مكافأة الأداء','مكافآت وحوافز','مكافأة ربعية',1200,'تحويل الكتروني'],
  ['محفظة استثمار','دخل استثماري','أرباح أسهم',650,'تحويل الكتروني'],
  ['إيجار شقة','إيجارات','إيجار شهري',900,'نقدا'],
  ['متجر إلكتروني','أرباح تجارية','مبيعات الشهر',850,'تحويل الكتروني'],
  ['هدية مناسبة','هدايا','هدية والد',500,'نقدا'],
  ['استشارة فنية','عمل حر','استشارة عميل',1100,'بطاقة بنكية'],
  ['فوائد بنكية','دخل استثماري','فائدة وديعة',350,'تحويل الكتروني']
];
var DEMO_EXPENSE_FIXED = [
  ['السكن','إيجار الشقة',2500,'تحويل الكتروني'],
  ['الطعام','بقالة الشهر',720,'بطاقة بنكية'],
  ['الفواتير','كهرباء وماء وإنترنت',380,'تحويل الكتروني']
];
var DEMO_EXPENSE_ROTATING = [
  ['النقل','وقود وصيانة',520,'بطاقة بنكية'],
  ['الصحة','كشف طبي وأدوية',300,'نقدا'],
  ['التعليم','رسوم دورة',450,'بطاقة بنكية'],
  ['التسوق','ملابس فصلية',610,'بطاقة بنكية'],
  ['الترفيه','مطعم وسينما',260,'نقدا'],
  ['الاشتراكات','Netflix Spotify',175,'بطاقة بنكية'],
  ['السفر','تذكرة طيران',1250,'بطاقة بنكية']
];
var DEMO_DRIFT = [0.92,0.95,0.98,1.02,1.0,1.05,1.08,1.1,1.05,1.02,1.0,1.04];
var DEMO_OVERSPEND = [2,5,8,11];

// ============================================================================
// 3. MAIN ENTRY POINT
// ============================================================================
function installSmartBudgetPro2026() {
  var startTime = new Date();
  var ss = SpreadsheetApp.getActive();
  var ui = SpreadsheetApp.getUi();

  var sheets = ss.getSheets();
  var nonEmpty = sheets.some(function(s) {
    return s.getLastRow() > 0 || s.getLastColumn() > 1;
  });
  if (sheets.length > 1 || nonEmpty) {
    var r = ui.alert('تحذير',
      'يبدو أن المصنف يحوي بيانات. الأوراق ذات الأسماء المتطابقة ستستبدل. متابعة؟',
      ui.ButtonSet.YES_NO);
    if (r !== ui.Button.YES) return;
  }

  Logger.log('SMARTBUDGET PRO 2026 install started ' + startTime.toISOString());

  precreateAllSheetStubs(ss);
  Logger.log('1/9 stubs created');

  buildSettings(ss);             Logger.log('2/9 settings');
  buildGoals(ss);                Logger.log('3/9 goals');
  for (var i = 0; i < MONTHS.length; i++) buildMonth(ss, MONTHS[i], i);
  Logger.log('4/9 12 monthly sheets');
  SpreadsheetApp.flush();

  buildFxRates(ss);              Logger.log('5/9 fx');
  buildDashboardV2(ss);          Logger.log('6/9 dashboard layout');
  buildDashboardEngineV2(ss);    Logger.log('7/9 engine');
  buildWelcomeV2(ss);            Logger.log('8/9 welcome');

  defineNamedRangesAndValidations(ss);
  applyProtectionV2(ss);
  reorderTabsV2(ss);

  SpreadsheetApp.flush();
  buildDashboardChartsV2(ss);    Logger.log('9/9 charts');

  ss.getSheetByName(SHEET_NAMES.engine).hideSheet();
  ss.getSheetByName(SHEET_NAMES.fx).hideSheet();
  ss.setActiveSheet(ss.getSheetByName(SHEET_NAMES.welcome));

  var elapsed = Math.round((new Date() - startTime) / 1000);
  ui.alert('SMARTBUDGET PRO 2026 - تم التركيب',
    'تم تركيب ' + (4 + MONTHS.length) + ' ورقة في ' + elapsed + ' ثانية.\n\n' +
    'افتح "لوحة التحكم"، اختر السنة في B4 والعملة في D4.\n\n' +
    'دوال إضافية: fillAllMonthsWithDemoData, addMonthlyVisualAnalytics.',
    ui.ButtonSet.OK);
}

// ============================================================================
// 4. HELPERS
// ============================================================================
function getOrCreateSheet(ss, name) {
  var s = ss.getSheetByName(name);
  if (!s) s = ss.insertSheet(name);
  s.setRightToLeft(true);
  s.setHiddenGridlines(true);
  return s;
}

function precreateAllSheetStubs(ss) {
  var all = [
    SHEET_NAMES.welcome, SHEET_NAMES.settings, SHEET_NAMES.goals
  ].concat(MONTHS).concat([
    SHEET_NAMES.dashboard, SHEET_NAMES.engine, SHEET_NAMES.fx
  ]);
  for (var i = 0; i < all.length; i++) getOrCreateSheet(ss, all[i]);
}

function mergeAndStyle(s, a1, value, opts) {
  var r = s.getRange(a1);
  try { r.merge(); } catch (e) {}
  if (value !== undefined && value !== null && value !== '') r.setValue(value);
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

function paintCard(s, a1) {
  s.getRange(a1).setBackground(T.bgCard).setFontColor(T.fgPrimary);
}

// ============================================================================
// 5. SETTINGS SHEET
// ============================================================================
function buildSettings(ss) {
  var s = getOrCreateSheet(ss, SHEET_NAMES.settings);
  s.clear();

  mergeAndStyle(s, 'A1:D1', 'SMARTBUDGET PRO 2026 - الإعدادات وأسعار الصرف',
    { bold:true, size:14, align:'center', fontFamily:FONT });
  mergeAndStyle(s, 'A2:D2',
    'يجب تحديث أسعار الصرف يدويا أو عبر GOOGLEFINANCE قبل بدء كل شهر.',
    { fg:T.fgMuted, size:10, align:'center', fontFamily:FONT });

  s.getRange('A3').setValue('العملة الرئيسية للعرض').setFontFamily(FONT);
  s.getRange('B3').setValue('USD').setFontFamily(FONT);
  s.getRange('A4').setValue('تنسيق العملة النشط').setFontFamily(FONT);
  s.getRange('B4').setFormula('=XLOOKUP(B3, A7:A20, D7:D20)').setFontFamily(FONT);
  s.getRange('A5').setValue('سعر الصرف مقابل الدولار').setFontFamily(FONT);
  s.getRange('B5').setFormula('=XLOOKUP(B3, A7:A20, C7:C20)').setFontFamily(FONT);

  s.getRange('A6:D6').setValues([['رمز العملة','اسم العملة',
    'سعر الصرف USD','التنسيق المالي']])
    .setFontWeight('bold').setBackground(T.glassBorder)
    .setFontColor(T.fgPrimary).setFontFamily(FONT);

  s.getRange(7, 1, CURRENCIES.length, 4).setValues(CURRENCIES)
    .setFontColor(TINT_FG).setFontFamily(FONT);

  s.getRange('F6').setValue('فئات الدخل')
    .setFontWeight('bold').setBackground(T.glassBorder)
    .setFontColor(T.fgPrimary).setFontFamily(FONT);
  s.getRange(7, 6, INCOME_CATEGORIES.length, 1)
    .setValues(INCOME_CATEGORIES.map(function(v){return [v];}))
    .setFontColor(TINT_FG).setFontFamily(FONT);

  s.getRange('G6').setValue('فئات المصاريف')
    .setFontWeight('bold').setBackground(T.glassBorder)
    .setFontColor(T.fgPrimary).setFontFamily(FONT);
  s.getRange(7, 7, EXPENSE_CATEGORIES.length, 1)
    .setValues(EXPENSE_CATEGORIES.map(function(v){return [v];}))
    .setFontColor(TINT_FG).setFontFamily(FONT);

  s.getRange('H6').setValue('طرق الدفع')
    .setFontWeight('bold').setBackground(T.glassBorder)
    .setFontColor(T.fgPrimary).setFontFamily(FONT);
  s.getRange(7, 8, PAYMENT_METHODS.length, 1)
    .setValues(PAYMENT_METHODS.map(function(v){return [v];}))
    .setFontColor(TINT_FG).setFontFamily(FONT);

  s.getRange('B3').setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInRange(s.getRange('A7:A20'), true)
      .setAllowInvalid(false).build());

  s.autoResizeColumns(1, 8);
}

// ============================================================================
// 6. GOALS SHEET
// ============================================================================
function buildGoals(ss) {
  var s = getOrCreateSheet(ss, SHEET_NAMES.goals);
  s.clear();

  mergeAndStyle(s, 'A1:I1', 'الأهداف المالية والادخار - SMARTBUDGET PRO 2026',
    { bold:true, size:16, align:'center', fontFamily:FONT });

  s.getRange('A2').setValue('إجمالي تكلفة الأهداف').setFontFamily(FONT);
  s.getRange('B2').setFormula('=SUM(B7:B26)');
  s.getRange('C2').setValue('إجمالي المدخر').setFontFamily(FONT);
  s.getRange('D2').setFormula('=SUM(C7:C26)');
  s.getRange('E2').setValue('نسبة الإنجاز').setFontFamily(FONT);
  s.getRange('F2').setFormula('=IFERROR(SUM(C7:C26)/SUM(B7:B26), 0)')
    .setNumberFormat('[$-en-US]0.0%');

  s.getRange('A3').setValue('القسط الشهري المطلوب').setFontFamily(FONT);
  s.getRange('B3').setFormula('=SUMIF(H7:H26, "🟡 قيد الادخار", G7:G26)');
  s.getRange('C3').setValue('أهداف مكتملة').setFontFamily(FONT);
  s.getRange('D3').setFormula('=COUNTIF(H7:H26, "🟢 مكتمل")');
  s.getRange('E3').setValue('أهداف قيد الادخار').setFontFamily(FONT);
  s.getRange('F3').setFormula('=COUNTIF(H7:H26, "🟡 قيد الادخار")');

  s.getRange('A4').setValue('أهداف لم تبدأ').setFontFamily(FONT);
  s.getRange('B4').setFormula('=COUNTIF(H7:H26, "⚪ لم يبدأ بعد")');

  s.getRange('A6:I6').setValues([['الهدف','التكلفة','المدخر',
    'النسبة','الموعد','أشهر متبقية','القسط الشهري','الحالة','التوصية']])
    .setFontWeight('bold').setBackground(T.glassBorder)
    .setFontColor(T.fgPrimary).setHorizontalAlignment('center')
    .setFontFamily(FONT);

  s.getRange(7, 1, GOALS_SEED.length, 9).setValues(GOALS_SEED).setFontFamily(FONT);
  s.getRange(7, 5, GOALS_SEED.length, 1).setNumberFormat('[$-en-US]dd/mm/yyyy');

  for (var r = 7; r <= 26; r++) {
    s.getRange('D' + r).setFormula('=IFERROR(C' + r + '/B' + r + ', 0)')
      .setNumberFormat('[$-en-US]0.0%');
    s.getRange('F' + r).setFormula(
      '=IFERROR(MAX(0, DATEDIF(TODAY(), E' + r + ', "M")), 0)');
    s.getRange('G' + r).setFormula(
      '=IF(C' + r + '>=B' + r + ', 0, IFERROR((B' + r + '-C' + r + ')/F' + r + ', 0))');
    s.getRange('H' + r).setFormula(
      '=IFS(B' + r + '="", "", IFERROR(C' + r + '/B' + r + ',0)>=1,"🟢 مكتمل",' +
      'IFERROR(C' + r + '/B' + r + ',0)>=0.01,"🟡 قيد الادخار",TRUE,"⚪ لم يبدأ بعد")');
    s.getRange('I' + r).setFormula(
      '=IFS(B' + r + '="","",IFERROR(C' + r + '/B' + r + ',0)>=1,' +
      '"🎉 الهدف محقق بالكامل.",F' + r + '=0,' +
      '"⚠️ الموعد انتهى دون اكتمال.",F' + r + '>24,' +
      '"⏳ خصص "&TEXT(G' + r + ',rng_ActiveFormat)&" شهريا.",F' + r + '>6,' +
      '"🟡 التزم بـ "&TEXT(G' + r + ',rng_ActiveFormat)&" شهريا.",TRUE,' +
      '"🔴 يلزم "&TEXT(G' + r + ',rng_ActiveFormat)&" شهريا.")');
  }

  var rules = s.getConditionalFormatRules();
  var hRng = s.getRange('H7:H26');
  rules.push(
    SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied('=$H7="🟢 مكتمل"')
      .setBackground('#27AE60').setFontColor(T.white).setRanges([hRng]).build(),
    SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied('=$H7="🟡 قيد الادخار"')
      .setBackground('#F1C40F').setFontColor('#000000').setRanges([hRng]).build(),
    SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied('=$H7="⚪ لم يبدأ بعد"')
      .setBackground('#BDC3C7').setFontColor('#000000').setRanges([hRng]).build()
  );
  s.setConditionalFormatRules(rules);

  s.getRange('A6:I26').setBorder(true,true,true,true,true,true,
    TINT_BORDER, SpreadsheetApp.BorderStyle.SOLID);
  for (var r2 = 7; r2 <= 26; r2++) {
    s.getRange(r2, 1, 1, 9)
      .setBackground(r2 % 2 === 0 ? '#FAFAFA' : '#FFFFFF')
      .setFontColor(TINT_FG).setFontFamily(FONT);
  }
  s.getRange('A2:F4').setBackground('#F5F5F5').setFontColor(TINT_FG)
    .setFontWeight('bold').setFontFamily(FONT);

  s.setFrozenRows(6);
  s.autoResizeColumns(1, 9);
}

// ============================================================================
// 7. MONTHLY SHEET
// ============================================================================
function buildMonth(ss, monthName, monthIndex) {
  var s = getOrCreateSheet(ss, monthName);
  s.clear();
  var tint = MONTH_TINTS[monthIndex] || MONTH_TINTS[0];

  mergeAndStyle(s, 'A1:H1', 'ميزانية شهر ' + monthName + ' - SMARTBUDGET PRO 2026',
    { bg:tint, fg:TINT_FG, bold:true, size:16, align:'center', fontFamily:FONT });
  s.setRowHeight(1, 38);

  s.getRange('A2:H5').setBackground(tint).setFontColor(TINT_FG)
    .setFontWeight('bold').setHorizontalAlignment('center')
    .setVerticalAlignment('middle').setFontFamily(FONT);
  for (var r = 2; r <= 5; r++) s.setRowHeight(r, 28);

  s.getRange('A2').setValue('العملة');
  s.getRange('B2').setFormula('=IFERROR(rng_MainCurrency,"USD")');
  s.getRange('C2').setValue('الشهر');
  s.getRange('D2').setValue(monthName);
  s.getRange('E2').setValue('مؤشر التنبيه');
  s.getRange('F2').setFormula(
    '=IF(OR(D3="",D4="",D3=0),"",IF(D4>D3,"🔴 تجاوز",IF(D4>=0.9*D3,"🟡 اقتراب","🟢 ممتاز")))');

  s.getRange('A3').setValue('الدخل المتوقع');
  s.getRange('B3').setFormula('=SUM(E10:E28)').setNumberFormat('[$-en-US]#,##0');
  s.getRange('C3').setValue('المصروف المتوقع');
  s.getRange('D3').setFormula('=SUM(D33:D62)').setNumberFormat('[$-en-US]#,##0');
  s.getRange('E3').setValue('نسبة الادخار');
  s.getRange('F3').setFormula('=IFERROR((B4-D4)/B4,0)').setNumberFormat('[$-en-US]0.0%');

  s.getRange('A4').setValue('الدخل الفعلي');
  s.getRange('B4').setFormula('=SUM(F10:F28)').setNumberFormat('[$-en-US]#,##0');
  s.getRange('C4').setValue('المصروف الفعلي');
  s.getRange('D4').setFormula('=SUM(E33:E62)').setNumberFormat('[$-en-US]#,##0');
  s.getRange('E4').setValue('نسبة الإنفاق');
  s.getRange('F4').setFormula('=IFERROR(D4/B4,0)').setNumberFormat('[$-en-US]0.0%');

  s.getRange('A5').setValue('صافي الفائض');
  s.getRange('B5').setFormula('=B4-D4').setNumberFormat('[$-en-US]#,##0');
  s.getRange('C5').setValue('أعلى فئة استنزاف');
  s.getRange('D5').setFormula(
    '=IFERROR(XLOOKUP(MAX(ARRAYFORMULA(SUMIF(B33:B62,rng_ExpenseCategories,E33:E62))),' +
    'ARRAYFORMULA(SUMIF(B33:B62,rng_ExpenseCategories,E33:E62)),rng_ExpenseCategories),"")');
  s.getRange('E5').setValue('مبلغها');
  s.getRange('F5').setFormula(
    '=IFERROR(MAX(ARRAYFORMULA(SUMIF(B33:B62,rng_ExpenseCategories,E33:E62))),0)')
    .setNumberFormat('[$-en-US]#,##0');

  s.getRange('A9:H9').setValues([['المداخيل','التاريخ','الفئة','الوصف',
    'الدخل المتوقع','الدخل الفعلي','الفرق','طريقة الدفع']])
    .setFontWeight('bold').setBackground(T.glassBorder)
    .setFontColor(T.fgPrimary).setHorizontalAlignment('center')
    .setFontFamily(FONT);

  s.getRange('B10:B28').setNumberFormat('[$-en-US]dd/mm/yyyy');
  s.getRange('E10:G28').setNumberFormat('[$-en-US]#,##0');
  s.getRange('G10').setFormula(
    '=ARRAYFORMULA(IF((E10:E28="")+(F10:F28="")>0,"",F10:F28-E10:E28))');

  s.getRange('A29').setValue('الإجمالي').setFontWeight('bold').setFontFamily(FONT);
  s.getRange('E29').setFormula('=SUM(E10:E28)').setNumberFormat('[$-en-US]#,##0');
  s.getRange('F29').setFormula('=SUM(F10:F28)').setNumberFormat('[$-en-US]#,##0');
  s.getRange('G29').setFormula('=F29-E29').setNumberFormat('[$-en-US]#,##0');

  s.getRange('A32:H32').setValues([['التاريخ','الفئة','الوصف',
    'المصروف المتوقع','المصروف الفعلي','الفرق','طريقة الدفع','حالة التنبيه']])
    .setFontWeight('bold').setBackground(T.glassBorder)
    .setFontColor(T.fgPrimary).setHorizontalAlignment('center')
    .setFontFamily(FONT);

  s.getRange('A33:A62').setNumberFormat('[$-en-US]dd/mm/yyyy');
  s.getRange('D33:F62').setNumberFormat('[$-en-US]#,##0');
  s.getRange('F33').setFormula(
    '=ARRAYFORMULA(IF((D33:D62="")+(E33:E62="")>0,"",D33:D62-E33:E62))');

  for (var rr = 33; rr <= 62; rr++) {
    s.getRange('H' + rr).setFormula(
      '=IF(OR(D' + rr + '="",E' + rr + '=""),"",' +
      'IF(E' + rr + '>D' + rr + ',"🔴 تجاوز",' +
      'IF(E' + rr + '>=0.9*D' + rr + ',"🟡 اقتراب","🟢 ممتاز")))');
  }

  s.getRange('A63').setValue('الإجمالي').setFontWeight('bold').setFontFamily(FONT);
  s.getRange('D63').setFormula('=SUM(D33:D62)').setNumberFormat('[$-en-US]#,##0');
  s.getRange('E63').setFormula('=SUM(E33:E62)').setNumberFormat('[$-en-US]#,##0');
  s.getRange('F63').setFormula('=D63-E63').setNumberFormat('[$-en-US]#,##0');

  var rules2 = s.getConditionalFormatRules();
  var hRng2 = s.getRange('H33:H62');
  rules2.push(
    SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied('=$H33="🔴 تجاوز"')
      .setBackground('#C0392B').setFontColor(T.white).setRanges([hRng2]).build(),
    SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied('=$H33="🟡 اقتراب"')
      .setBackground('#F1C40F').setFontColor('#000000').setRanges([hRng2]).build(),
    SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied('=$H33="🟢 ممتاز"')
      .setBackground('#27AE60').setFontColor(T.white).setRanges([hRng2]).build()
  );
  s.setConditionalFormatRules(rules2);

  s.getRange('A9:H29').setBorder(true,true,true,true,true,true,
    TINT_BORDER, SpreadsheetApp.BorderStyle.SOLID);
  s.getRange('A32:H63').setBorder(true,true,true,true,true,true,
    TINT_BORDER, SpreadsheetApp.BorderStyle.SOLID);
  for (var ri = 10; ri <= 28; ri++) {
    s.getRange(ri, 1, 1, 8)
      .setBackground(ri % 2 === 0 ? '#FAFAFA' : '#FFFFFF')
      .setFontColor(TINT_FG).setFontFamily(FONT);
  }
  for (var re = 33; re <= 62; re++) {
    s.getRange(re, 1, 1, 7)
      .setBackground(re % 2 === 0 ? '#FAFAFA' : '#FFFFFF')
      .setFontColor(TINT_FG).setFontFamily(FONT);
  }
  s.getRange('A29:H29').setBackground(tint).setFontWeight('bold')
    .setFontColor(TINT_FG).setFontFamily(FONT);
  s.getRange('A63:H63').setBackground(tint).setFontWeight('bold')
    .setFontColor(TINT_FG).setFontFamily(FONT);

  s.setFrozenRows(6);
  s.autoResizeColumns(1, 8);
}

// ============================================================================
// 8. FX RATES SHEET
// ============================================================================
function buildFxRates(ss) {
  var s = getOrCreateSheet(ss, SHEET_NAMES.fx);
  s.clear();

  s.getRange('A1:D1').setValues([['رمز','سعر مقابل USD','آخر تحديث','المصدر']])
    .setFontWeight('bold').setBackground(T.glassBorder)
    .setFontColor(T.fgPrimary).setFontFamily(FONT);

  for (var i = 0; i < CURRENCY_CODES.length; i++) {
    var code = CURRENCY_CODES[i];
    var fb = FX_FALLBACK[code];
    var row = i + 2;
    s.getRange(row, 1).setValue(code).setFontFamily(FONT);
    if (code === 'USD') {
      s.getRange(row, 2).setValue(1);
      s.getRange(row, 4).setValue('عملة الأساس').setFontFamily(FONT);
    } else {
      s.getRange(row, 2).setFormula(
        '=IFERROR(GOOGLEFINANCE("CURRENCY:USD' + code + '"),' + fb + ')');
      s.getRange(row, 4).setFormula(
        '=IF(ISNUMBER(GOOGLEFINANCE("CURRENCY:USD' + code + '")),"GOOGLEFINANCE","تقديري")')
        .setFontFamily(FONT);
    }
    s.getRange(row, 3).setFormula('=TODAY()').setNumberFormat('[$-en-US]dd/mm/yyyy');
  }
  s.getRange(2, 2, CURRENCY_CODES.length, 1).setNumberFormat('[$-en-US]0.0000');
  s.autoResizeColumns(1, 4);
}

// ============================================================================
// 9. DASHBOARD V2 LAYOUT
// ============================================================================
function buildDashboardV2(ss) {
  var s = getOrCreateSheet(ss, SHEET_NAMES.dashboard);
  s.clear();

  s.getRange(1, 1, 60, 26).setBackground(T.bgPage)
    .setFontColor(T.fgPrimary).setFontFamily(FONT);
  for (var c = 1; c <= 26; c++) s.setColumnWidth(c, 56);

  s.setRowHeight(2, 56);
  mergeAndStyle(s, 'B2:Q2', 'نظام الإدارة المالية الشاملة',
    { bg:T.bgPage, fg:T.fgPrimary, size:28, bold:true, align:'right', fontFamily:FONT });

  s.setRowHeight(3, 24);
  mergeAndStyle(s, 'S3:T3', 'السنة',
    { bg:T.bgPage, fg:T.fgMuted, size:12, bold:true, align:'center', fontFamily:FONT });
  mergeAndStyle(s, 'V3:W3', 'العملة',
    { bg:T.bgPage, fg:T.fgMuted, size:12, bold:true, align:'center', fontFamily:FONT });

  s.setRowHeight(4, 36);
  mergeAndStyle(s, 'S4:T4', '',
    { bg:T.bgCard, fg:T.fgPrimary, size:16, bold:true, align:'center', fontFamily:FONT });
  mergeAndStyle(s, 'V4:W4', '',
    { bg:T.bgCard, fg:T.fgPrimary, size:16, bold:true, align:'center', fontFamily:FONT });

  s.getRange('B4').setValue(new Date().getFullYear()).setFontFamily(FONT);
  s.getRange('B4').setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(YEARS_LIST, true)
      .setAllowInvalid(false).build());
  s.getRange('D4').setValue('USD').setFontFamily(FONT);
  s.getRange('D4').setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(CURRENCY_CODES, true)
      .setAllowInvalid(false).build());

  s.getRange('S4').setFormula('=B4').setNumberFormat('[$-en-US]0').setFontFamily(FONT);
  s.getRange('V4').setFormula('=D4').setFontFamily(FONT);

  s.getRange('F4').setFormula(
    '=IFERROR(VLOOKUP(D4,' + SHEET_NAMES.fx + '!A:B,2,FALSE),1)')
    .setNumberFormat('[$-en-US]0.0000');
  s.getRange('H4').setFormula(
    '=IFERROR(VLOOKUP(IFERROR(rng_MainCurrency,"USD"),' + SHEET_NAMES.fx + '!A:B,2,FALSE),1)')
    .setNumberFormat('[$-en-US]0.0000');
  s.getRange('J4').setFormula('=IFERROR(F4/H4,1)').setNumberFormat('[$-en-US]0.0000');

  buildKpiCardsV2(s);
  buildMiddleSectionV2(s);
  buildDoughnutsSectionV2(s);
  buildLedgerCardV2(s);
}

function buildKpiCardsV2(s) {
  var eng = "'" + SHEET_NAMES.engine + "'";
  var cards = [
    {range:'B6:E12',  icon:'💰', label:'إجمالي الدخل',     formula:'=IFERROR(SUM(' + eng + '!B2:B13),0)', format:'[$-en-US]#,##0', accent:T.income},
    {range:'F6:I12',  icon:'💸', label:'إجمالي المصروفات', formula:'=IFERROR(SUM(' + eng + '!C2:C13),0)', format:'[$-en-US]#,##0', accent:T.expense},
    {range:'J6:M12',  icon:'📈', label:'صافي الربح',        formula:'=IFERROR(SUM(' + eng + '!D2:D13),0)', format:'[$-en-US]#,##0', accent:T.netCyan},
    {range:'N6:Q12',  icon:'💎', label:'إجمالي الأصول',     formula:'=IFERROR(SUM(' + eng + '!D2:D13)*1.5,0)', format:'[$-en-US]#,##0', accent:T.netCyan},
    {range:'R6:U12',  icon:'📊', label:'معدل الادخار',      formula:'=IFERROR((SUM(' + eng + '!B2:B13)-SUM(' + eng + '!C2:C13))/SUM(' + eng + '!B2:B13),0)', format:'[$-en-US]0.0%', accent:T.income},
    {range:'V6:Y12',  icon:'🔄', label:'صافي اتجاه الشهر الماضي', formula:'=IFERROR(' + eng + '!P2,0)', format:'[$-en-US]#,##0', accent:T.warnAmber}
  ];

  for (var i = 0; i < cards.length; i++) {
    var c = cards[i];
    var parts = c.range.split(':');
    var colStart = parts[0].match(/[A-Z]+/)[0];
    var colEnd   = parts[1].match(/[A-Z]+/)[0];

    s.getRange(c.range).setBackground(T.bgCard).setFontColor(T.fgPrimary)
      .setFontFamily(FONT)
      .setBorder(true,true,true,true,false,false, T.glassBorder, SpreadsheetApp.BorderStyle.SOLID);
    s.getRange(colStart + '6:' + colStart + '12').setBackground(c.accent);

    mergeAndStyle(s, colStart + '6:' + colEnd + '6', c.icon,
      { bg:T.bgCard, fg:c.accent, size:20, bold:true, align:'right', fontFamily:FONT });
    mergeAndStyle(s, colStart + '7:' + colEnd + '7', c.label,
      { bg:T.bgCard, fg:T.fgMuted, size:14, align:'right', fontFamily:FONT });
    mergeAndStyle(s, colStart + '8:' + colEnd + '10', '',
      { bg:T.bgCard, fg:T.fgPrimary, size:32, bold:true, align:'right', vAlign:'middle', fontFamily:FONT });
    s.getRange(colStart + '8').setFormula(c.formula).setNumberFormat(c.format);
    mergeAndStyle(s, colStart + '11:' + colEnd + '12', '',
      { bg:T.bgCard, fg:T.fgMuted, size:11, align:'right', fontFamily:FONT });
  }

  s.setRowHeight(6, 28);
  s.setRowHeight(7, 22);
  for (var r = 8; r <= 10; r++) s.setRowHeight(r, 28);
  s.setRowHeight(11, 18);
  s.setRowHeight(12, 18);
}

function buildMiddleSectionV2(s) {
  var sections = [
    {range:'B14:H28',  title:'تدفق الأموال السنوي'},
    {range:'I14:O28',  title:'درجة الصحة المالية'},
    {range:'P14:Y28',  title:'مقارنة الأداء المالي (12 شهرا)'}
  ];
  for (var i = 0; i < sections.length; i++) {
    var sec = sections[i];
    s.getRange(sec.range).setBackground(T.bgCard).setFontColor(T.fgPrimary)
      .setFontFamily(FONT)
      .setBorder(true,true,true,true,false,false, T.glassBorder, SpreadsheetApp.BorderStyle.SOLID);
    var parts = sec.range.split(':');
    var colStart = parts[0].match(/[A-Z]+/)[0];
    var colEnd   = parts[1].match(/[A-Z]+/)[0];
    var titleR = s.getRange(colStart + '14:' + colEnd + '14');
    try { titleR.merge(); } catch (e) {}
    titleR.setFormula('="' + sec.title + ' - " & TEXT($B$4,"0") & " - " & $D$4')
      .setBackground(T.bgCard).setFontColor(T.fgPrimary).setFontFamily(FONT)
      .setFontSize(16).setFontWeight('bold')
      .setHorizontalAlignment('center').setVerticalAlignment('middle');
  }
  s.setRowHeight(14, 32);
  for (var r = 15; r <= 28; r++) s.setRowHeight(r, 22);
}

function buildDoughnutsSectionV2(s) {
  var doughnuts = [
    {range:'B30:M44',  title:'توزيع مصادر الدخل'},
    {range:'N30:Y44',  title:'تحليل المصاريف السنوية'}
  ];
  for (var i = 0; i < doughnuts.length; i++) {
    var d = doughnuts[i];
    s.getRange(d.range).setBackground(T.bgCard).setFontColor(T.fgPrimary)
      .setFontFamily(FONT)
      .setBorder(true,true,true,true,false,false, T.glassBorder, SpreadsheetApp.BorderStyle.SOLID);
    var parts = d.range.split(':');
    var colStart = parts[0].match(/[A-Z]+/)[0];
    var colEnd   = parts[1].match(/[A-Z]+/)[0];
    var titleR = s.getRange(colStart + '30:' + colEnd + '30');
    try { titleR.merge(); } catch (e) {}
    titleR.setFormula('="' + d.title + ' - " & TEXT($B$4,"0") & " - " & $D$4')
      .setBackground(T.bgCard).setFontColor(T.fgPrimary).setFontFamily(FONT)
      .setFontSize(16).setFontWeight('bold')
      .setHorizontalAlignment('center').setVerticalAlignment('middle');
  }
  s.setRowHeight(30, 32);
  for (var r = 31; r <= 44; r++) s.setRowHeight(r, 22);
}

function buildLedgerCardV2(s) {
  s.getRange('B46:Y54').setBackground(T.bgCard).setFontColor(T.fgPrimary)
    .setFontFamily(FONT)
    .setBorder(true,true,true,true,false,false, T.glassBorder, SpreadsheetApp.BorderStyle.SOLID);

  var titleR = s.getRange('B46:Y46');
  try { titleR.merge(); } catch (e) {}
  titleR.setFormula('="آخر 5 معاملات - " & TEXT($B$4,"0") & " - " & $D$4')
    .setBackground(T.bgCard).setFontColor(T.fgPrimary).setFontFamily(FONT)
    .setFontSize(16).setFontWeight('bold')
    .setHorizontalAlignment('center').setVerticalAlignment('middle');

  s.getRange('H47:N47').setValues([['الشهر','التاريخ','النوع','الفئة','الوصف','المبلغ','طريقة الدفع']])
    .setFontWeight('bold').setBackground(T.glassBorder).setFontColor(T.fgPrimary)
    .setFontFamily(FONT).setFontSize(12).setHorizontalAlignment('center');

  s.getRange('H48').setFormula(
    '=IFERROR(QUERY(\'' + SHEET_NAMES.engine + '\'!Q2:W,' +
    '"select * where Col2 is not null and YEAR(Col2)=" & B4 & ' +
    '" order by Col2 desc limit 5", 0), "")');

  s.getRange('I48:I52').setNumberFormat('[$-en-US]dd/mm/yyyy');
  s.getRange('M48:M52').setNumberFormat('[$-en-US]#,##0');

  s.setRowHeight(46, 32);
  for (var r = 47; r <= 54; r++) s.setRowHeight(r, 24);
}

// ============================================================================
// 10. DASHBOARD ENGINE V2
// ============================================================================
function buildDashboardEngineV2(ss) {
  var s = getOrCreateSheet(ss, SHEET_NAMES.engine);
  s.clear();

  var yr = "'" + SHEET_NAMES.dashboard + "'!$B$4";
  var fx = "'" + SHEET_NAMES.dashboard + "'!$J$4";

  s.getRange('A1:D1').setValues([['الشهر','الدخل','المصروف','الصافي']])
    .setFontWeight('bold').setBackground(T.glassBorder)
    .setFontColor(T.fgPrimary).setFontFamily(FONT);
  for (var i = 0; i < 12; i++) {
    var m = MONTHS[i];
    var row = i + 2;
    s.getRange(row, 1).setValue(m).setFontFamily(FONT);
    s.getRange(row, 2).setFormula(buildYearSum(m, 'B', 'F', 10, 28, yr, fx));
    s.getRange(row, 3).setFormula(buildYearSum(m, 'A', 'E', 33, 62, yr, fx));
    s.getRange(row, 4).setFormula('=B' + row + '-C' + row);
  }

  s.getRange('F1:G1').setValues([['البند','القيمة']])
    .setFontWeight('bold').setBackground(T.glassBorder)
    .setFontColor(T.fgPrimary).setFontFamily(FONT);
  s.getRange('F2').setValue('إجمالي الدخل').setFontFamily(FONT);
  s.getRange('G2').setFormula('=IFERROR(SUM(B2:B13),0)');
  s.getRange('F3').setValue('السكن').setFontFamily(FONT);
  s.getRange('G3').setFormula('=-1*' + buildCategoryYearSum('السكن', true, yr, fx));
  s.getRange('F4').setValue('الطعام').setFontFamily(FONT);
  s.getRange('G4').setFormula('=-1*' + buildCategoryYearSum('الطعام', true, yr, fx));
  s.getRange('F5').setValue('النقل').setFontFamily(FONT);
  s.getRange('G5').setFormula('=-1*' + buildCategoryYearSum('النقل', true, yr, fx));
  s.getRange('F6').setValue('باقي المصاريف').setFontFamily(FONT);
  s.getRange('G6').setFormula('=IFERROR(-1*(SUM(C2:C13)+G3+G4+G5),0)');
  s.getRange('F7').setValue('صافي الربح').setFontFamily(FONT);
  s.getRange('G7').setFormula('=IFERROR(SUM(G2:G6),0)');

  s.getRange('I1:J1').setValues([['فئة الدخل','الإجمالي']])
    .setFontWeight('bold').setBackground(T.glassBorder)
    .setFontColor(T.fgPrimary).setFontFamily(FONT);
  for (var ic = 0; ic < INCOME_CATEGORIES.length; ic++) {
    s.getRange(ic + 2, 9).setValue(INCOME_CATEGORIES[ic]).setFontFamily(FONT);
    s.getRange(ic + 2, 10).setFormula(buildCategoryYearSum(INCOME_CATEGORIES[ic], false, yr, fx));
  }

  s.getRange('L1:M1').setValues([['فئة المصاريف','الإجمالي']])
    .setFontWeight('bold').setBackground(T.glassBorder)
    .setFontColor(T.fgPrimary).setFontFamily(FONT);
  for (var ec = 0; ec < EXPENSE_CATEGORIES.length; ec++) {
    s.getRange(ec + 2, 12).setValue(EXPENSE_CATEGORIES[ec]).setFontFamily(FONT);
    s.getRange(ec + 2, 13).setFormula(buildCategoryYearSum(EXPENSE_CATEGORIES[ec], true, yr, fx));
  }

  s.getRange('O1').setValue('الصحة').setFontWeight('bold').setFontFamily(FONT);
  s.getRange('O2').setFormula(
    '=ROUND(40*MAX(0,MIN(1,IFERROR((SUM(B2:B13)-SUM(C2:C13))/SUM(B2:B13),0)))' +
    '+30*MAX(0,MIN(1,IFERROR(SUM(B2:B13)/(SUM(B2:B13)+SUM(C2:C13)),0)))' +
    '+30*IF(SUM(D2:D13)>0,1,0.3),0)');

  s.getRange('P1').setValue('صافي الشهر الماضي').setFontWeight('bold').setFontFamily(FONT);
  s.getRange('P2').setFormula(
    '=IFERROR(INDEX(D2:D13, MAX(1, MIN(12, MONTH(TODAY())-1))), 0)');

  s.getRange('Q1:W1').setValues([['الشهر','التاريخ','النوع','الفئة','الوصف','المبلغ','الدفع']])
    .setFontWeight('bold').setBackground(T.glassBorder)
    .setFontColor(T.fgPrimary).setFontFamily(FONT);

  var row2 = 2;
  for (var li = 0; li < MONTHS.length; li++) {
    var lm = MONTHS[li];
    s.getRange('Q' + row2).setFormula(
      '=ARRAYFORMULA(IF(\'' + lm + '\'!B10:B28="","","' + lm + '"))');
    s.getRange('R' + row2).setFormula('=ARRAYFORMULA(\'' + lm + '\'!B10:B28)');
    s.getRange('S' + row2).setFormula(
      '=ARRAYFORMULA(IF(\'' + lm + '\'!B10:B28="","","دخل"))');
    s.getRange('T' + row2).setFormula('=ARRAYFORMULA(\'' + lm + '\'!C10:C28)');
    s.getRange('U' + row2).setFormula('=ARRAYFORMULA(\'' + lm + '\'!D10:D28)');
    s.getRange('V' + row2).setFormula(
      '=ARRAYFORMULA(\'' + lm + '\'!F10:F28*' + fx + ')');
    s.getRange('W' + row2).setFormula('=ARRAYFORMULA(\'' + lm + '\'!H10:H28)');
    row2 += 19;
  }
  for (var le = 0; le < MONTHS.length; le++) {
    var em = MONTHS[le];
    s.getRange('Q' + row2).setFormula(
      '=ARRAYFORMULA(IF(\'' + em + '\'!A33:A62="","","' + em + '"))');
    s.getRange('R' + row2).setFormula('=ARRAYFORMULA(\'' + em + '\'!A33:A62)');
    s.getRange('S' + row2).setFormula(
      '=ARRAYFORMULA(IF(\'' + em + '\'!A33:A62="","","مصروف"))');
    s.getRange('T' + row2).setFormula('=ARRAYFORMULA(\'' + em + '\'!B33:B62)');
    s.getRange('U' + row2).setFormula('=ARRAYFORMULA(\'' + em + '\'!C33:C62)');
    s.getRange('V' + row2).setFormula(
      '=ARRAYFORMULA(\'' + em + '\'!E33:E62*' + fx + ')');
    s.getRange('W' + row2).setFormula('=ARRAYFORMULA(\'' + em + '\'!G33:G62)');
    row2 += 30;
  }
}

function buildYearSum(monthName, dateCol, amtCol, startRow, endRow, yr, fx) {
  var dr = "'" + monthName + "'!" + dateCol + startRow + ':' + dateCol + endRow;
  var ar = "'" + monthName + "'!" + amtCol  + startRow + ':' + amtCol  + endRow;
  return '=IFERROR(SUMPRODUCT((IFERROR(YEAR(' + dr + '),0)=' + yr + ')*(' + ar + '))*' + fx + ',0)';
}

function buildCategoryYearSum(category, isExpense, yr, fx) {
  var dateCol = isExpense ? 'A' : 'B';
  var catCol  = isExpense ? 'B' : 'C';
  var amtCol  = isExpense ? 'E' : 'F';
  var sr = isExpense ? 33 : 10;
  var er = isExpense ? 62 : 28;
  var parts = [];
  for (var i = 0; i < MONTHS.length; i++) {
    var m = MONTHS[i];
    var dr = "'" + m + "'!" + dateCol + sr + ':' + dateCol + er;
    var cr = "'" + m + "'!" + catCol  + sr + ':' + catCol  + er;
    var ar = "'" + m + "'!" + amtCol  + sr + ':' + amtCol  + er;
    parts.push('SUMPRODUCT((IFERROR(YEAR(' + dr + '),0)=' + yr + ')*' +
               '(' + cr + '="' + category + '")*(' + ar + '))');
  }
  return '(IFERROR(' + parts.join('+') + ',0)*' + fx + ')';
}

// ============================================================================
// 11. DASHBOARD CHARTS V2
// ============================================================================
function buildDashboardChartsV2(ss) {
  var dash = ss.getSheetByName(SHEET_NAMES.dashboard);
  var eng  = ss.getSheetByName(SHEET_NAMES.engine);

  dash.getCharts().forEach(function(c){ dash.removeChart(c); });

  var darkAxis = {
    textStyle:      { color: T.fgPrimary, fontSize: 11, fontName: FONT },
    titleTextStyle: { color: T.fgPrimary, fontSize: 12, fontName: FONT },
    gridlines:      { color: T.gridline },
    minorGridlines: { color: T.gridline }
  };
  var darkLegend = function(pos) {
    return { position: pos, textStyle: { color: T.fgPrimary, fontSize: 11, fontName: FONT } };
  };

  dash.insertChart(
    dash.newChart().setChartType(Charts.ChartType.COLUMN)
      .addRange(eng.getRange('F1:G7'))
      .setPosition(15, 2, 0, 0)
      .setOption('useFirstColumnAsDomain', true)
      .setOption('backgroundColor', T.bgCard)
      .setOption('legend', { position:'none' })
      .setOption('hAxis', darkAxis).setOption('vAxis', darkAxis)
      .setOption('chartArea', { left:'15%', top:'8%', width:'80%', height:'80%' })
      .setOption('series', { 0: { color: T.netCyan } })
      .setOption('width', 420).setOption('height', 320).build()
  );

  dash.insertChart(
    dash.newChart().setChartType(Charts.ChartType.GAUGE)
      .addRange(eng.getRange('O1:O2'))
      .setPosition(15, 9, 0, 0)
      .setOption('min', 0).setOption('max', 100)
      .setOption('redFrom', 0).setOption('redTo', 39)
      .setOption('yellowFrom', 40).setOption('yellowTo', 69)
      .setOption('greenFrom', 70).setOption('greenTo', 100)
      .setOption('minorTicks', 5)
      .setOption('width', 400).setOption('height', 320).build()
  );

  dash.insertChart(
    dash.newChart().setChartType(Charts.ChartType.COMBO)
      .addRange(eng.getRange('A1:D13'))
      .setPosition(15, 16, 0, 0)
      .setOption('useFirstColumnAsDomain', true)
      .setOption('backgroundColor', T.bgCard)
      .setOption('legend', darkLegend('bottom'))
      .setOption('hAxis', darkAxis).setOption('vAxis', darkAxis)
      .setOption('chartArea', { left:'12%', top:'8%', width:'82%', height:'70%' })
      .setOption('seriesType', 'bars')
      .setOption('series', {
        0: { type:'bars', color: T.income },
        1: { type:'bars', color: T.expense },
        2: { type:'line', color: T.netCyan, lineWidth:3, pointSize:6 }
      })
      .setOption('width', 600).setOption('height', 320).build()
  );

  dash.insertChart(
    dash.newChart().setChartType(Charts.ChartType.PIE)
      .addRange(eng.getRange('I1:J9'))
      .setPosition(31, 2, 0, 0)
      .setOption('pieHole', 0.55)
      .setOption('backgroundColor', T.bgCard)
      .setOption('legend', darkLegend('right'))
      .setOption('chartArea', { left:'5%', top:'8%', width:'90%', height:'85%' })
      .setOption('colors', [
        T.income, T.paletteBlue, T.palettePurple, T.paletteOrange,
        T.paletteLime, T.netCyan, T.palettePink, T.fgMuted
      ])
      .setOption('pieSliceText', 'percentage')
      .setOption('pieSliceTextStyle', { color: T.white, fontSize: 11, bold: true, fontName: FONT })
      .setOption('pieSliceBorderColor', T.bgCard)
      .setOption('width', 660).setOption('height', 320).build()
  );

  dash.insertChart(
    dash.newChart().setChartType(Charts.ChartType.PIE)
      .addRange(eng.getRange('L1:M13'))
      .setPosition(31, 14, 0, 0)
      .setOption('pieHole', 0.55)
      .setOption('backgroundColor', T.bgCard)
      .setOption('legend', darkLegend('right'))
      .setOption('chartArea', { left:'5%', top:'8%', width:'90%', height:'85%' })
      .setOption('colors', DOUGHNUT_COLORS)
      .setOption('pieSliceText', 'percentage')
      .setOption('pieSliceTextStyle', { color: T.white, fontSize: 11, bold: true, fontName: FONT })
      .setOption('pieSliceBorderColor', T.bgCard)
      .setOption('width', 660).setOption('height', 320).build()
  );
}

// ============================================================================
// 12. WELCOME PAGE
// ============================================================================
function buildWelcomeV2(ss) {
  var s = getOrCreateSheet(ss, SHEET_NAMES.welcome);
  s.clear();

  s.getRange(1, 1, 50, 18).setFontFamily(FONT);
  s.getRange(1, 1, 50, 18).setBackground(T.bgPage).setFontColor(T.fgPrimary);
  for (var i = 1; i <= 50; i++) s.setRowHeight(i, 24);
  for (var j = 3; j <= 6; j++) s.setRowHeight(j, 56);

  mergeAndStyle(s, 'B3:Q6', 'SMARTBUDGET PRO 2026',
    { bg:T.bgCard, fg:T.fgPrimary, size:48, bold:true,
      align:'center', vAlign:'middle', wrap:true, fontFamily:FONT });
  s.getRange('B3:Q6').setBorder(true,true,true,true,false,false,
    T.glassBorder, SpreadsheetApp.BorderStyle.SOLID);

  mergeAndStyle(s, 'B8:Q9', 'Premium Arabic Fintech Template',
    { bg:T.bgPage, fg:T.fgMuted, size:24, align:'center', wrap:true, fontFamily:FONT });
  s.setRowHeight(8, 36); s.setRowHeight(9, 36);

  mergeAndStyle(s, 'B11:Q14',
    'محرك عملات متعدد، 12 ورقة شهرية، نظام أهداف وادخار، ' +
    'لوحة تحكم بنظام عابر للسنوات (Evergreen) مع تحويل عملات حي ' +
    'وعداد صحة مالية تفاعلي.',
    { bg:T.bgPage, fg:T.fgPrimary, size:16, align:'center', wrap:true, fontFamily:FONT });
  for (var b = 11; b <= 14; b++) s.setRowHeight(b, 28);

  var settings = ss.getSheetByName(SHEET_NAMES.settings);
  if (settings) {
    var gid = settings.getSheetId();
    mergeAndStyle(s, 'G16:L18', '',
      { bg:T.income, fg:T.white, size:20, bold:true,
        align:'center', vAlign:'middle', fontFamily:FONT });
    s.getRange('G16').setFormula(
      '=HYPERLINK("#gid=' + gid + '","🚀  Get Started - ابدأ الإعداد")');
    s.getRange('G16:L18').setBorder(true,true,true,true,false,false,
      T.income, SpreadsheetApp.BorderStyle.SOLID_THICK);
    for (var g = 16; g <= 18; g++) s.setRowHeight(g, 32);
  }

  var cards = [
    {id:'01', title:'اضبط الإعدادات أولا',
      body:'افتح ورقة الإعدادات واختر العملة الرئيسية وحدث أسعار الصرف.',
      target:SHEET_NAMES.settings, accent:T.netCyan, link:'📘 الإعدادات'},
    {id:'02', title:'أدخل بياناتك الشهرية',
      body:'افتح ورقة الشهر الحالي وأدخل المداخيل في A10:H28 والمصاريف في A33:G62.',
      target:'جانفي', accent:T.income, link:'📅 جانفي'},
    {id:'03', title:'افتح لوحة التحكم',
      body:'بعد الإدخال، افتح لوحة التحكم. اختر السنة والعملة في الأعلى.',
      target:SHEET_NAMES.dashboard, accent:T.paletteOrange, link:'📊 لوحة التحكم'}
  ];
  var cardCols = [['B','F'],['G','K'],['L','P']];
  for (var ci = 0; ci < cards.length; ci++) {
    var c = cards[ci];
    var cs = cardCols[ci][0], ce = cardCols[ci][1];
    s.getRange(cs + '21:' + ce + '34').setBackground(T.bgCard).setFontColor(T.fgPrimary)
      .setFontFamily(FONT)
      .setBorder(true,true,true,true,false,false, T.glassBorder, SpreadsheetApp.BorderStyle.SOLID);
    s.getRange(cs + '21:' + ce + '21').setBackground(c.accent);
    mergeAndStyle(s, cs + '22:' + ce + '23', c.id,
      { bg:T.bgCard, fg:c.accent, size:32, bold:true, align:'right', fontFamily:FONT });
    mergeAndStyle(s, cs + '24:' + ce + '25', c.title,
      { bg:T.bgCard, fg:T.fgPrimary, size:18, bold:true, align:'right', fontFamily:FONT });
    mergeAndStyle(s, cs + '26:' + ce + '32', c.body,
      { bg:T.bgCard, fg:T.fgMuted, size:16, align:'right', wrap:true, fontFamily:FONT });
    var tgt = ss.getSheetByName(c.target);
    if (tgt) {
      var tgid = tgt.getSheetId();
      mergeAndStyle(s, cs + '33:' + ce + '34', '', { bg:T.bgCard, align:'right' });
      s.getRange(cs + '33').setFormula(
        '=HYPERLINK("#gid=' + tgid + '","' + c.link + '")')
        .setFontColor(T.income).setFontSize(14).setFontFamily(FONT);
    }
  }

  s.getRange('B37:Q41').setBackground(T.bgCard).setFontColor(T.fgPrimary)
    .setFontFamily(FONT)
    .setBorder(true,true,true,true,false,false, T.glassBorder, SpreadsheetApp.BorderStyle.SOLID);
  mergeAndStyle(s, 'B37:Q38', '💎 Developed by: Boulahdid Djamal Eddine',
    { bg:T.bgCard, fg:T.fgPrimary, size:18, bold:true,
      align:'center', vAlign:'middle', fontFamily:FONT });
  mergeAndStyle(s, 'B39:Q40', '📩 boulahdiddjamaleddine@gmail.com',
    { bg:T.bgCard, fg:T.fgMuted, size:16, align:'center', vAlign:'middle', fontFamily:FONT });
  mergeAndStyle(s, 'B41:Q41', 'SMARTBUDGET PRO 2026 - v2.0',
    { bg:T.bgCard, fg:T.fgMuted, size:12, align:'center', fontFamily:FONT });
}

// ============================================================================
// 13. NAMED RANGES + VALIDATIONS
// ============================================================================
function defineNamedRangesAndValidations(ss) {
  var settings = ss.getSheetByName(SHEET_NAMES.settings);
  var set = function(name, a1) { ss.setNamedRange(name, settings.getRange(a1)); };

  set('rng_MainCurrency',     'B3');
  set('rng_ActiveFormat',     'B4');
  set('rng_MainRate',          'B5');
  set('rng_Currencies',       'A7:A20');
  set('rng_CurrencyNames',    'B7:B20');
  set('rng_CurrencyRates',    'C7:C20');
  set('rng_FormatStrings',    'D7:D20');
  set('rng_CurrencyTable',    'A7:D20');
  set('rng_IncomeCategories', 'F7:F14');
  set('rng_ExpenseCategories','G7:G18');
  set('rng_PaymentMethods',   'H7:H10');

  var incomeCatDv = SpreadsheetApp.newDataValidation()
    .requireValueInRange(ss.getRangeByName('rng_IncomeCategories'), true)
    .setAllowInvalid(false).build();
  var expenseCatDv = SpreadsheetApp.newDataValidation()
    .requireValueInRange(ss.getRangeByName('rng_ExpenseCategories'), true)
    .setAllowInvalid(false).build();
  var payDv = SpreadsheetApp.newDataValidation()
    .requireValueInRange(ss.getRangeByName('rng_PaymentMethods'), true)
    .setAllowInvalid(false).build();

  for (var i = 0; i < MONTHS.length; i++) {
    var s = ss.getSheetByName(MONTHS[i]);
    s.getRange('C10:C28').setDataValidation(incomeCatDv);
    s.getRange('B33:B62').setDataValidation(expenseCatDv);
    s.getRange('H10:H28').setDataValidation(payDv);
    s.getRange('G33:G62').setDataValidation(payDv);
  }
}

// ============================================================================
// 14. PROTECTION
// ============================================================================
function applyProtectionV2(ss) {
  ss.getSheetByName(SHEET_NAMES.engine).protect()
    .setDescription(WARN_ENGINE).setWarningOnly(true);
  ss.getSheetByName(SHEET_NAMES.fx).protect()
    .setDescription(WARN_ENGINE).setWarningOnly(true);

  var w = ss.getSheetByName(SHEET_NAMES.welcome);
  w.getRange('B3:Q6').protect().setDescription(WARN_BRANDING).setWarningOnly(true);
  w.getRange('B37:Q41').protect().setDescription(WARN_BRANDING).setWarningOnly(true);

  var d = ss.getSheetByName(SHEET_NAMES.dashboard);
  ['B6:E12','F6:I12','J6:M12','N6:Q12','R6:U12','V6:Y12',
   'B14:H28','I14:O28','P14:Y28','B30:M44','N30:Y44','B46:Y54'].forEach(function(rng) {
    d.getRange(rng).protect().setDescription(WARN_CALC).setWarningOnly(true);
  });

  var st = ss.getSheetByName(SHEET_NAMES.settings);
  var stProt = st.protect().setDescription(WARN_SETTINGS).setWarningOnly(true);
  stProt.setUnprotectedRanges([
    st.getRange('B3'),
    st.getRange('C7:C20'),
    st.getRange('F7:F14'),
    st.getRange('G7:G18'),
    st.getRange('H7:H10')
  ]);

  var g = ss.getSheetByName(SHEET_NAMES.goals);
  ['D7:D26','F7:F26','G7:G26','H7:H26','I7:I26'].forEach(function(rng) {
    g.getRange(rng).protect().setDescription(WARN_CALC).setWarningOnly(true);
  });

  for (var m = 0; m < MONTHS.length; m++) {
    var ms = ss.getSheetByName(MONTHS[m]);
    ['A1:H6','G10:G28','H33:H62','A29:H29','A63:H63'].forEach(function(rng) {
      ms.getRange(rng).protect().setDescription(WARN_CALC).setWarningOnly(true);
    });
  }
}

// ============================================================================
// 15. TAB ORDER
// ============================================================================
function reorderTabsV2(ss) {
  var order = [SHEET_NAMES.welcome, SHEET_NAMES.settings, SHEET_NAMES.goals]
    .concat(MONTHS)
    .concat([SHEET_NAMES.dashboard, SHEET_NAMES.engine, SHEET_NAMES.fx]);
  for (var i = 0; i < order.length; i++) {
    var sheet = ss.getSheetByName(order[i]);
    if (sheet) {
      ss.setActiveSheet(sheet);
      ss.moveActiveSheet(i + 1);
    }
  }
}

// ============================================================================
// 16. DEMO DATA FILLER
// ============================================================================
function fillAllMonthsWithDemoData() {
  var startTime = new Date();
  var ss = SpreadsheetApp.getActive();
  var totalI = 0, totalE = 0, processed = 0;

  Logger.log('=== Demo Data Filler ===');
  for (var mi = 0; mi < MONTHS.length; mi++) {
    var sheet = ss.getSheetByName(MONTHS[mi]);
    if (!sheet) { Logger.log('SKIP ' + MONTHS[mi]); continue; }
    var overspend = DEMO_OVERSPEND.indexOf(mi) >= 0;
    Logger.log('[' + (mi+1) + '/12] ' + MONTHS[mi] +
      (overspend ? ' OVERSPEND' : ''));
    totalI += demoFillIncome(sheet, mi, overspend);
    totalE += demoFillExpense(sheet, mi, overspend);
    processed++;
  }
  SpreadsheetApp.flush();
  var el = Math.round((new Date() - startTime) / 1000);
  Logger.log('DONE ' + el + 's. ' + totalI + ' income + ' + totalE + ' expense rows.');
  SpreadsheetApp.getUi().alert('تمت تعبئة البيانات التجريبية',
    processed + ' ورقة، ' + totalI + ' دخل + ' + totalE + ' مصاريف، ' + el + ' ث.',
    SpreadsheetApp.getUi().ButtonSet.OK);
}

function demoFillIncome(sheet, mi, overspend) {
  var drift = DEMO_DRIFT[mi];
  var rot = DEMO_INCOME_ROTATING;
  var rotating = [
    rot[(mi+0) % rot.length],
    rot[(mi+2) % rot.length],
    rot[(mi+4) % rot.length]
  ];
  var templates = DEMO_INCOME_FIXED.concat(rotating);
  var days = [3, 9, 15, 21, 27];
  var blockAF = [], blockH = [];
  for (var i = 0; i < 5; i++) {
    var t = templates[i];
    var date = new Date(2026, mi, days[i]);
    var expected = Math.round(t[3] * drift);
    var actual = Math.round(expected * (overspend ? 0.95 : 1.05));
    blockAF.push([t[0], date, t[1], t[2], expected, actual]);
    blockH.push([t[4]]);
  }
  sheet.getRange(10, 1, 5, 6).setValues(blockAF);
  sheet.getRange(10, 8, 5, 1).setValues(blockH);
  sheet.getRange(10, 2, 5, 1).setNumberFormat('[$-en-US]dd/mm/yyyy');
  sheet.getRange(10, 5, 5, 2).setNumberFormat('[$-en-US]#,##0');
  return 5;
}

function demoFillExpense(sheet, mi, overspend) {
  var drift = DEMO_DRIFT[mi];
  var rot = DEMO_EXPENSE_ROTATING;
  var rotating = [
    rot[(mi+0) % rot.length],
    rot[(mi+3) % rot.length]
  ];
  var templates = DEMO_EXPENSE_FIXED.concat(rotating);
  var days = [5, 11, 17, 23, 28];
  var blockAE = [], blockG = [];
  for (var i = 0; i < 5; i++) {
    var t = templates[i];
    var date = new Date(2026, mi, days[i]);
    var expected = Math.round(t[2] * drift);
    var actual = Math.round(expected * (overspend ? 1.15 : 0.95));
    blockAE.push([date, t[0], t[1], expected, actual]);
    blockG.push([t[3]]);
  }
  sheet.getRange(33, 1, 5, 5).setValues(blockAE);
  sheet.getRange(33, 7, 5, 1).setValues(blockG);
  sheet.getRange(33, 1, 5, 1).setNumberFormat('[$-en-US]dd/mm/yyyy');
  sheet.getRange(33, 4, 5, 2).setNumberFormat('[$-en-US]#,##0');
  return 5;
}

function clearAllDemoData() {
  var ui = SpreadsheetApp.getUi();
  var r = ui.alert('مسح البيانات التجريبية',
    'سيتم مسح صفوف A10:H14 و A33:G37 في كل الأشهر. متابعة؟',
    ui.ButtonSet.YES_NO);
  if (r !== ui.Button.YES) return;

  var ss = SpreadsheetApp.getActive();
  var cleared = 0;
  for (var mi = 0; mi < MONTHS.length; mi++) {
    var sheet = ss.getSheetByName(MONTHS[mi]);
    if (!sheet) continue;
    sheet.getRange(10, 1, 5, 6).clearContent();
    sheet.getRange(10, 8, 5, 1).clearContent();
    sheet.getRange(33, 1, 5, 5).clearContent();
    sheet.getRange(33, 7, 5, 1).clearContent();
    cleared++;
  }
  SpreadsheetApp.flush();
  ui.alert('تم المسح', cleared + ' ورقة.', ui.ButtonSet.OK);
}

// ============================================================================
// 17. MONTHLY VISUAL ANALYTICS
// ============================================================================
function addMonthlyVisualAnalytics() {
  var ss = SpreadsheetApp.getActive();
  var processed = 0;
  Logger.log('=== Monthly Visual Analytics ===');
  for (var mi = 0; mi < MONTHS.length; mi++) {
    var sheet = ss.getSheetByName(MONTHS[mi]);
    if (!sheet) continue;
    sheet.getCharts().forEach(function(c){ sheet.removeChart(c); });
    monthlyAnalyticsHelpers(sheet);
    monthlyAnalyticsColumnChart(sheet);
    monthlyAnalyticsDoughnut(sheet);
    Logger.log('[' + (mi+1) + '/12] ' + MONTHS[mi] + ' done');
    processed++;
  }
  SpreadsheetApp.flush();
  SpreadsheetApp.getUi().alert('تمت إضافة التحليل البصري',
    processed + ' ورقة، 2 مخطط لكل منها.',
    SpreadsheetApp.getUi().ButtonSet.OK);
}

function monthlyAnalyticsHelpers(s) {
  s.getRange('Q1:T1').setValues([['البيان','المداخيل','المصاريف','المدخرات']])
    .setFontWeight('bold').setBackground(T.glassBorder)
    .setFontColor(T.fgPrimary).setFontFamily(FONT);
  s.getRange('Q2').setValue('المداخيل').setFontFamily(FONT);
  s.getRange('R2').setFormula('=IFERROR(SUM(F10:F28),0)');
  s.getRange('Q3').setValue('المصاريف').setFontFamily(FONT);
  s.getRange('S3').setFormula('=IFERROR(SUM(E33:E62),0)');
  s.getRange('Q4').setValue('المدخرات').setFontFamily(FONT);
  s.getRange('T4').setFormula('=IFERROR(SUM(F10:F28)-SUM(E33:E62),0)');
  s.getRange('R2:T4').setNumberFormat('[$-en-US]#,##0');

  s.getRange('Q9:R9').setValues([['فئة المصاريف','الإجمالي']])
    .setFontWeight('bold').setBackground(T.glassBorder)
    .setFontColor(T.fgPrimary).setFontFamily(FONT);
  for (var i = 0; i < EXPENSE_CATEGORIES.length; i++) {
    var rn = 10 + i;
    s.getRange(rn, 17).setValue(EXPENSE_CATEGORIES[i]).setFontFamily(FONT);
    s.getRange(rn, 18).setFormula(
      '=IFERROR(SUMIF(B33:B62, Q' + rn + ', E33:E62), 0)');
  }
  s.getRange(10, 18, 12, 1).setNumberFormat('[$-en-US]#,##0');
}

function monthlyAnalyticsColumnChart(s) {
  var chart = s.newChart().setChartType(Charts.ChartType.COLUMN)
    .addRange(s.getRange('Q1:T4'))
    .setPosition(2, 9, 0, 0)
    .setOption('useFirstColumnAsDomain', true)
    .setOption('useFirstRowAsHeaders', true)
    .setOption('title', 'مقارنة الإجماليات الفعلية')
    .setOption('titleTextStyle', { color:'#000000', fontSize:14, bold:true, fontName: FONT })
    .setOption('legend', { position:'top', textStyle:{ color:'#000000', fontSize:11, fontName:FONT } })
    .setOption('backgroundColor', '#FFFFFF')
    .setOption('chartArea', { left:'14%', top:'22%', width:'80%', height:'62%' })
    .setOption('hAxis', { textStyle:{ color:'#000000', fontSize:11, fontName:FONT } })
    .setOption('vAxis', { textStyle:{ color:'#000000', fontSize:11, fontName:FONT }, format:'#,##0' })
    .setOption('series', { 0:{color:T.income}, 1:{color:T.expense}, 2:{color:T.netCyan} })
    .setOption('width', 480).setOption('height', 240).build();
  s.insertChart(chart);
}

function monthlyAnalyticsDoughnut(s) {
  var chart = s.newChart().setChartType(Charts.ChartType.PIE)
    .addRange(s.getRange('Q9:R21'))
    .setPosition(33, 9, 0, 0)
    .setOption('pieHole', 0.5)
    .setOption('title', 'توزيع المصاريف حسب الفئة')
    .setOption('titleTextStyle', { color:'#000000', fontSize:14, bold:true, fontName: FONT })
    .setOption('legend', { position:'right', textStyle:{ color:'#000000', fontSize:10, fontName:FONT } })
    .setOption('backgroundColor', '#FFFFFF')
    .setOption('chartArea', { left:'5%', top:'15%', width:'70%', height:'78%' })
    .setOption('colors', DOUGHNUT_COLORS)
    .setOption('pieSliceText', 'percentage')
    .setOption('pieSliceTextStyle', { color:'#FFFFFF', fontSize:10, bold:true, fontName: FONT })
    .setOption('width', 480).setOption('height', 280).build();
  s.insertChart(chart);
}

function removeMonthlyVisualAnalytics() {
  var ui = SpreadsheetApp.getUi();
  var r = ui.alert('إزالة التحليل البصري الشهري',
    'سيتم حذف المخططات والبيانات المساعدة من 12 ورقة. متابعة؟',
    ui.ButtonSet.YES_NO);
  if (r !== ui.Button.YES) return;

  var ss = SpreadsheetApp.getActive();
  var removed = 0;
  for (var mi = 0; mi < MONTHS.length; mi++) {
    var s = ss.getSheetByName(MONTHS[mi]);
    if (!s) continue;
    s.getCharts().forEach(function(c){ s.removeChart(c); });
    s.getRange('Q1:T21').clearContent();
    removed++;
  }
  SpreadsheetApp.flush();
  ui.alert('تمت الإزالة', removed + ' ورقة.', ui.ButtonSet.OK);
}

// ============================================================================
// 18. REPAIR
// ============================================================================
function repairDashboardV2() {
  var ss = SpreadsheetApp.getActive();
  buildDashboardEngineV2(ss);
  SpreadsheetApp.flush();
  buildDashboardChartsV2(ss);
  SpreadsheetApp.getUi().alert('تم الإصلاح',
    'أعيد بناء صيغ المحرك والرسوم البيانية.',
    SpreadsheetApp.getUi().ButtonSet.OK);
}
