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
      t('common.warningTitle'),
      t('install.preflight'),
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
      t('install.successTitle'),
      t('install.successBody', { sheets: 4 + MONTHS.length, secs: elapsed }),
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
      t('demo.readyTitle'),
      t('demo.readyBody', { income: demo.income, expense: demo.expense, secs: elapsed }),
      ui.ButtonSet.OK);
  }
}

// ============================================================================
// CUSTOM MENU (auto-loads on workbook open)
// ============================================================================
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu(t('menu.title'))
    .addItem(t('menu.freshDemo'), 'menuFreshDemo')
    .addSeparator()
    .addSubMenu(ui.createMenu(t('menu.navSubmenu'))
      .addItem(t('menu.navWelcome'),   'gotoWelcome')
      .addItem(t('menu.navDashboard'), 'gotoDashboard')
      .addItem(t('menu.navSettings'),  'gotoSettings')
      .addItem(t('menu.navGoals'),     'gotoGoals'))
    .addSubMenu(ui.createMenu(t('menu.langSubmenu'))
      .addItem(t('menu.langArabic'),  'setLanguageAr')
      .addItem(t('menu.langEnglish'), 'setLanguageEn'))
    .addSeparator()
    .addItem(t('menu.onboarding'),       'menuOpenOnboarding')
    .addSubMenu(ui.createMenu(t('menu.notifications'))
      .addItem(t('menu.checkAlertsNow'),       'menuShowNotifications')
      .addItem(t('menu.notificationSettings'), 'menuToggleAutoCheck'))
    .addItem(t('menu.healthCheck'),     'runHealthCheck')
    .addItem(t('menu.verifyFormulas'),  'menuVerifyFormulaIntegrity')
    .addItem(t('menu.autoRepair'),      'menuAutoRepairFormulas')
    .addItem(t('menu.repairDashboard'), 'repairDashboardV2')
    .addSeparator()
    .addSubMenu(ui.createMenu(t('menu.exportSubmenu'))
      .addItem(t('menu.exportMonth'),     'exportMonthAsPdf')
      .addItem(t('menu.exportDashboard'), 'exportDashboardAsPdf')
      .addItem(t('menu.exportAnnual'),    'exportAnnualReport'))
    .addSeparator()
    .addItem(t('menu.fillDemo'),  'fillAllMonthsWithDemoData')
    .addItem(t('menu.clearDemo'), 'clearAllDemoData')
    .addSeparator()
    .addItem(t('menu.reset'),     'resetWorkbookCompletely')
    .addItem(t('menu.reinstall'), 'installSmartBudgetPro2026')
    .addToUi();

  // First-open auto-suggestion for the onboarding wizard.
  // Wrapped in try/catch inside the helper itself so any failure is silent —
  // we never want a bad property read to block onOpen.
  maybePromptOnboarding();

  // Phase 6: Smart Notifications auto-check on workbook open.
  // Internally guarded — silent if no alerts, anti-spammed per session,
  // user-toggleable from the notifications submenu.
  autoCheckOnOpen();
}

// ============================================================================
// LANGUAGE SWITCHING
// ----------------------------------------------------------------------------
// Persists the choice to PropertiesService so it survives across sessions,
// then rebuilds:
//   1. The Welcome sheet (hero, sub-tagline, body, CTA, cards, signature)
//   2. The custom menu itself (so menu items appear in the new language)
//
// IMPORTANT — what is NOT translated:
//   - Monthly tab names (جانفي, فيفري, ...) — these strings are interpolated
//     into 80+ cross-sheet formulas. Renaming them at runtime would require
//     a full workbook reinstall and would break existing data references.
//   - Sheet column headers, KPI labels, category names — these are seeded
//     into cells as plain values during install; switching them after the
//     fact would require a full sheet rebuild and would discard user data.
//
// What IS translated by this command:
//   - All alert dialogs (preflight, success, errors, prompts)
//   - All custom menu items
//   - All Logger.log messages
//   - The Welcome page in full (it has no user data, so safe to rebuild)
//   - The System Health Check report
// ============================================================================
function setLanguageAr() { _switchLanguage('ar'); }
function setLanguageEn() { _switchLanguage('en'); }

function _switchLanguage(lang) {
  setActiveLang(lang);
  const ss = SpreadsheetApp.getActive();

  // Rebuild the welcome page so its visible content reflects the new language.
  // Welcome is purely decorative/onboarding — no user data, safe to rebuild.
  if (ss.getSheetByName(SHEET_NAMES.welcome)) {
    buildWelcomeV2(ss);
  }

  // Rebuild the custom menu so its labels reflect the new language.
  onOpen();

  SpreadsheetApp.flush();

  // Confirmation alert — already in the new language (t() reads getActiveLang).
  const title = lang === 'ar' ? 'تم تغيير اللغة' : 'Language changed';
  const body  = lang === 'ar'
    ? 'تم تحديث جميع نصوص الواجهة وصفحة الترحيب. ' +
      'ملاحظة: أسماء الأوراق الشهرية (جانفي ... ديسمبر) وعناوين الأعمدة ' +
      'تبقى كما هي لأنها مرتبطة بصيغ المصنف. إعادة التثبيت الكامل ' +
      'تستبدلها عبر إعادة البناء.'
    : 'All UI text and the Welcome page have been updated. ' +
      'Note: monthly tab names and column headers stay in their original ' +
      'language because they are referenced by 80+ workbook formulas. ' +
      'A full reinstall replaces them via complete rebuild.';
  SpreadsheetApp.getUi().alert(title, body, SpreadsheetApp.getUi().ButtonSet.OK);
}

/**
 * Bulletproof one-click demo: nuclearReset first, then full demo.
 * Cannot fail on re-run because state always starts clean.
 */
function menuFreshDemo() {
  const ui = SpreadsheetApp.getUi();
  const r = ui.alert(
    t('demo.menuPromptTitle'),
    t('demo.menuPromptBody'),
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
    checks.passes.push(t('health.sheetsOK'));
  } else {
    checks.errors.push(t('health.sheetsMissing', { n: missing.length, list: missing.join('، ') }));
  }

  // Check 2: Named ranges
  const existingNames = ss.getNamedRanges().map(n => n.getName());
  const missingNames = EXPECTED_NAMED_RANGES.filter(n => existingNames.indexOf(n) < 0);
  if (missingNames.length === 0) {
    checks.passes.push(t('health.namesOK'));
  } else {
    checks.errors.push(t('health.namesMissing', { list: missingNames.join('، ') }));
  }

  // Check 3: Dashboard charts
  const dash = ss.getSheetByName(SHEET_NAMES.dashboard);
  if (dash) {
    const nCharts = dash.getCharts().length;
    if (nCharts >= 5)      checks.passes.push(t('health.chartsOK', { n: nCharts }));
    else if (nCharts > 0)  checks.warnings.push(t('health.chartsPartial', { n: nCharts }));
    else                   checks.errors.push(t('health.chartsNone'));
  }

  // Check 4: Critical formulas — settings B4 (XLOOKUP)
  const settings = ss.getSheetByName(SHEET_NAMES.settings);
  if (settings) {
    const f = settings.getRange('B4').getFormula();
    if (f.indexOf('XLOOKUP') >= 0) checks.passes.push(t('health.formulaB4OK'));
    else                            checks.errors.push(t('health.formulaB4Bad'));
  }

  // Check 5: FX engine
  const fx = ss.getSheetByName(SHEET_NAMES.fx);
  if (fx) {
    const fxF = fx.getRange('B2').getFormula();
    if (fxF.indexOf('GOOGLEFINANCE') >= 0) checks.passes.push(t('health.fxLive'));
    else                                    checks.warnings.push(t('health.fxFallback'));
  }

  // Check 6: Engine protection
  const engine = ss.getSheetByName(SHEET_NAMES.engine);
  if (engine) {
    const prots = engine.getProtections(SpreadsheetApp.ProtectionType.SHEET);
    if (prots.length > 0) checks.passes.push(t('health.engineProtected'));
    else                  checks.warnings.push(t('health.engineExposed'));
  }

  // Check 7: Monthly validations (sample first 3 months)
  let withValidation = 0;
  for (let m = 0; m < Math.min(3, MONTHS.length); m++) {
    const ms = ss.getSheetByName(MONTHS[m]);
    if (ms && ms.getRange('C10').getDataValidation()) withValidation++;
  }
  if (withValidation === 3) checks.passes.push(t('health.validationsOK'));
  else                       checks.warnings.push(t('health.validationsBad', { n: withValidation }));

  // Check 8: Dashboard year + currency selectors
  if (dash) {
    const year     = dash.getRange('B4').getValue();
    const currency = dash.getRange('D4').getValue();
    if (year && currency) checks.passes.push(t('health.selectorsOK', { year, currency }));
    else                  checks.warnings.push(t('health.selectorsEmpty'));
  }

  // Check 9 (Phase 3): Formula integrity via the manifest
  // Lightweight summary — if anything is wrong, point user at the dedicated
  // Verify Formula Integrity menu item for the full report.
  try {
    const integrity = verifyFormulaIntegrity();
    const issues = integrity.missing.length + integrity.altered.length;
    if (issues === 0) {
      checks.passes.push(`✅ سلامة الصيغ (${integrity.total} صيغة سليمة)`);
    } else {
      checks.errors.push(`🔧 ${issues} صيغة تحتاج إصلاح — استخدم "إصلاح تلقائي للصيغ"`);
    }
  } catch (e) {
    Logger.log(`Manifest check skipped: ${e}`);
  }

  // Build report (header + sections + footer)
  const ts = new Date().toLocaleString('ar-DZ');
  let report = t('health.header', { timestamp: ts });

  if (checks.errors.length > 0) {
    report += t('health.sectionErrors', { n: checks.errors.length });
    checks.errors.forEach(e => { report += `  • ${e}\n`; });
    report += '\n';
  }
  if (checks.warnings.length > 0) {
    report += t('health.sectionWarnings', { n: checks.warnings.length });
    checks.warnings.forEach(w => { report += `  • ${w}\n`; });
    report += '\n';
  }
  if (checks.passes.length > 0) {
    report += t('health.sectionPasses', { n: checks.passes.length });
    checks.passes.forEach(p => { report += `  • ${p}\n`; });
    report += '\n';
  }

  report += t('health.footer');
  if      (checks.errors.length > 0)   report += t('health.remedyErrors');
  else if (checks.warnings.length > 0) report += t('health.remedyWarnings');
  else                                  report += t('health.remedyHealthy');

  Logger.log(report);
  Logger.log('=== Health Check DONE ===');

  SpreadsheetApp.getUi().alert(t('health.reportTitle'), report,
    SpreadsheetApp.getUi().ButtonSet.OK);
}
