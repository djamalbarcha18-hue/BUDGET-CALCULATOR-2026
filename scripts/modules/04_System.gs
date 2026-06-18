/**
 * SMARTBUDGET PRO 2026 — Module 04: System Wiring
 * =============================================================================
 * Wires the workbook together AFTER all sheets are built:
 *   - defineNamedRangesAndValidations  (rng_* + dropdown rules)
 *   - applyProtectionV2                (soft-lock layer on calculated cells)
 *   - reorderTabsV2                    (canonical tab order)
 */

// ============================================================================
// NAMED RANGES + DROPDOWN VALIDATIONS
// ============================================================================
function defineNamedRangesAndValidations(ss) {
  const settings = ss.getSheetByName(SHEET_NAMES.settings);
  const set = (name, a1) => ss.setNamedRange(name, settings.getRange(a1));

  set('rng_MainCurrency',     'B3');
  set('rng_ActiveFormat',     'B4');
  set('rng_MainRate',         'B5');
  set('rng_Currencies',       'A7:A20');
  set('rng_CurrencyNames',    'B7:B20');
  set('rng_CurrencyRates',    'C7:C20');
  set('rng_FormatStrings',    'D7:D20');
  set('rng_CurrencyTable',    'A7:D20');
  set('rng_IncomeCategories', 'F7:F14');
  set('rng_ExpenseCategories','G7:G18');
  set('rng_PaymentMethods',   'H7:H10');

  // Build the three monthly-sheet validations once, reuse across all 12.
  const dvBuilder = (rangeName) => SpreadsheetApp.newDataValidation()
    .requireValueInRange(ss.getRangeByName(rangeName), true)
    .setAllowInvalid(false).build();

  const incomeCatDv  = dvBuilder('rng_IncomeCategories');
  const expenseCatDv = dvBuilder('rng_ExpenseCategories');
  const payDv        = dvBuilder('rng_PaymentMethods');

  MONTHS.forEach(m => {
    const s = ss.getSheetByName(m);
    s.getRange('C10:C28').setDataValidation(incomeCatDv);
    s.getRange('B33:B62').setDataValidation(expenseCatDv);
    s.getRange('H10:H28').setDataValidation(payDv);
    s.getRange('G33:G62').setDataValidation(payDv);
  });
}

// ============================================================================
// PROTECTION (soft-lock layer)
// ============================================================================
function applyProtectionV2(ss) {
  // Engine + FX sheets — full sheet protection
  ss.getSheetByName(SHEET_NAMES.engine).protect()
    .setDescription(WARN_ENGINE).setWarningOnly(true);
  ss.getSheetByName(SHEET_NAMES.fx).protect()
    .setDescription(WARN_ENGINE).setWarningOnly(true);

  // Welcome — protect brand surfaces
  const w = ss.getSheetByName(SHEET_NAMES.welcome);
  w.getRange('B3:Q6').protect().setDescription(WARN_BRANDING).setWarningOnly(true);
  w.getRange('B37:Q41').protect().setDescription(WARN_BRANDING).setWarningOnly(true);

  // Dashboard — every calculated panel
  const d = ss.getSheetByName(SHEET_NAMES.dashboard);
  ['B6:E12', 'F6:I12', 'J6:M12', 'N6:Q12', 'R6:U12', 'V6:Y12',
   'B14:H28', 'I14:O28', 'P14:Y28', 'B30:M44', 'N30:Y44', 'B46:Y54']
    .forEach(rng => {
      d.getRange(rng).protect().setDescription(WARN_CALC).setWarningOnly(true);
    });

  // Settings — sheet-level protect with input cells whitelisted
  const st = ss.getSheetByName(SHEET_NAMES.settings);
  const stProt = st.protect().setDescription(WARN_SETTINGS).setWarningOnly(true);
  stProt.setUnprotectedRanges([
    st.getRange('B3'),
    st.getRange('C7:C20'),
    st.getRange('F7:F14'),
    st.getRange('G7:G18'),
    st.getRange('H7:H10')
  ]);

  // Goals — protect calculated columns
  const g = ss.getSheetByName(SHEET_NAMES.goals);
  ['D7:D26', 'F7:F26', 'G7:G26', 'H7:H26', 'I7:I26'].forEach(rng => {
    g.getRange(rng).protect().setDescription(WARN_CALC).setWarningOnly(true);
  });

  // Monthly sheets — KPI panel + alert col + totals + income diff col
  MONTHS.forEach(m => {
    const ms = ss.getSheetByName(m);
    ['A1:H6', 'G10:G28', 'H33:H62', 'A29:H29', 'A63:H63'].forEach(rng => {
      ms.getRange(rng).protect().setDescription(WARN_CALC).setWarningOnly(true);
    });
  });
}

// ============================================================================
// TAB ORDER (welcome first, hidden engine + fx last)
// ============================================================================
function reorderTabsV2(ss) {
  const order = [
    SHEET_NAMES.welcome, SHEET_NAMES.settings, SHEET_NAMES.goals,
    ...MONTHS,
    SHEET_NAMES.dashboard, SHEET_NAMES.engine, SHEET_NAMES.fx
  ];

  order.forEach((name, i) => {
    const sheet = ss.getSheetByName(name);
    if (sheet) {
      ss.setActiveSheet(sheet);
      ss.moveActiveSheet(i + 1);
    }
  });
}
