/**
 * Module: 24_phase4_dashboard.gs
 * Layer: 3 (IO - phase builder)
 *
 * Phase 4b - builds ورقة "اللوحة الرئيسية والتقرير السنوي" with:
 *   - Title row (B2:Y2)
 *   - Six KPI cards (B4:Y8 in 4-column groups)
 *   - Conditional formatting on the trend cells (B7,F7,J7,N7,R7,V7)
 *   - Health gauge text panel (N29:S44)
 *   - Three SPARKLINE goal progress bars (T29:Y44)
 *   - Latest 5 transactions ledger (H47:N56) via QUERY against the engine
 *   - Four chart anchor stubs (B11:M26, N11:Y26, B29:G44, H29:M44) so the
 *     user can drop charts onto the painted backgrounds
 *
 * Reads (globals):
 *   T, SHEET_NAMES
 *   getOrCreateSheet, mergeAndStyle, paintCard (10_lib_apps_script.gs)
 *   buildAnnualSum, buildTrendFormula (11_lib_formulas.gs)
 *
 * No A1 references are changed by PR 1.
 */

function buildDashboard(ss) {
  const s = getOrCreateSheet(ss, SHEET_NAMES.dashboard);

  // Page background
  s.getRange(1, 1, 60, 25).setBackground(T.bgPage).setFontColor(T.fgPrimary);

  // Title row
  mergeAndStyle(s, 'B2:Y2', 'اللوحة الرئيسية والتقرير السنوي - نظام مالي ذكي متكامل',
    { bg: T.bgPage, fg: T.fgPrimary, size: 18, bold: true, align: 'center' });

  // ---- Module 1: Six KPI cards ----
  // Card 1: إجمالي الدخل (B4:E8)
  paintCard(s, 'B4:E8');
  mergeAndStyle(s, 'B4:E4', 'إجمالي الدخل', { bg: T.bgCard, fg: T.fgMuted, size: 11, align: 'right' });
  mergeAndStyle(s, 'B5:E6', '', { bg: T.bgCard, fg: T.fgPrimary, size: 24, bold: true, align: 'right' });
  s.getRange('B5').setFormula(buildAnnualSum(/*income=*/true));
  mergeAndStyle(s, 'B7:E7', '', { bg: T.bgCard, size: 12, align: 'right' });
  s.getRange('B7').setFormula(buildTrendFormula('H2', 'I2'));
  mergeAndStyle(s, 'B8:E8', 'إجمالي الدخل الفعلي السنوي عبر 12 شهراً.',
    { bg: T.bgCard, fg: T.fgMuted, size: 9, align: 'right' });

  // Card 2: إجمالي المصروفات (F4:I8)
  paintCard(s, 'F4:I8');
  mergeAndStyle(s, 'F4:I4', 'إجمالي المصروفات', { bg: T.bgCard, fg: T.fgMuted, size: 11, align: 'right' });
  mergeAndStyle(s, 'F5:I6', '', { bg: T.bgCard, fg: T.fgPrimary, size: 24, bold: true, align: 'right' });
  s.getRange('F5').setFormula(buildAnnualSum(false));
  mergeAndStyle(s, 'F7:I7', '', { bg: T.bgCard, size: 12, align: 'right' });
  s.getRange('F7').setFormula(buildTrendFormula('H3', 'I3'));
  mergeAndStyle(s, 'F8:I8', 'إجمالي المصروف الفعلي السنوي عبر 12 شهراً.',
    { bg: T.bgCard, fg: T.fgMuted, size: 9, align: 'right' });

  // Card 3: صافي الربح (J4:M8)
  paintCard(s, 'J4:M8');
  mergeAndStyle(s, 'J4:M4', 'صافي الربح', { bg: T.bgCard, fg: T.fgMuted, size: 11, align: 'right' });
  mergeAndStyle(s, 'J5:M6', '', { bg: T.bgCard, fg: T.fgPrimary, size: 24, bold: true, align: 'right' });
  s.getRange('J5').setFormula('=B5 - F5');
  mergeAndStyle(s, 'J7:M7', '', { bg: T.bgCard, size: 12, align: 'right' });
  s.getRange('J7').setFormula(buildTrendFormula('H4', 'I4'));
  mergeAndStyle(s, 'J8:M8', 'الفرق بين إجمالي الدخل وإجمالي المصروفات.',
    { bg: T.bgCard, fg: T.fgMuted, size: 9, align: 'right' });

  // Card 4: إجمالي الأصول (N4:Q8)
  paintCard(s, 'N4:Q8');
  mergeAndStyle(s, 'N4:Q4', 'إجمالي الأصول', { bg: T.bgCard, fg: T.fgMuted, size: 11, align: 'right' });
  mergeAndStyle(s, 'N5:Q6', '', { bg: T.bgCard, fg: T.fgPrimary, size: 24, bold: true, align: 'right' });
  s.getRange('N5').setFormula(`='${SHEET_NAMES.goals}'!D2 + ${SHEET_NAMES.engine}!O5`);
  mergeAndStyle(s, 'N7:Q7', '', { bg: T.bgCard, size: 12, align: 'right' });
  s.getRange('N7').setFormula(buildTrendFormula('H5', 'I5'));
  mergeAndStyle(s, 'N8:Q8', 'المبالغ المدّخرة في الأهداف + الفائض المتراكم.',
    { bg: T.bgCard, fg: T.fgMuted, size: 9, align: 'right' });

  // Card 5: إجمالي الالتزامات (R4:U8)
  paintCard(s, 'R4:U8');
  mergeAndStyle(s, 'R4:U4', 'إجمالي الالتزامات', { bg: T.bgCard, fg: T.fgMuted, size: 11, align: 'right' });
  mergeAndStyle(s, 'R5:U6', '', { bg: T.bgCard, fg: T.fgPrimary, size: 24, bold: true, align: 'right' });
  s.getRange('R5').setFormula(`='${SHEET_NAMES.goals}'!B3 * 12`);
  mergeAndStyle(s, 'R7:U7', '', { bg: T.bgCard, size: 12, align: 'right' });
  s.getRange('R7').setFormula(buildTrendFormula('H6', 'I6'));
  mergeAndStyle(s, 'R8:U8', 'الأقساط الشهريّة المطلوبة × 12 (تقدير سنوي).',
    { bg: T.bgCard, fg: T.fgMuted, size: 9, align: 'right' });

  // Card 6: معدل الادخار % (V4:Y8)
  paintCard(s, 'V4:Y8');
  mergeAndStyle(s, 'V4:Y4', 'معدل الادخار %', { bg: T.bgCard, fg: T.fgMuted, size: 11, align: 'right' });
  mergeAndStyle(s, 'V5:Y6', '', { bg: T.bgCard, fg: T.fgPrimary, size: 24, bold: true, align: 'right' });
  s.getRange('V5').setFormula('=IFERROR((B5 - F5) / B5, 0)').setNumberFormat('0.0%');
  mergeAndStyle(s, 'V7:Y7', '', { bg: T.bgCard, size: 12, align: 'right' });
  s.getRange('V7').setFormula(buildTrendFormula('H7', 'I7'));
  mergeAndStyle(s, 'V8:Y8', '(الدخل - المصروفات) / الدخل.',
    { bg: T.bgCard, fg: T.fgMuted, size: 9, align: 'right' });

  // Conditional formatting on trend cells (▲ green / ▼ red)
  const rules = s.getConditionalFormatRules();
  ['B7', 'F7', 'J7', 'N7', 'R7', 'V7'].forEach(cell => {
    const rng = s.getRange(cell);
    rules.push(
      SpreadsheetApp.newConditionalFormatRule()
        .whenFormulaSatisfied(`=LEFT($${cell},1)="▲"`)
        .setBackground(T.accentIncome).setFontColor(T.white).setRanges([rng]).build(),
      SpreadsheetApp.newConditionalFormatRule()
        .whenFormulaSatisfied(`=LEFT($${cell},1)="▼"`)
        .setBackground(T.accentTrendDown).setFontColor(T.white).setRanges([rng]).build());
  });

  // ---- Module 3: Health gauge display (text under where the chart goes) ----
  paintCard(s, 'N29:S44');
  mergeAndStyle(s, 'N29:S29', 'درجة الصحّة المالية', { bg: T.bgCard, fg: T.fgMuted, size: 11, align: 'center' });
  mergeAndStyle(s, 'N31:S38', '', { bg: T.bgCard, fg: T.fgPrimary, size: 36, bold: true, align: 'center' });
  s.getRange('N31').setFormula(`=${SHEET_NAMES.engine}!O2 & "/100"`);
  mergeAndStyle(s, 'N40:S40', '', { bg: T.bgCard, fg: T.fgPrimary, size: 14, align: 'center' });
  s.getRange('N40').setFormula(`=${SHEET_NAMES.engine}!O3`);
  mergeAndStyle(s, 'N43:S43', 'يُحدَّد مقياس الصحّة من نسبة الادخار + الانضباط الميزاني + تقدّم الأهداف.',
    { bg: T.bgCard, fg: T.fgMuted, size: 9, align: 'center', wrap: true });

  // ---- Module 3: Three SPARKLINE progress bars ----
  paintCard(s, 'T29:Y44');
  mergeAndStyle(s, 'T29:Y29', 'تقدّم الأهداف الرئيسيّة', { bg: T.bgCard, fg: T.fgMuted, size: 11, align: 'center' });

  const goalNames = ['صندوق الطوارئ', 'شراء منزل', 'صندوق التقاعد'];
  const barRows = [31, 34, 37];
  for (let i = 0; i < goalNames.length; i++) {
    const g = goalNames[i];
    const rr = barRows[i];
    s.getRange('Y' + rr).setValue(g).setFontColor(T.fgPrimary).setBackground(T.bgCard).setFontSize(11);
    // Sparkline merged across V..X
    mergeAndStyle(s, `V${rr}:X${rr}`, '', { bg: T.bgCard });
    const goalLookup = `IFERROR(XLOOKUP("${g}", '${SHEET_NAMES.goals}'!A7:A26, '${SHEET_NAMES.goals}'!D7:D26), 0)`;
    s.getRange(`V${rr}`).setFormula(
      `=SPARKLINE(${goalLookup}, {"charttype","bar"; "max",1; "color1", IF(${goalLookup} < 0.33, "${T.accentExpense}", IF(${goalLookup} < 0.66, "${T.gaugeAmber}", "${T.accentIncome}")); "empty","zero"})`);
    s.getRange('U' + rr).setFormula(`=TEXT(${goalLookup}, "0.0%")`)
      .setFontColor(T.fgPrimary).setBackground(T.bgCard).setFontSize(11)
      .setHorizontalAlignment('center');
  }

  // ---- Module 3: Latest 5 transactions ledger ----
  paintCard(s, 'H47:N56');
  const ledgerHdr = ['الشهر', 'التاريخ', 'النوع', 'الفئة', 'الوصف', 'المبلغ', 'طريقة الدفع'];
  s.getRange('H47:N47').setValues([ledgerHdr])
    .setFontWeight('bold').setBackground('#374151').setFontColor(T.fgPrimary)
    .setHorizontalAlignment('center');
  s.getRange('H48').setFormula(
    `=IFERROR(QUERY(${SHEET_NAMES.engine}!Q2:W, "select * where Col2 is not null order by Col2 desc limit 5", 0), "")`);

  // CF on the type column (J48:J52)
  const jRange = s.getRange('J48:J52');
  rules.push(
    SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied('=$J48="دخل"')
      .setBackground(T.accentIncome).setFontColor(T.white).setRanges([jRange]).build(),
    SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied('=$J48="مصروف"')
      .setBackground(T.accentExpense).setFontColor(T.white).setRanges([jRange]).build());
  s.setConditionalFormatRules(rules);

  // Stub anchors for the four charts (visible card backgrounds the user can drop charts onto)
  paintCard(s, 'B11:M26');
  mergeAndStyle(s, 'B11:M11', 'Chart 1: المقارنة الشهريّة (أدرجه يدوياً من _DashboardEngine!A1:D13)',
    { bg: T.bgCard, fg: T.fgMuted, size: 10, align: 'center', wrap: true });
  paintCard(s, 'N11:Y26');
  mergeAndStyle(s, 'N11:Y11', 'Chart 2: Waterfall - تدفّق النقد (أدرجه يدوياً من _DashboardEngine!F1:G7)',
    { bg: T.bgCard, fg: T.fgMuted, size: 10, align: 'center', wrap: true });
  paintCard(s, 'B29:G44');
  mergeAndStyle(s, 'B29:G29', 'Chart 3: دونات الدخل (أدرجه يدوياً من _DashboardEngine!I1:J9)',
    { bg: T.bgCard, fg: T.fgMuted, size: 10, align: 'center', wrap: true });
  paintCard(s, 'H29:M44');
  mergeAndStyle(s, 'H29:M29', 'Chart 4: دونات المصاريف (أدرجه يدوياً من _DashboardEngine!L1:M13)',
    { bg: T.bgCard, fg: T.fgMuted, size: 10, align: 'center', wrap: true });
}
