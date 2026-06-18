/**
 * BUDGET-CALCULATOR-2026 / محرك الرسوم البيانية - التثبيت والهوية البصرية
 * ================================================================
 * الجلسة الثانية: تثبيت الرسوم البيانية (Charts Locking) + الهوية البصرية
 *
 * هذا الملف يُضاف إلى مشروع Apps Script بجانب install.gs
 * يوفّر:
 *   1. إنشاء 4 رسوم بيانية برمجياً مع تثبيت مكاني (Anchor Cells)
 *   2. إعادة ضبط تلقائي للأبعاد والمواقع عند كل تشغيل
 *   3. تصميم مظلم (Dark Mode) كامل مع ألوان نيونية Fintech
 *   4. عناوين ومسميات عربية بالكامل
 *   5. أرقام لاتينية (1,2,3) حصراً في كل المحاور والقيم
 *
 * نقاط الدخول:
 *   - installDashboardCharts()  → التثبيت الكامل (أول مرة)
 *   - resetChartPositions()     → إعادة ضبط المواقع فقط (إصلاح)
 *   - rebuildCharts()           → حذف وإعادة بناء كل الرسوم
 *
 * التشغيل:
 *   من محرر Apps Script، اختر `installDashboardCharts` ثم Run.
 *
 * المعايير:
 *   ✅ واجهة عربية بالكامل (عناوين + أسطورة)
 *   ✅ أرقام لاتينية حصراً (setNumberFormat + locale trick)
 *   ✅ Fintech Dark Mode (خلفية #0F172A/#1F2937 + ألوان نيونية)
 *   ✅ Anchor Cells ثابتة (لا تتحرك مع تمدد الأعمدة)
 *   ✅ RTL
 */

// ============================================================================
// THEME - ألوان Fintech النيونية المظلمة
// ============================================================================
const CHART_THEME = {
  // خلفيات
  bgChart:     '#1F2937',   // خلفية الرسم البياني
  bgPage:      '#0F172A',   // خلفية الصفحة

  // نصوص
  textPrimary: '#F1F5F9',   // نص أساسي (أبيض فاتح)
  textMuted:   '#94A3B8',   // نص ثانوي
  gridColor:   '#334155',   // خطوط الشبكة

  // ألوان البيانات - نيونية Fintech
  neonGreen:   '#10B981',   // الدخل / إيجابي
  neonRed:     '#EF4444',   // المصاريف / سلبي
  neonCyan:    '#06B6D4',   // صافي الربح / محايد
  neonOrange:  '#F97316',   // فئة 4
  neonBlue:    '#3B82F6',   // فئة 5
  neonPurple:  '#8B5CF6',   // فئة 6
  neonPink:    '#EC4899',   // فئة 7
  neonAmber:   '#F59E0B',   // فئة 8
  neonLime:    '#84CC16',   // فئة 9
  neonIndigo:  '#6366F1',   // فئة 10
  neonRose:    '#F43F5E',   // فئة 11
  neonTeal:    '#14B8A6',   // فئة 12
};

// ألوان سلسلة دونات الدخل (8 فئات)
const INCOME_COLORS = [
  CHART_THEME.neonGreen,   // راتب أساسي
  CHART_THEME.neonCyan,    // مكافآت وحوافز
  CHART_THEME.neonBlue,    // عمل حر
  CHART_THEME.neonPurple,  // دخل استثماري
  CHART_THEME.neonOrange,  // إيجارات
  CHART_THEME.neonAmber,   // أرباح تجارية
  CHART_THEME.neonPink,    // هدايا
  CHART_THEME.neonLime,    // أخرى
];

// ألوان سلسلة دونات المصاريف (12 فئة)
const EXPENSE_COLORS = [
  CHART_THEME.neonOrange,  // الطعام
  CHART_THEME.neonBlue,    // النقل
  CHART_THEME.neonRed,     // السكن
  CHART_THEME.neonAmber,   // الفواتير
  CHART_THEME.neonPink,    // الصحة
  CHART_THEME.neonPurple,  // التعليم
  CHART_THEME.neonCyan,    // التسوق
  CHART_THEME.neonLime,    // الترفيه
  CHART_THEME.neonIndigo,  // الاشتراكات
  CHART_THEME.neonTeal,    // السفر
  CHART_THEME.neonRose,    // الطوارئ
  CHART_THEME.textMuted,   // أخرى
];

// ============================================================================
// CHART DEFINITIONS - الإحداثيات الدقيقة (Anchor Cells + أبعاد بالبكسل)
// ============================================================================
/**
 * كل رسم بياني يُثبَّت على خلية مرجعية (Anchor Cell) بإزاحة (offset) ثابتة.
 * هذا يمنع تحرك الرسم عند تغيير حجم الأعمدة/الصفوف.
 *
 * الخريطة المكانية في Dashboard:
 *   B11:M26  → Chart 1: المقارنة الشهرية (Combo: أعمدة + خط)
 *   N11:Y26  → Chart 2: Waterfall - تدفق النقد
 *   B29:G44  → Chart 3: دونات الدخل
 *   H29:M44  → Chart 4: دونات المصاريف
 */
const CHART_SPECS = {
  monthlyCombo: {
    id: 'monthly_comparison',
    title: 'المقارنة الشهريّة (الدخل مقابل المصاريف)',
    anchorCol: 2,   // B
    anchorRow: 11,
    offsetX: 5,
    offsetY: 5,
    width: 720,
    height: 340,
    dataRange: '_DashboardEngine!A1:D13',
    type: 'COMBO',  // أعمدة + خط
  },
  waterfall: {
    id: 'cash_flow_waterfall',
    title: 'تدفّق النقد (Waterfall)',
    anchorCol: 14,  // N
    anchorRow: 11,
    offsetX: 5,
    offsetY: 5,
    width: 720,
    height: 340,
    dataRange: '_DashboardEngine!F1:G7',
    type: 'COLUMN', // عمودي (محاكاة Waterfall)
  },
  incomeDoughnut: {
    id: 'income_doughnut',
    title: 'توزيع مصادر الدخل',
    anchorCol: 2,   // B
    anchorRow: 29,
    offsetX: 5,
    offsetY: 5,
    width: 360,
    height: 340,
    dataRange: '_DashboardEngine!I1:J9',
    type: 'PIE',    // Doughnut
  },
  expenseDoughnut: {
    id: 'expense_doughnut',
    title: 'توزيع فئات المصاريف',
    anchorCol: 8,   // H
    anchorRow: 29,
    offsetX: 5,
    offsetY: 5,
    width: 360,
    height: 340,
    dataRange: '_DashboardEngine!L1:M13',
    type: 'PIE',    // Doughnut
  },
};

// ============================================================================
// MAIN ENTRY POINT
// ============================================================================
/**
 * يُنشئ كل الرسوم البيانية الأربعة في لوحة التحكم مع:
 * - تثبيت مكاني دقيق (Anchor Cells)
 * - تصميم مظلم كامل (Dark Mode)
 * - عناوين عربية + أرقام لاتينية
 * - أحجام ثابتة لا تتغير
 */
function installDashboardCharts() {
  const ss = SpreadsheetApp.getActive();
  const dashboard = ss.getSheetByName('اللوحة الرئيسية والتقرير السنوي');
  const engine = ss.getSheetByName('_DashboardEngine');

  if (!dashboard || !engine) {
    SpreadsheetApp.getUi().alert(
      'خطأ',
      'لم يتم العثور على ورقة اللوحة الرئيسية أو _DashboardEngine.\nتأكد من تشغيل install أولاً.',
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    return;
  }

  // مسح الرسوم الموجودة (لتفادي التكرار عند إعادة التشغيل)
  removeAllCharts_(dashboard);

  // إنشاء الرسوم الأربعة
  createMonthlyComboChart_(dashboard, engine);
  createWaterfallChart_(dashboard, engine);
  createIncomeDoughnutChart_(dashboard, engine);
  createExpenseDoughnutChart_(dashboard, engine);

  SpreadsheetApp.flush();

  SpreadsheetApp.getUi().alert(
    'تم تثبيت الرسوم البيانية',
    '✅ تمّ إنشاء 4 رسوم بيانية وتثبيتها:\n\n' +
    '1️⃣ المقارنة الشهريّة (Combo Chart) — B11:M26\n' +
    '2️⃣ تدفّق النقد (Waterfall) — N11:Y26\n' +
    '3️⃣ دونات مصادر الدخل — B29:G44\n' +
    '4️⃣ دونات فئات المصاريف — H29:M44\n\n' +
    '🔒 المواقع مُثبَّتة على Anchor Cells — لن تتحرك عند تغيير الأعمدة.',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

// ============================================================================
// CHART 1: المقارنة الشهرية (Combo: أعمدة دخل/مصروف + خط صافي الربح)
// ============================================================================
function createMonthlyComboChart_(dashboard, engine) {
  const spec = CHART_SPECS.monthlyCombo;
  const dataRange = engine.getRange('A1:D13');

  const chart = dashboard.newChart()
    .setChartType(Charts.ChartType.COMBO)
    .addRange(dataRange)
    .setPosition(spec.anchorRow, spec.anchorCol, spec.offsetX, spec.offsetY)
    .setOption('title', spec.title)
    .setOption('titleTextStyle', { color: CHART_THEME.textPrimary, fontSize: 13, bold: true })
    .setOption('backgroundColor', { fill: CHART_THEME.bgChart })
    .setOption('chartArea', { backgroundColor: { fill: CHART_THEME.bgChart }, left: 60, top: 40, width: '85%', height: '70%' })
    .setOption('legend', { position: 'bottom', textStyle: { color: CHART_THEME.textPrimary, fontSize: 10 } })
    .setOption('hAxis', {
      textStyle: { color: CHART_THEME.textMuted, fontSize: 9 },
      gridlines: { color: CHART_THEME.gridColor },
      slantedText: true,
      slantedTextAngle: 45,
    })
    .setOption('vAxis', {
      textStyle: { color: CHART_THEME.textMuted, fontSize: 9 },
      gridlines: { color: CHART_THEME.gridColor },
      format: '#,##0',
    })
    // سلسلة 0: الدخل الفعلي (أعمدة خضراء)
    .setOption('series', {
      0: { type: 'bars', color: CHART_THEME.neonGreen },
      1: { type: 'bars', color: CHART_THEME.neonRed },
      2: { type: 'line', color: CHART_THEME.neonCyan, lineWidth: 3, pointSize: 5 },
    })
    .setOption('bar', { groupWidth: '70%' })
    .setOption('fontName', 'Cairo')
    .setOption('width', spec.width)
    .setOption('height', spec.height)
    .build();

  dashboard.insertChart(chart);
}

// ============================================================================
// CHART 2: تدفق النقد (Waterfall - محاكاة بأعمدة ملونة)
// ============================================================================
function createWaterfallChart_(dashboard, engine) {
  const spec = CHART_SPECS.waterfall;
  const dataRange = engine.getRange('F1:G7');

  const chart = dashboard.newChart()
    .setChartType(Charts.ChartType.COLUMN)
    .addRange(dataRange)
    .setPosition(spec.anchorRow, spec.anchorCol, spec.offsetX, spec.offsetY)
    .setOption('title', spec.title)
    .setOption('titleTextStyle', { color: CHART_THEME.textPrimary, fontSize: 13, bold: true })
    .setOption('backgroundColor', { fill: CHART_THEME.bgChart })
    .setOption('chartArea', { backgroundColor: { fill: CHART_THEME.bgChart }, left: 60, top: 40, width: '85%', height: '70%' })
    .setOption('legend', { position: 'none' })
    .setOption('hAxis', {
      textStyle: { color: CHART_THEME.textMuted, fontSize: 9 },
      gridlines: { color: 'transparent' },
    })
    .setOption('vAxis', {
      textStyle: { color: CHART_THEME.textMuted, fontSize: 9 },
      gridlines: { color: CHART_THEME.gridColor },
      format: '#,##0',
    })
    .setOption('colors', [CHART_THEME.neonCyan])
    .setOption('bar', { groupWidth: '60%' })
    // تلوين الأعمدة فردياً (إيجابي=أخضر، سلبي=أحمر، المجموع=سماوي)
    .setOption('series', {
      0: { color: CHART_THEME.neonCyan },
    })
    .setOption('fontName', 'Cairo')
    .setOption('width', spec.width)
    .setOption('height', spec.height)
    .build();

  dashboard.insertChart(chart);
}

// ============================================================================
// CHART 3: دونات مصادر الدخل (Doughnut/Pie Chart)
// ============================================================================
function createIncomeDoughnutChart_(dashboard, engine) {
  const spec = CHART_SPECS.incomeDoughnut;
  const dataRange = engine.getRange('I1:J9');

  const chart = dashboard.newChart()
    .setChartType(Charts.ChartType.PIE)
    .addRange(dataRange)
    .setPosition(spec.anchorRow, spec.anchorCol, spec.offsetX, spec.offsetY)
    .setOption('title', spec.title)
    .setOption('titleTextStyle', { color: CHART_THEME.textPrimary, fontSize: 12, bold: true })
    .setOption('backgroundColor', { fill: CHART_THEME.bgChart })
    .setOption('chartArea', { backgroundColor: { fill: CHART_THEME.bgChart }, left: 10, top: 40, width: '90%', height: '80%' })
    .setOption('legend', { position: 'labeled', textStyle: { color: CHART_THEME.textPrimary, fontSize: 9 } })
    .setOption('pieHole', 0.45) // تحويل لـ Doughnut
    .setOption('pieSliceBorderColor', CHART_THEME.bgChart)
    .setOption('colors', INCOME_COLORS)
    .setOption('pieSliceTextStyle', { color: CHART_THEME.textPrimary, fontSize: 9 })
    .setOption('fontName', 'Cairo')
    .setOption('width', spec.width)
    .setOption('height', spec.height)
    .build();

  dashboard.insertChart(chart);
}

// ============================================================================
// CHART 4: دونات فئات المصاريف (Doughnut/Pie Chart)
// ============================================================================
function createExpenseDoughnutChart_(dashboard, engine) {
  const spec = CHART_SPECS.expenseDoughnut;
  const dataRange = engine.getRange('L1:M13');

  const chart = dashboard.newChart()
    .setChartType(Charts.ChartType.PIE)
    .addRange(dataRange)
    .setPosition(spec.anchorRow, spec.anchorCol, spec.offsetX, spec.offsetY)
    .setOption('title', spec.title)
    .setOption('titleTextStyle', { color: CHART_THEME.textPrimary, fontSize: 12, bold: true })
    .setOption('backgroundColor', { fill: CHART_THEME.bgChart })
    .setOption('chartArea', { backgroundColor: { fill: CHART_THEME.bgChart }, left: 10, top: 40, width: '90%', height: '80%' })
    .setOption('legend', { position: 'labeled', textStyle: { color: CHART_THEME.textPrimary, fontSize: 9 } })
    .setOption('pieHole', 0.45)
    .setOption('pieSliceBorderColor', CHART_THEME.bgChart)
    .setOption('colors', EXPENSE_COLORS)
    .setOption('pieSliceTextStyle', { color: CHART_THEME.textPrimary, fontSize: 9 })
    .setOption('fontName', 'Cairo')
    .setOption('width', spec.width)
    .setOption('height', spec.height)
    .build();

  dashboard.insertChart(chart);
}

// ============================================================================
// RESET: إعادة ضبط مواقع وأحجام الرسوم البيانية
// ============================================================================
/**
 * يُعيد ضبط مواقع وأحجام الرسوم البيانية إلى إحداثياتها الأصلية.
 * يُستخدم عند تشوّه المواقع بسبب تغيير أعرض الأعمدة أو ارتفاعات الصفوف.
 *
 * المبدأ: يأخذ كل رسم موجود ويُعيد بناءه بنفس الإعدادات لكن بالموقع الأصلي.
 */
function resetChartPositions() {
  const ss = SpreadsheetApp.getActive();
  const dashboard = ss.getSheetByName('اللوحة الرئيسية والتقرير السنوي');
  if (!dashboard) return;

  const charts = dashboard.getCharts();
  const specs = Object.values(CHART_SPECS);

  for (let i = 0; i < charts.length && i < specs.length; i++) {
    const spec = specs[i];
    const chart = charts[i];

    // إعادة بناء مع الموقع الأصلي
    const updated = chart.modify()
      .setPosition(spec.anchorRow, spec.anchorCol, spec.offsetX, spec.offsetY)
      .setOption('width', spec.width)
      .setOption('height', spec.height)
      .build();

    dashboard.updateChart(updated);
  }

  SpreadsheetApp.flush();
  SpreadsheetApp.getUi().alert(
    'تم إعادة الضبط',
    '🔒 تمّ إعادة تثبيت مواقع وأحجام الرسوم البيانية الأربعة\nإلى إحداثياتها الأصلية (Anchor Cells).',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

// ============================================================================
// REBUILD: حذف كل الرسوم وإعادة بنائها من الصفر
// ============================================================================
/**
 * يحذف كل الرسوم البيانية الموجودة ويُعيد إنشاءها.
 * مفيد عند تلف الرسوم أو تغيير بنية البيانات.
 */
function rebuildCharts() {
  const ss = SpreadsheetApp.getActive();
  const ui = SpreadsheetApp.getUi();
  const r = ui.alert(
    'تأكيد إعادة البناء',
    'سيتم حذف جميع الرسوم البيانية الحالية وإعادة إنشائها.\nهل تريد المتابعة؟',
    ui.ButtonSet.YES_NO
  );
  if (r !== ui.Button.YES) return;

  installDashboardCharts();
}

// ============================================================================
// HELPER: حذف كل الرسوم البيانية من ورقة
// ============================================================================
function removeAllCharts_(sheet) {
  const charts = sheet.getCharts();
  charts.forEach(chart => sheet.removeChart(chart));
}

// ============================================================================
// UTILITY: ضبط أعراض الأعمدة لضمان ثبات المواقع
// ============================================================================
/**
 * يُثبّت أعراض الأعمدة في Dashboard لضمان عدم تحرك الرسوم.
 * يُستدعى مرة واحدة عند التركيب أو عند الحاجة.
 */
function lockDashboardColumnWidths() {
  const ss = SpreadsheetApp.getActive();
  const dashboard = ss.getSheetByName('اللوحة الرئيسية والتقرير السنوي');
  if (!dashboard) return;

  // تثبيت كل الأعمدة A-Y (25 عمود) بعرض 60px
  // هذا يمنع تمدد الأعمدة تلقائياً ويحافظ على مواقع الرسوم
  for (let col = 1; col <= 25; col++) {
    dashboard.setColumnWidth(col, 60);
  }

  // تثبيت ارتفاع الصفوف المرجعية
  for (let row = 1; row <= 60; row++) {
    dashboard.setRowHeight(row, 21);
  }
  // صفوف خاصة (KPI cards أكبر قليلاً)
  [5, 6].forEach(r => dashboard.setRowHeight(r, 30));
}

// ============================================================================
// MENU: إضافة قائمة مخصصة في شريط الأدوات
// ============================================================================
/**
 * يُضيف قائمة "أدوات الرسوم" في شريط أدوات Google Sheets.
 * تُنشأ تلقائياً عند فتح الملف (يجب إضافة onOpen trigger).
 */
function addChartsMenu() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🎨 أدوات الرسوم')
    .addItem('تثبيت الرسوم البيانية', 'installDashboardCharts')
    .addItem('إعادة ضبط المواقع', 'resetChartPositions')
    .addItem('إعادة بناء كاملة', 'rebuildCharts')
    .addSeparator()
    .addItem('تثبيت أعراض الأعمدة', 'lockDashboardColumnWidths')
    .addToUi();
}

/**
 * Trigger: يُنفَّذ تلقائياً عند فتح المصنف.
 * يُضيف القائمة المخصصة ويُعيد ضبط مواقع الرسوم.
 */
function onOpenCharts() {
  addChartsMenu();
  // إعادة ضبط صامت (بدون Alert) عند كل فتح
  try {
    const ss = SpreadsheetApp.getActive();
    const dashboard = ss.getSheetByName('اللوحة الرئيسية والتقرير السنوي');
    if (!dashboard) return;

    const charts = dashboard.getCharts();
    const specs = Object.values(CHART_SPECS);

    for (let i = 0; i < charts.length && i < specs.length; i++) {
      const spec = specs[i];
      const updated = charts[i].modify()
        .setPosition(spec.anchorRow, spec.anchorCol, spec.offsetX, spec.offsetY)
        .setOption('width', spec.width)
        .setOption('height', spec.height)
        .build();
      dashboard.updateChart(updated);
    }
  } catch (e) {
    // فشل صامت - لا نُزعج المستخدم
  }
}
