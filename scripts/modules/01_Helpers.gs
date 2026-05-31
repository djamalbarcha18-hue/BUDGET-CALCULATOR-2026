/**
 * SMARTBUDGET PRO 2026 — Module 01: Shared Helpers
 * =============================================================================
 * DRY utility functions used across every other module.
 *
 * NEW DRY HELPERS introduced during the Phase 1 refactor:
 *   - wipeSheetSurfaces()  : removes data validations + protections
 *   - applyGlassBorder()   : the "glassmorphism edge" border (was inline x18)
 *   - applyCardSurface()   : bgCard + fgPrimary + Cairo + glass border
 *   - styleHeader()        : table header style (was inline x12)
 *   - styleAccent()        : accent strip + Cairo + black text (was inline x6)
 *   - alphaSplit()         : split A1 range to col-start / col-end letters
 *   - nuclearReset()       : pure reset logic (was duplicated in 3 places)
 *
 * PRESERVED helpers (with var → const/let modernization):
 *   - getOrCreateSheet, precreateAllSheetStubs, mergeAndStyle
 */

// ============================================================================
// SHEET LIFECYCLE
// ============================================================================

/**
 * Get or create a sheet, then defensively wipe stale validations + protections.
 * Idempotent: safe to call any number of times.
 */
function getOrCreateSheet(ss, name) {
  let s = ss.getSheetByName(name);
  if (!s) s = ss.insertSheet(name);
  s.setRightToLeft(true);
  s.setHiddenGridlines(true);
  wipeSheetSurfaces(s);
  return s;
}

/**
 * Pre-creates every sheet the workbook will need, BEFORE any cross-sheet
 * formula is written. Prevents the "ghost reference" bug where Apps Script
 * persists formulas to non-existent sheets as #REF!.
 */
function precreateAllSheetStubs(ss) {
  const all = [
    SHEET_NAMES.welcome, SHEET_NAMES.settings, SHEET_NAMES.goals,
    ...MONTHS,
    SHEET_NAMES.dashboard, SHEET_NAMES.engine, SHEET_NAMES.fx
  ];
  all.forEach(name => getOrCreateSheet(ss, name));
}

/**
 * Removes every data validation and every protection (range + sheet) from
 * a sheet. Used by getOrCreateSheet, repair routines, and reset routines.
 *
 * NEW HELPER (Phase 1 DRY): replaces 4 duplicated try/catch blocks across
 * the codebase. ~30 lines of duplication eliminated.
 */
function wipeSheetSurfaces(s) {
  try {
    s.getRange(1, 1, s.getMaxRows(), s.getMaxColumns()).clearDataValidations();
  } catch (e) {}
  try {
    [
      ...s.getProtections(SpreadsheetApp.ProtectionType.RANGE),
      ...s.getProtections(SpreadsheetApp.ProtectionType.SHEET)
    ].forEach(p => {
      try { p.remove(); } catch (e2) {}
    });
  } catch (e) {}
}

// ============================================================================
// STYLE HELPERS
// ============================================================================

/**
 * Merge a range, optionally set value, then apply styling.
 * Existing helper — kept for compatibility with all callers.
 */
function mergeAndStyle(s, a1, value, opts) {
  const r = s.getRange(a1);
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

/**
 * Apply the signature glassmorphism edge border to a card range.
 *
 * NEW HELPER (Phase 1 DRY): replaces ~18 inline calls of
 *   .setBorder(true,true,true,true,false,false, T.glassBorder, ...SOLID)
 */
function applyGlassBorder(range, color) {
  range.setBorder(
    true, true, true, true, false, false,
    color || T.glassBorder,
    SpreadsheetApp.BorderStyle.SOLID
  );
  return range;
}

/**
 * Paint a card surface (dark bg + light fg + Cairo + glass border edge).
 *
 * NEW HELPER (Phase 1 DRY): combines 3 lines of styling that appear ~14
 * times across dashboard / welcome modules into a single call.
 */
function applyCardSurface(s, a1) {
  const r = s.getRange(a1);
  r.setBackground(T.bgCard).setFontColor(T.fgPrimary).setFontFamily(FONT);
  applyGlassBorder(r);
  return r;
}

/**
 * Apply the "table header" style (dark slate bg + light fg + Cairo + bold).
 *
 * NEW HELPER (Phase 1 DRY): used 12+ times across modules.
 */
function styleHeader(range) {
  return range
    .setFontWeight('bold')
    .setBackground(T.glassBorder)
    .setFontColor(T.fgPrimary)
    .setFontFamily(FONT);
}

/**
 * Apply the "tinted surface" style (locked black text + bold + center + Cairo).
 * Used by monthly KPI panels and goals summary panel.
 *
 * NEW HELPER (Phase 1 DRY): consolidates 5 inline blocks.
 */
function styleTintedHeader(range, tint) {
  return range
    .setBackground(tint)
    .setFontColor(TINT_FG)
    .setFontWeight('bold')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle')
    .setFontFamily(FONT);
}

/**
 * Split an A1 range like 'B6:E12' into { colStart: 'B', colEnd: 'E' }.
 *
 * NEW HELPER (Phase 1 DRY): replaces 5 inline regex matches.
 */
function alphaSplit(a1) {
  const [topLeft, bottomRight] = a1.split(':');
  return {
    colStart: topLeft.match(/[A-Z]+/)[0],
    colEnd:   bottomRight.match(/[A-Z]+/)[0]
  };
}

/**
 * Apply alternating row banding to a data block.
 *
 * NEW HELPER (Phase 1 DRY): replaces 3 inline for-loops in buildMonth + buildGoals.
 */
function applyBandedRows(s, startRow, endRow, numCols) {
  for (let r = startRow; r <= endRow; r++) {
    s.getRange(r, 1, 1, numCols)
      .setBackground(r % 2 === 0 ? '#FAFAFA' : '#FFFFFF')
      .setFontColor(TINT_FG)
      .setFontFamily(FONT);
  }
}

// ============================================================================
// FORMULA BUILDERS
// ============================================================================

/**
 * Builds a year-filtered, FX-converted SUM for a single monthly sheet.
 * Used by the dashboard engine grid (rows B2:C13).
 */
function buildYearSum(monthName, dateCol, amtCol, startRow, endRow, yr, fx) {
  const dr = `'${monthName}'!${dateCol}${startRow}:${dateCol}${endRow}`;
  const ar = `'${monthName}'!${amtCol}${startRow}:${amtCol}${endRow}`;
  return `=IFERROR(SUMPRODUCT((IFERROR(YEAR(${dr}),0)=${yr})*(${ar}))*${fx},0)`;
}

/**
 * Builds a year-filtered, FX-converted, category-filtered SUM across all 12
 * monthly sheets. Used by income/expense doughnuts and waterfall.
 */
function buildCategoryYearSum(category, isExpense, yr, fx) {
  const dateCol = isExpense ? 'A' : 'B';
  const catCol  = isExpense ? 'B' : 'C';
  const amtCol  = isExpense ? 'E' : 'F';
  const sr      = isExpense ? 33 : 10;
  const er      = isExpense ? 62 : 28;

  const parts = MONTHS.map(m => {
    const dr = `'${m}'!${dateCol}${sr}:${dateCol}${er}`;
    const cr = `'${m}'!${catCol}${sr}:${catCol}${er}`;
    const ar = `'${m}'!${amtCol}${sr}:${amtCol}${er}`;
    return `SUMPRODUCT((IFERROR(YEAR(${dr}),0)=${yr})*(${cr}="${category}")*(${ar}))`;
  });

  return `(IFERROR(${parts.join('+')},0)*${fx})`;
}

// ============================================================================
// NAVIGATION
// ============================================================================

/**
 * Internal helper that backs the gotoX shortcuts on the custom menu.
 */
function _gotoSheet(name) {
  const ss = SpreadsheetApp.getActive();
  const s  = ss.getSheetByName(name);
  if (s) {
    ss.setActiveSheet(s);
  } else {
    SpreadsheetApp.getUi().alert(
      'الورقة غير موجودة',
      'الرجاء تشغيل التثبيت أولا من قائمة SmartBudget.',
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  }
}

// ============================================================================
// NUCLEAR RESET (CORE LOGIC)
// ----------------------------------------------------------------------------
// Pure logic — no UI prompts. The user-facing wrapper is in Module 05.
// Used by both resetWorkbookCompletely (with confirmation) and menuFreshDemo
// (silent). Eliminates ~70 lines of duplication.
// ============================================================================
function nuclearReset(ss) {
  Logger.log('=== NUCLEAR RESET START ===');

  // 1. Remove all named ranges
  try {
    const named = ss.getNamedRanges();
    named.forEach(n => { try { n.remove(); } catch (e) {} });
    Logger.log(`Removed ${named.length} named ranges`);
  } catch (e) {
    Logger.log(`Named range removal error: ${e}`);
  }

  // 2. Insert placeholder (workbook must keep at least 1 sheet)
  const placeholder = ss.insertSheet(`_TEMP_RESET_${Date.now()}`);

  // 3. Delete every other sheet
  let deleted = 0;
  ss.getSheets().forEach(sh => {
    if (sh.getName() !== placeholder.getName()) {
      try { ss.deleteSheet(sh); deleted++; }
      catch (e) { Logger.log(`Could not delete ${sh.getName()}: ${e}`); }
    }
  });
  Logger.log(`Deleted ${deleted} sheets`);

  // 4. Strip placeholder of validations + protections
  try {
    placeholder.clear();
    wipeSheetSurfaces(placeholder);
  } catch (e) {
    Logger.log(`Placeholder cleanup error: ${e}`);
  }

  // 5. Rename to clean default
  try { placeholder.setName('Sheet1'); } catch (e) {}

  SpreadsheetApp.flush();
  Logger.log('=== NUCLEAR RESET DONE ===');
}
