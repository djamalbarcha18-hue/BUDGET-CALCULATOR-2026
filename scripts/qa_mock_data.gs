/**
 * BUDGET-CALCULATOR-2026 — QA / stress-test helpers
 * ---------------------------------------------------
 *
 * This file is OPTIONAL and TEMPORARY. Paste it as a SECOND .gs file in
 * your Apps Script project alongside install.gs while you stress-test the
 * workbook. After the dashboard has rendered correctly with the simulated
 * data, run `clearMockData` to wipe the test rows, and then DELETE this
 * file from your Apps Script project before starting real data entry.
 *
 * Functions exposed (pick from the Apps Script function dropdown):
 *
 *   fillMockData()    Populates 6 income rows (10..15) + 8 expense rows
 *                     (33..40) on every one of the 12 monthly sheets with
 *                     realistic Arabic budget data, then rebuilds the four
 *                     dashboard charts so you can verify the entire
 *                     end-to-end data flow at once.
 *
 *   clearMockData()   Wipes the same row ranges so you can begin real data
 *                     entry on a clean slate. Headers, formulas, banded
 *                     rows, and the calculated columns (income diff at G10,
 *                     expense diff at F33, alert column H) are NOT cleared.
 *
 * The dataset is engineered to:
 *
 *   1. Use only category strings from rng_IncomeCategories /
 *      rng_ExpenseCategories so the strict dropdown validation never
 *      flags a cell.
 *   2. Distribute amounts so net profit is positive most months but four
 *      months deliberately overspend (مارس / جوان / سبتمبر / ديسمبر),
 *      which fires the red alert engine on the monthly sheets and visibly
 *      lowers the composite health score on the dashboard.
 *   3. Drift slightly month-over-month so the Combo chart shows real
 *      movement and the six trend-arrow KPI cards have non-zero deltas.
 *
 * Designed against PR #24 (Gold Master) of install.gs:
 *
 *   - Maghrebi month names (جانفي … ديسمبر).
 *   - Income block A:H with المداخيل (Revenue Source label) at column A.
 *   - Expense block A:H with calculated diff at F and per-row alert at H.
 *   - ARRAYFORMULAs at G10 (income diff) and F33 (expense diff) — preserved
 *     by writing only to columns A..F + H on income and A..E + G on expense.
 */

// ============================================================================
// fillMockData — populates 12 monthly sheets with simulated income + expenses
// ============================================================================
function fillMockData() {
  const ss = SpreadsheetApp.getActive();
  const ui = SpreadsheetApp.getUi();

  const r = ui.alert(
    'تعبئة بيانات اختباريّة',
    'سيتم استبدال أيّ بيانات موجودة في الصفوف 10..15 (الدخل) ' +
    'و 33..40 (المصاريف) في كلّ ورقة من الأشهر الإثني عشر.\n\n' +
    'متابعة؟',
    ui.ButtonSet.YES_NO);
  if (r !== ui.Button.YES) return;

  // ---------------------------------------------------------------------------
  // 6 income templates. Each tuple maps directly onto the post-PR-24 income
  // block columns:
  //   [0] revenue source label      → col A (المداخيل, free text)
  //   [1] income category           → col C (must be in rng_IncomeCategories)
  //   [2] description               → col D (الوصف, free text)
  //   [3] expected income BASE      → col E (الدخل المتوقع, the per-month
  //                                          drift factor scales this)
  //   [4] payment method            → col H (must be in rng_PaymentMethods)
  // The actual income (col F) is derived from the expected amount × a
  // per-month factor so net profit varies across the 12 months.
  // ---------------------------------------------------------------------------
  const INCOME_TEMPLATES = [
    ['راتب شركة الأمل',          'راتب أساسي',     'راتب الشهر',           8500, 'تحويل الكتروني'],
    ['مكافأة الأداء الربعيّة',    'مكافآت وحوافز',  'مكافأة الإنجاز',         1500, 'تحويل الكتروني'],
    ['عميل تصميم - مشروع X',     'عمل حر',         'تصميم موقع',           2000, 'بطاقة بنكية'],
    ['محفظة استثمار',            'دخل استثماري',   'أرباح أسهم',           800,  'تحويل الكتروني'],
    ['إيجار شقة',                'إيجارات',        'إيجار شهري',           1200, 'نقداً'],
    ['هدية مناسبة',              'هدايا',          'هدية والد',             500,  'نقداً'],
  ];

  // ---------------------------------------------------------------------------
  // 8 expense templates. Each tuple maps onto the expense block columns:
  //   [0] expense category          → col B (must be in rng_ExpenseCategories)
  //   [1] description               → col C (الوصف, free text)
  //   [2] expected expense BASE     → col D (المصروف المتوقع)
  //   [3] payment method            → col G (must be in rng_PaymentMethods)
  // The actual expense (col E) and the alert string (col H, calculated by
  // the per-row formula written by buildMonth) follow from these.
  // ---------------------------------------------------------------------------
  const EXPENSE_TEMPLATES = [
    ['السكن',         'إيجار الشقة',                    3500, 'تحويل الكتروني'],
    ['الطعام',        'بقالة الشهر',                    800,  'بطاقة بنكية'],
    ['النقل',         'وقود + صيانة',                   600,  'بطاقة بنكية'],
    ['الفواتير',      'كهرباء + ماء + إنترنت',           450,  'تحويل الكتروني'],
    ['الصحة',         'كشف طبي + أدوية',                300,  'نقداً'],
    ['التسوق',        'ملابس فصلية',                    600,  'بطاقة بنكية'],
    ['الترفيه',       'مطعم + سينما',                   400,  'نقداً'],
    ['الاشتراكات',    'Netflix + Spotify + Cloud',      150,  'بطاقة بنكية'],
  ];

  // Per-month drift factor on the BASE amounts. Pattern: dip in early year,
  // peak around mid-summer, stabilise toward year-end. This produces visible
  // movement on the Combo chart and non-zero deltas on the six trend cards.
  const MONTH_DRIFT = [
    0.92, 0.95, 0.98, 1.02, 1.00, 1.05,   // جانفي → جوان
    1.08, 1.10, 1.05, 1.02, 1.00, 1.04,   // جويلية → ديسمبر
  ];

  // Months that deliberately blow past their expected expenses so the red
  // alert engine fires on monthly sheets and the composite health score on
  // the dashboard visibly drops. Indices match the MONTHS array (0 = جانفي).
  const OVERSPEND = new Set([2, 5, 8, 11]); // مارس, جوان, سبتمبر, ديسمبر

  for (let mi = 0; mi < MONTHS.length; mi++) {
    const m = MONTHS[mi];
    const sheet = ss.getSheetByName(m);
    if (!sheet) continue;

    const drift     = MONTH_DRIFT[mi];
    const overspend = OVERSPEND.has(mi);
    const monthNum  = String(mi + 1).padStart(2, '0');

    // ----- INCOME block (rows 10..15) -----
    // Write only A..F (six cols) and H (one col). Skipping G is what
    // preserves the ARRAYFORMULA at G10 that computes the income diff.
    const incomeAF = [];
    const incomeH  = [];
    for (let i = 0; i < INCOME_TEMPLATES.length; i++) {
      const [source, category, description, expectedBase, payment] = INCOME_TEMPLATES[i];
      // Days 03, 07, 11, 15, 19, 23 — distinct ISO dates so the latest-5
      // ledger on the dashboard sorts meaningfully across months.
      const day      = String(3 + i * 4).padStart(2, '0');
      const date     = new Date(`2026-${monthNum}-${day}`);
      const expected = Math.round(expectedBase * drift);
      // Income side: in overspend months actual income comes in slightly
      // LOW so net profit tightens; otherwise actual beats expected by 5 %.
      const actual   = Math.round(expected * (overspend ? 0.95 : 1.05));
      incomeAF.push([source, date, category, description, expected, actual]);
      incomeH.push([payment]);
    }
    sheet.getRange(10, 1, incomeAF.length, 6).setValues(incomeAF);
    sheet.getRange(10, 8, incomeH.length, 1).setValues(incomeH);

    // Re-assert the ISO date format on the income date column. setValues
    // with a Date object usually preserves this, but Sheets has been seen
    // to drift on locale changes — the explicit re-assertion costs nothing.
    sheet.getRange(10, 2, incomeAF.length, 1).setNumberFormat('yyyy-mm-dd');

    // ----- EXPENSE block (rows 33..40) -----
    // Write only A..E (five cols) and G (one col). Skipping F preserves the
    // ARRAYFORMULA at F33 that computes the expense diff. Column H carries
    // the per-row alert formulas written by buildMonth — never touched.
    const expenseAE = [];
    const expenseG  = [];
    for (let i = 0; i < EXPENSE_TEMPLATES.length; i++) {
      const [category, description, expectedBase, payment] = EXPENSE_TEMPLATES[i];
      // Days 02, 05, 08, 11, 14, 17, 20, 23 — distinct ISO dates per row.
      const day      = String(2 + i * 3).padStart(2, '0');
      const date     = new Date(`2026-${monthNum}-${day}`);
      const expected = Math.round(expectedBase * drift);
      // Expense side: in overspend months actual blows past expected by
      // 15 % so the red alert fires; otherwise actual is 5 % under expected.
      const actual   = Math.round(expected * (overspend ? 1.15 : 0.95));
      expenseAE.push([date, category, description, expected, actual]);
      expenseG.push([payment]);
    }
    sheet.getRange(33, 1, expenseAE.length, 5).setValues(expenseAE);
    sheet.getRange(33, 7, expenseG.length, 1).setValues(expenseG);
    sheet.getRange(33, 1, expenseAE.length, 1).setNumberFormat('yyyy-mm-dd');

    // ----- Re-paint banded rows + locked-black text on the new entries.
    // setValues can drop styling when it overwrites cells; explicit re-paint
    // confirms PR #24's clean-table aesthetic on the simulated data.
    for (let r = 10; r <= 15; r++) {
      sheet.getRange(r, 1, 1, 8)
        .setBackground(r % 2 === 0 ? '#FAFAFA' : '#FFFFFF')
        .setFontColor('#000000');
    }
    for (let r = 33; r <= 40; r++) {
      sheet.getRange(r, 1, 1, 7)
        .setBackground(r % 2 === 0 ? '#FAFAFA' : '#FFFFFF')
        .setFontColor('#000000');
    }
  }

  // Force every pending formula to recalculate so the engine, the KPI
  // cards, and the four named-range-bound charts pick up the new data
  // before we hand control back to the user.
  SpreadsheetApp.flush();

  // Rebuild the four dashboard charts. They auto-update via their named
  // ranges, but a clean rebuild also confirms the chartArea (responsive %),
  // the Fintech doughnut/combo palette, and the dark canvas options are
  // intact under the new data load. This satisfies the user's "trigger a
  // refresh of the dashboard" requirement deterministically.
  buildDashboardCharts(ss);

  ui.alert(
    'تمت تعبئة البيانات الاختباريّة',
    'تمّت تعبئة 6 صفوف دخل و 8 صفوف مصاريف في كلّ ورقة من الأشهر الإثني عشر ' +
    '(72 صفّ دخل + 96 صفّ مصاريف).\n\n' +
    'افتح ورقة \"اللوحة الرئيسيّة والتقرير السنوي\" لمراجعة:\n' +
    '  • بطاقات KPI الستّ (يجب أن تظهر بأرقام غير صفريّة)\n' +
    '  • مخطّط Combo الشهري (يجب أن يُظهر حركة الأشهر)\n' +
    '  • دونات الدخل والمصاريف (شرائح ملوّنة بالعدد الصحيح)\n' +
    '  • سجلّ آخر 5 معاملات (يجب أن يَعرض البيانات الأحدث)\n' +
    '  • أعمدة التنبيه الحمراء في 4 أشهر (مارس، جوان، سبتمبر، ديسمبر)\n\n' +
    'لمسح البيانات الاختباريّة قبل الاستخدام الفعلي شغّل clearMockData().',
    ui.ButtonSet.OK);
}

// ============================================================================
// clearMockData — wipes only the cells fillMockData populated
// ============================================================================
function clearMockData() {
  const ss = SpreadsheetApp.getActive();
  const ui = SpreadsheetApp.getUi();

  const r = ui.alert(
    'مسح البيانات الاختباريّة',
    'سيتم مسح القيم في الصفوف 10..15 (الدخل) و 33..40 (المصاريف) ' +
    'في كلّ الأوراق الإثني عشر، مع الحفاظ على رؤوس الجداول والصيغ ' +
    'والأعمدة المحسوبة (G للدخل، F و H للمصاريف).\n\n' +
    'متابعة؟',
    ui.ButtonSet.YES_NO);
  if (r !== ui.Button.YES) return;

  for (const m of MONTHS) {
    const sheet = ss.getSheetByName(m);
    if (!sheet) continue;
    // Mirror the exact ranges fillMockData wrote to. Never touch G on the
    // income block (ARRAYFORMULA) or F/H on the expense block (ARRAYFORMULA
    // and per-row alert formulas) — those are part of the installer.
    sheet.getRange(10, 1, 6, 6).clearContent();   // income A10:F15
    sheet.getRange(10, 8, 6, 1).clearContent();   // income H10:H15
    sheet.getRange(33, 1, 8, 5).clearContent();   // expense A33:E40
    sheet.getRange(33, 7, 8, 1).clearContent();   // expense G33:G40
  }

  SpreadsheetApp.flush();
  ui.alert(
    'تم المسح',
    'كل البيانات الاختباريّة مُسحت. الأوراق جاهزة للاستخدام الفعلي. ' +
    'يمكنك الآن حذف هذا الملف (qa_mock_data.gs) من مشروع Apps Script.',
    ui.ButtonSet.OK);
}
