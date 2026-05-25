/**
 * BUDGET-CALCULATOR-2026 - Final dashboard visuals engine
 * =======================================================
 *
 * Public:
 *   automateDashboardVisuals()         - runnable from menu / button / dropdown
 *   automateDashboardVisualsCore_(ss)  - silent core, returns structured report
 *
 * Charts injected (clean 3-cell grid, no overlap)
 * -----------------------------------------------
 *   1. Vertical Column chart  | top row    | B11:M26  | rng_dash_annual_columns
 *        - Series 0 (Income)   = T.accentIncome  = #10B981 (green)
 *        - Series 1 (Expense)  = T.accentExpense = #DC2626 (red)
 *        - Series 2 (Savings)  = T.accentNet     = #06B6D4 (sky blue)
 *   2. Income doughnut        | bottom-left  | B29:G44 | rng_dash_doughnut_income
 *   3. Expense doughnut       | bottom-right | H29:M44 | rng_dash_doughnut_expense
 *
 * Idempotent / safe to re-run
 * ---------------------------
 *   - Step 1 deletes every existing chart on the dashboard sheet, so duplicates
 *     are impossible.
 *   - Step 2 ensures every named range required by the chart builders exists,
 *     auto-creating `rng_dash_annual_columns` (engine!A1:D13) if missing.
 *   - Step 3 builds the three charts INDEPENDENTLY inside three try/catch
 *     blocks. A failure in one chart cannot abort the others.
 *
 * Anti-collision design
 * ---------------------
 * Apps Script puts every .gs file in one shared global scope (this is what
 * caused the DASH_THEME SyntaxError two turns ago). Every top-level const here
 * is prefixed `ADV_`; shared symbols from install.gs (`T`, `SHEET_NAMES`) are
 * accessed via the `typeof X !== 'undefined' ? X : <fallback>` pattern. Result:
 * this file works alongside install.gs AND as a standalone drop-in.
 *
 * Linking to a one-click button
 * -----------------------------
 * See the README block at the bottom of this file (after the code).
 */

// =============================================================================
// LOCAL CONSTANTS  (ADV_ prefix prevents any collision with install.gs)
// =============================================================================

/**
 * Theme palette resolver. Prefers `T` from install.gs (single source of truth),
 * falls back to the bundled values otherwise so this file is also usable as
 * a standalone drop-in. We expose a getter rather than a top-level const
 * because `T` may be defined LATER in the global scope at parse time, depending
 * on .gs file load order.
 */
function ADV_theme_() {
  if (typeof T !== 'undefined' && T && T.bgCard) {
    return {
      bgPage:         T.bgPage,
      bgCard:         T.bgCard,
      fgPrimary:      T.fgPrimary,
      fgMuted:        T.fgMuted,
      gridline:       T.gridline,
      accentIncome:   T.accentIncome,    // #10B981 (green)
      accentExpense:  T.accentExpense,   // #DC2626 (red)
      accentSavings:  T.accentNet,       // #06B6D4 (sky blue) - mapped from accentNet
      slicePalette: [
        T.paletteOrange, T.paletteBlue, T.palettePurple, T.palettePink,
        T.accentIncome,  T.gaugeAmber,  T.accentNet,     T.gaugeLightGreen,
      ],
    };
  }
  // Fallback - mirrors data/dashboard/theme_palette.csv exactly.
  return {
    bgPage:         '#0F172A',
    bgCard:         '#1F2937',
    fgPrimary:      '#F1F5F9',
    fgMuted:        '#94A3B8',
    gridline:       '#334155',
    accentIncome:   '#10B981',
    accentExpense:  '#DC2626',
    accentSavings:  '#06B6D4',
    slicePalette: [
      '#F97316', '#3B82F6', '#8B5CF6', '#EC4899',
      '#10B981', '#F59E0B', '#06B6D4', '#84CC16',
    ],
  };
}

/**
 * Dashboard sheet resolution candidates - canonical name from install.gs first,
 * historical short form as a fallback so this works on legacy workbooks.
 */
const ADV_DASHBOARD_NAME_CANDIDATES = [
  (typeof SHEET_NAMES !== 'undefined' && SHEET_NAMES.dashboard)
    ? SHEET_NAMES.dashboard
    : 'اللوحة الرئيسية والتقرير السنوي',
  'اللوحة الرئيسية',                                // legacy short form
];

/** Hidden engine sheet that backs every chart's data source. */
const ADV_ENGINE_SHEET_NAME = (typeof SHEET_NAMES !== 'undefined' && SHEET_NAMES.engine)
  ? SHEET_NAMES.engine
  : '_DashboardEngine';

/** Required named ranges. Bar/columns range is auto-created if absent. */
const ADV_NR = {
  doughnutIncome:  'rng_dash_doughnut_income',     // engine!I1:J9
  doughnutExpense: 'rng_dash_doughnut_expense',    // engine!L1:M13
  annualColumns:   'rng_dash_annual_columns',      // engine!A1:D13 (auto-created)
};

// =============================================================================
// PUBLIC ENTRY POINT
// =============================================================================
/**
 * Run from the Apps Script function dropdown, a custom menu item, or a
 * drawing-based button on the dashboard. Wraps the silent core in try/catch
 * and surfaces a single Arabic UI alert summarising the result.
 */
function automateDashboardVisuals() {
  const ui = SpreadsheetApp.getUi();

  let result;
  try {
    result = automateDashboardVisualsCore_(SpreadsheetApp.getActive());
  } catch (err) {
    Logger.log('automateDashboardVisuals: fatal: ' +
      (err && err.stack ? err.stack : err));
    ui.alert(
      'فشل تنفيذ أتمتة الرسوم البيانية',
      (err && err.message) ? err.message : String(err),
      ui.ButtonSet.OK);
    return;
  }

  // Arabic UI alert from the structured report.
  const lines = [
    'تمت إزالة ' + result.removed + ' رسم(ة) موجود(ة) سابقاً.',
    '',
    'تمّ إنشاء ' + result.built.length + ' رسم(ات) بنجاح:',
  ];
  result.built.forEach(function (label) { lines.push('  • ' + label); });

  if (result.failed.length) {
    lines.push('');
    lines.push('تعذّر إنشاء ' + result.failed.length + ' رسم(ات):');
    result.failed.forEach(function (f) {
      lines.push('  • ' + f.label + ': ' + f.error);
    });
    lines.push('');
    lines.push('راجع View -> Logs في محرّر Apps Script لمزيد من التفاصيل.');
  }

  ui.alert(
    result.failed.length ? 'تمّ التنفيذ مع تحفّظات' : 'تمّ تركيب الرسوم البيانية بنجاح',
    lines.join('\n'),
    ui.ButtonSet.OK);
}

// =============================================================================
// SILENT CORE
// =============================================================================
/**
 * Performs the full chart-rebuild pipeline and returns a structured result.
 * Throws ONLY on unrecoverable preconditions (missing dashboard sheet);
 * per-chart failures are collected in `result.failed` and the others continue.
 *
 * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} ss
 * @return {{
 *   removed: number,
 *   built:   string[],
 *   failed:  Array<{label:string, error:string}>
 * }}
 */
function automateDashboardVisualsCore_(ss) {
  // STEP 1 - Resolve the dashboard sheet (throws on failure).
  const sheet = ADV_resolveDashboardSheet_(ss);

  // STEP 2 - Cleanup: remove every existing chart on the dashboard sheet.
  const removed = ADV_clearAllCharts_(sheet);

  // STEP 3 - Make sure every named range the charts depend on exists.
  ADV_ensureAnnualColumnsRange_(ss);

  // STEP 4 - Build the three charts INDEPENDENTLY. Each in its own try/catch
  // so one failure does not block the rest. Order: column on top, then the
  // two doughnuts side-by-side - matches the visual grid layout below.
  const theme = ADV_theme_();
  const results = [
    ADV_buildAnnualColumnChart_(sheet, ss, theme),
    ADV_buildIncomeDoughnut_(sheet, ss, theme),
    ADV_buildExpenseDoughnut_(sheet, ss, theme),
  ];

  return {
    removed: removed,
    built:   results.filter(function (r) { return  r.ok; }).map(function (r) { return r.label; }),
    failed:  results.filter(function (r) { return !r.ok; }).map(function (r) {
      return { label: r.label, error: r.error };
    }),
  };
}

// =============================================================================
// PHASE 1 - SHEET RESOLUTION
// =============================================================================
/**
 * Tries each name in ADV_DASHBOARD_NAME_CANDIDATES (canonical first), then
 * the active sheet if its name starts with 'اللوحة'. Throws an Arabic error
 * if nothing matches.
 */
function ADV_resolveDashboardSheet_(ss) {
  for (var i = 0; i < ADV_DASHBOARD_NAME_CANDIDATES.length; i++) {
    var s = ss.getSheetByName(ADV_DASHBOARD_NAME_CANDIDATES[i]);
    if (s) return s;
  }
  var active = ss.getActiveSheet();
  if (active && active.getName().indexOf('اللوحة') === 0) return active;

  throw new Error('لم يتم العثور على ورقة اللوحة الرئيسية. ' +
    'تأكّد من أنّ اسم الورقة هو \"' + ADV_DASHBOARD_NAME_CANDIDATES[0] + '\" ' +
    'أو فعّلها قبل تشغيل الدالة.');
}

// =============================================================================
// PHASE 2 - CLEANUP
// =============================================================================
/**
 * Deletes every chart currently embedded in the sheet. Idempotent: safe to
 * call any number of times; returns the count for the UI summary.
 */
function ADV_clearAllCharts_(sheet) {
  var charts = sheet.getCharts();
  charts.forEach(function (chart) { sheet.removeChart(chart); });
  return charts.length;
}

// =============================================================================
// PHASE 3 - NAMED RANGE WIRING
// =============================================================================
/**
 * Ensures `rng_dash_annual_columns` exists. Source: `_DashboardEngine!A1:D13`,
 * which is months (col A) + income (B) + expense (C) + savings/net (D).
 * Idempotent: if the range already exists pointing anywhere, we leave it alone
 * (the user might have customised it).
 */
function ADV_ensureAnnualColumnsRange_(ss) {
  if (ss.getRangeByName(ADV_NR.annualColumns)) return;     // already wired
  var engine = ss.getSheetByName(ADV_ENGINE_SHEET_NAME);
  if (!engine) {
    Logger.log('ADV_ensureAnnualColumnsRange_: engine sheet "' +
      ADV_ENGINE_SHEET_NAME + '" not found - skipping. The column chart ' +
      'builder will report a clear error to the user.');
    return;
  }
  ss.setNamedRange(ADV_NR.annualColumns, engine.getRange('A1:D13'));
}

/**
 * Returns the Range object for a named range, or throws an Arabic error.
 * Centralised so every chart builder reports missing ranges identically.
 */
function ADV_requireRange_(ss, name) {
  var r = ss.getRangeByName(name);
  if (!r) {
    throw new Error('النطاق المُسمّى \"' + name + '\" غير معرَّف. ' +
      'شغّل المُركِّب الرئيسي أو دالة repairDashboard2026 أوّلاً.');
  }
  return r;
}

// =============================================================================
// PHASE 4a - SHARED THEME APPLICATOR
// =============================================================================
/**
 * Applies the unified dark-mode theme to any EmbeddedChartBuilder. Centralising
 * the styling here is what guarantees visual consistency across the three
 * charts: change a colour once and every chart updates.
 *
 * @param {GoogleAppsScript.Charts.EmbeddedChartBuilder} builder
 * @param {string} title - shown at the top of the chart
 * @param {Object} theme - resolved palette from ADV_theme_()
 * @param {Object} [extra] - extra options merged on top of the base theme
 */
function ADV_applyDarkTheme_(builder, title, theme, extra) {
  var baseOptions = {
    title: title,
    backgroundColor: theme.bgCard,
    titleTextStyle: { color: theme.fgPrimary, fontSize: 14, bold: true },
    legend: {
      position: 'top',
      textStyle: { color: theme.fgPrimary, fontSize: 11 },
    },
    chartArea: { backgroundColor: theme.bgCard },
    hAxis: {
      textStyle: { color: theme.fgMuted, fontSize: 11 },
      gridlines: { color: theme.gridline },
      baselineColor: theme.gridline,
    },
    vAxis: {
      textStyle: { color: theme.fgMuted, fontSize: 11 },
      gridlines: { color: theme.gridline },
      baselineColor: theme.gridline,
    },
  };

  // Merge any chart-specific overrides on top of the base options.
  var merged = Object.assign({}, baseOptions, extra || {});
  Object.keys(merged).forEach(function (key) {
    builder.setOption(key, merged[key]);
  });
}

// =============================================================================
// PHASE 4b - CHART 1: VERTICAL COLUMN CHART (Income / Expense / Savings)
// =============================================================================
/**
 * Anchor: B11:M26 (top row of the dashboard grid) -> row 11, col B (=2).
 * Source: rng_dash_annual_columns -> _DashboardEngine!A1:D13
 *   Col A  = month (axis)
 *   Col B  = actual income     | series 0 | green     #10B981
 *   Col C  = actual expense    | series 1 | red       #DC2626
 *   Col D  = net (savings)     | series 2 | sky blue  #06B6D4
 *
 * Note on the legend label for series 2: the engine column header is
 * 'صافي الربح' (Net Profit). The user requested the legend to read 'الادخار'
 * (Savings). We override via series.labelInLegend rather than touching the
 * engine sheet - keeps the engine layout untouched.
 */
function ADV_buildAnnualColumnChart_(sheet, ss, theme) {
  var label = 'الرسم العمودي السنوي - الدخل والمصروف والادخار';
  try {
    var range = ADV_requireRange_(ss, ADV_NR.annualColumns);

    var builder = sheet.newChart()
      .setChartType(Charts.ChartType.COLUMN)            // VERTICAL bars
      .addRange(range)
      .setNumHeaders(1)                                 // first row = header
      .setPosition(11, 2, 0, 0)                         // row 11, col B
      .setOption('width',  1200)
      .setOption('height', 336);

    ADV_applyDarkTheme_(builder, 'الإنفاق السنوي - الدخل والمصروف والادخار', theme, {
      series: {
        0: { color: theme.accentIncome,  labelInLegend: 'الدخل' },
        1: { color: theme.accentExpense, labelInLegend: 'المصروف' },
        2: { color: theme.accentSavings, labelInLegend: 'الادخار' },
      },
      bar: { groupWidth: '70%' },                       // tighter side-by-side cluster
      isStacked: false,                                 // explicit: side-by-side, NOT stacked
      legend: {
        position: 'top',
        textStyle: { color: theme.fgPrimary, fontSize: 11 },
      },
    });

    sheet.insertChart(builder.build());
    return { ok: true, label: label };
  } catch (err) {
    var msg = (err && err.message) ? err.message : String(err);
    Logger.log('ADV_buildAnnualColumnChart_: ' + msg);
    return { ok: false, label: label, error: msg };
  }
}

// =============================================================================
// PHASE 4c - CHART 2: INCOME DOUGHNUT (top income sources)
// =============================================================================
/**
 * Anchor: B29:G44 (bottom-left of the grid) -> row 29, col B.
 * Source: rng_dash_doughnut_income -> _DashboardEngine!I1:J9
 */
function ADV_buildIncomeDoughnut_(sheet, ss, theme) {
  var label = 'دونات أكثر مصادر الدخل';
  try {
    var range = ADV_requireRange_(ss, ADV_NR.doughnutIncome);

    var builder = sheet.newChart()
      .setChartType(Charts.ChartType.PIE)
      .addRange(range)
      .setNumHeaders(1)
      .setPosition(29, 2, 0, 0)                         // row 29, col B
      .setOption('width',  600)
      .setOption('height', 336);

    ADV_applyDarkTheme_(builder, 'أكثر مصادر الدخل', theme, {
      pieHole: 0.6,                                     // pie -> doughnut
      pieSliceTextStyle: { color: theme.fgPrimary, fontSize: 11 },
      colors: theme.slicePalette,
      legend: {
        position: 'right',
        textStyle: { color: theme.fgPrimary, fontSize: 11 },
      },
    });

    sheet.insertChart(builder.build());
    return { ok: true, label: label };
  } catch (err) {
    var msg = (err && err.message) ? err.message : String(err);
    Logger.log('ADV_buildIncomeDoughnut_: ' + msg);
    return { ok: false, label: label, error: msg };
  }
}

// =============================================================================
// PHASE 4d - CHART 3: EXPENSE DOUGHNUT (drain categories)
// =============================================================================
/**
 * Anchor: H29:M44 (bottom-right of the grid) -> row 29, col H (=8).
 * Source: rng_dash_doughnut_expense -> _DashboardEngine!L1:M13
 */
function ADV_buildExpenseDoughnut_(sheet, ss, theme) {
  var label = 'دونات أكثر فئات الإنفاق استنزافاً';
  try {
    var range = ADV_requireRange_(ss, ADV_NR.doughnutExpense);

    var builder = sheet.newChart()
      .setChartType(Charts.ChartType.PIE)
      .addRange(range)
      .setNumHeaders(1)
      .setPosition(29, 8, 0, 0)                         // row 29, col H
      .setOption('width',  600)
      .setOption('height', 336);

    ADV_applyDarkTheme_(builder, 'أكثر فئات الإنفاق استنزافاً', theme, {
      pieHole: 0.6,
      pieSliceTextStyle: { color: theme.fgPrimary, fontSize: 11 },
      colors: theme.slicePalette,
      legend: {
        position: 'right',
        textStyle: { color: theme.fgPrimary, fontSize: 11 },
      },
    });

    sheet.insertChart(builder.build());
    return { ok: true, label: label };
  } catch (err) {
    var msg = (err && err.message) ? err.message : String(err);
    Logger.log('ADV_buildExpenseDoughnut_: ' + msg);
    return { ok: false, label: label, error: msg };
  }
}

/* ============================================================================
   HOW TO LINK THIS TO A ONE-CLICK BUTTON ON THE DASHBOARD
   ============================================================================

   Option A - Drawing-based button (visual button on the dashboard sheet):
   ----------------------------------------------------------------------
   1. Open the dashboard sheet ('اللوحة الرئيسية والتقرير السنوي').
   2. Insert -> Drawing.
   3. Draw a rectangle. Add the text "تحديث الرسوم البيانية" inside it.
      Suggested style: fill #06B6D4 (sky blue, matches the savings series),
      text colour #FFFFFF.
   4. Click "Save and close" - the drawing appears on the sheet.
   5. Click the drawing once to select it. Click the three-dot menu in
      the upper-right of the drawing -> "Assign script".
   6. Type exactly:  automateDashboardVisuals
      (NO parentheses, NO leading/trailing spaces.)
   7. Click OK. The first click after assignment will prompt for
      authorisation - approve.
   8. From now on, one click on the drawing rebuilds all three charts.

   Option B - Custom menu item (one-click from the menu bar):
   ----------------------------------------------------------
   If your project does NOT yet have an `onOpen` function, add this:

       function onOpen() {
         SpreadsheetApp.getUi()
           .createMenu('🎨 الرسوم البيانية')
           .addItem('تحديث الرسوم البيانية الآن', 'automateDashboardVisuals')
           .addToUi();
       }

   If your project ALREADY has an `onOpen`, just add the three middle lines
   to your existing onOpen body.

   Option C - Run directly from the editor:
   ----------------------------------------
   In the Apps Script editor, pick `automateDashboardVisuals` from the
   function dropdown and press Run. Useful while developing.
   ============================================================================ */
