/**
 * Module: 22_phase3_goals.gs
 * Layer: 3 (IO - phase builder)
 *
 * Phase 3 - builds ورقة "الأهداف المالية والادخار" with the summary panel
 * (rows 2-4), the goals table (rows 6..26), 4 baseline goals seeded at rows
 * 7..10, and the per-row computed columns D, F, G, H, I (each row gets its
 * own formula because the smart-recommendation IFS embeds per-row references
 * to G{r} via TEXT(G{r}, rng_ActiveFormat)).
 *
 * Reads (globals):
 *   T, SHEET_NAMES, GOALS_SEED
 *   getOrCreateSheet, mergeAndStyle (from 10_lib_apps_script.gs)
 *
 * Cross-sheet contract: dashboard reads B3, D2, F2, A7:A26, D7:D26, plus the
 * named-range rng_ActiveFormat is consumed by the I-column IFS formulas.
 * No A1 references are changed by PR 1.
 */

function buildGoals(ss) {
  const s = getOrCreateSheet(ss, SHEET_NAMES.goals);

  // Title
  mergeAndStyle(s, 'A1:I1', 'الأهداف المالية والادخار - نظام مالي ذكي متكامل',
    { bold: true, size: 16, align: 'center' });

  // Summary panel rows 2-4 (cell-by-cell from docs/05 section 3.1)
  s.getRange('A2').setValue('إجمالي تكلفة الأهداف');
  s.getRange('B2').setFormula('=SUM(B7:B26)');
  s.getRange('C2').setValue('إجمالي المدخر');
  s.getRange('D2').setFormula('=SUM(C7:C26)');
  s.getRange('E2').setValue('نسبة الإنجاز الكلية');
  s.getRange('F2').setFormula('=IFERROR(SUM(C7:C26)/SUM(B7:B26), 0)').setNumberFormat('0.0%');

  s.getRange('A3').setValue('إجمالي القسط الشهري المطلوب');
  s.getRange('B3').setFormula('=SUMIF(H7:H26, "🟡 قيد الادخار", G7:G26)');
  s.getRange('C3').setValue('أهداف مكتملة');
  s.getRange('D3').setFormula('=COUNTIF(H7:H26, "🟢 مكتمل")');
  s.getRange('E3').setValue('أهداف قيد الادخار');
  s.getRange('F3').setFormula('=COUNTIF(H7:H26, "🟡 قيد الادخار")');

  s.getRange('A4').setValue('أهداف لم تبدأ');
  s.getRange('B4').setFormula('=COUNTIF(H7:H26, "⚪ لم يبدأ بعد")');

  // Goals table header at row 6
  const goalHeader = ['الهدف', 'التكلفة التقديرية', 'المبلغ المدخر حالياً',
    'نسبة الإنجاز', 'الموعد المستهدف', 'الأشهر المتبقية',
    'القسط الشهري المطلوب', 'الحالة', 'التوصية الذكية'];
  s.getRange('A6:I6').setValues([goalHeader])
    .setFontWeight('bold').setBackground('#374151').setFontColor(T.fgPrimary)
    .setHorizontalAlignment('center');

  // 4 baseline goals (cols A, B, C, E)
  s.getRange(7, 1, GOALS_SEED.length, 9).setValues(GOALS_SEED);
  s.getRange(7, 5, GOALS_SEED.length, 1).setNumberFormat('yyyy-mm-dd');

  // Per-row formulas for D, F, G, H, I across rows 7..26 (write each row to keep refs).
  for (let r = 7; r <= 26; r++) {
    s.getRange('D' + r).setFormula(`=IFERROR(C${r}/B${r}, 0)`).setNumberFormat('0.0%');
    s.getRange('F' + r).setFormula(`=IFERROR(MAX(0, DATEDIF(TODAY(), E${r}, "M")), 0)`);
    s.getRange('G' + r).setFormula(`=IF(C${r}>=B${r}, 0, IFERROR((B${r}-C${r})/F${r}, 0))`);
    s.getRange('H' + r).setFormula(
      `=IFS(B${r}="", "", IFERROR(C${r}/B${r}, 0) >= 1, "🟢 مكتمل", IFERROR(C${r}/B${r}, 0) >= 0.01, "🟡 قيد الادخار", TRUE, "⚪ لم يبدأ بعد")`);
    s.getRange('I' + r).setFormula(
      `=IFS(B${r}="", "", IFERROR(C${r}/B${r}, 0) >= 1, "🎉 الهدف محقق بالكامل، يمكن إعادة توجيه القسط لهدف جديد.", F${r} = 0, "⚠️ الموعد المستهدف انتهى دون اكتمال الهدف، يجب تمديد المدة أو زيادة الادخار.", F${r} > 24, "⏳ لديك وقت كافٍ، خصص " & TEXT(G${r}, rng_ActiveFormat) & " شهرياً للوصول للهدف خلال " & F${r} & " شهراً.", F${r} > 6, "🟡 الزمن متوسط، التزم بـ " & TEXT(G${r}, rng_ActiveFormat) & " شهرياً ولا تؤجّل الادخار.", TRUE, "🔴 الموعد قريب جداً، يلزم ادخار " & TEXT(G${r}, rng_ActiveFormat) & " شهرياً وقد يتطلب الأمر مراجعة الأولويات.")`);
  }

  // Conditional formatting on H7:H26 for status colors
  const rules = s.getConditionalFormatRules();
  const hRange = s.getRange('H7:H26');
  rules.push(
    SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied('=$H7="🟢 مكتمل"')
      .setBackground('#27AE60').setFontColor(T.white).setRanges([hRange]).build(),
    SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied('=$H7="🟡 قيد الادخار"')
      .setBackground('#F1C40F').setFontColor('#000000').setRanges([hRange]).build(),
    SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied('=$H7="⚪ لم يبدأ بعد"')
      .setBackground('#BDC3C7').setFontColor('#000000').setRanges([hRange]).build());
  s.setConditionalFormatRules(rules);

  s.setFrozenRows(6);
  s.autoResizeColumns(1, 9);
}
