/**
 * SMARTBUDGET PRO 2026 — Module 05: Demo Data & QA Tools
 * =============================================================================
 * Optional tools for testing, recovery, and onboarding:
 *   - fillAllMonthsWithDemoData    populate 5 income + 5 expense per month
 *   - clearAllDemoData             wipe demo rows
 *   - addMonthlyVisualAnalytics    add column + doughnut inside each month
 *   - removeMonthlyVisualAnalytics remove them
 *   - repairDashboardV2            rewrite engine + charts
 *   - resetWorkbookCompletely      nuclear reset (UI-confirmed wrapper)
 */

// ============================================================================
// DEMO DATA FILLER
// ============================================================================
function fillAllMonthsWithDemoData(silent) {
  const startTime = new Date();
  const ss = SpreadsheetApp.getActive();
  let totalI = 0, totalE = 0, processed = 0;

  Logger.log('=== Demo Data Filler ===');
  MONTHS.forEach((m, mi) => {
    const sheet = ss.getSheetByName(m);
    if (!sheet) { Logger.log(`SKIP ${m}`); return; }
    const overspend = DEMO_OVERSPEND.indexOf(mi) >= 0;
    Logger.log(`[${mi + 1}/12] ${m}${overspend ? ' OVERSPEND' : ''}`);
    totalI += demoFillIncome(sheet, mi, overspend);
    totalE += demoFillExpense(sheet, mi, overspend);
    processed++;
  });

  SpreadsheetApp.flush();
  const el = Math.round((new Date() - startTime) / 1000);
  Logger.log(`DONE ${el}s. ${totalI} income + ${totalE} expense rows.`);

  if (!silent) {
    SpreadsheetApp.getUi().alert(
      'تمت تعبئة البيانات التجريبية',
      `${processed} ورقة، ${totalI} دخل + ${totalE} مصاريف، ${el} ث.`,
      SpreadsheetApp.getUi().ButtonSet.OK);
  }
  return { processed, income: totalI, expense: totalE, elapsed: el };
}

function demoFillIncome(sheet, mi, overspend) {
  const drift = DEMO_DRIFT[mi];
  const rot   = DEMO_INCOME_ROTATING;
  const rotating = [
    rot[(mi + 0) % rot.length],
    rot[(mi + 2) % rot.length],
    rot[(mi + 4) % rot.length]
  ];
  const templates = [...DEMO_INCOME_FIXED, ...rotating];
  const days = [3, 9, 15, 21, 27];
  const blockAF = [], blockH = [];

  templates.forEach((t, i) => {
    const date     = new Date(2026, mi, days[i]);
    const expected = Math.round(t[3] * drift);
    const actual   = Math.round(expected * (overspend ? 0.95 : 1.05));
    blockAF.push([t[0], date, t[1], t[2], expected, actual]);
    blockH.push([t[4]]);
  });

  sheet.getRange(10, 1, 5, 6).setValues(blockAF);
  sheet.getRange(10, 8, 5, 1).setValues(blockH);
  sheet.getRange(10, 2, 5, 1).setNumberFormat(FORMATS.date);
  sheet.getRange(10, 5, 5, 2).setNumberFormat(FORMATS.money);
  return 5;
}

function demoFillExpense(sheet, mi, overspend) {
  const drift = DEMO_DRIFT[mi];
  const rot   = DEMO_EXPENSE_ROTATING;
  const rotating = [
    rot[(mi + 0) % rot.length],
    rot[(mi + 3) % rot.length]
  ];
  const templates = [...DEMO_EXPENSE_FIXED, ...rotating];
  const days = [5, 11, 17, 23, 28];
  const blockAE = [], blockG = [];

  templates.forEach((t, i) => {
    const date     = new Date(2026, mi, days[i]);
    const expected = Math.round(t[2] * drift);
    const actual   = Math.round(expected * (overspend ? 1.15 : 0.95));
    blockAE.push([date, t[0], t[1], expected, actual]);
    blockG.push([t[3]]);
  });

  sheet.getRange(33, 1, 5, 5).setValues(blockAE);
  sheet.getRange(33, 7, 5, 1).setValues(blockG);
  sheet.getRange(33, 1, 5, 1).setNumberFormat(FORMATS.date);
  sheet.getRange(33, 4, 5, 2).setNumberFormat(FORMATS.money);
  return 5;
}

function clearAllDemoData() {
  const ui = SpreadsheetApp.getUi();
  const r = ui.alert(
    'مسح البيانات التجريبية',
    'سيتم مسح صفوف A10:H14 و A33:G37 في كل الأشهر. متابعة؟',
    ui.ButtonSet.YES_NO);
  if (r !== ui.Button.YES) return;

  const ss = SpreadsheetApp.getActive();
  let cleared = 0;

  MONTHS.forEach(m => {
    const sheet = ss.getSheetByName(m);
    if (!sheet) return;
    sheet.getRange(10, 1, 5, 6).clearContent();
    sheet.getRange(10, 8, 5, 1).clearContent();
    sheet.getRange(33, 1, 5, 5).clearContent();
    sheet.getRange(33, 7, 5, 1).clearContent();
    cleared++;
  });

  SpreadsheetApp.flush();
  ui.alert('تم المسح', `${cleared} ورقة.`, ui.ButtonSet.OK);
}

// ============================================================================
// MONTHLY VISUAL ANALYTICS
// ============================================================================
function addMonthlyVisualAnalytics(silent) {
  const ss = SpreadsheetApp.getActive();
  let processed = 0;

  Logger.log('=== Monthly Visual Analytics ===');
  MONTHS.forEach((m, mi) => {
    const sheet = ss.getSheetByName(m);
    if (!sheet) return;
    sheet.getCharts().forEach(c => sheet.removeChart(c));
    monthlyAnalyticsHelpers(sheet);
    monthlyAnalyticsColumnChart(sheet);
    monthlyAnalyticsDoughnut(sheet);
    Logger.log(`[${mi + 1}/12] ${m} done`);
    processed++;
  });

  SpreadsheetApp.flush();
  if (!silent) {
    SpreadsheetApp.getUi().alert(
      'تمت إضافة التحليل البصري',
      `${processed} ورقة، 2 مخطط لكل منها.`,
      SpreadsheetApp.getUi().ButtonSet.OK);
  }
  return processed;
}

function monthlyAnalyticsHelpers(s) {
  // Column chart helpers Q1:T4 (diagonal layout = 3 colored bars)
  styleHeader(s.getRange('Q1:T1').setValues([['البيان', 'المداخيل', 'المصاريف', 'المدخرات']]));
  s.getRange('Q2').setValue('المداخيل').setFontFamily(FONT);
  s.getRange('R2').setFormula('=IFERROR(SUM(F10:F28),0)');
  s.getRange('Q3').setValue('المصاريف').setFontFamily(FONT);
  s.getRange('S3').setFormula('=IFERROR(SUM(E33:E62),0)');
  s.getRange('Q4').setValue('المدخرات').setFontFamily(FONT);
  s.getRange('T4').setFormula('=IFERROR(SUM(F10:F28)-SUM(E33:E62),0)');
  s.getRange('R2:T4').setNumberFormat(FORMATS.money);

  // Doughnut helpers Q9:R21
  styleHeader(s.getRange('Q9:R9').setValues([['فئة المصاريف', 'الإجمالي']]));
  EXPENSE_CATEGORIES.forEach((cat, i) => {
    const rn = 10 + i;
    s.getRange(rn, 17).setValue(cat).setFontFamily(FONT);
    s.getRange(rn, 18).setFormula(
      `=IFERROR(SUMIF(B33:B62, Q${rn}, E33:E62), 0)`);
  });
  s.getRange(10, 18, 12, 1).setNumberFormat(FORMATS.money);
}

function monthlyAnalyticsColumnChart(s) {
  s.insertChart(
    s.newChart().setChartType(Charts.ChartType.COLUMN)
      .addRange(s.getRange('Q1:T4'))
      .setPosition(2, 9, 0, 0)
      .setOption('useFirstColumnAsDomain', true)
      .setOption('useFirstRowAsHeaders', true)
      .setOption('title', 'مقارنة الإجماليات الفعلية')
      .setOption('titleTextStyle', { color: '#000000', fontSize: 14, bold: true, fontName: FONT })
      .setOption('legend', { position: 'top', textStyle: { color: '#000000', fontSize: 11, fontName: FONT } })
      .setOption('backgroundColor', '#FFFFFF')
      .setOption('chartArea', { left: '14%', top: '22%', width: '80%', height: '62%' })
      .setOption('hAxis', { textStyle: { color: '#000000', fontSize: 11, fontName: FONT } })
      .setOption('vAxis', { textStyle: { color: '#000000', fontSize: 11, fontName: FONT }, format: '#,##0' })
      .setOption('series', { 0: { color: T.income }, 1: { color: T.expense }, 2: { color: T.netCyan } })
      .setOption('width', 480).setOption('height', 240).build()
  );
}

function monthlyAnalyticsDoughnut(s) {
  s.insertChart(
    s.newChart().setChartType(Charts.ChartType.PIE)
      .addRange(s.getRange('Q9:R21'))
      .setPosition(33, 9, 0, 0)
      .setOption('pieHole', 0.5)
      .setOption('title', 'توزيع المصاريف حسب الفئة')
      .setOption('titleTextStyle', { color: '#000000', fontSize: 14, bold: true, fontName: FONT })
      .setOption('legend', { position: 'right', textStyle: { color: '#000000', fontSize: 10, fontName: FONT } })
      .setOption('backgroundColor', '#FFFFFF')
      .setOption('chartArea', { left: '5%', top: '15%', width: '70%', height: '78%' })
      .setOption('colors', DOUGHNUT_COLORS)
      .setOption('pieSliceText', 'percentage')
      .setOption('pieSliceTextStyle', { color: '#FFFFFF', fontSize: 10, bold: true, fontName: FONT })
      .setOption('width', 480).setOption('height', 280).build()
  );
}

function removeMonthlyVisualAnalytics() {
  const ui = SpreadsheetApp.getUi();
  const r  = ui.alert(
    'إزالة التحليل البصري الشهري',
    'سيتم حذف المخططات والبيانات المساعدة من 12 ورقة. متابعة؟',
    ui.ButtonSet.YES_NO);
  if (r !== ui.Button.YES) return;

  const ss = SpreadsheetApp.getActive();
  let removed = 0;
  MONTHS.forEach(m => {
    const s = ss.getSheetByName(m);
    if (!s) return;
    s.getCharts().forEach(c => s.removeChart(c));
    s.getRange('Q1:T21').clearContent();
    removed++;
  });

  SpreadsheetApp.flush();
  ui.alert('تمت الإزالة', `${removed} ورقة.`, ui.ButtonSet.OK);
}

// ============================================================================
// REPAIR
// ============================================================================
function repairDashboardV2() {
  const ss = SpreadsheetApp.getActive();
  buildDashboardEngineV2(ss);
  SpreadsheetApp.flush();
  buildDashboardChartsV2(ss);
  SpreadsheetApp.getUi().alert(
    'تم الإصلاح',
    'أعيد بناء صيغ المحرك والرسوم البيانية.',
    SpreadsheetApp.getUi().ButtonSet.OK);
}

// ============================================================================
// NUCLEAR RESET (UI-confirmed wrapper)
// ============================================================================
function resetWorkbookCompletely() {
  const ui = SpreadsheetApp.getUi();
  const r = ui.alert(
    'تحذير: سيتم حذف كل البيانات',
    'سيتم حذف جميع الأوراق والصيغ والبيانات في هذا المصنف. ' +
    'هذه العملية لا يمكن التراجع عنها. متابعة؟',
    ui.ButtonSet.YES_NO);
  if (r !== ui.Button.YES) return;

  nuclearReset(SpreadsheetApp.getActive());

  ui.alert(
    'تم إعادة الضبط',
    'المصنف نظيف تماما. الآن شغل tryFullDemoSmartBudget لإنشاء القالب من جديد.',
    ui.ButtonSet.OK);
}
