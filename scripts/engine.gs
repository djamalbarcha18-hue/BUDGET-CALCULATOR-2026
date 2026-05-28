/**
 * BUDGET-CALCULATOR-2026 — Data Aggregation Engine
 * ============================================================================
 * scripts/engine.gs
 *
 * Pure data-access layer that reads the 12 monthly sheets and aggregates
 * their income / expense rows into a single JSON object suitable for any
 * downstream consumer: the planned Executive Dashboard UI, custom sidebar
 * widgets, integration tests, programmatic exports, …
 *
 * This file is INTENTIONALLY separate from `install.gs`:
 *   * `install.gs`              — UI / scaffolding / chart insertion / theming
 *   * `engine.gs` (this file)   — pure functions that return data structures
 *
 * The script reuses the `MONTHS` constant from `install.gs` (Apps Script
 * flattens every .gs file into one global scope, so no import is needed).
 * If `engine.gs` is ever loaded standalone, the `MONTHS` guard at the top of
 * `getAnnualData` reports a clean diagnostic rather than crashing.
 *
 * NAMING NOTE: this is the *JavaScript-side* aggregation engine, distinct
 * from the `_DashboardEngine` *spreadsheet* (built by `buildDashboardEngine`
 * in install.gs) which feeds the chart bindings. They serve different
 * consumers and can drift independently — engine.gs reads raw monthly cells,
 * not the engine sheet, so a corrupted engine sheet does not break it.
 *
 * Design notes
 * ------------
 *  * Reads RAW row data (income block A10:G28, expense block A33:H62) — does
 *    NOT depend on the KPI panel's formulas (B4 / D4 / F3) being intact. If
 *    a user accidentally clears the panel, aggregation still works.
 *  * Every cross-sheet read is wrapped in try/catch so a single broken sheet
 *    cannot abort aggregation. Failures log under the `[engine]` tag and the
 *    affected month is recorded as zero income / zero expenses, plus the
 *    error message is surfaced in `result.errors[]`.
 *  * Output is a stable shape with all 12 months keyed even when sheets are
 *    missing — consumers always get a 12-key `monthlyTrends` object.
 *  * Arabic month names and category names are handled transparently:
 *    JavaScript strings are Unicode, object keys can be any string, no
 *    special encoding is required.
 *
 * Public surface
 * --------------
 *   getAnnualData()                — returns the aggregated annual JSON.
 *   testGetAnnualData()            — runs aggregation and dumps to Logger.
 *   snapshotAnnualDataToSheet()    — writes the aggregate to a visible
 *                                    sheet for human-readable inspection.
 * ============================================================================
 */

/**
 * Pull every financial figure from the 12 monthly sheets and return a
 * structured aggregate.
 *
 * Output shape:
 *   {
 *     totalIncome:    Number,
 *     totalExpenses:  Number,
 *     netProfit:      Number,                                              // income − expenses
 *     savingsRate:    Number,                                              // 0..1, net / income
 *     totalAssets:    Number,                                              // goals!D2 + cumulative net
 *     totalLiabilities: Number,                                            // goals!B3 × 12 (annualised)
 *     monthlyTrends:  { [arabicMonthName]: { income: Number, expenses: Number } },
 *     categoryTotals: { [arabicCategoryName]: Number },                    // expenses by category
 *     missingMonths:  String[],                                            // names of absent sheets
 *     errors:         String[],                                            // diagnostic messages, [] on a clean run
 *     generatedAt:    String                                               // ISO timestamp of this run
 *   }
 *
 * Safe to call repeatedly. Never throws — every failure is captured into
 * `result.errors`.
 *
 * @return {Object} aggregated annual financial data.
 */
function getAnnualData() {
  const result = {
    totalIncome:      0,
    totalExpenses:    0,
    netProfit:        0,
    savingsRate:      0,
    totalAssets:      0,
    totalLiabilities: 0,
    monthlyTrends:    {},
    categoryTotals:   {},
    missingMonths:    [],
    errors:           [],
    generatedAt:      new Date().toISOString(),
  };

  // Resolve the active spreadsheet defensively. `getActive()` returns null
  // when the script runs outside a workbook context (e.g. headless tests
  // via clasp). Reporting cleanly instead of throwing keeps the contract
  // "never throws".
  const ss = (function tryActive() {
    try { return SpreadsheetApp.getActive(); }
    catch (err) { return null; }
  })();

  if (!ss) {
    result.errors.push(
      '[engine] No active spreadsheet — getAnnualData was called outside a workbook context.');
    return result;
  }

  // `MONTHS` lives in install.gs. If engine.gs is loaded standalone, fail
  // gracefully with a single diagnostic rather than a ReferenceError.
  if (typeof MONTHS === 'undefined' || !Array.isArray(MONTHS)) {
    result.errors.push(
      '[engine] MONTHS constant is undefined — load install.gs alongside engine.gs in the Apps Script project.');
    return result;
  }

  MONTHS.forEach(function (monthName) {
    // Always seed the slot so consumers get a stable 12-key object even
    // when individual sheets are missing or empty.
    result.monthlyTrends[monthName] = { income: 0, expenses: 0 };

    const sheet = ss.getSheetByName(monthName);
    if (!sheet) {
      result.missingMonths.push(monthName);
      return;
    }

    // ---- Income block: A10:G28 (categories in B, amounts in E) ----
    const incomeRows  = _engineReadBlock(sheet, 'A10:G28', result.errors);
    const monthIncome = _engineSumColumn(incomeRows, 4);     // E = idx 4

    // ---- Expense block: A33:H62 (categories in B, amounts in E) ----
    const expenseRows  = _engineReadBlock(sheet, 'A33:H62', result.errors);
    const monthExpenses = _engineSumColumn(expenseRows, 4);

    result.totalIncome   += monthIncome;
    result.totalExpenses += monthExpenses;
    result.monthlyTrends[monthName].income   = monthIncome;
    result.monthlyTrends[monthName].expenses = monthExpenses;

    // ---- Spending breakdown by expense category (col B → col E aggregate) ----
    expenseRows.forEach(function (row) {
      const category = (row[1] != null) ? String(row[1]).trim() : '';
      const amount   = Number(row[4]);
      if (!category) return;                                 // skip placeholder rows
      if (!isFinite(amount) || amount === 0) return;         // skip empty / NaN cells
      result.categoryTotals[category] = (result.categoryTotals[category] || 0) + amount;
    });
  });

  result.netProfit   = result.totalIncome - result.totalExpenses;
  result.savingsRate = (result.totalIncome > 0)
    ? result.netProfit / result.totalIncome
    : 0;

  // ---- Goals-derived aggregates: Total Assets + Total Liabilities ----
  // Mirrors `_DashboardEngine!H5` and `H6` exactly so JS-side and
  // dashboard-side numbers stay in lockstep:
  //
  //   Total Assets       = goals!D2 (إجمالي المدخر across all goals)
  //                      + result.netProfit (cumulative annual surplus)
  //   Total Liabilities  = goals!B3 (إجمالي القسط الشهري المطلوب) × 12
  //
  // Failures degrade gracefully: a missing goals sheet, a corrupted cell, a
  // text value where a number is expected — each scenario logs an `[engine]`
  // line and the affected aggregate stays at 0.
  const goalsName = (typeof SHEET_NAMES === 'object' && SHEET_NAMES && SHEET_NAMES.goals)
    ? SHEET_NAMES.goals
    : 'الأهداف المالية والادخار';
  const goalsSheet = ss.getSheetByName(goalsName);
  if (!goalsSheet) {
    result.errors.push(
      '[engine] Goals sheet "' + goalsName + '" not found — totalAssets / totalLiabilities default to 0.');
  } else {
    const totalSavedRaw  = _engineReadCell(goalsSheet, 'D2', result.errors);
    const monthlyReqRaw  = _engineReadCell(goalsSheet, 'B3', result.errors);
    const totalSaved     = isFinite(Number(totalSavedRaw)) ? Number(totalSavedRaw) : 0;
    const monthlyRequired = isFinite(Number(monthlyReqRaw)) ? Number(monthlyReqRaw) : 0;
    result.totalAssets      = totalSaved + result.netProfit;
    result.totalLiabilities = monthlyRequired * 12;
  }

  return result;
}

// ============================================================================
// PRIVATE HELPERS — prefixed `_engine*` so they cannot collide with anything
// in install.gs (Apps Script files share one global scope).
// ============================================================================

/**
 * Read an A1-style range as a 2-D array of values, with full error capture.
 * On failure, an `[engine]` line is appended to the errors sink and an
 * empty array is returned — so the caller's `.reduce` / `.forEach` keeps
 * working without any extra null checks.
 *
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 * @param {string}              a1     range in A1 notation (e.g. 'A10:G28')
 * @param {Array<string>}       errors sink array to record failures into
 * @return {Array<Array<*>>} rows of values, or [] on failure
 */
function _engineReadBlock(sheet, a1, errors) {
  try {
    return sheet.getRange(a1).getValues();
  } catch (err) {
    const tag = (sheet && sheet.getName && sheet.getName()) || '?';
    const msg = '[engine] readBlock(' + tag + '/' + a1 + ') failed: ' + (err && err.message);
    Logger.log(msg);
    if (Array.isArray(errors)) errors.push(msg);
    return [];
  }
}

/**
 * Sum a single column across a 2-D array, coercing each cell to Number and
 * skipping non-finite values (empty cells, leftover text labels, formula
 * errors). Pure — never throws.
 *
 * @param {Array<Array<*>>} rows
 * @param {number}          colIdx 0-based column index
 * @return {number}
 */
function _engineSumColumn(rows, colIdx) {
  return rows.reduce(function (sum, row) {
    const v = Number(row[colIdx]);
    return sum + (isFinite(v) ? v : 0);
  }, 0);
}

/**
 * Read a single cell as a value, with full error capture. Used for scalar
 * lookups on the Goals sheet (D2, B3) where a 2-D `getValues` would be
 * overkill.
 *
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 * @param {string}        a1     cell reference (e.g. 'D2')
 * @param {Array<string>} errors sink array to record failures into
 * @return {*} the raw cell value, or null on failure
 */
function _engineReadCell(sheet, a1, errors) {
  try {
    return sheet.getRange(a1).getValue();
  } catch (err) {
    const tag = (sheet && sheet.getName && sheet.getName()) || '?';
    const msg = '[engine] readCell(' + tag + '/' + a1 + ') failed: ' + (err && err.message);
    Logger.log(msg);
    if (Array.isArray(errors)) errors.push(msg);
    return null;
  }
}

// ============================================================================
// TESTING / INSPECTION HELPERS
// ============================================================================

/**
 * Quick smoke test: run `getAnnualData()` and dump a pretty-printed summary
 * to the Apps Script execution log. From the script editor, pick this name
 * from the function dropdown and click Run, then open View → Executions
 * (or Ctrl+Enter for the legacy log) to see the output.
 *
 * @return {Object} the same payload returned by getAnnualData(), so the
 *                  function can be chained inside other tests.
 */
function testGetAnnualData() {
  const data = getAnnualData();
  Logger.log('[engine] generatedAt      = ' + data.generatedAt);
  Logger.log('[engine] totalIncome      = ' + data.totalIncome);
  Logger.log('[engine] totalExpenses    = ' + data.totalExpenses);
  Logger.log('[engine] netProfit        = ' + data.netProfit);
  Logger.log('[engine] savingsRate      = ' + (data.savingsRate * 100).toFixed(2) + '%');
  Logger.log('[engine] totalAssets      = ' + data.totalAssets);
  Logger.log('[engine] totalLiabilities = ' + data.totalLiabilities);
  Logger.log('[engine] missingMonths    = ' + JSON.stringify(data.missingMonths));
  Logger.log('[engine] errors           = ' + JSON.stringify(data.errors));
  Logger.log('[engine] monthlyTrends    = ' + JSON.stringify(data.monthlyTrends, null, 2));
  Logger.log('[engine] categoryTotals   = ' + JSON.stringify(data.categoryTotals, null, 2));
  return data;
}

/**
 * Write the aggregate to a sheet named "_EngineSnapshot" for visual
 * inspection. Useful when the Apps Script log is truncated, when sharing
 * a debug view with a non-developer collaborator, or when sanity-checking
 * the numbers against the dashboard KPI cards.
 *
 * Idempotent: creates the sheet on first use, clears + re-writes on each
 * subsequent call. The sheet is regular (not hidden) so the user can
 * eyeball it; deleting it has no effect on the workbook.
 *
 * @return {Object} the same payload returned by getAnnualData().
 */
function snapshotAnnualDataToSheet() {
  const ss = SpreadsheetApp.getActive();
  let s = ss.getSheetByName('_EngineSnapshot');
  if (!s) s = ss.insertSheet('_EngineSnapshot');
  s.clear();

  const data = getAnnualData();

  // -- Top-line totals --
  s.getRange('A1:B1').setValues([['Field', 'Value']]).setFontWeight('bold');
  const topRows = [
    ['generatedAt',      data.generatedAt],
    ['totalIncome',      data.totalIncome],
    ['totalExpenses',    data.totalExpenses],
    ['netProfit',        data.netProfit],
    ['savingsRate',      data.savingsRate],
    ['totalAssets',      data.totalAssets],
    ['totalLiabilities', data.totalLiabilities],
    ['missingMonths',    data.missingMonths.join(', ') || '—'],
    ['errors',           data.errors.join(' | ')         || '—'],
  ];
  s.getRange(2, 1, topRows.length, 2).setValues(topRows);

  // -- Monthly trends --
  const trendStart = 2 + topRows.length + 2;
  s.getRange(trendStart, 1, 1, 3)
    .setValues([['الشهر', 'الدخل', 'المصروف']])
    .setFontWeight('bold');
  const trendRows = MONTHS.map(function (m) {
    return [m, data.monthlyTrends[m].income, data.monthlyTrends[m].expenses];
  });
  s.getRange(trendStart + 1, 1, trendRows.length, 3).setValues(trendRows);

  // -- Category totals (sorted desc by amount) --
  const catStart = trendStart + 1 + trendRows.length + 2;
  s.getRange(catStart, 1, 1, 2)
    .setValues([['الفئة', 'الإجمالي']])
    .setFontWeight('bold');
  const catEntries = Object.keys(data.categoryTotals)
    .map(function (k) { return [k, data.categoryTotals[k]]; })
    .sort(function (a, b) { return b[1] - a[1]; });
  if (catEntries.length > 0) {
    s.getRange(catStart + 1, 1, catEntries.length, 2).setValues(catEntries);
  }

  s.autoResizeColumns(1, 3);
  ss.setActiveSheet(s);
  return data;
}
