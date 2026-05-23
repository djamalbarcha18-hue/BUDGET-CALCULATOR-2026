/**
 * Module: 30_named_ranges.gs
 * Layer: 3 (IO)
 *
 * Defines the 11 workbook-scoped named ranges that wire the workbook together.
 * After creating them, this module triggers applyMonthlyValidations(ss) so
 * that the data validations on monthly sheets can reference the named ranges
 * (rng_IncomeCategories, rng_ExpenseCategories, rng_PaymentMethods).
 *
 * The 11 named ranges (must match docs/01 section 4):
 *   rng_MainCurrency, rng_ActiveFormat, rng_MainRate,
 *   rng_Currencies, rng_CurrencyNames, rng_CurrencyRates, rng_FormatStrings,
 *   rng_CurrencyTable,
 *   rng_IncomeCategories, rng_ExpenseCategories, rng_PaymentMethods.
 *
 * Reads (globals): SHEET_NAMES, applyMonthlyValidations (31_validations.gs).
 *
 * The inline call to applyMonthlyValidations() preserves the original
 * monolithic install order. PR 2 will decouple this so the validation pass
 * is invoked explicitly from the entry point.
 * No A1 references are changed by PR 1.
 */

function defineNamedRanges(ss) {
  const settings = ss.getSheetByName(SHEET_NAMES.settings);
  const set = (name, a1) => ss.setNamedRange(name, settings.getRange(a1));

  set('rng_MainCurrency',     'B3');
  set('rng_ActiveFormat',     'B4');
  set('rng_MainRate',          'B5');
  set('rng_Currencies',       'A7:A20');
  set('rng_CurrencyNames',    'B7:B20');
  set('rng_CurrencyRates',    'C7:C20');
  set('rng_FormatStrings',    'D7:D20');
  set('rng_CurrencyTable',    'A7:D20');
  set('rng_IncomeCategories', 'F7:F14');
  set('rng_ExpenseCategories', 'G7:G18');
  set('rng_PaymentMethods',   'H7:H10');

  // Now apply data validations that depend on named ranges (categories, payment methods)
  applyMonthlyValidations(ss);
}
