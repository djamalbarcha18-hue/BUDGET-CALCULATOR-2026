/**
 * Module: 25_phase5_welcome.gs
 * Layer: 3 (IO - phase builder)
 *
 * Phase 5 - builds ورقة "📖 دليل الاستخدام والترحيب" (the welcome / onboarding
 * sheet that loads first when the user opens the workbook):
 *   - Hero header (B2:O4)
 *   - Tagline (B6:O9)
 *   - Three Quick Start cards (B11..F23, G11..K23, L11..P23) with HYPERLINK
 *     formulas that resolve to the live sheet IDs at install time
 *   - Developer signature card (B26:O29) - the ONLY place in the workbook
 *     where the developer signature appears (verified by `Ctrl+F Boulahdid`)
 *   - Footer rows (B32:O34)
 *
 * Reads (globals):
 *   T, SHEET_NAMES
 *   getOrCreateSheet, mergeAndStyle, paintCard (10_lib_apps_script.gs)
 *
 * Must run AFTER all target sheets exist (Settings, Goals, يناير, Dashboard)
 * because the HYPERLINK formulas embed the live `gid` of each target.
 * No A1 references are changed by PR 1.
 */

function buildWelcome(ss) {
  const s = getOrCreateSheet(ss, SHEET_NAMES.welcome);

  // Page background and increase row heights
  s.getRange(1, 1, 40, 16).setBackground(T.bgPage).setFontColor(T.fgPrimary);
  for (let i = 1; i <= 40; i++) s.setRowHeight(i, 24);
  for (let i = 2; i <= 4; i++) s.setRowHeight(i, 60);

  // Hero header
  const hero = s.getRange('B2:O4');
  hero.merge();
  hero.setValue('نظام ميزان المالي الذكي\nBUDGET CALCULATOR 2026')
    .setBackground(T.bgCard).setFontColor(T.fgPrimary)
    .setFontSize(20).setFontWeight('bold')
    .setHorizontalAlignment('center').setVerticalAlignment('middle')
    .setWrap(true);

  // Tagline
  mergeAndStyle(s, 'B6:O9',
    'نظام ميزان المالي الذكي قالب فنتك عربي احترافي مبني على Google Sheets، يجمع محرّك عملات متعدّد، 12 ورقة شهريّة بمحرّك تنبيهات ذكي، نظام أهداف وادّخار مع توصيات آليّة، ولوحة معلومات فاخرة بوضع داكن وتحليلات سنويّة.',
    { bg: T.bgPage, fg: T.fgMuted, size: 13, align: 'center', wrap: true });

  // Quick start cards (3 columns of 5 each)
  const cards = [
    { id: '01', title: 'اضبط الإعدادات أوّلاً', body: 'افتح ورقة الإعدادات وأسعار الصرف، اختر العملة الرئيسيّة من B3، حدِّث أسعار الصرف، وراجع قوائم الفئات وطرق الدفع.', target: SHEET_NAMES.settings, accent: T.accentNet, link: '📘 افتح ورقة الإعدادات' },
    { id: '02', title: 'أدخل بياناتك الشهريّة', body: 'انتقل لورقة الشهر الحالي وأدخل صفوف الدخل في A10:G28 وصفوف المصاريف في A33:G62. الفرق ومحرّك التنبيهات يُحسبان آلياً.', target: 'يناير', accent: T.accentIncome, link: '📅 افتح ورقة يناير' },
    { id: '03', title: 'اقرأ اللوحة الرئيسيّة بأمان', body: 'بعد تراكم البيانات افتح ورقة اللوحة الرئيسيّة. ستجد ست بطاقات KPI وأربعة رسوم وسجلّ المعاملات. لا تُحرِّر الخلايا المحميّة.', target: SHEET_NAMES.dashboard, accent: T.paletteOrange, link: '📊 افتح اللوحة الرئيسيّة' },
  ];

  const cardCols = [['B', 'F'], ['G', 'K'], ['L', 'P']];
  for (let i = 0; i < cards.length; i++) {
    const c = cards[i];
    const [colStart, colEnd] = cardCols[i];
    paintCard(s, `${colStart}11:${colEnd}23`);
    // Top accent border (Apps Script doesn't expose top-only-border with custom width well, so use a narrow row)
    s.getRange(`${colStart}11:${colEnd}11`).setBackground(c.accent);
    mergeAndStyle(s, `${colStart}12:${colEnd}13`, c.id,
      { bg: T.bgCard, fg: c.accent, size: 30, bold: true, align: 'right' });
    mergeAndStyle(s, `${colStart}14:${colEnd}15`, c.title,
      { bg: T.bgCard, fg: T.fgPrimary, size: 16, bold: true, align: 'right' });
    mergeAndStyle(s, `${colStart}16:${colEnd}22`, c.body,
      { bg: T.bgCard, fg: T.fgMuted, size: 11, align: 'right', wrap: true });
    // Hyperlink
    const target = ss.getSheetByName(c.target);
    if (target) {
      const gid = target.getSheetId();
      mergeAndStyle(s, `${colStart}23:${colEnd}23`, '', { bg: T.bgCard, align: 'right' });
      s.getRange(`${colStart}23`).setFormula(`=HYPERLINK("#gid=${gid}", "${c.link}")`)
        .setFontColor(T.accentIncome).setFontSize(11);
    }
  }

  // Developer signature card
  paintCard(s, 'B26:O29');
  mergeAndStyle(s, 'B26:O27', '💎 تم التطوير والهندسة بواسطة: Boulahdid Djamal Eddine - المهندس',
    { bg: T.bgCard, fg: T.fgPrimary, size: 14, bold: true, align: 'center', vAlign: 'middle' });
  mergeAndStyle(s, 'B28:O29', '📩 للتواصل والدعم الفني: boulahdiddjamaleddine',
    { bg: T.bgCard, fg: T.fgMuted, size: 12, align: 'center', vAlign: 'middle' });

  // Footer
  mergeAndStyle(s, 'B32:O32', 'الإصدار: 1.0.0 (Phase 6/13 - Apps Script Installer) - مايو 2026',
    { bg: T.bgPage, fg: T.fgMuted, size: 10, align: 'center' });
  mergeAndStyle(s, 'B33:O33',
    'قالب احترافي مفتوح للتخصيص. أسعار الصرف مؤشّرات إرشاديّة - يجب على المستخدم تحديثها قبل أيّ استخدام محاسبي فعلي.',
    { bg: T.bgPage, fg: T.fgMuted, size: 10, align: 'center' });
  mergeAndStyle(s, 'B34:O34',
    'Premium Arabic Fintech Template - All formulas built for Google Sheets compatibility (XLOOKUP, ARRAYFORMULA, IFS, QUERY, SPARKLINE).',
    { bg: T.bgPage, fg: T.fgMuted, size: 9, align: 'center' });
}
