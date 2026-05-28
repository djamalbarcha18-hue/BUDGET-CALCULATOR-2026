/**
 * BUDGET-CALCULATOR-2026 — Soft-Lock Protection Layer
 * ============================================================================
 * scripts/security.gs
 *
 * Owns every `protect()` call across the workbook. Split out from install.gs
 * so the security model is auditable in one place — adding or relaxing a
 * protection rule means editing this file alone.
 *
 * All protections are "warning-only": edits trigger a confirmation dialog
 * but are still allowed. This balances guidance (don't accidentally break a
 * formula) with flexibility (advanced users can override when needed).
 *
 * Public surface:
 *   _applySecurity(sheet, ranges) — generic helper used by `_buildWelcomePage`
 *                                   and any future UI builder that needs
 *                                   per-sheet branded-region protection.
 *   applyProtection(ss)           — workbook-wide orchestrator called from
 *                                   `installBudgetCalculator2026` after
 *                                   every other build step is finished.
 *
 * Apps Script flattens every .gs file into one global scope, so the WARN_*
 * string constants below and the SHEET_NAMES / MONTHS constants from
 * install.gs are accessible to each other without explicit imports.
 * ============================================================================
 */

// ============================================================================
// WARNING MESSAGES — Arabic labels shown when a user tries to edit a
// protected range. Tuned to be informative without being condescending.
// ============================================================================

const WARN_BRANDING  = 'هذه الكتلة جزء من الهويّة البصريّة للقالب. التعديل غير مرغوب.';
const WARN_SETTINGS  = 'هذه الورقة هي مصدر الحقيقة الوحيد للإعدادات. التعديل قد يكسر كل المصنّف.';
const WARN_CALC_CELL = 'هذه الخلية محسوبة آلياً، لا تُعدَّل يدوياً.';
const WARN_ENGINE    = 'هذه الورقة جزء من المحرك الخلفي للوحة المعلومات. التعديل قد يكسر الصيغ والرسوم البيانية.';

// ============================================================================
// _applySecurity — generic per-sheet protection helper
// ============================================================================

/**
 * Apply warning-only `protect()` to a list of A1 ranges on a single sheet,
 * with full error capture so a corrupt range cannot abort the installer
 * mid-build.
 *
 * "warning-only" means edits prompt a confirmation dialog but are still
 * allowed — entry-cell sheets remain open while branded UI regions are
 * protected from accidental modification.
 *
 * @param {GoogleAppsScript.Spreadsheet.Sheet} s      target sheet
 * @param {Array<string>}                      ranges A1 ranges to protect
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
// applyProtection — workbook-wide orchestrator
// ----------------------------------------------------------------------------
// Called once at the end of `installBudgetCalculator2026`, after every sheet
// has been built and every formula written. Locks down:
//
//   * Engine sheet (whole-sheet — users should never edit it directly)
//   * Dashboard — KPI cards, chart anchors, Annual Performance Matrix
//   * Settings — protect everything EXCEPT the four entry zones
//     (currency selector, exchange rates, category lists, payment methods)
//   * Goals — protect calculated columns D / F / G / H / I; A / B / C / E
//     stay editable for the user's own goals.
//   * Monthly sheets — protect KPI panel + ARRAYFORMULA difference column
//     + per-row alert column + the two totals rows. Entry rows stay open.
//
// Welcome branding is NOT protected here — `_buildWelcomePage` calls
// `_applySecurity` directly on its 5 branded regions, keeping ownership
// co-located with the layout builder.
// ============================================================================

/**
 * Apply the workbook-wide soft-lock protection layer.
 *
 * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} ss
 */
function applyProtection(ss) {
  // Engine sheet (whole-sheet protection)
  const engine = ss.getSheetByName(SHEET_NAMES.engine);
  engine.protect().setDescription(WARN_ENGINE).setWarningOnly(true);

  // Dashboard regions (KPI cards + chart anchors + Annual Performance Matrix)
  const dash = ss.getSheetByName(SHEET_NAMES.dashboard);
  ['B5:E10', 'F5:I10', 'J5:M10', 'N5:Q10', 'R5:U10', 'V5:Y10',
   'B11:M26', 'N11:Y26', 'B29:G44', 'H29:M44',
   'N29:S44', 'T29:Y44',
   'B47:I60', 'J47:Q60', 'R47:Y60'].forEach(function (r) {
    dash.getRange(r).protect().setDescription(WARN_CALC_CELL).setWarningOnly(true);
  });

  // Settings sheet — protect everything except the four entry zones.
  const settings = ss.getSheetByName(SHEET_NAMES.settings);
  const settingsProtect = settings.protect()
    .setDescription(WARN_SETTINGS).setWarningOnly(true);
  settingsProtect.setUnprotectedRanges([
    settings.getRange('B3'),       // currency selector
    settings.getRange('C7:C20'),   // exchange rates
    settings.getRange('F7:F14'),   // income categories
    settings.getRange('G7:G18'),   // expense categories
    settings.getRange('H7:H10'),   // payment methods
  ]);

  // Goals sheet — protect calculated columns (D, F, G, H, I from rows 7..26)
  const goals = ss.getSheetByName(SHEET_NAMES.goals);
  ['D7:D26', 'F7:F26', 'G7:G26', 'H7:H26', 'I7:I26'].forEach(function (r) {
    goals.getRange(r).protect().setDescription(WARN_CALC_CELL).setWarningOnly(true);
  });

  // Monthly sheets — protect KPI panel + alert column + totals.
  for (const m of MONTHS) {
    const s = ss.getSheetByName(m);
    ['A1:G6', 'F10:F28', 'H33:H62', 'A29:G29', 'A63:H63'].forEach(function (r) {
      s.getRange(r).protect().setDescription(WARN_CALC_CELL).setWarningOnly(true);
    });
  }
}
