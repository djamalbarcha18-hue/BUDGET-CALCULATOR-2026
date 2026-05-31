/**
 * SMARTBUDGET PRO 2026 — Module 07: Formula Integrity Manifest
 * =============================================================================
 * Phase 3 of the Strategic Refactor Plan: Self-Healing System.
 *
 * The Architect Mandate said:
 *   "Detect missing formulas. Detect altered formulas.
 *    Restore critical formulas automatically whenever possible."
 *
 * This module fulfills that promise.
 *
 * HOW IT WORKS
 * ------------
 *   buildFormulaManifest()        Returns the canonical map:
 *                                   { sheetName: { cellA1: expectedFormula, ... } }
 *                                 Generated using the SAME helpers as the
 *                                 builders (buildYearSum, buildCategoryYearSum)
 *                                 so manifest and reality cannot drift apart.
 *
 *   verifyFormulaIntegrity()      Runs the manifest against the workbook.
 *                                 Returns a report object with three buckets:
 *                                   { healthy: [...], missing: [...], altered: [...] }
 *
 *   menuVerifyFormulaIntegrity()  UI wrapper: shows a dialog with the report.
 *
 *   menuAutoRepairFormulas()      UI wrapper: confirms with user, then
 *                                 rewrites every missing/altered formula
 *                                 to its expected value. User-entered values
 *                                 in input cells are NEVER touched.
 *
 * WHY THIS APPROACH
 * -----------------
 * Building the manifest by hand and writing formulas by hand would let them
 * drift apart over time. By having the manifest call the SAME helpers
 * (buildYearSum, buildCategoryYearSum) that the engine builder calls, we
 * guarantee that "expected" always equals "what was originally written."
 *
 * STATUS CODES (for reports)
 * --------------------------
 *   'sheet_missing'  — entire parent sheet is gone
 *   'missing'        — sheet exists, formula cell is empty
 *   'altered'        — formula exists but does not match expected
 *   'healthy'        — formula matches expected exactly
 */

// ============================================================================
// MANIFEST BUILDER
// ----------------------------------------------------------------------------
// Returns the full map of every critical formula in the workbook.
// Called fresh each time — never cached — so language/year selector changes
// in the dashboard cells reflect correctly.
// ============================================================================
function buildFormulaManifest() {
  const manifest = {};

  // -------- Settings sheet (the source of truth) ----------------------------
  manifest[SHEET_NAMES.settings] = {
    'B4': '=XLOOKUP(B3, A7:A20, D7:D20)',
    'B5': '=XLOOKUP(B3, A7:A20, C7:C20)'
  };

  // -------- Goals sheet -----------------------------------------------------
  // Summary panel B2:F4
  manifest[SHEET_NAMES.goals] = {
    'B2': '=SUM(B7:B26)',
    'D2': '=SUM(C7:C26)',
    'F2': '=IFERROR(SUM(C7:C26)/SUM(B7:B26), 0)',
    'B3': '=SUMIF(H7:H26, "🟡 قيد الادخار", G7:G26)',
    'D3': '=COUNTIF(H7:H26, "🟢 مكتمل")',
    'F3': '=COUNTIF(H7:H26, "🟡 قيد الادخار")',
    'B4': '=COUNTIF(H7:H26, "⚪ لم يبدأ بعد")'
  };
  // Per-row formulas D/F/G/H/I across rows 7..26
  for (let r = 7; r <= 26; r++) {
    manifest[SHEET_NAMES.goals][`D${r}`] = `=IFERROR(C${r}/B${r}, 0)`;
    manifest[SHEET_NAMES.goals][`F${r}`] = `=IFERROR(MAX(0, DATEDIF(TODAY(), E${r}, "M")), 0)`;
    manifest[SHEET_NAMES.goals][`G${r}`] = `=IF(C${r}>=B${r}, 0, IFERROR((B${r}-C${r})/F${r}, 0))`;
  }

  // -------- 12 monthly sheets ----------------------------------------------
  // Each month has the same canonical formula set on its KPI panel + totals.
  MONTHS.forEach(m => {
    const sheet = {};
    // KPI panel
    sheet['B2'] = '=IFERROR(rng_MainCurrency,"USD")';
    sheet['F2'] = '=IF(OR(D3="",D4="",D3=0),"",IF(D4>D3,"🔴 تجاوز",IF(D4>=0.9*D3,"🟡 اقتراب","🟢 ممتاز")))';
    sheet['B3'] = '=SUM(E10:E28)';
    sheet['D3'] = '=SUM(D33:D62)';
    sheet['F3'] = '=IFERROR((B4-D4)/B4,0)';
    sheet['B4'] = '=SUM(F10:F28)';
    sheet['D4'] = '=SUM(E33:E62)';
    sheet['F4'] = '=IFERROR(D4/B4,0)';
    sheet['B5'] = '=B4-D4';
    sheet['D5'] = '=IFERROR(XLOOKUP(MAX(ARRAYFORMULA(SUMIF(B33:B62,rng_ExpenseCategories,E33:E62))),' +
                 'ARRAYFORMULA(SUMIF(B33:B62,rng_ExpenseCategories,E33:E62)),rng_ExpenseCategories),"")';
    sheet['F5'] = '=IFERROR(MAX(ARRAYFORMULA(SUMIF(B33:B62,rng_ExpenseCategories,E33:E62))),0)';

    // ARRAYFORMULAs (the ones users sometimes accidentally delete)
    sheet['G10'] = '=ARRAYFORMULA(IF((E10:E28="")+(F10:F28="")>0,"",F10:F28-E10:E28))';
    sheet['F33'] = '=ARRAYFORMULA(IF((D33:D62="")+(E33:E62="")>0,"",D33:D62-E33:E62))';

    // Totals rows
    sheet['E29'] = '=SUM(E10:E28)';
    sheet['F29'] = '=SUM(F10:F28)';
    sheet['G29'] = '=F29-E29';
    sheet['D63'] = '=SUM(D33:D62)';
    sheet['E63'] = '=SUM(E33:E62)';
    sheet['F63'] = '=D63-E63';

    manifest[m] = sheet;
  });

  // -------- Dashboard sheet -------------------------------------------------
  // Selectors: visible mirrors + FX multiplier chain
  manifest[SHEET_NAMES.dashboard] = {
    'F4': `=IFERROR(VLOOKUP(D4,${SHEET_NAMES.fx}!A:B,2,FALSE),1)`,
    'H4': `=IFERROR(VLOOKUP(IFERROR(rng_MainCurrency,"USD"),${SHEET_NAMES.fx}!A:B,2,FALSE),1)`,
    'J4': '=IFERROR(F4/H4,1)',
    'S4': '=B4',
    'V4': '=D4'
  };
  // KPI card big numbers (cells $colStart$8 for the 6 cards)
  const eng = `'${SHEET_NAMES.engine}'`;
  manifest[SHEET_NAMES.dashboard]['B8'] = `=IFERROR(SUM(${eng}!B2:B13),0)`;
  manifest[SHEET_NAMES.dashboard]['F8'] = `=IFERROR(SUM(${eng}!C2:C13),0)`;
  manifest[SHEET_NAMES.dashboard]['J8'] = `=IFERROR(SUM(${eng}!D2:D13),0)`;
  manifest[SHEET_NAMES.dashboard]['N8'] = `=IFERROR(SUM(${eng}!D2:D13)*1.5,0)`;
  manifest[SHEET_NAMES.dashboard]['R8'] =
    `=IFERROR((SUM(${eng}!B2:B13)-SUM(${eng}!C2:C13))/SUM(${eng}!B2:B13),0)`;
  manifest[SHEET_NAMES.dashboard]['V8'] = `=IFERROR(${eng}!P2,0)`;
  // Latest-5 ledger query
  manifest[SHEET_NAMES.dashboard]['H48'] =
    `=IFERROR(QUERY('${SHEET_NAMES.engine}'!Q2:W,` +
    `"select * where Col2 is not null and YEAR(Col2)=" & B4 & ` +
    `" order by Col2 desc limit 5", 0), "")`;

  // -------- Engine sheet (the analytical core) ------------------------------
  // Generated using the SAME helpers as buildDashboardEngineV2 — guaranteed
  // to match what the original installer wrote.
  const yr = `'${SHEET_NAMES.dashboard}'!$B$4`;
  const fx = `'${SHEET_NAMES.dashboard}'!$J$4`;

  const engineMap = {};
  // A:D monthly grid
  for (let i = 0; i < 12; i++) {
    const m = MONTHS[i];
    const row = i + 2;
    engineMap[`B${row}`] = buildYearSum(m, 'B', 'F', 10, 28, yr, fx);
    engineMap[`C${row}`] = buildYearSum(m, 'A', 'E', 33, 62, yr, fx);
    engineMap[`D${row}`] = `=B${row}-C${row}`;
  }
  // F:G waterfall
  engineMap['G2'] = '=IFERROR(SUM(B2:B13),0)';
  engineMap['G3'] = `=-1*${buildCategoryYearSum('السكن', true, yr, fx)}`;
  engineMap['G4'] = `=-1*${buildCategoryYearSum('الطعام', true, yr, fx)}`;
  engineMap['G5'] = `=-1*${buildCategoryYearSum('النقل', true, yr, fx)}`;
  engineMap['G6'] = '=IFERROR(-1*(SUM(C2:C13)+G3+G4+G5),0)';
  engineMap['G7'] = '=IFERROR(SUM(G2:G6),0)';
  // Income doughnut
  INCOME_CATEGORIES.forEach((cat, i) => {
    engineMap[`J${i + 2}`] = buildCategoryYearSum(cat, false, yr, fx);
  });
  // Expense doughnut
  EXPENSE_CATEGORIES.forEach((cat, i) => {
    engineMap[`M${i + 2}`] = buildCategoryYearSum(cat, true, yr, fx);
  });
  // Health score + last-month-net
  engineMap['O2'] = '=ROUND(40*MAX(0,MIN(1,IFERROR((SUM(B2:B13)-SUM(C2:C13))/SUM(B2:B13),0)))' +
                   '+30*MAX(0,MIN(1,IFERROR(SUM(B2:B13)/(SUM(B2:B13)+SUM(C2:C13)),0)))' +
                   '+30*IF(SUM(D2:D13)>0,1,0.3),0)';
  engineMap['P2'] = '=IFERROR(INDEX(D2:D13, MAX(1, MIN(12, MONTH(TODAY())-1))), 0)';

  manifest[SHEET_NAMES.engine] = engineMap;

  return manifest;
}

// ============================================================================
// VERIFY — runs the manifest against the live workbook
// ----------------------------------------------------------------------------
// Returns a report object, no side effects, no UI prompts.
// ============================================================================
function verifyFormulaIntegrity() {
  const ss = SpreadsheetApp.getActive();
  const manifest = buildFormulaManifest();
  const report = {
    total: 0,
    healthy: 0,
    missing: [],       // { sheet, cell, expected }
    altered: [],       // { sheet, cell, expected, actual }
    sheetMissing: []   // [sheetName, ...]
  };

  Object.keys(manifest).forEach(sheetName => {
    const s = ss.getSheetByName(sheetName);
    if (!s) {
      report.sheetMissing.push(sheetName);
      // still count the formulas so total reflects the spec
      report.total += Object.keys(manifest[sheetName]).length;
      return;
    }

    Object.keys(manifest[sheetName]).forEach(cellA1 => {
      report.total++;
      const expected = manifest[sheetName][cellA1];
      const actual = s.getRange(cellA1).getFormula();

      if (!actual) {
        report.missing.push({ sheet: sheetName, cell: cellA1, expected });
      } else if (_normalizeFormula(actual) !== _normalizeFormula(expected)) {
        report.altered.push({ sheet: sheetName, cell: cellA1, expected, actual });
      } else {
        report.healthy++;
      }
    });
  });

  return report;
}

/**
 * Normalize a formula for comparison so that whitespace/case variants
 * generated by Sheets' formula parser don't show up as "altered" false
 * positives. Strips leading '=', collapses whitespace, lowercases.
 */
function _normalizeFormula(f) {
  if (!f) return '';
  return String(f)
    .replace(/^=/, '')
    .replace(/\s+/g, '')
    .toLowerCase();
}

// ============================================================================
// AUTO-REPAIR — rewrites every missing/altered formula
// ----------------------------------------------------------------------------
// Pure logic. UI wrapper is menuAutoRepairFormulas below.
// ============================================================================
function autoRepairFormulas(report) {
  const ss = SpreadsheetApp.getActive();
  let repaired = 0;

  // Combine missing + altered; both need the same write
  const toFix = [...(report.missing || []), ...(report.altered || [])];

  toFix.forEach(({ sheet, cell, expected }) => {
    const s = ss.getSheetByName(sheet);
    if (!s) return;
    try {
      s.getRange(cell).setFormula(expected);
      repaired++;
    } catch (e) {
      Logger.log(`[autoRepair] failed on ${sheet}!${cell}: ${e}`);
    }
  });

  SpreadsheetApp.flush();
  return repaired;
}

// ============================================================================
// MENU WRAPPERS — UI dialogs called from the SmartBudget custom menu
// ============================================================================

/**
 * Verify-only flow: show a categorized report, no writes.
 */
function menuVerifyFormulaIntegrity() {
  const ui = SpreadsheetApp.getUi();
  const report = verifyFormulaIntegrity();
  const ts = new Date().toLocaleString(getActiveLang() === 'ar' ? 'ar-DZ' : 'en-US');

  let body = t('integrity.header', { timestamp: ts, total: report.total });

  const issues = report.missing.length + report.altered.length + report.sheetMissing.length;

  if (issues === 0) {
    body += t('integrity.allHealthy');
  } else {
    body += t('integrity.foundIssues', { n: issues });

    report.sheetMissing.forEach(name => {
      body += t('integrity.issueRow', { sheet: name, cell: '*', status: t('integrity.statusSheetMissing') });
    });
    report.missing.forEach(item => {
      body += t('integrity.issueRow', { sheet: item.sheet, cell: item.cell, status: t('integrity.statusMissing') });
    });
    report.altered.forEach(item => {
      body += t('integrity.issueRow', { sheet: item.sheet, cell: item.cell, status: t('integrity.statusAltered') });
    });

    body += t('integrity.footerWithIssues');
  }

  Logger.log(body);
  ui.alert(t('integrity.reportTitle'), body, ui.ButtonSet.OK);
}

/**
 * Repair flow: scan, confirm with user, fix.
 */
function menuAutoRepairFormulas() {
  const ui = SpreadsheetApp.getUi();
  const report = verifyFormulaIntegrity();

  // Block repair entirely if parent sheets are missing — that needs reinstall.
  if (report.sheetMissing.length > 0) {
    ui.alert(
      t('integrity.repairTitle'),
      t('integrity.repairSheetMissing', { n: report.sheetMissing.length }),
      ui.ButtonSet.OK
    );
    return;
  }

  const fixable = report.missing.length + report.altered.length;

  if (fixable === 0) {
    ui.alert(
      t('integrity.repairNothingTitle'),
      t('integrity.repairNothingBody'),
      ui.ButtonSet.OK
    );
    return;
  }

  // Confirm with the user
  const confirm = ui.alert(
    t('integrity.repairTitle'),
    t('integrity.repairConfirm', { n: fixable }),
    ui.ButtonSet.YES_NO
  );
  if (confirm !== ui.Button.YES) return;

  const repaired = autoRepairFormulas(report);

  ui.alert(
    t('integrity.repairDoneTitle'),
    t('integrity.repairDoneBody', { n: repaired }),
    ui.ButtonSet.OK
  );
}
