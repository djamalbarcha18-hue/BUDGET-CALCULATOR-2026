/**
 * Module: 32_protection.gs
 * Layer: 3 (IO)
 *
 * Applies the soft-lock protection layer (warningOnly = true on every range).
 * Five domains:
 *   - Engine sheet            (whole-sheet protection, warning text WARN_ENGINE)
 *   - Welcome branding        (B2:O4, B26:O29, warning text WARN_BRANDING)
 *   - Dashboard regions       (KPI cards, chart anchors, gauge, ledger, sparklines)
 *   - Settings sheet          (whole sheet, with unprotected ranges for the user inputs)
 *   - Goals calculated columns (D, F, G, H, I across rows 7..26)
 *   - Monthly sheets          (KPI panel + difference column + alert column + totals)
 *
 * Reads (globals):
 *   SHEET_NAMES, MONTHS,
 *   WARN_BRANDING, WARN_SETTINGS, WARN_CALC_CELL, WARN_ENGINE.
 *
 * KNOWN ISSUE (deferred to PR 2): protection rules are appended on each run
 * rather than replaced. This is preserved in PR 1 to keep behavior identical.
 * No A1 references are changed by PR 1.
 */

function applyProtection(ss) {
  // Engine sheet (whole-sheet protection)
  const engine = ss.getSheetByName(SHEET_NAMES.engine);
  engine.protect().setDescription(WARN_ENGINE).setWarningOnly(true);

  // Welcome branding regions
  const welcome = ss.getSheetByName(SHEET_NAMES.welcome);
  welcome.getRange('B2:O4').protect().setDescription(WARN_BRANDING).setWarningOnly(true);
  welcome.getRange('B26:O29').protect().setDescription(WARN_BRANDING).setWarningOnly(true);

  // Dashboard regions (KPI cards + chart anchors + ledger)
  const dash = ss.getSheetByName(SHEET_NAMES.dashboard);
  ['B4:E8', 'F4:I8', 'J4:M8', 'N4:Q8', 'R4:U8', 'V4:Y8',
   'B11:M26', 'N11:Y26', 'B29:G44', 'H29:M44',
   'N29:S44', 'T29:Y44', 'H47:N56'].forEach(r => {
    dash.getRange(r).protect().setDescription(WARN_CALC_CELL).setWarningOnly(true);
  });

  // Settings sheet - protect everything except B3 + C7:C20 + F7:H18
  const settings = ss.getSheetByName(SHEET_NAMES.settings);
  const settingsProtect = settings.protect()
    .setDescription(WARN_SETTINGS).setWarningOnly(true);
  // Allow editing within these ranges
  settingsProtect.setUnprotectedRanges([
    settings.getRange('B3'),
    settings.getRange('C7:C20'),
    settings.getRange('F7:F14'),
    settings.getRange('G7:G18'),
    settings.getRange('H7:H10'),
  ]);

  // Goals sheet - protect calculated columns (D, F, G, H, I from rows 7..26)
  const goals = ss.getSheetByName(SHEET_NAMES.goals);
  ['D7:D26', 'F7:F26', 'G7:G26', 'H7:H26', 'I7:I26'].forEach(r => {
    goals.getRange(r).protect().setDescription(WARN_CALC_CELL).setWarningOnly(true);
  });

  // Monthly sheets - protect KPI panel + alert column + totals
  for (const m of MONTHS) {
    const s = ss.getSheetByName(m);
    ['A1:G6', 'F10:F28', 'H33:H62', 'A29:G29', 'A63:H63'].forEach(r => {
      s.getRange(r).protect().setDescription(WARN_CALC_CELL).setWarningOnly(true);
    });
  }
}
