/**
 * SMARTBUDGET PRO 2026 — Module 02: Sheet Builders
 * =============================================================================
 * Functions that construct each user-facing sheet:
 *   - buildSettings   (currency table + categories + payment methods)
 *   - buildGoals      (savings goals + status engine)
 *   - buildMonth      (monthly budget sheet x 12)
 *   - buildFxRates    (hidden GOOGLEFINANCE FX engine)
 *   - buildWelcomeV2  (SaaS landing page)
 *
 * Refactored to use helpers from 01_Helpers.gs (styleHeader, applyCardSurface,
 * applyGlassBorder, applyBandedRows, styleTintedHeader, FORMATS constants).
 *
 * Every formula, every cell address, every behavior is preserved exactly.
 */

// ============================================================================
// SETTINGS SHEET
// ============================================================================
function buildSettings(ss) {
  const s = getOrCreateSheet(ss, SHEET_NAMES.settings);
  s.clear();

  mergeAndStyle(s, 'A1:D1', 'SMARTBUDGET PRO 2026 - الإعدادات وأسعار الصرف',
    { bold: true, size: 14, align: 'center', fontFamily: FONT });
  mergeAndStyle(s, 'A2:D2',
    'يجب تحديث أسعار الصرف يدويا أو عبر GOOGLEFINANCE قبل بدء كل شهر.',
    { fg: T.fgMuted, size: 10, align: 'center', fontFamily: FONT });

  s.getRange('A3').setValue('العملة الرئيسية للعرض').setFontFamily(FONT);
  s.getRange('B3').setValue('USD').setFontFamily(FONT);
  s.getRange('A4').setValue('تنسيق العملة النشط').setFontFamily(FONT);
  s.getRange('B4').setFormula('=XLOOKUP(B3, A7:A20, D7:D20)').setFontFamily(FONT);
  s.getRange('A5').setValue('سعر الصرف مقابل الدولار').setFontFamily(FONT);
  s.getRange('B5').setFormula('=XLOOKUP(B3, A7:A20, C7:C20)').setFontFamily(FONT);

  styleHeader(s.getRange('A6:D6').setValues([['رمز العملة', 'اسم العملة',
    'سعر الصرف USD', 'التنسيق المالي']]));

  s.getRange(7, 1, CURRENCIES.length, 4)
    .setValues(CURRENCIES).setFontColor(TINT_FG).setFontFamily(FONT);

  // Three category/payment lists with shared layout
  const lists = [
    { col: 6, header: 'فئات الدخل',     data: INCOME_CATEGORIES },
    { col: 7, header: 'فئات المصاريف',  data: EXPENSE_CATEGORIES },
    { col: 8, header: 'طرق الدفع',      data: PAYMENT_METHODS }
  ];
  lists.forEach(({ col, header, data }) => {
    styleHeader(s.getRange(6, col).setValue(header));
    s.getRange(7, col, data.length, 1)
      .setValues(data.map(v => [v]))
      .setFontColor(TINT_FG).setFontFamily(FONT);
  });

  s.getRange('B3').setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInRange(s.getRange('A7:A20'), true)
      .setAllowInvalid(false).build());

  s.autoResizeColumns(1, 8);
}

// ============================================================================
// GOALS SHEET
// ============================================================================
function buildGoals(ss) {
  const s = getOrCreateSheet(ss, SHEET_NAMES.goals);
  s.clear();

  mergeAndStyle(s, 'A1:I1', 'الأهداف المالية والادخار - SMARTBUDGET PRO 2026',
    { bold: true, size: 16, align: 'center', fontFamily: FONT });

  // Summary panel rows 2..4
  s.getRange('A2').setValue('إجمالي تكلفة الأهداف').setFontFamily(FONT);
  s.getRange('B2').setFormula('=SUM(B7:B26)');
  s.getRange('C2').setValue('إجمالي المدخر').setFontFamily(FONT);
  s.getRange('D2').setFormula('=SUM(C7:C26)');
  s.getRange('E2').setValue('نسبة الإنجاز').setFontFamily(FONT);
  s.getRange('F2').setFormula('=IFERROR(SUM(C7:C26)/SUM(B7:B26), 0)')
    .setNumberFormat(FORMATS.percent);

  s.getRange('A3').setValue('القسط الشهري المطلوب').setFontFamily(FONT);
  s.getRange('B3').setFormula('=SUMIF(H7:H26, "🟡 قيد الادخار", G7:G26)');
  s.getRange('C3').setValue('أهداف مكتملة').setFontFamily(FONT);
  s.getRange('D3').setFormula('=COUNTIF(H7:H26, "🟢 مكتمل")');
  s.getRange('E3').setValue('أهداف قيد الادخار').setFontFamily(FONT);
  s.getRange('F3').setFormula('=COUNTIF(H7:H26, "🟡 قيد الادخار")');

  s.getRange('A4').setValue('أهداف لم تبدأ').setFontFamily(FONT);
  s.getRange('B4').setFormula('=COUNTIF(H7:H26, "⚪ لم يبدأ بعد")');

  styleHeader(s.getRange('A6:I6').setValues([['الهدف', 'التكلفة', 'المدخر',
    'النسبة', 'الموعد', 'أشهر متبقية', 'القسط الشهري', 'الحالة', 'التوصية']])
    .setHorizontalAlignment('center'));

  s.getRange(7, 1, GOALS_SEED.length, 9).setValues(GOALS_SEED).setFontFamily(FONT);
  s.getRange(7, 5, GOALS_SEED.length, 1).setNumberFormat(FORMATS.date);

  // Per-row formulas across rows 7..26
  for (let r = 7; r <= 26; r++) {
    s.getRange(`D${r}`).setFormula(`=IFERROR(C${r}/B${r}, 0)`).setNumberFormat(FORMATS.percent);
    s.getRange(`F${r}`).setFormula(`=IFERROR(MAX(0, DATEDIF(TODAY(), E${r}, "M")), 0)`);
    s.getRange(`G${r}`).setFormula(`=IF(C${r}>=B${r}, 0, IFERROR((B${r}-C${r})/F${r}, 0))`);
    s.getRange(`H${r}`).setFormula(
      `=IFS(B${r}="", "", IFERROR(C${r}/B${r},0)>=1,"🟢 مكتمل",` +
      `IFERROR(C${r}/B${r},0)>=0.01,"🟡 قيد الادخار",TRUE,"⚪ لم يبدأ بعد")`);
    s.getRange(`I${r}`).setFormula(
      `=IFS(B${r}="","",IFERROR(C${r}/B${r},0)>=1,` +
      `"🎉 الهدف محقق بالكامل.",F${r}=0,` +
      `"⚠️ الموعد انتهى دون اكتمال.",F${r}>24,` +
      `"⏳ خصص "&TEXT(G${r},rng_ActiveFormat)&" شهريا.",F${r}>6,` +
      `"🟡 التزم بـ "&TEXT(G${r},rng_ActiveFormat)&" شهريا.",TRUE,` +
      `"🔴 يلزم "&TEXT(G${r},rng_ActiveFormat)&" شهريا.")`);
  }

  // CF on H column
  const rules = s.getConditionalFormatRules();
  const hRng = s.getRange('H7:H26');
  rules.push(
    SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied('=$H7="🟢 مكتمل"')
      .setBackground('#27AE60').setFontColor(T.white).setRanges([hRng]).build(),
    SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied('=$H7="🟡 قيد الادخار"')
      .setBackground('#F1C40F').setFontColor('#000000').setRanges([hRng]).build(),
    SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied('=$H7="⚪ لم يبدأ بعد"')
      .setBackground('#BDC3C7').setFontColor('#000000').setRanges([hRng]).build()
  );
  s.setConditionalFormatRules(rules);

  s.getRange('A6:I26').setBorder(true, true, true, true, true, true,
    TINT_BORDER, SpreadsheetApp.BorderStyle.SOLID);

  applyBandedRows(s, 7, 26, 9);

  s.getRange('A2:F4').setBackground('#F5F5F5').setFontColor(TINT_FG)
    .setFontWeight('bold').setFontFamily(FONT);

  s.setFrozenRows(6);
  s.autoResizeColumns(1, 9);
}

// ============================================================================
// MONTHLY SHEET
// ============================================================================
function buildMonth(ss, monthName, monthIndex) {
  const s = getOrCreateSheet(ss, monthName);
  s.clear();
  const tint = MONTH_TINTS[monthIndex] || MONTH_TINTS[0];

  mergeAndStyle(s, 'A1:H1', `ميزانية شهر ${monthName} - SMARTBUDGET PRO 2026`,
    { bg: tint, fg: TINT_FG, bold: true, size: 16, align: 'center', fontFamily: FONT });
  s.setRowHeight(1, 38);

  styleTintedHeader(s.getRange('A2:H5'), tint);
  for (let r = 2; r <= 5; r++) s.setRowHeight(r, 28);

  // KPI panel
  s.getRange('A2').setValue('العملة');
  s.getRange('B2').setFormula('=IFERROR(rng_MainCurrency,"USD")');
  s.getRange('C2').setValue('الشهر');
  s.getRange('D2').setValue(monthName);
  s.getRange('E2').setValue('مؤشر التنبيه');
  s.getRange('F2').setFormula(
    '=IF(OR(D3="",D4="",D3=0),"",IF(D4>D3,"🔴 تجاوز",IF(D4>=0.9*D3,"🟡 اقتراب","🟢 ممتاز")))');

  s.getRange('A3').setValue('الدخل المتوقع');
  s.getRange('B3').setFormula('=SUM(E10:E28)').setNumberFormat(FORMATS.money);
  s.getRange('C3').setValue('المصروف المتوقع');
  s.getRange('D3').setFormula('=SUM(D33:D62)').setNumberFormat(FORMATS.money);
  s.getRange('E3').setValue('نسبة الادخار');
  s.getRange('F3').setFormula('=IFERROR((B4-D4)/B4,0)').setNumberFormat(FORMATS.percent);

  s.getRange('A4').setValue('الدخل الفعلي');
  s.getRange('B4').setFormula('=SUM(F10:F28)').setNumberFormat(FORMATS.money);
  s.getRange('C4').setValue('المصروف الفعلي');
  s.getRange('D4').setFormula('=SUM(E33:E62)').setNumberFormat(FORMATS.money);
  s.getRange('E4').setValue('نسبة الإنفاق');
  s.getRange('F4').setFormula('=IFERROR(D4/B4,0)').setNumberFormat(FORMATS.percent);

  s.getRange('A5').setValue('صافي الفائض');
  s.getRange('B5').setFormula('=B4-D4').setNumberFormat(FORMATS.money);
  s.getRange('C5').setValue('أعلى فئة استنزاف');
  s.getRange('D5').setFormula(
    '=IFERROR(XLOOKUP(MAX(ARRAYFORMULA(SUMIF(B33:B62,rng_ExpenseCategories,E33:E62))),' +
    'ARRAYFORMULA(SUMIF(B33:B62,rng_ExpenseCategories,E33:E62)),rng_ExpenseCategories),"")');
  s.getRange('E5').setValue('مبلغها');
  s.getRange('F5').setFormula(
    '=IFERROR(MAX(ARRAYFORMULA(SUMIF(B33:B62,rng_ExpenseCategories,E33:E62))),0)')
    .setNumberFormat(FORMATS.money);

  // Income block
  styleHeader(s.getRange('A9:H9').setValues([['المداخيل', 'التاريخ', 'الفئة', 'الوصف',
    'الدخل المتوقع', 'الدخل الفعلي', 'الفرق', 'طريقة الدفع']])
    .setHorizontalAlignment('center'));

  s.getRange('B10:B28').setNumberFormat(FORMATS.date);
  s.getRange('E10:G28').setNumberFormat(FORMATS.money);
  s.getRange('G10').setFormula(
    '=ARRAYFORMULA(IF((E10:E28="")+(F10:F28="")>0,"",F10:F28-E10:E28))');

  // Income totals row 29
  s.getRange('A29').setValue('الإجمالي').setFontWeight('bold').setFontFamily(FONT);
  s.getRange('E29').setFormula('=SUM(E10:E28)').setNumberFormat(FORMATS.money);
  s.getRange('F29').setFormula('=SUM(F10:F28)').setNumberFormat(FORMATS.money);
  s.getRange('G29').setFormula('=F29-E29').setNumberFormat(FORMATS.money);

  // Expense block
  styleHeader(s.getRange('A32:H32').setValues([['التاريخ', 'الفئة', 'الوصف',
    'المصروف المتوقع', 'المصروف الفعلي', 'الفرق', 'طريقة الدفع', 'حالة التنبيه']])
    .setHorizontalAlignment('center'));

  s.getRange('A33:A62').setNumberFormat(FORMATS.date);
  s.getRange('D33:F62').setNumberFormat(FORMATS.money);
  s.getRange('F33').setFormula(
    '=ARRAYFORMULA(IF((D33:D62="")+(E33:E62="")>0,"",D33:D62-E33:E62))');

  // Per-row alert formula
  for (let rr = 33; rr <= 62; rr++) {
    s.getRange(`H${rr}`).setFormula(
      `=IF(OR(D${rr}="",E${rr}=""),"",` +
      `IF(E${rr}>D${rr},"🔴 تجاوز",` +
      `IF(E${rr}>=0.9*D${rr},"🟡 اقتراب","🟢 ممتاز")))`);
  }

  // Expense totals row 63
  s.getRange('A63').setValue('الإجمالي').setFontWeight('bold').setFontFamily(FONT);
  s.getRange('D63').setFormula('=SUM(D33:D62)').setNumberFormat(FORMATS.money);
  s.getRange('E63').setFormula('=SUM(E33:E62)').setNumberFormat(FORMATS.money);
  s.getRange('F63').setFormula('=D63-E63').setNumberFormat(FORMATS.money);

  // Alert CF
  const rules = s.getConditionalFormatRules();
  const hRng = s.getRange('H33:H62');
  rules.push(
    SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied('=$H33="🔴 تجاوز"')
      .setBackground('#C0392B').setFontColor(T.white).setRanges([hRng]).build(),
    SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied('=$H33="🟡 اقتراب"')
      .setBackground('#F1C40F').setFontColor('#000000').setRanges([hRng]).build(),
    SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied('=$H33="🟢 ممتاز"')
      .setBackground('#27AE60').setFontColor(T.white).setRanges([hRng]).build()
  );
  s.setConditionalFormatRules(rules);

  // Borders + banded rows
  s.getRange('A9:H29').setBorder(true, true, true, true, true, true,
    TINT_BORDER, SpreadsheetApp.BorderStyle.SOLID);
  s.getRange('A32:H63').setBorder(true, true, true, true, true, true,
    TINT_BORDER, SpreadsheetApp.BorderStyle.SOLID);

  applyBandedRows(s, 10, 28, 8);
  applyBandedRows(s, 33, 62, 7);

  // Totals lift on tint
  s.getRange('A29:H29').setBackground(tint).setFontWeight('bold')
    .setFontColor(TINT_FG).setFontFamily(FONT);
  s.getRange('A63:H63').setBackground(tint).setFontWeight('bold')
    .setFontColor(TINT_FG).setFontFamily(FONT);

  s.setFrozenRows(6);
  s.autoResizeColumns(1, 8);
}

// ============================================================================
// FX RATES SHEET (hidden)
// ============================================================================
function buildFxRates(ss) {
  const s = getOrCreateSheet(ss, SHEET_NAMES.fx);
  s.clear();

  styleHeader(s.getRange('A1:D1').setValues([['رمز', 'سعر مقابل USD',
    'آخر تحديث', 'المصدر']]));

  CURRENCY_CODES.forEach((code, i) => {
    const fb  = FX_FALLBACK[code];
    const row = i + 2;
    s.getRange(row, 1).setValue(code).setFontFamily(FONT);

    if (code === 'USD') {
      s.getRange(row, 2).setValue(1);
      s.getRange(row, 4).setValue('عملة الأساس').setFontFamily(FONT);
    } else {
      s.getRange(row, 2).setFormula(
        `=IFERROR(GOOGLEFINANCE("CURRENCY:USD${code}"),${fb})`);
      s.getRange(row, 4).setFormula(
        `=IF(ISNUMBER(GOOGLEFINANCE("CURRENCY:USD${code}")),"GOOGLEFINANCE","تقديري")`)
        .setFontFamily(FONT);
    }
    s.getRange(row, 3).setFormula('=TODAY()').setNumberFormat(FORMATS.date);
  });

  s.getRange(2, 2, CURRENCY_CODES.length, 1).setNumberFormat(FORMATS.rate);
  s.autoResizeColumns(1, 4);
}

// ============================================================================
// WELCOME PAGE (SaaS landing)
// ============================================================================
function buildWelcomeV2(ss) {
  const s = getOrCreateSheet(ss, SHEET_NAMES.welcome);
  s.clear();

  // Cairo on the entire surface FIRST so subsequent styling inherits it.
  s.getRange(1, 1, 50, 18).setFontFamily(FONT)
    .setBackground(T.bgPage).setFontColor(T.fgPrimary);
  for (let i = 1; i <= 50; i++) s.setRowHeight(i, 24);
  for (let j = 3; j <= 6; j++) s.setRowHeight(j, 56);

  // Hero 48pt
  mergeAndStyle(s, 'B3:Q6', t('welcome.hero'),
    { bg: T.bgCard, fg: T.fgPrimary, size: 48, bold: true,
      align: 'center', vAlign: 'middle', wrap: true, fontFamily: FONT });
  applyGlassBorder(s.getRange('B3:Q6'));

  // Sub-tagline 24pt
  mergeAndStyle(s, 'B8:Q9', t('welcome.subtag'),
    { bg: T.bgPage, fg: T.fgMuted, size: 24, align: 'center', wrap: true, fontFamily: FONT });
  s.setRowHeight(8, 36); s.setRowHeight(9, 36);

  // Body 16pt
  mergeAndStyle(s, 'B11:Q14', t('welcome.body'),
    { bg: T.bgPage, fg: T.fgPrimary, size: 16, align: 'center', wrap: true, fontFamily: FONT });
  for (let b = 11; b <= 14; b++) s.setRowHeight(b, 28);

  // Get Started CTA
  const settings = ss.getSheetByName(SHEET_NAMES.settings);
  if (settings) {
    const gid = settings.getSheetId();
    mergeAndStyle(s, 'G16:L18', '',
      { bg: T.income, fg: T.white, size: 20, bold: true,
        align: 'center', vAlign: 'middle', fontFamily: FONT });
    s.getRange('G16').setFormula(
      `=HYPERLINK("#gid=${gid}","${t('welcome.ctaLabel')}")`);
    s.getRange('G16:L18').setBorder(true, true, true, true, false, false,
      T.income, SpreadsheetApp.BorderStyle.SOLID_THICK);
    for (let g = 16; g <= 18; g++) s.setRowHeight(g, 32);
  }

  // 3 Quick Start cards — content from TEXTS.welcome.cards, hyperlink targets
  // are still resolved here because they depend on live sheet IDs.
  const cardTargets = [SHEET_NAMES.settings, 'جانفي', SHEET_NAMES.dashboard];
  const cardAccents = [T.netCyan, T.income, T.paletteOrange];
  const cardCols    = [['B', 'F'], ['G', 'K'], ['L', 'P']];

  TEXTS[ACTIVE_LANG].welcome.cards.forEach((c, i) => {
    const [cs, ce] = cardCols[i];
    const accent   = cardAccents[i];
    applyCardSurface(s, `${cs}21:${ce}34`);
    s.getRange(`${cs}21:${ce}21`).setBackground(accent);
    mergeAndStyle(s, `${cs}22:${ce}23`, c.id,
      { bg: T.bgCard, fg: accent, size: 32, bold: true, align: 'right', fontFamily: FONT });
    mergeAndStyle(s, `${cs}24:${ce}25`, c.title,
      { bg: T.bgCard, fg: T.fgPrimary, size: 18, bold: true, align: 'right', fontFamily: FONT });
    mergeAndStyle(s, `${cs}26:${ce}32`, c.body,
      { bg: T.bgCard, fg: T.fgMuted, size: 16, align: 'right', wrap: true, fontFamily: FONT });

    const tgt = ss.getSheetByName(cardTargets[i]);
    if (tgt) {
      const tgid = tgt.getSheetId();
      mergeAndStyle(s, `${cs}33:${ce}34`, '', { bg: T.bgCard, align: 'right' });
      s.getRange(`${cs}33`).setFormula(
        `=HYPERLINK("#gid=${tgid}","${c.link}")`)
        .setFontColor(T.income).setFontSize(14).setFontFamily(FONT);
    }
  });

  // Signature card
  applyCardSurface(s, 'B37:Q41');
  mergeAndStyle(s, 'B37:Q38', t('welcome.developer'),
    { bg: T.bgCard, fg: T.fgPrimary, size: 18, bold: true,
      align: 'center', vAlign: 'middle', fontFamily: FONT });
  mergeAndStyle(s, 'B39:Q40', t('welcome.contact'),
    { bg: T.bgCard, fg: T.fgMuted, size: 16, align: 'center', vAlign: 'middle', fontFamily: FONT });
  mergeAndStyle(s, 'B41:Q41', t('welcome.version'),
    { bg: T.bgCard, fg: T.fgMuted, size: 12, align: 'center', fontFamily: FONT });
}
