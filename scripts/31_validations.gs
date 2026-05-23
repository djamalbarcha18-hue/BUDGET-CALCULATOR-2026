/**
 * Module: 31_validations.gs
 * Layer: 3 (IO)
 *
 * Applies data validations to all 12 monthly sheets:
 *   B10:B28, B33:B62  -> rng_IncomeCategories / rng_ExpenseCategories
 *   G10:G28, G33:G62  -> rng_PaymentMethods
 *
 * Called by defineNamedRanges() AFTER the named ranges are created (the
 * validations reference them by name). Splitting this into its own module
 * keeps the dependency direction explicit even though the call site is
 * unchanged in PR 1.
 *
 * Reads (globals): MONTHS.
 * No A1 references are changed by PR 1.
 */

function applyMonthlyValidations(ss) {
  const incomeCatDv = SpreadsheetApp.newDataValidation()
    .requireValueInRange(ss.getRangeByName('rng_IncomeCategories'), true)
    .setAllowInvalid(false).build();
  const expenseCatDv = SpreadsheetApp.newDataValidation()
    .requireValueInRange(ss.getRangeByName('rng_ExpenseCategories'), true)
    .setAllowInvalid(false).build();
  const payDv = SpreadsheetApp.newDataValidation()
    .requireValueInRange(ss.getRangeByName('rng_PaymentMethods'), true)
    .setAllowInvalid(false).build();

  for (const m of MONTHS) {
    const s = ss.getSheetByName(m);
    s.getRange('B10:B28').setDataValidation(incomeCatDv);
    s.getRange('B33:B62').setDataValidation(expenseCatDv);
    s.getRange('G10:G28').setDataValidation(payDv);
    s.getRange('G33:G62').setDataValidation(payDv);
  }
}
