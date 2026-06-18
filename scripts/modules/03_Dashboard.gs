/**
 * SMARTBUDGET PRO 2026 — Module 03: Dashboard System
 * =============================================================================
 * The evergreen dashboard with year + currency selectors:
 *   - buildDashboardV2          (layout: title bar, selectors, KPI grid, panels)
 *   - buildKpiCardsV2           (6 glassmorphism KPI cards)
 *   - buildMiddleSectionV2      (3 chart panels around the gauge)
 *   - buildDoughnutsSectionV2   (2 doughnut panels at the bottom)
 *   - buildLedgerCardV2         (latest 5 transactions, year-filtered)
 *   - buildDashboardEngineV2    (hidden engine sheet — every formula source)
 *   - buildDashboardChartsV2    (5 programmatic charts)
 *
 * All formulas reference dashboard!$B$4 (year) and dashboard!$J$4 (FX
 * multiplier) so changing either dropdown reflows the entire dashboard.
 */

// ============================================================================
// DASHBOARD LAYOUT
// ============================================================================
function buildDashboardV2(ss) {
  const s = getOrCreateSheet(ss, SHEET_NAMES.dashboard);
  s.clear();

  s.getRange(1, 1, 60, 26).setBackground(T.bgPage)
    .setFontColor(T.fgPrimary).setFontFamily(FONT);
  for (let c = 1; c <= 26; c++) s.setColumnWidth(c, 56);

  s.setRowHeight(2, 56);
  mergeAndStyle(s, 'B2:Q2', 'نظام الإدارة المالية الشاملة',
    { bg: T.bgPage, fg: T.fgPrimary, size: 28, bold: true, align: 'right', fontFamily: FONT });

  // Selector labels (row 3)
  s.setRowHeight(3, 24);
  mergeAndStyle(s, 'S3:T3', 'السنة',
    { bg: T.bgPage, fg: T.fgMuted, size: 12, bold: true, align: 'center', fontFamily: FONT });
  mergeAndStyle(s, 'V3:W3', 'العملة',
    { bg: T.bgPage, fg: T.fgMuted, size: 12, bold: true, align: 'center', fontFamily: FONT });

  // Selector visible mirrors (row 4)
  s.setRowHeight(4, 36);
  mergeAndStyle(s, 'S4:T4', '',
    { bg: T.bgCard, fg: T.fgPrimary, size: 16, bold: true, align: 'center', fontFamily: FONT });
  mergeAndStyle(s, 'V4:W4', '',
    { bg: T.bgCard, fg: T.fgPrimary, size: 16, bold: true, align: 'center', fontFamily: FONT });

  // Hidden control cells: B4 = year, D4 = currency
  s.getRange('B4').setValue(new Date().getFullYear()).setFontFamily(FONT);
  s.getRange('B4').setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(YEARS_LIST, true)
      .setAllowInvalid(false).build());
  s.getRange('D4').setValue('USD').setFontFamily(FONT);
  s.getRange('D4').setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(CURRENCY_CODES, true)
      .setAllowInvalid(false).build());

  // Mirror controls into visible selector cells
  s.getRange('S4').setFormula('=B4').setNumberFormat(FORMATS.year).setFontFamily(FONT);
  s.getRange('V4').setFormula('=D4').setFontFamily(FONT);

  // FX rate computation: F4 (display rate) / H4 (base rate) → J4 (multiplier)
  s.getRange('F4').setFormula(
    `=IFERROR(VLOOKUP(D4,${SHEET_NAMES.fx}!A:B,2,FALSE),1)`)
    .setNumberFormat(FORMATS.rate);
  s.getRange('H4').setFormula(
    `=IFERROR(VLOOKUP(IFERROR(rng_MainCurrency,"USD"),${SHEET_NAMES.fx}!A:B,2,FALSE),1)`)
    .setNumberFormat(FORMATS.rate);
  s.getRange('J4').setFormula('=IFERROR(F4/H4,1)').setNumberFormat(FORMATS.rate);

  buildKpiCardsV2(s);
  buildMiddleSectionV2(s);
  buildDoughnutsSectionV2(s);
  buildLedgerCardV2(s);
}

// ----------------------------------------------------------------------------
// 6 Premium KPI Cards (glassmorphism)
// ----------------------------------------------------------------------------
function buildKpiCardsV2(s) {
  const eng = `'${SHEET_NAMES.engine}'`;
  const cards = [
    { range: 'B6:E12',  icon: '💰', label: 'إجمالي الدخل',
      formula: `=IFERROR(SUM(${eng}!B2:B13),0)`,                  format: FORMATS.money,   accent: T.income },
    { range: 'F6:I12',  icon: '💸', label: 'إجمالي المصروفات',
      formula: `=IFERROR(SUM(${eng}!C2:C13),0)`,                  format: FORMATS.money,   accent: T.expense },
    { range: 'J6:M12',  icon: '📈', label: 'صافي الربح',
      formula: `=IFERROR(SUM(${eng}!D2:D13),0)`,                  format: FORMATS.money,   accent: T.netCyan },
    { range: 'N6:Q12',  icon: '💎', label: 'إجمالي الأصول',
      formula: `=IFERROR(SUM(${eng}!D2:D13)*1.5,0)`,              format: FORMATS.money,   accent: T.netCyan },
    { range: 'R6:U12',  icon: '📊', label: 'معدل الادخار',
      formula: `=IFERROR((SUM(${eng}!B2:B13)-SUM(${eng}!C2:C13))/SUM(${eng}!B2:B13),0)`,
      format: FORMATS.percent, accent: T.income },
    { range: 'V6:Y12',  icon: '🔄', label: 'صافي اتجاه الشهر الماضي',
      formula: `=IFERROR(${eng}!P2,0)`,                           format: FORMATS.money,   accent: T.warnAmber }
  ];

  cards.forEach(c => {
    const { colStart, colEnd } = alphaSplit(c.range);
    applyCardSurface(s, c.range);
    s.getRange(`${colStart}6:${colStart}12`).setBackground(c.accent);

    mergeAndStyle(s, `${colStart}6:${colEnd}6`, c.icon,
      { bg: T.bgCard, fg: c.accent, size: 20, bold: true, align: 'right', fontFamily: FONT });
    mergeAndStyle(s, `${colStart}7:${colEnd}7`, c.label,
      { bg: T.bgCard, fg: T.fgMuted, size: 14, align: 'right', fontFamily: FONT });
    mergeAndStyle(s, `${colStart}8:${colEnd}10`, '',
      { bg: T.bgCard, fg: T.fgPrimary, size: 32, bold: true, align: 'right',
        vAlign: 'middle', fontFamily: FONT });
    s.getRange(`${colStart}8`).setFormula(c.formula).setNumberFormat(c.format);
    mergeAndStyle(s, `${colStart}11:${colEnd}12`, '',
      { bg: T.bgCard, fg: T.fgMuted, size: 11, align: 'right', fontFamily: FONT });
  });

  s.setRowHeight(6, 28);
  s.setRowHeight(7, 22);
  for (let r = 8; r <= 10; r++) s.setRowHeight(r, 28);
  s.setRowHeight(11, 18);
  s.setRowHeight(12, 18);
}

// ----------------------------------------------------------------------------
// Middle section: 3 chart panels
// ----------------------------------------------------------------------------
function buildMiddleSectionV2(s) {
  const sections = [
    { range: 'B14:H28', title: 'تدفق الأموال السنوي' },
    { range: 'I14:O28', title: 'درجة الصحة المالية' },
    { range: 'P14:Y28', title: 'مقارنة الأداء المالي (12 شهرا)' }
  ];

  sections.forEach(sec => {
    applyCardSurface(s, sec.range);
    const { colStart, colEnd } = alphaSplit(sec.range);
    const titleR = s.getRange(`${colStart}14:${colEnd}14`);
    try { titleR.merge(); } catch (e) {}
    titleR.setFormula(`="${sec.title} - " & TEXT($B$4,"0") & " - " & $D$4`)
      .setBackground(T.bgCard).setFontColor(T.fgPrimary).setFontFamily(FONT)
      .setFontSize(16).setFontWeight('bold')
      .setHorizontalAlignment('center').setVerticalAlignment('middle');
  });

  s.setRowHeight(14, 32);
  for (let r = 15; r <= 28; r++) s.setRowHeight(r, 22);
}

// ----------------------------------------------------------------------------
// Doughnuts section: 2 panels side by side
// ----------------------------------------------------------------------------
function buildDoughnutsSectionV2(s) {
  const doughnuts = [
    { range: 'B30:M44', title: 'توزيع مصادر الدخل' },
    { range: 'N30:Y44', title: 'تحليل المصاريف السنوية' }
  ];

  doughnuts.forEach(d => {
    applyCardSurface(s, d.range);
    const { colStart, colEnd } = alphaSplit(d.range);
    const titleR = s.getRange(`${colStart}30:${colEnd}30`);
    try { titleR.merge(); } catch (e) {}
    titleR.setFormula(`="${d.title} - " & TEXT($B$4,"0") & " - " & $D$4`)
      .setBackground(T.bgCard).setFontColor(T.fgPrimary).setFontFamily(FONT)
      .setFontSize(16).setFontWeight('bold')
      .setHorizontalAlignment('center').setVerticalAlignment('middle');
  });

  s.setRowHeight(30, 32);
  for (let r = 31; r <= 44; r++) s.setRowHeight(r, 22);
}

// ----------------------------------------------------------------------------
// Latest 5 transactions ledger (year-filtered via QUERY)
// ----------------------------------------------------------------------------
function buildLedgerCardV2(s) {
  applyCardSurface(s, 'B46:Y54');

  const titleR = s.getRange('B46:Y46');
  try { titleR.merge(); } catch (e) {}
  titleR.setFormula('="آخر 5 معاملات - " & TEXT($B$4,"0") & " - " & $D$4')
    .setBackground(T.bgCard).setFontColor(T.fgPrimary).setFontFamily(FONT)
    .setFontSize(16).setFontWeight('bold')
    .setHorizontalAlignment('center').setVerticalAlignment('middle');

  styleHeader(s.getRange('H47:N47').setValues([['الشهر', 'التاريخ', 'النوع',
    'الفئة', 'الوصف', 'المبلغ', 'طريقة الدفع']])
    .setFontSize(12).setHorizontalAlignment('center'));

  s.getRange('H48').setFormula(
    `=IFERROR(QUERY('${SHEET_NAMES.engine}'!Q2:W,` +
    `"select * where Col2 is not null and YEAR(Col2)=" & B4 & ` +
    `" order by Col2 desc limit 5", 0), "")`);

  s.getRange('I48:I52').setNumberFormat(FORMATS.date);
  s.getRange('M48:M52').setNumberFormat(FORMATS.money);

  s.setRowHeight(46, 32);
  for (let r = 47; r <= 54; r++) s.setRowHeight(r, 24);
}

// ============================================================================
// DASHBOARD ENGINE (hidden) — every formula source
// ============================================================================
function buildDashboardEngineV2(ss) {
  const s = getOrCreateSheet(ss, SHEET_NAMES.engine);
  s.clear();

  const yr = `'${SHEET_NAMES.dashboard}'!$B$4`;
  const fx = `'${SHEET_NAMES.dashboard}'!$J$4`;

  // A:D — monthly grid (12 months)
  styleHeader(s.getRange('A1:D1').setValues([['الشهر', 'الدخل', 'المصروف', 'الصافي']]));
  for (let i = 0; i < 12; i++) {
    const m   = MONTHS[i];
    const row = i + 2;
    s.getRange(row, 1).setValue(m).setFontFamily(FONT);
    s.getRange(row, 2).setFormula(buildYearSum(m, 'B', 'F', 10, 28, yr, fx));
    s.getRange(row, 3).setFormula(buildYearSum(m, 'A', 'E', 33, 62, yr, fx));
    s.getRange(row, 4).setFormula(`=B${row}-C${row}`);
  }

  // F:G — cash flow waterfall
  styleHeader(s.getRange('F1:G1').setValues([['البند', 'القيمة']]));
  s.getRange('F2').setValue('إجمالي الدخل').setFontFamily(FONT);
  s.getRange('G2').setFormula('=IFERROR(SUM(B2:B13),0)');
  s.getRange('F3').setValue('السكن').setFontFamily(FONT);
  s.getRange('G3').setFormula(`=-1*${buildCategoryYearSum('السكن', true, yr, fx)}`);
  s.getRange('F4').setValue('الطعام').setFontFamily(FONT);
  s.getRange('G4').setFormula(`=-1*${buildCategoryYearSum('الطعام', true, yr, fx)}`);
  s.getRange('F5').setValue('النقل').setFontFamily(FONT);
  s.getRange('G5').setFormula(`=-1*${buildCategoryYearSum('النقل', true, yr, fx)}`);
  s.getRange('F6').setValue('باقي المصاريف').setFontFamily(FONT);
  s.getRange('G6').setFormula('=IFERROR(-1*(SUM(C2:C13)+G3+G4+G5),0)');
  s.getRange('F7').setValue('صافي الربح').setFontFamily(FONT);
  s.getRange('G7').setFormula('=IFERROR(SUM(G2:G6),0)');

  // I:J — income source doughnut data
  styleHeader(s.getRange('I1:J1').setValues([['فئة الدخل', 'الإجمالي']]));
  INCOME_CATEGORIES.forEach((cat, ic) => {
    s.getRange(ic + 2, 9).setValue(cat).setFontFamily(FONT);
    s.getRange(ic + 2, 10).setFormula(buildCategoryYearSum(cat, false, yr, fx));
  });

  // L:M — expense category doughnut data
  styleHeader(s.getRange('L1:M1').setValues([['فئة المصاريف', 'الإجمالي']]));
  EXPENSE_CATEGORIES.forEach((cat, ec) => {
    s.getRange(ec + 2, 12).setValue(cat).setFontFamily(FONT);
    s.getRange(ec + 2, 13).setFormula(buildCategoryYearSum(cat, true, yr, fx));
  });

  // O — composite health score (40 savings + 30 budget discipline + 30 goals)
  s.getRange('O1').setValue('الصحة').setFontWeight('bold').setFontFamily(FONT);
  s.getRange('O2').setFormula(
    '=ROUND(40*MAX(0,MIN(1,IFERROR((SUM(B2:B13)-SUM(C2:C13))/SUM(B2:B13),0)))' +
    '+30*MAX(0,MIN(1,IFERROR(SUM(B2:B13)/(SUM(B2:B13)+SUM(C2:C13)),0)))' +
    '+30*IF(SUM(D2:D13)>0,1,0.3),0)');

  // P — last completed month net (KPI feeder)
  s.getRange('P1').setValue('صافي الشهر الماضي').setFontWeight('bold').setFontFamily(FONT);
  s.getRange('P2').setFormula(
    '=IFERROR(INDEX(D2:D13, MAX(1, MIN(12, MONTH(TODAY())-1))), 0)');

  // Q:W — stacked transaction ledger (income then expense per month)
  styleHeader(s.getRange('Q1:W1').setValues([['الشهر', 'التاريخ', 'النوع',
    'الفئة', 'الوصف', 'المبلغ', 'الدفع']]));

  let row2 = 2;
  // Income per month
  MONTHS.forEach(lm => {
    s.getRange(`Q${row2}`).setFormula(`=ARRAYFORMULA(IF('${lm}'!B10:B28="","","${lm}"))`);
    s.getRange(`R${row2}`).setFormula(`=ARRAYFORMULA('${lm}'!B10:B28)`);
    s.getRange(`S${row2}`).setFormula(`=ARRAYFORMULA(IF('${lm}'!B10:B28="","","دخل"))`);
    s.getRange(`T${row2}`).setFormula(`=ARRAYFORMULA('${lm}'!C10:C28)`);
    s.getRange(`U${row2}`).setFormula(`=ARRAYFORMULA('${lm}'!D10:D28)`);
    s.getRange(`V${row2}`).setFormula(`=ARRAYFORMULA('${lm}'!F10:F28*${fx})`);
    s.getRange(`W${row2}`).setFormula(`=ARRAYFORMULA('${lm}'!H10:H28)`);
    row2 += 19;
  });
  // Expense per month
  MONTHS.forEach(em => {
    s.getRange(`Q${row2}`).setFormula(`=ARRAYFORMULA(IF('${em}'!A33:A62="","","${em}"))`);
    s.getRange(`R${row2}`).setFormula(`=ARRAYFORMULA('${em}'!A33:A62)`);
    s.getRange(`S${row2}`).setFormula(`=ARRAYFORMULA(IF('${em}'!A33:A62="","","مصروف"))`);
    s.getRange(`T${row2}`).setFormula(`=ARRAYFORMULA('${em}'!B33:B62)`);
    s.getRange(`U${row2}`).setFormula(`=ARRAYFORMULA('${em}'!C33:C62)`);
    s.getRange(`V${row2}`).setFormula(`=ARRAYFORMULA('${em}'!E33:E62*${fx})`);
    s.getRange(`W${row2}`).setFormula(`=ARRAYFORMULA('${em}'!G33:G62)`);
    row2 += 30;
  });
}

// ============================================================================
// 5 PROGRAMMATIC CHARTS
// ============================================================================
function buildDashboardChartsV2(ss) {
  const dash = ss.getSheetByName(SHEET_NAMES.dashboard);
  const eng  = ss.getSheetByName(SHEET_NAMES.engine);

  // Idempotent: nuke any pre-existing chart before rebuilding
  dash.getCharts().forEach(c => dash.removeChart(c));

  const darkAxis = {
    textStyle:      { color: T.fgPrimary, fontSize: 11, fontName: FONT },
    titleTextStyle: { color: T.fgPrimary, fontSize: 12, fontName: FONT },
    gridlines:      { color: T.gridline },
    minorGridlines: { color: T.gridline }
  };
  const darkLegend = pos => ({
    position: pos,
    textStyle: { color: T.fgPrimary, fontSize: 11, fontName: FONT }
  });

  // 1) Cash flow column chart at B15
  dash.insertChart(
    dash.newChart().setChartType(Charts.ChartType.COLUMN)
      .addRange(eng.getRange('F1:G7'))
      .setPosition(15, 2, 0, 0)
      .setOption('useFirstColumnAsDomain', true)
      .setOption('backgroundColor', T.bgCard)
      .setOption('legend', { position: 'none' })
      .setOption('hAxis', darkAxis).setOption('vAxis', darkAxis)
      .setOption('chartArea', { left: '15%', top: '8%', width: '80%', height: '80%' })
      .setOption('series', { 0: { color: T.netCyan } })
      .setOption('width', 420).setOption('height', 320).build()
  );

  // 2) Health score gauge at I15
  dash.insertChart(
    dash.newChart().setChartType(Charts.ChartType.GAUGE)
      .addRange(eng.getRange('O1:O2'))
      .setPosition(15, 9, 0, 0)
      .setOption('min', 0).setOption('max', 100)
      .setOption('redFrom', 0).setOption('redTo', 39)
      .setOption('yellowFrom', 40).setOption('yellowTo', 69)
      .setOption('greenFrom', 70).setOption('greenTo', 100)
      .setOption('minorTicks', 5)
      .setOption('width', 400).setOption('height', 320).build()
  );

  // 3) 12-month combo at P15
  dash.insertChart(
    dash.newChart().setChartType(Charts.ChartType.COMBO)
      .addRange(eng.getRange('A1:D13'))
      .setPosition(15, 16, 0, 0)
      .setOption('useFirstColumnAsDomain', true)
      .setOption('backgroundColor', T.bgCard)
      .setOption('legend', darkLegend('bottom'))
      .setOption('hAxis', darkAxis).setOption('vAxis', darkAxis)
      .setOption('chartArea', { left: '12%', top: '8%', width: '82%', height: '70%' })
      .setOption('seriesType', 'bars')
      .setOption('series', {
        0: { type: 'bars', color: T.income },
        1: { type: 'bars', color: T.expense },
        2: { type: 'line', color: T.netCyan, lineWidth: 3, pointSize: 6 }
      })
      .setOption('width', 600).setOption('height', 320).build()
  );

  // 4) Income source doughnut at B31
  dash.insertChart(
    dash.newChart().setChartType(Charts.ChartType.PIE)
      .addRange(eng.getRange('I1:J9'))
      .setPosition(31, 2, 0, 0)
      .setOption('pieHole', 0.55)
      .setOption('backgroundColor', T.bgCard)
      .setOption('legend', darkLegend('right'))
      .setOption('chartArea', { left: '5%', top: '8%', width: '90%', height: '85%' })
      .setOption('colors', [
        T.income, T.paletteBlue, T.palettePurple, T.paletteOrange,
        T.paletteLime, T.netCyan, T.palettePink, T.fgMuted
      ])
      .setOption('pieSliceText', 'percentage')
      .setOption('pieSliceTextStyle', { color: T.white, fontSize: 11, bold: true, fontName: FONT })
      .setOption('pieSliceBorderColor', T.bgCard)
      .setOption('width', 660).setOption('height', 320).build()
  );

  // 5) Annual expense distribution doughnut at N31
  dash.insertChart(
    dash.newChart().setChartType(Charts.ChartType.PIE)
      .addRange(eng.getRange('L1:M13'))
      .setPosition(31, 14, 0, 0)
      .setOption('pieHole', 0.55)
      .setOption('backgroundColor', T.bgCard)
      .setOption('legend', darkLegend('right'))
      .setOption('chartArea', { left: '5%', top: '8%', width: '90%', height: '85%' })
      .setOption('colors', DOUGHNUT_COLORS)
      .setOption('pieSliceText', 'percentage')
      .setOption('pieSliceTextStyle', { color: T.white, fontSize: 11, bold: true, fontName: FONT })
      .setOption('pieSliceBorderColor', T.bgCard)
      .setOption('width', 660).setOption('height', 320).build()
  );
}
