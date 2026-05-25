/**
 * BUDGET-CALCULATOR-2026 - Programmatic dashboard visualisation layer
 * ===================================================================
 *
 * Single entry point: `automateDashboardVisuals()`
 *
 * What it does
 * ------------
 * 1. Locates the dashboard sheet (the user-visible Arabic tab).
 * 2. Wipes every existing chart on that sheet to prevent duplicates.
 * 3. Ensures every named range required by the charts is wired up.
 * 4. Builds three charts programmatically via the EmbeddedChartBuilder API:
 *      - Doughnut: income sources           (rng_dash_doughnut_income)
 *      - Doughnut: expense categories       (rng_dash_doughnut_expense)
 *      - Bar:      annual income vs expense (rng_dash_annual_bars)
 * 5. Applies a unified dark-mode theme (palette mirrors theme_palette.csv).
 *
 * Design principles
 * -----------------
 * - Modular: one helper per concern (cleanup, range wiring, theme, each chart).
 * - Defensive: every chart is built inside its own try/catch so a single
 *   failure (e.g., a renamed named range) cannot abort the rest.
 * - Idempotent: safe to re-run any number of times. Each call returns the
 *   sheet to a clean, freshly-rendered visual state.
 * - Self-contained: the THEME constant is local, so this file can be pasted
 *   into an empty Apps Script project on its own and still work.
 *
 * Usage
 * -----
 * 1. Open the spreadsheet, then Extensions -> Apps Script.
 * 2. Paste this file (or add it as a new .gs file alongside install.gs).
 * 3. From the function dropdown at the top, pick `automateDashboardVisuals`.
 * 4. Click Run. Authorise when prompted. A toast confirms completion.
 */

// =============================================================================
// LOCAL CONSTANTS (kept here so this file can run without install.gs)
// =============================================================================

/** Dark-mode palette - mirrors data/dashboard/theme_palette.csv exactly. */
const DASH_THEME = {
  bgPage:        '#0F172A',
  bgCard:        '#1F2937',
  fgPrimary:     '#F1F5F9',
  fgMuted:       '#94A3B8',
  gridline:      '#334155',
  accentIncome:  '#10B981',
  accentExpense: '#DC2626',
  accentNet:     '#06B6D4',
  // High-contrast doughnut slice palette (orange / blue / purple / pink + tints).
  slicePalette:  ['#F97316', '#3B82F6', '#8B5CF6', '#EC4899',
                  '#10B981', '#F59E0B', '#06B6D4', '#84CC16'],
};

/**
 * Canonical names for the dashboard tab. The user's instruction referred to
 * the short form `اللوحة الرئيسية`, but the workbook's actual sheet (per
 * docs/07_dashboard_architecture.md) is the longer form. We try them in order.
 */
const DASH_SHEET_CANDIDATES = [
  'اللوحة الرئيسية والتقرير السنوي',
  'اللوحة الرئيسية',
];

/** Hidden engine sheet that backs every chart's data source. */
const DASH_ENGINE_SHEET = '_DashboardEngine';

/**
 * Required named ranges. If any are missing the bar chart auto-wires its
 * own; the doughnuts will throw a descriptive error so the user knows to
 * run the installer first.
 */
const NR = {
  doughnutIncome:  'rng_dash_doughnut_income',   // _DashboardEngine!I1:J9
  doughnutExpense: 'rng_dash_doughnut_expense',  // _DashboardEngine!L1:M13
  annualBars:      'rng_dash_annual_bars',       // _DashboardEngine!A1:C13 (auto-created)
};

// =============================================================================
// MAIN ENTRY POINT
// =============================================================================
/**
 * Orchestrates the full chart-rebuild pipeline. Each phase is wrapped in its
 * own try/catch so a partial failure still surfaces a clear UI message and
 * leaves the sheet in a coherent state.
 */
function automateDashboardVisuals() {
  const ss = SpreadsheetApp.getActive();
  const ui = SpreadsheetApp.getUi();

  let sheet;
  try {
    // STEP 1 - Resolve the dashboard sheet.
    sheet = getDashboardSheet_(ss);
  } catch (err) {
    ui.alert('فشل تحديد ورقة اللوحة', err.message, ui.ButtonSet.OK);
    return;
  }

  // STEP 2 - Cleanup: remove every existing chart on the dashboard sheet.
  const removed = cleanupDashboardCharts_(sheet);

  // STEP 3 - Make sure every named range the charts depend on actually exists.
  ensureAnnualBarsNamedRange_(ss);

  // STEP 4 - Build the three charts. Each call is independent: a failure in
  // one does not block the others. We collect the outcomes and report once.
  const results = [
    buildIncomeDoughnut_(sheet, ss),
    buildExpenseDoughnut_(sheet, ss),
    buildAnnualBarChart_(sheet, ss),
  ];

  // STEP 5 - Surface a single consolidated status to the user.
  const built  = results.filter(r => r.ok).map(r => r.label);
  const failed = results.filter(r => !r.ok);

  let msg = `تمت إزالة ${removed} رسم(ة) موجود(ة) سابقاً.\n\n` +
            `تمّ إنشاء ${built.length} رسم(ات) بنجاح:\n  • ${built.join('\n  • ')}`;
  if (failed.length) {
    msg += `\n\nتعذّر إنشاء ${failed.length} رسم(ات):\n` +
           failed.map(f => `  • ${f.label}: ${f.error}`).join('\n');
  }
  ui.alert('automateDashboardVisuals', msg, ui.ButtonSet.OK);
}

// =============================================================================
// PHASE 1 - SHEET RESOLUTION
// =============================================================================
/**
 * Returns the dashboard Sheet object. Resolution order:
 *   1. Each name in DASH_SHEET_CANDIDATES (longest/canonical first).
 *   2. The currently active sheet, if its name starts with `اللوحة`.
 * Throws a descriptive error if nothing matches.
 */
function getDashboardSheet_(ss) {
  for (const name of DASH_SHEET_CANDIDATES) {
    const s = ss.getSheetByName(name);
    if (s) return s;
  }
  const active = ss.getActiveSheet();
  if (active && active.getName().indexOf('اللوحة') === 0) return active;

  throw new Error(
    'لم يتم العثور على ورقة اللوحة الرئيسية. ' +
    'تأكّد من أنّ اسم الورقة هو \"اللوحة الرئيسية والتقرير السنوي\" ' +
    'أو فعّلها قبل تشغيل الدالة.');
}

// =============================================================================
// PHASE 2 - CLEANUP
// =============================================================================
/**
 * Deletes every chart currently embedded in the given sheet. Returns the count
 * of removed charts so the caller can report it.
 */
function cleanupDashboardCharts_(sheet) {
  const charts = sheet.getCharts();
  charts.forEach(chart => sheet.removeChart(chart));
  return charts.length;
}

// =============================================================================
// PHASE 3 - NAMED RANGE WIRING
// =============================================================================
/**
 * Creates `rng_dash_annual_bars` if it doesn't exist. Source range is
 * `_DashboardEngine!A1:C13` (header + 12 months × [income, expense]),
 * which gives a natural side-by-side bar chart per month.
 */
function ensureAnnualBarsNamedRange_(ss) {
  if (ss.getRangeByName(NR.annualBars)) return; // already wired
  const engine = ss.getSheetByName(DASH_ENGINE_SHEET);
  if (!engine) {
    // Engine sheet missing - skip silently. The bar-chart builder will report
    // the failure with its own message rather than killing the whole pipeline.
    return;
  }
  ss.setNamedRange(NR.annualBars, engine.getRange('A1:C13'));
}

/**
 * Returns the Range object for a named range, or throws a translated error.
 * Centralised so every chart builder reports missing ranges the same way.
 */
function requireNamedRange_(ss, name) {
  const r = ss.getRangeByName(name);
  if (!r) {
    throw new Error(`النطاق المُسمّى \"${name}\" غير معرَّف. ` +
      `شغّل المُركِّب الرئيسي أو دالة repairDashboard2026 أوّلاً.`);
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
 * @param {string} title - displayed at the top of the chart
 * @param {Object} [extra] - extra options merged on top of the base theme
 */
function applyDarkModeChartTheme_(builder, title, extra) {
  const baseOptions = {
    title: title,
    backgroundColor: DASH_THEME.bgCard,
    titleTextStyle: { color: DASH_THEME.fgPrimary, fontSize: 14, bold: true },
    legend: {
      position: 'right',
      textStyle: { color: DASH_THEME.fgPrimary, fontSize: 11 },
    },
    chartArea: { backgroundColor: DASH_THEME.bgCard },
    hAxis: {
      textStyle: { color: DASH_THEME.fgMuted, fontSize: 11 },
      gridlines: { color: DASH_THEME.gridline },
      baselineColor: DASH_THEME.gridline,
    },
    vAxis: {
      textStyle: { color: DASH_THEME.fgMuted, fontSize: 11 },
      gridlines: { color: DASH_THEME.gridline },
      baselineColor: DASH_THEME.gridline,
    },
  };

  // Merge any chart-specific overrides on top of the base options.
  const merged = Object.assign({}, baseOptions, extra || {});
  Object.keys(merged).forEach(key => builder.setOption(key, merged[key]));
}

// =============================================================================
// PHASE 4b - CHART 1 - INCOME DOUGHNUT
// =============================================================================
/**
 * Anchor: B29:G44  (per docs/07 section 4.3) -> row 29, col 2.
 * Source: rng_dash_doughnut_income -> _DashboardEngine!I1:J9
 */
function buildIncomeDoughnut_(sheet, ss) {
  const label = 'دونات أكثر مصادر الدخل';
  try {
    const range = requireNamedRange_(ss, NR.doughnutIncome);

    const builder = sheet.newChart()
      .setChartType(Charts.ChartType.PIE)
      .addRange(range)
      .setNumHeaders(1)                  // first row of the range is the header
      .setPosition(29, 2, 0, 0)          // row 29, col B
      .setOption('width',  600)
      .setOption('height', 336);

    applyDarkModeChartTheme_(builder, 'أكثر مصادر الدخل', {
      pieHole: 0.6,                                  // turns pie into doughnut
      pieSliceTextStyle: { color: DASH_THEME.fgPrimary, fontSize: 11 },
      colors: DASH_THEME.slicePalette,
    });

    sheet.insertChart(builder.build());
    return { ok: true, label: label };
  } catch (err) {
    return { ok: false, label: label, error: err && err.message ? err.message : String(err) };
  }
}

// =============================================================================
// PHASE 4c - CHART 2 - EXPENSE DOUGHNUT
// =============================================================================
/**
 * Anchor: H29:M44  (per docs/07 section 4.4) -> row 29, col 8.
 * Source: rng_dash_doughnut_expense -> _DashboardEngine!L1:M13
 */
function buildExpenseDoughnut_(sheet, ss) {
  const label = 'دونات أكثر فئات الإنفاق استنزافاً';
  try {
    const range = requireNamedRange_(ss, NR.doughnutExpense);

    const builder = sheet.newChart()
      .setChartType(Charts.ChartType.PIE)
      .addRange(range)
      .setNumHeaders(1)
      .setPosition(29, 8, 0, 0)          // row 29, col H
      .setOption('width',  600)
      .setOption('height', 336);

    applyDarkModeChartTheme_(builder, 'أكثر فئات الإنفاق استنزافاً', {
      pieHole: 0.6,
      pieSliceTextStyle: { color: DASH_THEME.fgPrimary, fontSize: 11 },
      colors: DASH_THEME.slicePalette,
    });

    sheet.insertChart(builder.build());
    return { ok: true, label: label };
  } catch (err) {
    return { ok: false, label: label, error: err && err.message ? err.message : String(err) };
  }
}

// =============================================================================
// PHASE 4d - CHART 3 - ANNUAL SPENDING BAR CHART
// =============================================================================
/**
 * Anchor: B11:M26  (the slot that previously held the Combo chart) -> row 11, col 2.
 * Source: rng_dash_annual_bars -> _DashboardEngine!A1:C13
 *   Col A = month (axis), Col B = actual income, Col C = actual expense.
 *
 * Rendered as a horizontal Bar chart (one bar per month, two series side-by-side)
 * so income and expense are directly comparable across the year.
 */
function buildAnnualBarChart_(sheet, ss) {
  const label = 'الرسم الشريطي للإنفاق السنوي';
  try {
    const range = requireNamedRange_(ss, NR.annualBars);

    const builder = sheet.newChart()
      .setChartType(Charts.ChartType.BAR)   // horizontal bars; use COLUMN for vertical
      .addRange(range)
      .setNumHeaders(1)
      .setPosition(11, 2, 0, 0)             // row 11, col B
      .setOption('width',  1200)
      .setOption('height', 336);

    applyDarkModeChartTheme_(builder, 'الإنفاق السنوي - مقارنة الدخل والمصروف لكل شهر', {
      // Two-series colour binding: series 0 = income (green), series 1 = expense (red).
      series: {
        0: { color: DASH_THEME.accentIncome, labelInLegend: 'الدخل الفعلي' },
        1: { color: DASH_THEME.accentExpense, labelInLegend: 'المصروف الفعلي' },
      },
      bar: { groupWidth: '70%' },
      legend: {
        position: 'top',
        textStyle: { color: DASH_THEME.fgPrimary, fontSize: 11 },
      },
    });

    sheet.insertChart(builder.build());
    return { ok: true, label: label };
  } catch (err) {
    return { ok: false, label: label, error: err && err.message ? err.message : String(err) };
  }
}
