/**
 * Module: 20_phase1_settings.gs
 * Layer: 3 (IO - phase builder)
 *
 * Phase 1 - builds ورقة "الإعدادات وأسعار الصرف" with 14 currencies, income
 * and expense categories, payment methods, and the active currency selector
 * at B3 (formulas at B4/B5 derive the active format and rate via XLOOKUP).
 *
 * Reads (globals):
 *   T, SHEET_NAMES, CURRENCIES, INCOME_CATEGORIES, EXPENSE_CATEGORIES,
 *   PAYMENT_METHODS
 *   getOrCreateSheet, mergeAndStyle (from 10_lib_apps_script.gs)
 *
 * Owns A1:H20 of the settings sheet. No A1 references are changed by PR 1.
 */

function buildSettings(ss) {
  const s = getOrCreateSheet(ss, SHEET_NAMES.settings);

  // Title
  mergeAndStyle(s, 'A1:D1', 'نظام مالي ذكي متكامل - الإعدادات وأسعار الصرف',
    { bold: true, size: 14, align: 'center' });
  mergeAndStyle(s, 'A2:D2',
    'يجب تحديث أسعار الصرف يدوياً أو عبر دالة GOOGLEFINANCE قبل بدء كل شهر مالي.',
    { fg: T.fgMuted, size: 10, align: 'center' });

  // Main currency selector + active format + active rate
  s.getRange('A3').setValue('العملة الرئيسية للعرض');
  s.getRange('B3').setValue('USD');
  s.getRange('A4').setValue('تنسيق العملة النشط');
  s.getRange('B4').setFormula('=XLOOKUP(B3, A7:A20, D7:D20)');
  s.getRange('A5').setValue('سعر صرف العملة الرئيسية مقابل الدولار');
  s.getRange('B5').setFormula('=XLOOKUP(B3, A7:A20, C7:C20)');

  // Currency table header
  const header = ['رمز العملة', 'اسم العملة', 'سعر الصرف مقابل الدولار USD', 'التنسيق المالي الافتراضي'];
  s.getRange('A6:D6').setValues([header])
    .setFontWeight('bold').setBackground('#374151').setFontColor(T.fgPrimary);

  // 14 currencies
  s.getRange(7, 1, CURRENCIES.length, 4).setValues(CURRENCIES);

  // Income categories at F6:F14
  s.getRange('F6').setValue('فئات الدخل').setFontWeight('bold').setBackground('#374151').setFontColor(T.fgPrimary);
  s.getRange(7, 6, INCOME_CATEGORIES.length, 1)
    .setValues(INCOME_CATEGORIES.map(v => [v]));

  // Expense categories at G6:G18
  s.getRange('G6').setValue('فئات المصاريف').setFontWeight('bold').setBackground('#374151').setFontColor(T.fgPrimary);
  s.getRange(7, 7, EXPENSE_CATEGORIES.length, 1)
    .setValues(EXPENSE_CATEGORIES.map(v => [v]));

  // Payment methods at H6:H10
  s.getRange('H6').setValue('طرق الدفع').setFontWeight('bold').setBackground('#374151').setFontColor(T.fgPrimary);
  s.getRange(7, 8, PAYMENT_METHODS.length, 1)
    .setValues(PAYMENT_METHODS.map(v => [v]));

  // Validate B3 against rng_Currencies (we'll set the real validation after named ranges exist;
  // here we use a direct range reference because rng_Currencies isn't defined yet).
  const dvCur = SpreadsheetApp.newDataValidation()
    .requireValueInRange(s.getRange('A7:A20'), true)
    .setAllowInvalid(false).build();
  s.getRange('B3').setDataValidation(dvCur);

  // Auto-resize for legibility.
  s.autoResizeColumns(1, 8);
}
