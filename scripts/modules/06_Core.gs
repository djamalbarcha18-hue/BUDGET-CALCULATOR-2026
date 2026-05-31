/**
 * SMARTBUDGET PRO 2026 — Module 06: Core Entry Points
 * =============================================================================
 * User-facing entry points + the custom menu trigger:
 *   - onOpen                      Auto-fires on workbook open, builds the menu
 *   - installSmartBudgetPro2026   Main installer (orchestrates 02-04)
 *   - tryFullDemoSmartBudget      Install + fill demo + monthly charts
 *   - menuFreshDemo               Bulletproof one-click full demo
 *   - gotoWelcome / Dashboard / Settings / Goals  Navigation
 *   - runHealthCheck              System Health Center
 */

// ============================================================================
// MAIN INSTALLER
// ============================================================================
function installSmartBudgetPro2026(silent) {
  const startTime = new Date();
  const ss = SpreadsheetApp.getActive();
  const ui = SpreadsheetApp.getUi();

  const sheets = ss.getSheets();
  const nonEmpty = sheets.some(s => s.getLastRow() > 0 || s.getLastColumn() > 1);
  if (!silent && (sheets.length > 1 || nonEmpty)) {
    const r = ui.alert(
      'تحذير',
      'يبدو أن المصنف يحوي بيانات. الأوراق ذات الأسماء المتطابقة ستستبدل. متابعة؟',
      ui.ButtonSet.YES_NO);
    if (r !== ui.Button.YES) return;
  }

  Logger.log(`SMARTBUDGET PRO 2026 install started ${startTime.toISOString()}`);

  precreateAllSheetStubs(ss);                                        Logger.log('1/9 stubs created');
  buildSettings(ss);                                                 Logger.log('2/9 settings');
  buildGoals(ss);                                                    Logger.log('3/9 goals');
  MONTHS.forEach((m, i) => buildMonth(ss, m, i));                    Logger.log('4/9 12 monthly sheets');
  SpreadsheetApp.flush();

  buildFxRates(ss);                                                  Logger.log('5/9 fx');
  buildDashboardV2(ss);                                              Logger.log('6/9 dashboard layout');
  buildDashboardEngineV2(ss);                                        Logger.log('7/9 engine');
  buildWelcomeV2(ss);                                                Logger.log('8/9 welcome');

  defineNamedRangesAndValidations(ss);
  applyProtectionV2(ss);
  reorderTabsV2(ss);

  SpreadsheetApp.flush();
  buildDashboardChartsV2(ss);                                        Logger.log('9/9 charts');

  ss.getSheetByName(SHEET_NAMES.engine).hideSheet();
  ss.getSheetByName(SHEET_NAMES.fx).hideSheet();
  ss.setActiveSheet(ss.getSheetByName(SHEET_NAMES.welcome));

  const elapsed = Math.round((new Date() - startTime) / 1000);
  if (!silent) {
    ui.alert(
      'SMARTBUDGET PRO 2026 - تم التركيب',
      `تم تركيب ${4 + MONTHS.length} ورقة في ${elapsed} ثانية.\n\n` +
      'افتح "لوحة التحكم"، اختر السنة في B4 والعملة في D4.\n\n' +
      'دوال إضافية: fillAllMonthsWithDemoData, addMonthlyVisualAnalytics.',
      ui.ButtonSet.OK);
  }
  return elapsed;
}

// ============================================================================
// FULL DEMO (install + fill + analytics + refresh)
// ============================================================================
function tryFullDemoSmartBudget() {
  const startTime = new Date();
  const ui = SpreadsheetApp.getActive() ? SpreadsheetApp.getUi() : null;

  Logger.log('===== FULL DEMO START =====');
  Logger.log('Step 1/4: Installing workbook...');
  installSmartBudgetPro2026(true);

  Logger.log('Step 2/4: Filling demo data...');
  const demo = fillAllMonthsWithDemoData(true);

  Logger.log('Step 3/4: Adding monthly charts...');
  addMonthlyVisualAnalytics(true);

  Logger.log('Step 4/4: Refreshing dashboard engine + charts...');
  const ss = SpreadsheetApp.getActive();
  buildDashboardEngineV2(ss);
  SpreadsheetApp.flush();
  buildDashboardChartsV2(ss);

  ss.setActiveSheet(ss.getSheetByName(SHEET_NAMES.dashboard));

  const elapsed = Math.round((new Date() - startTime) / 1000);
  Logger.log(`===== FULL DEMO DONE in ${elapsed} seconds =====`);

  if (ui) {
    ui.alert(
      'SMARTBUDGET PRO 2026 - النسخة التجريبية جاهزة',
      'تم تركيب القالب بالكامل وتعبئته ببيانات تجريبية:\n\n' +
      '• 12 ورقة شهرية (جانفي - ديسمبر)\n' +
      `• ${demo.income} صف دخل + ${demo.expense} صف مصاريف\n` +
      '• 4 أهداف ادخار في حالات مختلفة\n' +
      '• لوحة تحكم بـ 6 بطاقات KPI + 5 رسوم بيانية\n' +
      '• مخططات شهرية داخل كل ورقة\n' +
      '• محرك تحويل عملات (USD/EUR/SAR/DZD/...)\n\n' +
      `استغرق التنفيذ ${elapsed} ثانية.\n\n` +
      'الآن: في "لوحة التحكم" غير السنة (B4) والعملة (D4) لرؤية ' +
      'التحديث اللحظي.\n\n' +
      'لاحقا: clearAllDemoData لمسح البيانات التجريبية وبدء الاستخدام الفعلي.',
      ui.ButtonSet.OK);
  }
}

// ============================================================================
// CUSTOM MENU (auto-loads on workbook open)
// ============================================================================
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('💎 SmartBudget')
    .addItem('🚀 تجربة القالب بالبيانات التجريبية', 'menuFreshDemo')
    .addSeparator()
    .addSubMenu(ui.createMenu('🔀 التنقل السريع')
      .addItem('🏠 صفحة الترحيب', 'gotoWelcome')
      .addItem('📊 لوحة التحكم', 'gotoDashboard')
      .addItem('💰 الإعدادات', 'gotoSettings')
      .addItem('🎯 الأهداف', 'gotoGoals'))
    .addSeparator()
    .addItem('🩺 فحص صحة النظام', 'runHealthCheck')
    .addItem('♻️ إعادة بناء اللوحة', 'repairDashboardV2')
    .addSeparator()
    .addItem('📥 تعبئة بيانات تجريبية', 'fillAllMonthsWithDemoData')
    .addItem('🧹 مسح البيانات التجريبية', 'clearAllDemoData')
    .addSeparator()
    .addItem('⚠️ إعادة الضبط الكامل', 'resetWorkbookCompletely')
    .addItem('🛠️ إعادة التثبيت', 'installSmartBudgetPro2026')
    .addToUi();
}

/**
 * Bulletproof one-click demo: nuclearReset first, then full demo.
 * Cannot fail on re-run because state always starts clean.
 */
function menuFreshDemo() {
  const ui = SpreadsheetApp.getUi();
  const r = ui.alert(
    'تجربة القالب بالبيانات التجريبية',
    'سيتم مسح أي بيانات حالية في المصنف ثم بناء النموذج التجريبي الكامل.\n\n' +
    'الوقت المتوقع: 60-90 ثانية. متابعة؟',
    ui.ButtonSet.YES_NO);
  if (r !== ui.Button.YES) return;

  Logger.log('Fresh demo: nuclear reset...');
  nuclearReset(SpreadsheetApp.getActive());

  Logger.log('Fresh demo: running tryFullDemoSmartBudget...');
  tryFullDemoSmartBudget();
}

// ----------------------------------------------------------------------------
// Navigation shortcuts
// ----------------------------------------------------------------------------
function gotoWelcome()   { _gotoSheet(SHEET_NAMES.welcome); }
function gotoDashboard() { _gotoSheet(SHEET_NAMES.dashboard); }
function gotoSettings()  { _gotoSheet(SHEET_NAMES.settings); }
function gotoGoals()     { _gotoSheet(SHEET_NAMES.goals); }

// ============================================================================
// SYSTEM HEALTH CENTER
// ============================================================================
function runHealthCheck() {
  const ss = SpreadsheetApp.getActive();
  const checks = { passes: [], warnings: [], errors: [] };

  Logger.log(`=== Health Check START ${new Date().toISOString()} ===`);

  // Check 1: All expected sheets present
  const expected = [
    SHEET_NAMES.welcome, SHEET_NAMES.settings, SHEET_NAMES.goals,
    SHEET_NAMES.dashboard, SHEET_NAMES.engine, SHEET_NAMES.fx,
    ...MONTHS
  ];
  const missing = expected.filter(name => !ss.getSheetByName(name));
  if (missing.length === 0) {
    checks.passes.push('17 ورقة موجودة');
  } else {
    checks.errors.push(`أوراق ناقصة (${missing.length}): ${missing.join('، ')}`);
  }

  // Check 2: Named ranges
  const existingNames = ss.getNamedRanges().map(n => n.getName());
  const missingNames = EXPECTED_NAMED_RANGES.filter(n => existingNames.indexOf(n) < 0);
  if (missingNames.length === 0) {
    checks.passes.push('11 نطاق مسمى موجود');
  } else {
    checks.errors.push(`نطاقات ناقصة: ${missingNames.join('، ')}`);
  }

  // Check 3: Dashboard charts
  const dash = ss.getSheetByName(SHEET_NAMES.dashboard);
  if (dash) {
    const nCharts = dash.getCharts().length;
    if (nCharts >= 5)      checks.passes.push(`${nCharts} رسم بياني على لوحة التحكم`);
    else if (nCharts > 0)  checks.warnings.push(`عدد الرسوم البيانية ناقص: ${nCharts}/5`);
    else                   checks.errors.push('لا توجد رسوم بيانية على لوحة التحكم');
  }

  // Check 4: Critical formulas — settings B4 (XLOOKUP)
  const settings = ss.getSheetByName(SHEET_NAMES.settings);
  if (settings) {
    const f = settings.getRange('B4').getFormula();
    if (f.indexOf('XLOOKUP') >= 0) checks.passes.push('صيغة العملة النشطة (XLOOKUP) سليمة');
    else                            checks.errors.push('صيغة الإعدادات B4 محذوفة أو معطلة');
  }

  // Check 5: FX engine
  const fx = ss.getSheetByName(SHEET_NAMES.fx);
  if (fx) {
    const fxF = fx.getRange('B2').getFormula();
    if (fxF.indexOf('GOOGLEFINANCE') >= 0) {
      checks.passes.push('محرك العملات الحي (GOOGLEFINANCE) متصل');
    } else {
      checks.warnings.push('محرك العملات يستخدم أسعار ثابتة فقط');
    }
  }

  // Check 6: Engine protection
  const engine = ss.getSheetByName(SHEET_NAMES.engine);
  if (engine) {
    const prots = engine.getProtections(SpreadsheetApp.ProtectionType.SHEET);
    if (prots.length > 0) checks.passes.push('ورقة المحرك محمية');
    else                  checks.warnings.push('ورقة المحرك غير محمية - بيانات حساسة معرضة');
  }

  // Check 7: Monthly validations (sample first 3 months)
  let withValidation = 0;
  for (let m = 0; m < Math.min(3, MONTHS.length); m++) {
    const ms = ss.getSheetByName(MONTHS[m]);
    if (ms && ms.getRange('C10').getDataValidation()) withValidation++;
  }
  if (withValidation === 3) {
    checks.passes.push('قوائم الفئات (dropdown) نشطة على الأوراق الشهرية');
  } else {
    checks.warnings.push(`قواعد التحقق ناقصة: ${withValidation}/3 ورقة فحصت`);
  }

  // Check 8: Dashboard year + currency selectors
  if (dash) {
    const b4 = dash.getRange('B4').getValue();
    const d4 = dash.getRange('D4').getValue();
    if (b4 && d4) checks.passes.push(`محددات السنة (${b4}) والعملة (${d4}) مضبوطة`);
    else          checks.warnings.push('محددات السنة أو العملة فارغة على لوحة التحكم');
  }

  // Build report
  const ts = new Date().toLocaleString('ar-DZ');
  let report = `🩺 تقرير صحة النظام\nوقت الفحص: ${ts}\n═══════════════════════════\n\n`;

  if (checks.errors.length > 0) {
    report += `🔴 أخطاء حرجة (${checks.errors.length})\n`;
    checks.errors.forEach(e => { report += `  • ${e}\n`; });
    report += '\n';
  }
  if (checks.warnings.length > 0) {
    report += `🟡 تحذيرات (${checks.warnings.length})\n`;
    checks.warnings.forEach(w => { report += `  • ${w}\n`; });
    report += '\n';
  }
  if (checks.passes.length > 0) {
    report += `✅ يعمل بشكل صحيح (${checks.passes.length})\n`;
    checks.passes.forEach(p => { report += `  • ${p}\n`; });
    report += '\n';
  }

  report += '═══════════════════════════\n';
  if (checks.errors.length > 0) {
    report += 'موصى به: قائمة SmartBudget → إعادة بناء اللوحة\n';
    report += 'إن استمرت المشاكل: قائمة SmartBudget → إعادة الضبط الكامل';
  } else if (checks.warnings.length > 0) {
    report += 'النظام يعمل، لكن راجع التحذيرات أعلاه';
  } else {
    report += '🎉 النظام في حالة ممتازة';
  }

  Logger.log(report);
  Logger.log('=== Health Check DONE ===');

  SpreadsheetApp.getUi().alert('فحص صحة النظام', report,
    SpreadsheetApp.getUi().ButtonSet.OK);
}
