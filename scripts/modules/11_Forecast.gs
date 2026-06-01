/**
 * SMARTBUDGET PRO 2026 - Module 11: Budget Forecasting Engine
 * =============================================================================
 * Phase 7 of the Strategic Refactor Plan - the AI-touch finale.
 *
 * Builds a hidden-but-accessible forecast sheet that projects next-month
 * spending from historical trends. Uses three complementary techniques:
 *
 *   1. MOVING AVERAGE (3 months)
 *      Rolling average of the most recent 3 completed monthly totals.
 *      Stable, easy to interpret, immune to single outliers.
 *
 *   2. LINEAR TREND (Sheets TREND function)
 *      Native TREND() projects the (n+1)th data point from the linear
 *      regression of the historical series. Catches steady up/down drifts
 *      that a flat average would miss.
 *
 *   3. STANDARD DEVIATION (variance)
 *      STDEV() over the historical series quantifies how erratic each
 *      category is. Surfaced so the user knows which forecasts to trust.
 *
 * SUGGESTED BUDGET = max(movingAvg, trendForecast) * 1.10
 * The 10% buffer is the "safety margin" - tunable in one constant below.
 *
 * READ-ONLY FROM USER DATA
 * ------------------------
 * The forecast sheet is the ONLY thing this module writes. It never touches
 * monthly sheets, settings, dashboard, or engine. Pure analysis layer.
 *
 * WHY THE FORECAST IS A SHEET (NOT A JS RESULT)
 * ----------------------------------------------
 * Sheets formulas recompute live as the user enters new data. A forecast
 * sheet built with TREND/AVERAGE/STDEV stays current without re-running
 * Apps Script. JS-only forecasts would be stale the moment a user types a
 * new transaction. This is the right architecture for a spreadsheet SaaS.
 */

// ============================================================================
// CONFIGURATION
// ============================================================================
const FORECAST_SHEET_NAME    = '🔮 التوقّعات';
const FORECAST_BUFFER_RATIO  = 1.10;    // 10% safety margin on suggested limits
const FORECAST_MIN_MONTHS    = 3;       // refuse to forecast with fewer months

// ============================================================================
// PUBLIC ENTRY POINTS
// ============================================================================

/**
 * Build (or fully rebuild) the forecast sheet.
 * Idempotent: clears + rewrites every cell every run.
 */
function menuBuildForecast() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActive();

  try {
    const completedMonths = _countCompletedMonths(ss);
    if (completedMonths < FORECAST_MIN_MONTHS) {
      ui.alert(
        t('forecast.noDataYetTitle'),
        t('forecast.noDataYetBody'),
        ui.ButtonSet.OK
      );
      return;
    }

    Logger.log(`[Forecast] Building - ${completedMonths} completed months`);
    _buildForecastSheet(ss, completedMonths);
    SpreadsheetApp.flush();

    // Activate the new sheet so the user sees the result immediately
    const fSheet = ss.getSheetByName(FORECAST_SHEET_NAME);
    if (fSheet) ss.setActiveSheet(fSheet);

    ui.alert(
      t('forecast.doneTitle'),
      t('forecast.doneBody', { months: completedMonths }),
      ui.ButtonSet.OK
    );
  } catch (e) {
    Logger.log(`[Forecast] FAILED: ${e}`);
    ui.alert(
      t('common.warningTitle'),
      `${e}`,
      ui.ButtonSet.OK
    );
  }
}

/**
 * Open the forecast sheet (build it first if it doesn't exist).
 */
function menuViewForecast() {
  const ss = SpreadsheetApp.getActive();
  const fSheet = ss.getSheetByName(FORECAST_SHEET_NAME);

  if (fSheet) {
    ss.setActiveSheet(fSheet);
  } else {
    // Sheet doesn't exist - build it
    menuBuildForecast();
  }
}

/**
 * Remove the forecast sheet entirely. User-confirmed.
 */
function menuRemoveForecast() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActive();
  const fSheet = ss.getSheetByName(FORECAST_SHEET_NAME);

  if (!fSheet) {
    ui.alert(
      t('forecast.notFoundTitle'),
      t('forecast.notFoundBody'),
      ui.ButtonSet.OK
    );
    return;
  }

  const r = ui.alert(
    t('forecast.removeConfirmTitle'),
    t('forecast.removeConfirmBody'),
    ui.ButtonSet.YES_NO
  );
  if (r !== ui.Button.YES) return;

  ss.deleteSheet(fSheet);
  SpreadsheetApp.flush();

  ui.alert(
    t('forecast.removedTitle'),
    t('forecast.removedBody'),
    ui.ButtonSet.OK
  );
}

// ============================================================================
// CORE BUILDER
// ============================================================================

function _buildForecastSheet(ss, completedMonths) {
  // Use the same defensive helper as every other module
  const s = getOrCreateSheet(ss, FORECAST_SHEET_NAME);
  s.clear();

  // Page background + Cairo
  s.getRange(1, 1, 60, 12).setBackground(T.bgPage)
    .setFontColor(T.fgPrimary).setFontFamily(FONT);
  for (let c = 1; c <= 12; c++) s.setColumnWidth(c, 130);

  const ts = new Date().toLocaleString(getActiveLang() === 'ar' ? 'ar-DZ' : 'en-US');

  // ---- Title ----
  mergeAndStyle(s, 'A1:H1', t('forecast.sheetTitle'),
    { bg: T.bgPage, fg: T.fgPrimary, size: 22, bold: true,
      align: 'center', vAlign: 'middle', fontFamily: FONT });
  s.setRowHeight(1, 44);

  mergeAndStyle(s, 'A2:H2', t('forecast.sheetSubtitle'),
    { bg: T.bgPage, fg: T.fgMuted, size: 13,
      align: 'center', fontFamily: FONT });
  s.setRowHeight(2, 24);

  mergeAndStyle(s, 'A3:H3', t('forecast.sheetGenerated', { ts }),
    { bg: T.bgPage, fg: T.fgMuted, size: 11,
      align: 'center', fontFamily: FONT });
  s.setRowHeight(3, 20);

  // ---- Section 1: Monthly forecast (rows 5-10) ----
  _buildMonthlySection(s, 5);

  // ---- Section 2: Per-category forecast (rows 13-30) ----
  _buildCategorySection(s, 13);

  // ---- Section 3: Method note (row 32) ----
  mergeAndStyle(s, 'A32:H32', t('forecast.methodNote'),
    { bg: T.bgCardSoft, fg: T.fgMuted, size: 11,
      align: 'center', wrap: true, fontFamily: FONT });
  applyGlassBorder(s.getRange('A32:H32'));
  s.setRowHeight(32, 36);

  // Hide the row/column headers via gridlines + frozen rows
  s.setFrozenRows(3);
}

// ----------------------------------------------------------------------------
// Section 1: Monthly totals forecast
// ----------------------------------------------------------------------------
// Source data lives at _DashboardEngine!B2:B13 (income), C2:C13 (expense),
// D2:D13 (net). We use those columns directly so the forecast stays in sync
// with the dashboard's annual aggregates.
// ----------------------------------------------------------------------------
function _buildMonthlySection(s, startRow) {
  const eng = `'${SHEET_NAMES.engine}'`;

  applyCardSurface(s, `A${startRow}:H${startRow + 5}`);

  // Section title
  mergeAndStyle(s, `A${startRow}:H${startRow}`, t('forecast.sectionMonthly'),
    { bg: T.bgCard, fg: T.fgPrimary, size: 16, bold: true,
      align: 'center', fontFamily: FONT });
  s.setRowHeight(startRow, 32);

  // Table headers (row startRow+1)
  const hdrRow = startRow + 1;
  s.getRange(hdrRow, 1, 1, 4).setValues([[
    t('forecast.colMetric'),
    t('forecast.colHistorical'),
    t('forecast.colTrend'),
    t('forecast.colSuggestion')
  ]]);
  styleHeader(s.getRange(hdrRow, 1, 1, 4));
  s.getRange(hdrRow, 1, 1, 4).setHorizontalAlignment('center');

  // Three rows of forecasts
  // Each row uses native Sheets functions so it stays live as data changes:
  //   - 3-month moving average via AVERAGE on the latest 3 cells
  //   - TREND projects the 13th data point from the existing 12
  //   - Suggestion = max(avg, trend) * 1.10
  const rows = [
    {
      label:  t('forecast.rowIncome'),
      avgRange:   `${eng}!B11:B13`,           // last 3 months
      trendRange: `${eng}!B2:B13`,            // full series
      color:  T.income
    },
    {
      label:  t('forecast.rowExpense'),
      avgRange:   `${eng}!C11:C13`,
      trendRange: `${eng}!C2:C13`,
      color:  T.expense
    },
    {
      label:  t('forecast.rowSavings'),
      avgRange:   `${eng}!D11:D13`,
      trendRange: `${eng}!D2:D13`,
      color:  T.netCyan
    }
  ];

  rows.forEach((r, i) => {
    const row = hdrRow + 1 + i;
    s.getRange(row, 1).setValue(r.label).setFontFamily(FONT);
    s.getRange(row, 1).setFontColor(r.color).setFontWeight('bold');

    // 3-month moving average
    s.getRange(row, 2).setFormula(`=IFERROR(AVERAGE(${r.avgRange}),0)`);

    // Linear TREND projecting position 13 from positions 1..12
    // TREND(known_y, known_x, new_x) returns the projected value
    s.getRange(row, 3).setFormula(
      `=IFERROR(TREND(${r.trendRange}, ROW(${r.trendRange}), MAX(ROW(${r.trendRange}))+1), 0)`
    );

    // Suggested budget: max(historical avg, trend) * buffer ratio
    s.getRange(row, 4).setFormula(
      `=IFERROR(MAX(B${row},C${row}) * ${FORECAST_BUFFER_RATIO}, 0)`
    );
  });

  s.getRange(hdrRow + 1, 2, 3, 3).setNumberFormat(FORMATS.money);
  s.getRange(hdrRow + 1, 1, 3, 4).setBackground(T.bgCard).setFontFamily(FONT);
}

// ----------------------------------------------------------------------------
// Section 2: Per-category forecast
// ----------------------------------------------------------------------------
// For each expense category, build:
//   - Average monthly spend across all 12 months
//   - Standard deviation (variance signal)
//   - Forecast for next month = average + drift via TREND on quarterly slices
//   - Suggested limit = forecast * buffer ratio
//
// This uses the per-month SUMIF pattern shared with the dashboard engine,
// but aggregated across all expense categories rather than just the top 3
// shown on the cash-flow waterfall.
// ----------------------------------------------------------------------------
function _buildCategorySection(s, startRow) {
  applyCardSurface(s, `A${startRow}:H${startRow + 1 + EXPENSE_CATEGORIES.length}`);

  // Section title
  mergeAndStyle(s, `A${startRow}:H${startRow}`, t('forecast.sectionCategory'),
    { bg: T.bgCard, fg: T.fgPrimary, size: 16, bold: true,
      align: 'center', fontFamily: FONT });
  s.setRowHeight(startRow, 32);

  // Table headers
  const hdrRow = startRow + 1;
  s.getRange(hdrRow, 1, 1, 5).setValues([[
    t('forecast.colCategory'),
    t('forecast.colAvgSpend'),
    t('forecast.colVariance'),
    t('forecast.colForecastAmount'),
    t('forecast.colSuggestedLimit')
  ]]);
  styleHeader(s.getRange(hdrRow, 1, 1, 5));
  s.getRange(hdrRow, 1, 1, 5).setHorizontalAlignment('center');

  // For each category, build one row of formulas.
  // We collect category sums per month INTO HELPER COLUMNS far to the right
  // (cols J..U = months 1..12 spend per category) so AVERAGE / STDEV /
  // TREND can all read from the same series without rebuilding it 4 times.
  EXPENSE_CATEGORIES.forEach((cat, i) => {
    const row = hdrRow + 1 + i;

    // Column A: category name
    s.getRange(row, 1).setValue(cat).setFontFamily(FONT);

    // Helper columns J..U (10..21): monthly spend per category
    // Each column is one month's SUMIF for this category
    MONTHS.forEach((month, m) => {
      const colIdx = 10 + m;  // J=10
      s.getRange(row, colIdx).setFormula(
        `=IFERROR(SUMIF('${month}'!B33:B62, A${row}, '${month}'!E33:E62), 0)`
      );
    });

    // Column B: 12-month average spend
    s.getRange(row, 2).setFormula(`=IFERROR(AVERAGE(J${row}:U${row}), 0)`);

    // Column C: standard deviation (variance signal)
    s.getRange(row, 3).setFormula(`=IFERROR(STDEV(J${row}:U${row}), 0)`);

    // Column D: TREND forecast for month 13
    s.getRange(row, 4).setFormula(
      `=IFERROR(TREND(J${row}:U${row}, COLUMN(J${row}:U${row}), COLUMN(U${row})+1), 0)`
    );

    // Column E: suggested limit = max(avg, forecast) * buffer
    s.getRange(row, 5).setFormula(
      `=IFERROR(MAX(B${row}, D${row}) * ${FORECAST_BUFFER_RATIO}, 0)`
    );
  });

  // Format the data block
  const dataStart = hdrRow + 1;
  const dataRows = EXPENSE_CATEGORIES.length;
  s.getRange(dataStart, 2, dataRows, 4).setNumberFormat(FORMATS.money);
  s.getRange(dataStart, 1, dataRows, 5).setBackground(T.bgCard).setFontFamily(FONT);

  // Hide the helper columns J..U so the user only sees the analysis
  s.hideColumns(10, 12);

  // Color-code the suggested limit column (the actionable output)
  s.getRange(dataStart, 5, dataRows, 1).setFontColor(T.income).setFontWeight('bold');
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Counts how many monthly sheets have at least one row of expense data.
 * Used as the gate for "do we have enough data to forecast?"
 */
function _countCompletedMonths(ss) {
  let count = 0;
  MONTHS.forEach(m => {
    const sheet = ss.getSheetByName(m);
    if (!sheet) return;
    // E63 is the actual-expense total. If it's > 0, the month has data.
    const total = Number(sheet.getRange('E63').getValue()) || 0;
    if (total > 0) count++;
  });
  return count;
}
