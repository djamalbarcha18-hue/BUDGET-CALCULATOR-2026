/**
 * Module: 21_phase2_monthly.gs
 * Layer: 3 (IO - phase builder)
 *
 * Phase 2 - builds a single monthly sheet (called 12 times by the entry point,
 * once per month name in MONTHS).
 *
 * Each monthly sheet owns:
 *   - KPI panel:        A1:G6
 *   - Income block:     A9:G29 (header row 9, data rows 10-28, totals row 29)
 *   - Expense block:    A32:H63 (header row 32, data rows 33-62, totals row 63)
 *   - Per-row alert:    H33:H62 (one IF formula per row)
 *
 * Reads (globals):
 *   T, getOrCreateSheet, mergeAndStyle (from 00_/10_ modules)
 *
 * Cross-sheet contract: the engine reads E10:E28, E33:E62, B10:B28, B33:B62,
 * A10:A28, A33:A62, C10:C28, C33:C62, G10:G28, G33:G62 from this sheet.
 * No A1 references are changed by PR 1.
 */

function buildMonth(ss, monthName) {
  const s = getOrCreateSheet(ss, monthName);

  // Title row
  mergeAndStyle(s, 'A1:G1', `ميزانية شهر ${monthName} - نظام مالي ذكي متكامل`,
    { bold: true, size: 14, align: 'center' });

  // KPI panel labels rows 2-5 (per docs/03 section 2.2)
  s.getRange('A2').setValue('العملة الرئيسية للعرض');
  s.getRange('B2').setFormula(`=IFERROR(rng_MainCurrency, "USD")`);
  s.getRange('C2').setValue('الشهر');
  s.getRange('D2').setValue(monthName);
  s.getRange('E2').setValue('مؤشر التنبيه الذكي');
  s.getRange('F2').setFormula(
    '=IF(OR(D3="", D4="", D3=0), "", IF(D4 > D3, "🔴 تجاوز الميزانية", IF(D4 >= 0.9 * D3, "🟡 اقتراب من الحد", "🟢 أداء مالي ممتاز")))');

  s.getRange('A3').setValue('إجمالي الدخل المتوقع');
  s.getRange('B3').setFormula('=SUM(D10:D28)');
  s.getRange('C3').setValue('إجمالي المصروف المتوقع');
  s.getRange('D3').setFormula('=SUM(D33:D62)');
  s.getRange('E3').setValue('نسبة الادخار');
  s.getRange('F3').setFormula('=IFERROR((B4-D4)/B4, 0)').setNumberFormat('0.0%');

  s.getRange('A4').setValue('إجمالي الدخل الفعلي');
  s.getRange('B4').setFormula('=SUM(E10:E28)');
  s.getRange('C4').setValue('إجمالي المصروف الفعلي');
  s.getRange('D4').setFormula('=SUM(E33:E62)');
  s.getRange('E4').setValue('نسبة الإنفاق');
  s.getRange('F4').setFormula('=IFERROR(D4/B4, 0)').setNumberFormat('0.0%');

  s.getRange('A5').setValue('صافي الفائض/العجز');
  s.getRange('B5').setFormula('=B4-D4');
  s.getRange('C5').setValue('أعلى فئة استنزاف');
  s.getRange('D5').setFormula(
    '=IFERROR(XLOOKUP(MAX(ARRAYFORMULA(SUMIF(B33:B62, rng_ExpenseCategories, E33:E62))), ARRAYFORMULA(SUMIF(B33:B62, rng_ExpenseCategories, E33:E62)), rng_ExpenseCategories), "")');
  s.getRange('E5').setValue('مبلغ أعلى فئة استنزاف');
  s.getRange('F5').setFormula(
    '=IFERROR(MAX(ARRAYFORMULA(SUMIF(B33:B62, rng_ExpenseCategories, E33:E62))), 0)');

  // Income block header row 9
  const incomeHdr = ['التاريخ', 'الفئة', 'الوصف', 'الدخل المتوقع', 'الدخل الفعلي', 'الفرق', 'طريقة الدفع'];
  s.getRange('A9:G9').setValues([incomeHdr])
    .setFontWeight('bold').setBackground('#374151').setFontColor(T.fgPrimary)
    .setHorizontalAlignment('center');

  // Income difference column F10:F28 (ARRAYFORMULA in F10)
  s.getRange('F10').setFormula(
    '=ARRAYFORMULA(IF((D10:D28="")+(E10:E28="")>0, "", E10:E28 - D10:D28))');

  // Income totals row 29
  s.getRange('A29').setValue('الإجمالي').setFontWeight('bold');
  s.getRange('D29').setFormula('=SUM(D10:D28)');
  s.getRange('E29').setFormula('=SUM(E10:E28)');
  s.getRange('F29').setFormula('=E29-D29');

  // Expense block header row 32
  const expenseHdr = ['التاريخ', 'الفئة', 'الوصف', 'المصروف المتوقع', 'المصروف الفعلي', 'الفرق', 'طريقة الدفع', 'حالة التنبيه'];
  s.getRange('A32:H32').setValues([expenseHdr])
    .setFontWeight('bold').setBackground('#374151').setFontColor(T.fgPrimary)
    .setHorizontalAlignment('center');

  // Expense difference column F33:F62 (ARRAYFORMULA in F33)
  s.getRange('F33').setFormula(
    '=ARRAYFORMULA(IF((D33:D62="")+(E33:E62="")>0, "", D33:D62 - E33:E62))');

  // Per-row alert column H33:H62 (one formula per row to keep IF chain clean)
  for (let r = 33; r <= 62; r++) {
    s.getRange('H' + r).setFormula(
      `=IF(OR(D${r}="", E${r}=""), "", IF(E${r} > D${r}, "🔴 تجاوز الميزانية", IF(E${r} >= 0.9 * D${r}, "🟡 اقتراب من الحد", "🟢 أداء مالي ممتاز")))`);
  }

  // Expense totals row 63
  s.getRange('A63').setValue('الإجمالي').setFontWeight('bold');
  s.getRange('D63').setFormula('=SUM(D33:D62)');
  s.getRange('E63').setFormula('=SUM(E33:E62)');
  s.getRange('F63').setFormula('=D63-E63');

  // Conditional formatting on H33:H62 (alert states)
  const rules = s.getConditionalFormatRules();
  const hRange = s.getRange('H33:H62');
  rules.push(
    SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied('=$H33="🔴 تجاوز الميزانية"')
      .setBackground('#C0392B').setFontColor(T.white).setRanges([hRange]).build(),
    SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied('=$H33="🟡 اقتراب من الحد"')
      .setBackground('#F1C40F').setFontColor('#000000').setRanges([hRange]).build(),
    SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied('=$H33="🟢 أداء مالي ممتاز"')
      .setBackground('#27AE60').setFontColor(T.white).setRanges([hRange]).build());
  s.setConditionalFormatRules(rules);

  s.setFrozenRows(6);
  s.autoResizeColumns(1, 8);
}
