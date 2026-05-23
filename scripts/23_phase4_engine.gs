/**
 * Module: 23_phase4_engine.gs
 * Layer: 3 (IO - phase builder)
 *
 * Phase 4a - builds the hidden `_DashboardEngine` sheet that aggregates the
 * 12 monthly sheets into the data anchors consumed by the dashboard charts:
 *
 *   A1:D13   Monthly comparison grid (income, expense, net per month)
 *   F1:G7    Waterfall data (income -> top categories -> rest -> net)
 *   H2:I7    Trend current/prior pairs for the six KPI cards
 *   I1:J9    Income source doughnut (8 categories)
 *   L1:M13   Expense category doughnut (12 categories)
 *   O2:O3    Composite health score (0..100) + qualitative label
 *   O5       Cumulative net surplus (used by Card K4)
 *   Q1:W~590 Stacked transactions ledger (12 months income + 12 months expense)
 *
 * Reads (globals):
 *   T, SHEET_NAMES, MONTHS, INCOME_CATEGORIES, EXPENSE_CATEGORIES
 *   getOrCreateSheet (10_lib_apps_script.gs)
 *   buildCategorySumFormula (11_lib_formulas.gs)
 *
 * No A1 references are changed by PR 1.
 */

function buildDashboardEngine(ss) {
  const s = getOrCreateSheet(ss, SHEET_NAMES.engine);

  // A:D - Monthly comparison grid (per docs/07 section 8.1)
  s.getRange('A1:D1').setValues([['الشهر', 'الدخل الفعلي', 'المصروف الفعلي', 'صافي الربح']])
    .setFontWeight('bold').setBackground('#374151').setFontColor(T.fgPrimary);
  for (let i = 0; i < 12; i++) {
    const m = MONTHS[i];
    const row = i + 2;
    s.getRange('A' + row).setValue(m);
    s.getRange('B' + row).setFormula(`=SUM('${m}'!E10:E28)`);
    s.getRange('C' + row).setFormula(`=SUM('${m}'!E33:E62)`);
    s.getRange('D' + row).setFormula(`=B${row}-C${row}`);
  }

  // O5: cumulative net surplus (used by Card K4)
  s.getRange('O5').setFormula('=SUM(D2:D13)');

  // F:G - Waterfall data (per docs/07 section 4.2.1)
  s.getRange('F1:G1').setValues([['العنصر', 'المبلغ']])
    .setFontWeight('bold').setBackground('#374151').setFontColor(T.fgPrimary);
  s.getRange('F2').setValue('إجمالي الدخل');
  s.getRange('G2').setFormula(`='${SHEET_NAMES.dashboard}'!B5`);
  s.getRange('F3').setValue('السكن');
  s.getRange('G3').setFormula(buildCategorySumFormula('السكن', /*expense=*/true, /*negate=*/true));
  s.getRange('F4').setValue('الطعام');
  s.getRange('G4').setFormula(buildCategorySumFormula('الطعام', true, true));
  s.getRange('F5').setValue('المواصلات');
  s.getRange('G5').setFormula(buildCategorySumFormula('النقل', true, true)); // canonical category is النقل
  s.getRange('F6').setValue('باقي المصاريف');
  s.getRange('G6').setFormula(`=-1 * ('${SHEET_NAMES.dashboard}'!F5 + G3 + G4 + G5)`);
  s.getRange('F7').setValue('صافي الربح');
  s.getRange('G7').setFormula(`='${SHEET_NAMES.dashboard}'!J5`);

  // H:I - Trend current/prior (per docs/07 section 8.3)
  s.getRange('H2').setFormula('=SUM(B2:B13)');     // Total income (current)
  s.getRange('I2').setFormula('=SUM(B2:B12)');     // Total income (prior, last 11 months)
  s.getRange('H3').setFormula('=SUM(C2:C13)');     // Total expense (current)
  s.getRange('I3').setFormula('=SUM(C2:C12)');     // Total expense (prior)
  s.getRange('H4').setFormula('=H2-H3');           // Net profit (current)
  s.getRange('I4').setFormula('=I2-I3');           // Net profit (prior)
  s.getRange('H5').setFormula(`='${SHEET_NAMES.goals}'!D2 + O5`);                     // Assets (current)
  s.getRange('I5').setFormula(`='${SHEET_NAMES.goals}'!D2 + SUM(D2:D12)`);            // Assets (prior)
  s.getRange('H6').setFormula(`='${SHEET_NAMES.goals}'!B3 * 12`);                     // Liabilities (current)
  s.getRange('I6').setFormula(`='${SHEET_NAMES.goals}'!B3 * 11`);                     // Liabilities (prior)
  s.getRange('H7').setFormula('=IFERROR((H2-H3)/H2, 0)');                             // Savings rate (current)
  s.getRange('I7').setFormula('=IFERROR((I2-I3)/I2, 0)');                             // Savings rate (prior)

  // I:J - Income source doughnut (per docs/07 section 4.3)
  s.getRange('I1:J1').setValues([['فئة الدخل', 'الإجمالي']])
    .setFontWeight('bold').setBackground('#374151').setFontColor(T.fgPrimary);
  for (let i = 0; i < INCOME_CATEGORIES.length; i++) {
    s.getRange(2 + i, 9).setValue(INCOME_CATEGORIES[i]);
    s.getRange(2 + i, 10).setFormula(buildCategorySumFormula('', /*expense=*/false, /*negate=*/false, `I${2 + i}`));
  }

  // L:M - Expense category doughnut (per docs/07 section 4.4)
  s.getRange('L1:M1').setValues([['فئة المصاريف', 'الإجمالي']])
    .setFontWeight('bold').setBackground('#374151').setFontColor(T.fgPrimary);
  for (let i = 0; i < EXPENSE_CATEGORIES.length; i++) {
    s.getRange(2 + i, 12).setValue(EXPENSE_CATEGORIES[i]);
    s.getRange(2 + i, 13).setFormula(buildCategorySumFormula('', true, false, `L${2 + i}`));
  }

  // O2 - Composite health score (40 savings + 30 budget discipline + 30 goal progress)
  const monthlyExpectedExpenseSum = MONTHS.map(m => `'${m}'!D33:D62`).join(', ');
  s.getRange('O2').setFormula(
    `=ROUND(40 * MAX(0, MIN(1, IFERROR(('${SHEET_NAMES.dashboard}'!B5 - '${SHEET_NAMES.dashboard}'!F5) / '${SHEET_NAMES.dashboard}'!B5, 0))) + 30 * MAX(0, MIN(1, IFERROR(1 - ('${SHEET_NAMES.dashboard}'!F5 / SUM(${monthlyExpectedExpenseSum})), 0))) + 30 * IFERROR('${SHEET_NAMES.goals}'!F2, 0), 0)`);
  s.getRange('O3').setFormula('=IFS(O2>=90, "ممتاز", O2>=75, "جيد", O2>=60, "مقبول", TRUE, "يحتاج إلى تحسين")');

  // Q:W - Stacked transactions for ledger (we keep this as a SIMPLER variant: just the
  // current 12-month income+expense rows via 24 separate ARRAYFORMULA blocks).
  s.getRange('Q1:W1').setValues([['الشهر', 'التاريخ', 'النوع', 'الفئة', 'الوصف', 'المبلغ', 'طريقة الدفع']])
    .setFontWeight('bold').setBackground('#374151').setFontColor(T.fgPrimary);

  // Income blocks: 12 months × 19 rows = rows 2..(2 + 12*19 -1) = 2..229
  // Expense blocks: rows 230..(230 + 12*30 -1) = 230..589
  // Approach: write per-month ARRAYFORMULAs so each row is dynamic.
  let row = 2;
  for (let i = 0; i < MONTHS.length; i++) {
    const m = MONTHS[i];
    s.getRange('Q' + row).setFormula(`=ARRAYFORMULA(IF('${m}'!A10:A28="", "", "${m}"))`);
    s.getRange('R' + row).setFormula(`=ARRAYFORMULA('${m}'!A10:A28)`);
    s.getRange('S' + row).setFormula(`=ARRAYFORMULA(IF('${m}'!A10:A28="", "", "دخل"))`);
    s.getRange('T' + row).setFormula(`=ARRAYFORMULA('${m}'!B10:B28)`);
    s.getRange('U' + row).setFormula(`=ARRAYFORMULA('${m}'!C10:C28)`);
    s.getRange('V' + row).setFormula(`=ARRAYFORMULA('${m}'!E10:E28)`);
    s.getRange('W' + row).setFormula(`=ARRAYFORMULA('${m}'!G10:G28)`);
    row += 19;
  }
  for (let i = 0; i < MONTHS.length; i++) {
    const m = MONTHS[i];
    s.getRange('Q' + row).setFormula(`=ARRAYFORMULA(IF('${m}'!A33:A62="", "", "${m}"))`);
    s.getRange('R' + row).setFormula(`=ARRAYFORMULA('${m}'!A33:A62)`);
    s.getRange('S' + row).setFormula(`=ARRAYFORMULA(IF('${m}'!A33:A62="", "", "مصروف"))`);
    s.getRange('T' + row).setFormula(`=ARRAYFORMULA('${m}'!B33:B62)`);
    s.getRange('U' + row).setFormula(`=ARRAYFORMULA('${m}'!C33:C62)`);
    s.getRange('V' + row).setFormula(`=ARRAYFORMULA('${m}'!E33:E62)`);
    s.getRange('W' + row).setFormula(`=ARRAYFORMULA('${m}'!G33:G62)`);
    row += 30;
  }
}
