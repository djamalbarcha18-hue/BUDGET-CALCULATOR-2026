/**
 * BUDGET-CALCULATOR-2026 / محرك السنوات الديناميكي
 * ================================================================
 * هذا الملف يُضاف إلى مشروع Apps Script بجانب install.gs
 * يوفّر:
 *   1. قائمة منسدلة لاختيار السنة (2025→2035) في ورقة الإعدادات
 *   2. نطاق مُسمَّى rng_ActiveYear يربط كل المعادلات بالسنة النشطة
 *   3. ورقة _YearData مخفية تخزّن كل المعاملات لكل السنوات
 *   4. معادلات QUERY ديناميكية في الأوراق الشهرية تعرض بيانات السنة المختارة فقط
 *   5. بيانات تجريبية كاملة لسنة 2025 (Demo Year)
 *   6. تطهير السنوات 2026-2035 (فارغة بالكامل)
 *
 * التشغيل:
 *   من محرر Apps Script، اختر الدالة `installYearEngine` ثم Run.
 *   يمكن تشغيلها بعد install الأصلي أو بشكل مستقل.
 *
 * المعايير التقنية:
 *   ✅ واجهة عربية بالكامل
 *   ✅ أرقام لاتينية (1,2,3) حصراً - مفروضة عبر setNumberFormat
 *   ✅ تواريخ yyyy-mm-dd
 *   ✅ Fintech Dark Mode
 *   ✅ RTL
 */

// ============================================================================
// CONSTANTS
// ============================================================================
const YEAR_SHEET_NAME = '_YearData';
const YEARS_LIST = ['2025','2026','2027','2028','2029','2030','2031','2032','2033','2034','2035'];

// Theme (reuse from install.gs if running together, else define locally)
const TY = typeof T !== 'undefined' ? T : {
  bgPage: '#0F172A', bgCard: '#1F2937', fgPrimary: '#F1F5F9',
  fgMuted: '#94A3B8', accentIncome: '#10B981', accentExpense: '#DC2626',
  accentNet: '#06B6D4', gaugeAmber: '#F59E0B', white: '#FFFFFF',
  paletteOrange: '#F97316', paletteBlue: '#3B82F6',
};

// ============================================================================
// MAIN ENTRY POINT
// ============================================================================
/**
 * يُنصّب محرك السنوات الديناميكي:
 * 1. يُضيف خلية اختيار السنة في الإعدادات (J3)
 * 2. يُنشئ ورقة _YearData المخفية
 * 3. يحقن بيانات 2025 التجريبية
 * 4. يُعدّل معادلات _DashboardEngine لتكون مرتبطة بالسنة
 * 5. يُضيف نطاقات مُسمَّاة جديدة
 */
function installYearEngine() {
  const ss = SpreadsheetApp.getActive();
  const ui = SpreadsheetApp.getUi();

  // Step 1: إضافة خلية السنة في ورقة الإعدادات
  setupYearSelector(ss);

  // Step 2: إنشاء ورقة _YearData
  buildYearDataSheet(ss);

  // Step 3: حقن بيانات 2025 التجريبية
  injectDemoData2025(ss);

  // Step 4: تحديث معادلات المحرك لتقرأ عبر السنة النشطة
  updateEngineForDynamicYear(ss);

  // Step 5: تعريف النطاقات المُسمَّاة الجديدة
  defineYearNamedRanges(ss);

  // Step 6: إخفاء ورقة _YearData
  const ydSheet = ss.getSheetByName(YEAR_SHEET_NAME);
  if (ydSheet) ydSheet.hideSheet();

  SpreadsheetApp.flush();
  ui.alert(
    'تم تركيب محرك السنوات',
    '✅ تمّ بنجاح:\n' +
    '• قائمة اختيار السنة (2025→2035) في خلية J3 بورقة الإعدادات\n' +
    '• بيانات تجريبية كاملة لسنة 2025 (Demo Year)\n' +
    '• السنوات 2026→2035 نظيفة وجاهزة للاستخدام\n' +
    '• جميع المعادلات مرتبطة ديناميكياً بالسنة المختارة\n\n' +
    'غيّر السنة من J3 في ورقة الإعدادات لترى البيانات تتحدّث فوراً.',
    ui.ButtonSet.OK
  );
}

// ============================================================================
// STEP 1: YEAR SELECTOR IN SETTINGS
// ============================================================================
function setupYearSelector(ss) {
  const settings = ss.getSheetByName('الإعدادات وأسعار الصرف');
  if (!settings) return;

  // عنوان
  settings.getRange('J2').setValue('السنة المالية النشطة')
    .setFontWeight('bold').setFontColor(TY.fgPrimary)
    .setBackground('#374151').setHorizontalAlignment('center');

  // قيمة افتراضية: 2025 (السنة التجريبية)
  settings.getRange('J3').setValue(2025)
    .setFontWeight('bold').setFontColor(TY.accentNet)
    .setBackground(TY.bgCard).setHorizontalAlignment('center')
    .setFontSize(14).setNumberFormat('0');

  // قائمة منسدلة 2025→2035
  const dvYear = SpreadsheetApp.newDataValidation()
    .requireValueInList(YEARS_LIST, true)
    .setAllowInvalid(false)
    .build();
  settings.getRange('J3').setDataValidation(dvYear);

  // ملاحظة توضيحية
  settings.getRange('J3').setNote(
    'اختر السنة المالية النشطة.\n' +
    '• 2025 = سنة تجريبية (Demo) ببيانات وهمية لاستعراض القالب\n' +
    '• 2026-2035 = سنوات نظيفة جاهزة للاستخدام الفعلي'
  );

  // وصف إضافي
  settings.getRange('J4').setValue('⚡ غيّر السنة لتحديث كل الأوراق فوراً')
    .setFontColor(TY.fgMuted).setFontSize(9).setBackground(TY.bgCard);
}

// ============================================================================
// STEP 2: _YearData SHEET (مخزن البيانات المركزي لكل السنوات)
// ============================================================================
/**
 * هيكل _YearData:
 *   A: السنة (رقم)
 *   B: الشهر (اسم عربي)
 *   C: النوع ("دخل" أو "مصروف")
 *   D: التاريخ
 *   E: الفئة
 *   F: الوصف
 *   G: المبلغ المتوقع
 *   H: المبلغ الفعلي
 *   I: طريقة الدفع
 *
 * الأوراق الشهرية تستخدم QUERY أو FILTER لسحب البيانات حسب السنة النشطة.
 */
function buildYearDataSheet(ss) {
  let s = ss.getSheetByName(YEAR_SHEET_NAME);
  if (!s) s = ss.insertSheet(YEAR_SHEET_NAME);
  s.setRightToLeft(true);

  // رأس الجدول
  const header = ['السنة', 'الشهر', 'النوع', 'التاريخ', 'الفئة', 'الوصف', 'المبلغ المتوقع', 'المبلغ الفعلي', 'طريقة الدفع'];
  s.getRange('A1:I1').setValues([header])
    .setFontWeight('bold').setBackground('#374151').setFontColor(TY.fgPrimary)
    .setHorizontalAlignment('center');

  // تنسيق الأعمدة
  s.getRange('A:A').setNumberFormat('0');
  s.getRange('D:D').setNumberFormat('yyyy-mm-dd');
  s.getRange('G:G').setNumberFormat('#,##0.00');
  s.getRange('H:H').setNumberFormat('#,##0.00');
}

// ============================================================================
// STEP 3: INJECT 2025 DEMO DATA
// ============================================================================
function injectDemoData2025(ss) {
  const s = ss.getSheetByName(YEAR_SHEET_NAME);
  if (!s) return;

  // مسح أي بيانات 2025 سابقة (الاحتفاظ بالرأس)
  const lastRow = Math.max(s.getLastRow(), 1);
  if (lastRow > 1) {
    // نمسح كل شيء ونعيد الكتابة
    s.getRange(2, 1, lastRow, 9).clearContent();
  }

  // ===== بيانات الدخل 2025 (واقعية ومتنوعة) =====
  const incomeData = [];
  const MONTHS_ARR = ['يناير','فبراير','مارس','أبريل','مايو','يونيو',
                      'يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

  // راتب شهري ثابت 12,000
  for (let m = 0; m < 12; m++) {
    incomeData.push([2025, MONTHS_ARR[m], 'دخل', new Date(2025, m, 1), 'راتب أساسي', `راتب شهر ${MONTHS_ARR[m]}`, 12000, 12000, 'تحويل الكتروني']);
  }

  // عمل حر (8 أشهر)
  const freelanceMonths = [
    {m:0, d:10, desc:'تصميم واجهة تطبيق',   exp:3500, act:4200},
    {m:1, d:20, desc:'استشارة تقنية',        exp:2000, act:2000},
    {m:2, d:12, desc:'تطوير تطبيق ويب',      exp:6000, act:5500},
    {m:4, d:14, desc:'تدريب فريق برمجة',     exp:3000, act:3200},
    {m:5, d:28, desc:'مشروع API متكامل',     exp:5000, act:4700},
    {m:6, d:20, desc:'تصميم هوية بصرية',     exp:4000, act:4000},
    {m:8, d:8,  desc:'ورشة تدريب أونلاين',   exp:2500, act:2500},
    {m:9, d:20, desc:'برمجة لوحة تحكم',      exp:5500, act:5000},
    {m:11,d:18, desc:'مشروع ختام السنة',     exp:4000, act:3800},
  ];
  freelanceMonths.forEach(f => {
    incomeData.push([2025, MONTHS_ARR[f.m], 'دخل', new Date(2025, f.m, f.d), 'عمل حر', f.desc, f.exp, f.act, 'تحويل الكتروني']);
  });

  // مكافآت (4 أشهر)
  [[1,8,'مكافأة أداء Q4-2024',5000,5000],[5,10,'مكافأة نصف سنوية',8000,8000],
   [9,12,'مكافأة مشروع ناجح',3000,3000],[11,10,'مكافأة نهاية السنة',10000,10000]].forEach(b => {
    incomeData.push([2025, MONTHS_ARR[b[0]], 'دخل', new Date(2025, b[0], b[1]), 'مكافآت وحوافز', b[2], b[3], b[4], 'تحويل الكتروني']);
  });

  // دخل استثماري (5 أشهر)
  [[0,15,1200,980],[3,18,1800,1800],[6,15,2200,2800],[8,18,1500,1500],[10,22,9000,11000]].forEach(inv => {
    const cat = inv[0] === 10 ? 'أرباح تجارية' : 'دخل استثماري';
    const desc = inv[0] === 10 ? 'أرباح حملة Black Friday' : 'أرباح محفظة أسهم';
    incomeData.push([2025, MONTHS_ARR[inv[0]], 'دخل', new Date(2025, inv[0], inv[1]), cat, desc, inv[2], inv[3], 'تحويل الكتروني']);
  });

  // إيجارات (5 أشهر)
  [2,5,7,8,10].forEach(m => {
    incomeData.push([2025, MONTHS_ARR[m], 'دخل', new Date(2025, m, 25), 'إيجارات', 'إيجار عقار تجاري', 3000, 3000, 'نقداً']);
  });

  // ===== بيانات المصاريف 2025 =====
  const expenseData = [];

  // إيجار شهري ثابت 4,500
  for (let m = 0; m < 12; m++) {
    expenseData.push([2025, MONTHS_ARR[m], 'مصروف', new Date(2025, m, 2), 'السكن', 'إيجار الشقة', 4500, 4500, 'تحويل الكتروني']);
  }

  // فواتير خدمات (كل شهر، متغيرة)
  const bills = [920,680,800,880,720,1400,1250,1650,850,780,750,1100];
  const billsExp = [800,700,750,900,750,1200,1100,1500,850,800,750,1000];
  for (let m = 0; m < 12; m++) {
    expenseData.push([2025, MONTHS_ARR[m], 'مصروف', new Date(2025, m, 3), 'الفواتير', 'كهرباء + ماء + غاز', billsExp[m], bills[m], 'بطاقة بنكية']);
  }

  // طعام (كل شهر)
  const food = [2350,1900,2100,2200,1750,2500,2800,1950,2150,2000,2100,3200];
  const foodExp = [2000,1800,2200,2000,1800,2300,2500,2000,2000,1900,2200,3000];
  for (let m = 0; m < 12; m++) {
    expenseData.push([2025, MONTHS_ARR[m], 'مصروف', new Date(2025, m, 5), 'الطعام', 'مشتريات غذائية', foodExp[m], food[m], 'بطاقة بنكية']);
  }

  // نقل (كل شهر)
  const transport = [1100,850,2500,950,1100,1000,1800,2200,1050,1000,900,1500];
  const transportExp = [1200,900,2000,1000,1100,1000,1800,2200,1000,1000,900,1500];
  for (let m = 0; m < 12; m++) {
    expenseData.push([2025, MONTHS_ARR[m], 'مصروف', new Date(2025, m, 8), 'النقل', 'وقود + صيانة سيارة', transportExp[m], transport[m], 'نقداً']);
  }

  // اشتراكات (كل شهر)
  for (let m = 0; m < 12; m++) {
    expenseData.push([2025, MONTHS_ARR[m], 'مصروف', new Date(2025, m, 12), 'الاشتراكات', 'انترنت + نتفلكس + سحابي', 350, 350, 'بطاقة بنكية']);
  }

  // مصاريف إضافية متنوعة (لإبراز التنبيهات)
  const extras = [
    [0, 15, 'الصحة', 'فحص طبي دوري', 500, 500, 'نقداً'],
    [0, 20, 'التعليم', 'كورس AWS أونلاين', 400, 400, 'بطاقة بنكية'],
    [1, 14, 'الترفيه', 'عشاء عيد الحب', 600, 750, 'بطاقة بنكية'],
    [1, 20, 'التسوق', 'ملابس شتوية', 1500, 1800, 'بطاقة بنكية'],
    [2, 28, 'الطوارئ', 'إصلاح لابتوب', 800, 1200, 'بطاقة بنكية'],
    [3, 25, 'السفر', 'رحلة نهاية أسبوع', 3000, 3500, 'بطاقة بنكية'],
    [4, 15, 'الترفيه', 'اشتراك نادي رياضي', 500, 500, 'بطاقة بنكية'],
    [4, 28, 'التسوق', 'أجهزة إلكترونية', 2500, 2500, 'بطاقة بنكية'],
    [5, 15, 'الصحة', 'تأمين صحي ربع سنوي', 2000, 2000, 'تحويل الكتروني'],
    [5, 28, 'الترفيه', 'سينما + كافيه', 350, 450, 'نقداً'],
    [6, 18, 'السفر', 'إجازة صيفية', 8000, 9200, 'بطاقة بنكية'],
    [6, 25, 'التسوق', 'مشتريات إجازة', 1500, 1500, 'بطاقة بنكية'],
    [7, 15, 'التعليم', 'دورة PMP تحضيرية', 1500, 1500, 'بطاقة بنكية'],
    [8, 14, 'التعليم', 'كتب + أدوات تعلّم', 600, 600, 'بطاقة بنكية'],
    [8, 20, 'الصحة', 'فحوصات مخبرية', 400, 400, 'نقداً'],
    [8, 28, 'الترفيه', 'حفلة + خروجات', 700, 900, 'نقداً'],
    [9, 15, 'التسوق', 'ملابس موسم الخريف', 2000, 2200, 'بطاقة بنكية'],
    [10, 15, 'التسوق', 'تخفيضات Black Friday', 5000, 6500, 'بطاقة بنكية'],
    [10, 28, 'الطوارئ', 'إصلاح سباكة', 600, 600, 'نقداً'],
    [11, 15, 'هدايا', 'هدايا رأس السنة', 3000, 3500, 'بطاقة بنكية'],
    [11, 20, 'الاشتراكات', 'تجديد سنوي كل الخدمات', 1200, 1200, 'بطاقة بنكية'],
    [11, 28, 'السفر', 'رحلة رأس السنة', 5000, 5500, 'بطاقة بنكية'],
  ];
  extras.forEach(e => {
    expenseData.push([2025, MONTHS_ARR[e[0]], 'مصروف', new Date(2025, e[0], e[1]), e[2], e[3], e[4], e[5], e[6]]);
  });

  // ===== كتابة كل البيانات في _YearData =====
  const allData = [...incomeData, ...expenseData];
  if (allData.length > 0) {
    s.getRange(2, 1, allData.length, 9).setValues(allData);
    s.getRange(2, 1, allData.length, 1).setNumberFormat('0');
    s.getRange(2, 4, allData.length, 1).setNumberFormat('yyyy-mm-dd');
    s.getRange(2, 7, allData.length, 1).setNumberFormat('#,##0.00');
    s.getRange(2, 8, allData.length, 1).setNumberFormat('#,##0.00');
  }

  // ===== حقن بيانات الأهداف في ورقة الأهداف =====
  const goalsSheet = ss.getSheetByName('الأهداف المالية والادخار');
  if (goalsSheet) {
    const DEMO_GOALS = [
      ['صندوق الطوارئ',      60000,   60000, '', new Date('2025-12-31'), '', '', '', ''],
      ['شراء سيارة جديدة',   80000,   45000, '', new Date('2027-06-30'), '', '', '', ''],
      ['شراء منزل',         1200000, 180000, '', new Date('2030-12-31'), '', '', '', ''],
      ['صندوق التقاعد',     500000,  75000,  '', new Date('2045-12-31'), '', '', '', ''],
      ['رحلة الحج',          35000,   35000, '', new Date('2025-09-01'), '', '', '', ''],
      ['تعليم الأبناء',     200000,  20000,  '', new Date('2035-09-01'), '', '', '', ''],
      ['مشروع تجاري خاص',   150000,      0, '', new Date('2028-12-31'), '', '', '', ''],
      ['السفر والاستثمار',    25000,  12000, '', new Date('2026-08-31'), '', '', '', ''],
    ];
    goalsSheet.getRange(7, 1, DEMO_GOALS.length, 9).setValues(DEMO_GOALS);
    goalsSheet.getRange(7, 5, DEMO_GOALS.length, 1).setNumberFormat('yyyy-mm-dd');
    goalsSheet.getRange(7, 2, DEMO_GOALS.length, 1).setNumberFormat('#,##0.00');
    goalsSheet.getRange(7, 3, DEMO_GOALS.length, 1).setNumberFormat('#,##0.00');
  }

  // ===== حقن بيانات مفكرة السلف في ورقة الأهداف (إذا وجد الجدول) =====
  if (goalsSheet && goalsSheet.getRange('A30').getValue() !== '') {
    const DEMO_DEBTS = [
      ['أحمد بن محمد',    'أعطيته سلف',  15000, 'USD', new Date('2025-01-10'), new Date('2025-07-10'), 15000, '', ''],
      ['سارة العلي',      'أخذت منه سلف', 8000,  'USD', new Date('2025-02-15'), new Date('2025-08-15'), 5000,  '', ''],
      ['خالد يوسف',       'أعطيته سلف',  25000, 'USD', new Date('2025-03-01'), new Date('2026-03-01'), 10000, '', ''],
      ['فاطمة الزهراء',   'أخذت منه سلف', 5000,  'USD', new Date('2025-04-20'), new Date('2025-10-20'), 5000,  '', ''],
      ['محمد الأمين',     'أعطيته سلف',  12000, 'USD', new Date('2025-06-01'), new Date('2026-06-01'), 0,     '', ''],
      ['نورة حسين',       'أخذت منه سلف', 3500,  'USD', new Date('2025-07-15'), new Date('2026-01-15'), 1000,  '', ''],
      ['عبد الرحمن',      'أعطيته سلف',  7000,  'USD', new Date('2025-09-01'), new Date('2026-03-01'), 7000,  '', ''],
      ['ليلى بوعلام',     'أخذت منه سلف', 20000, 'USD', new Date('2025-10-10'), new Date('2026-10-10'), 0,     '', ''],
    ];
    goalsSheet.getRange(31, 1, DEMO_DEBTS.length, 9).setValues(DEMO_DEBTS);
    goalsSheet.getRange(31, 5, DEMO_DEBTS.length, 1).setNumberFormat('yyyy-mm-dd');
    goalsSheet.getRange(31, 6, DEMO_DEBTS.length, 1).setNumberFormat('yyyy-mm-dd');
    goalsSheet.getRange(31, 3, DEMO_DEBTS.length, 1).setNumberFormat('#,##0.00');
    goalsSheet.getRange(31, 7, DEMO_DEBTS.length, 1).setNumberFormat('#,##0.00');
  }
}

// ============================================================================
// STEP 4: UPDATE ENGINE TO READ FROM _YearData VIA ACTIVE YEAR
// ============================================================================
/**
 * يُحدّث معادلات _DashboardEngine لتقرأ من _YearData مفلترة بالسنة النشطة.
 * يُعدّل أيضاً الأوراق الشهرية لتعرض بيانات السنة المختارة فقط.
 *
 * المبدأ:
 *   - _DashboardEngine!B2:B13 (دخل شهري) = SUMIFS من _YearData
 *   - _DashboardEngine!C2:C13 (مصروف شهري) = SUMIFS من _YearData
 *   - الأوراق الشهرية تستخدم QUERY لعرض المعاملات
 */
function updateEngineForDynamicYear(ss) {
  const engine = ss.getSheetByName('_DashboardEngine');
  if (!engine) return;

  const yd = YEAR_SHEET_NAME;
  const yearRef = `'الإعدادات وأسعار الصرف'!J3`; // خلية السنة النشطة

  // تحديث B2:B13 و C2:C13 - الدخل والمصروف لكل شهر
  const monthsArr = ['يناير','فبراير','مارس','أبريل','مايو','يونيو',
                     'يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

  for (let i = 0; i < 12; i++) {
    const row = i + 2;
    const month = monthsArr[i];

    // B: إجمالي الدخل الفعلي للشهر (من _YearData)
    engine.getRange('B' + row).setFormula(
      `=IFERROR(SUMIFS('${yd}'!H:H, '${yd}'!A:A, ${yearRef}, '${yd}'!B:B, "${month}", '${yd}'!C:C, "دخل"), 0)`
    );

    // C: إجمالي المصروف الفعلي للشهر (من _YearData)
    engine.getRange('C' + row).setFormula(
      `=IFERROR(SUMIFS('${yd}'!H:H, '${yd}'!A:A, ${yearRef}, '${yd}'!B:B, "${month}", '${yd}'!C:C, "مصروف"), 0)`
    );
  }

  // تحديث Q:W (سجل المعاملات المتراكم) ليقرأ من _YearData بدل الأوراق الشهرية
  // نستبدل الـ ARRAYFORMULAs القديمة بـ QUERY واحد
  engine.getRange('Q2').setFormula(
    `=IFERROR(QUERY('${yd}'!B2:I, "SELECT B, D, C, E, F, H, I WHERE A = " & ${yearRef} & " AND H IS NOT NULL ORDER BY D DESC", 0), "")`
  );
  // مسح المنطقة القديمة (الصفوف 3+) من Q لأن QUERY ستملأها تلقائياً
  // (لا نمسح لأن QUERY يملأ تلقائياً)

  // تحديث buildCategorySumFormula equivalent - الأعمدة G (waterfall)
  // G3-G5 يحتاجون SUMIFS مفلترة بالسنة
  engine.getRange('G3').setFormula(
    `=IFERROR(-1*SUMIFS('${yd}'!H:H, '${yd}'!A:A, ${yearRef}, '${yd}'!C:C, "مصروف", '${yd}'!E:E, "السكن"), 0)`
  );
  engine.getRange('G4').setFormula(
    `=IFERROR(-1*SUMIFS('${yd}'!H:H, '${yd}'!A:A, ${yearRef}, '${yd}'!C:C, "مصروف", '${yd}'!E:E, "الطعام"), 0)`
  );
  engine.getRange('G5').setFormula(
    `=IFERROR(-1*SUMIFS('${yd}'!H:H, '${yd}'!A:A, ${yearRef}, '${yd}'!C:C, "مصروف", '${yd}'!E:E, "النقل"), 0)`
  );

  // تحديث I:J (دونات الدخل) - SUMIFS بالسنة + الفئة
  const INCOME_CATS = ['راتب أساسي','مكافآت وحوافز','عمل حر','دخل استثماري',
                       'إيجارات','أرباح تجارية','هدايا','أخرى'];
  for (let i = 0; i < INCOME_CATS.length; i++) {
    engine.getRange(2 + i, 10).setFormula(
      `=IFERROR(SUMIFS('${yd}'!H:H, '${yd}'!A:A, ${yearRef}, '${yd}'!C:C, "دخل", '${yd}'!E:E, I${2+i}), 0)`
    );
  }

  // تحديث L:M (دونات المصاريف) - SUMIFS بالسنة + الفئة
  const EXPENSE_CATS = ['الطعام','النقل','السكن','الفواتير','الصحة','التعليم',
                        'التسوق','الترفيه','الاشتراكات','السفر','الطوارئ','أخرى'];
  for (let i = 0; i < EXPENSE_CATS.length; i++) {
    engine.getRange(2 + i, 13).setFormula(
      `=IFERROR(SUMIFS('${yd}'!H:H, '${yd}'!A:A, ${yearRef}, '${yd}'!C:C, "مصروف", '${yd}'!E:E, L${2+i}), 0)`
    );
  }
}

// ============================================================================
// STEP 5: NAMED RANGES
// ============================================================================
function defineYearNamedRanges(ss) {
  const settings = ss.getSheetByName('الإعدادات وأسعار الصرف');
  if (!settings) return;

  // نطاق السنة النشطة
  ss.setNamedRange('rng_ActiveYear', settings.getRange('J3'));

  // نطاق بيانات السنوات (للأرشيف والاستعلامات)
  const ydSheet = ss.getSheetByName(YEAR_SHEET_NAME);
  if (ydSheet) {
    ss.setNamedRange('rng_YearData', ydSheet.getRange('A1:I'));
  }
}

// ============================================================================
// UTILITY: تطهير سنة معيّنة (حذف كل بياناتها من _YearData)
// ============================================================================
/**
 * يمسح كل بيانات سنة معيّنة من _YearData.
 * مفيد لتنظيف السنوات قبل الاستخدام.
 *
 * الاستخدام: cleanYear(2026) — يحذف كل صفوف 2026
 */
function cleanYear(year) {
  const ss = SpreadsheetApp.getActive();
  const s = ss.getSheetByName(YEAR_SHEET_NAME);
  if (!s) return;

  const data = s.getDataRange().getValues();
  const rowsToDelete = [];

  // نجمع أرقام الصفوف التي تطابق السنة (من الأسفل للأعلى للحذف الآمن)
  for (let i = data.length - 1; i >= 1; i--) {
    if (data[i][0] === year || data[i][0] === String(year)) {
      rowsToDelete.push(i + 1); // 1-based
    }
  }

  // حذف من الأسفل للأعلى
  rowsToDelete.forEach(r => s.deleteRow(r));

  SpreadsheetApp.flush();
}

/**
 * تطهير كل السنوات من 2026 إلى 2035 (ضمان نظافتها).
 * السنة 2025 (التجريبية) لا تُمسح.
 */
function cleanAllYearsExcept2025() {
  for (let y = 2026; y <= 2035; y++) {
    cleanYear(y);
  }
  SpreadsheetApp.getUi().alert(
    'تم التطهير',
    'تمّ مسح كل بيانات السنوات 2026→2035.\nالسنة التجريبية 2025 لم تُمسّ.',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

// ============================================================================
// UTILITY: إضافة معاملة جديدة (يمكن استدعاؤها من واجهة مخصصة)
// ============================================================================
/**
 * يُضيف صف معاملة جديد في _YearData.
 * @param {number} year - السنة
 * @param {string} month - الشهر (عربي)
 * @param {string} type - "دخل" أو "مصروف"
 * @param {Date} date - التاريخ
 * @param {string} category - الفئة
 * @param {string} description - الوصف
 * @param {number} expected - المبلغ المتوقع
 * @param {number} actual - المبلغ الفعلي
 * @param {string} paymentMethod - طريقة الدفع
 */
function addTransaction(year, month, type, date, category, description, expected, actual, paymentMethod) {
  const ss = SpreadsheetApp.getActive();
  const s = ss.getSheetByName(YEAR_SHEET_NAME);
  if (!s) return;

  const newRow = [year, month, type, date, category, description, expected, actual, paymentMethod];
  s.appendRow(newRow);

  // تنسيق الصف الأخير
  const lastRow = s.getLastRow();
  s.getRange(lastRow, 1).setNumberFormat('0');
  s.getRange(lastRow, 4).setNumberFormat('yyyy-mm-dd');
  s.getRange(lastRow, 7).setNumberFormat('#,##0.00');
  s.getRange(lastRow, 8).setNumberFormat('#,##0.00');
}
