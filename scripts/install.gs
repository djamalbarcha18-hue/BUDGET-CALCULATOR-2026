/**
 * BUDGET-CALCULATOR-2026 / نظام مالي ذكي متكامل
 * Single-click Google Apps Script installer - ENTRY POINT
 *
 * ARCHITECTURE (PR 1: structural refactor, zero behavior change)
 * --------------------------------------------------------------
 * The previous monolithic 905-line install.gs has been split into 14 focused
 * modules. All `.gs` files in an Apps Script project share a single global
 * scope, so cross-file function and constant references resolve without
 * imports. Numeric prefixes drive load order in the editor sidebar.
 *
 *   install.gs                <- THIS FILE: doc + installBudgetCalculator2026()
 *   00_constants.gs           <- T (theme), SHEET_NAMES, WARN_*
 *   01_seed_data.gs           <- CURRENCIES, INCOME_CATEGORIES,
 *                                EXPENSE_CATEGORIES, PAYMENT_METHODS,
 *                                MONTHS, GOALS_SEED
 *   10_lib_apps_script.gs     <- getOrCreateSheet, paintSheet, mergeAndStyle,
 *                                paintCard
 *   11_lib_formulas.gs        <- buildCategorySumFormula, buildAnnualSum,
 *                                buildTrendFormula
 *   20_phase1_settings.gs     <- buildSettings(ss)
 *   21_phase2_monthly.gs      <- buildMonth(ss, monthName)
 *   22_phase3_goals.gs        <- buildGoals(ss)
 *   23_phase4_engine.gs       <- buildDashboardEngine(ss)
 *   24_phase4_dashboard.gs    <- buildDashboard(ss)
 *   25_phase5_welcome.gs      <- buildWelcome(ss)
 *   30_named_ranges.gs        <- defineNamedRanges(ss)
 *   31_validations.gs         <- applyMonthlyValidations(ss)
 *   32_protection.gs          <- applyProtection(ss)
 *   33_tabs.gs                <- reorderTabs(ss)
 *
 * The generated workbook is byte-identical to the previous install.gs output.
 * No formulas, A1 references, sheet names, named ranges, or run order have
 * changed. PR 1 is a pure source-layout change.
 *
 * USAGE
 * -----
 * 1. Open https://sheets.new (a fresh empty Google Sheet)
 * 2. File -> Settings -> Locale = Saudi Arabia (or any Arabic locale)
 * 3. Extensions -> Apps Script
 * 4. Delete the placeholder `function myFunction() {}`
 * 5. Add the 14 module files (Apps Script editor: Files panel -> "+" -> Script):
 *    paste each `scripts/*.gs` file from this repository into a script of the
 *    same name (no `.gs` extension is needed in the editor). The `install.gs`
 *    contents replace the placeholder.
 * 6. Save (Ctrl+S), give the project any name
 * 7. From the function dropdown at the top, pick `installBudgetCalculator2026`
 * 8. Click Run. Authorize when Google prompts (the script needs permission to
 *    edit the active spreadsheet only).
 * 9. Wait ~30-60 seconds. A success alert will appear.
 * 10. Close the Apps Script tab and return to the sheet. You will land on the
 *    welcome tab `📖 دليل الاستخدام والترحيب`.
 *
 * (See scripts/README.md for the full module map and step-by-step screenshots.)
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
 */

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

  // Build in canonical order (settings first because everything else references it).
  buildSettings(ss);
  buildGoals(ss);
  for (let i = 0; i < MONTHS.length; i++) buildMonth(ss, MONTHS[i]);
  buildDashboardEngine(ss);
  buildDashboard(ss);
  buildWelcome(ss);

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
    'الخطوة الاختيارية المتبقية: أدرج الرسوم البيانية الخمسة في ورقة \"اللوحة الرئيسية والتقرير السنوي\" (Insert → Chart) كما هو موضح في docs/07_dashboard_architecture.md، الفقرات 4-5.',
    ui.ButtonSet.OK);
}
