/**
 * Module: 11_lib_formulas.gs
 * Layer: 2 (pure helpers - never touches SpreadsheetApp)
 *
 * Pure formula string builders. Given inputs, returns a formula string.
 * Used by phase builders to assemble cross-sheet formulas.
 *
 * Functions:
 *   buildCategorySumFormula(category, expense, negate, refCell?)
 *   buildAnnualSum(income)
 *   buildTrendFormula(curCell, priCell)
 *
 * Reads (globals): MONTHS, SHEET_NAMES.
 */

function buildCategorySumFormula(category, expense, negate, refCell) {
  // If refCell is provided, the formula references that cell for the category;
  // otherwise it inlines the category as a string literal.
  const catRef = refCell || `"${category}"`;
  const cats = expense ? 'B33:B62' : 'B10:B28';
  const amts = expense ? 'E33:E62' : 'E10:E28';
  const parts = MONTHS.map(m => `SUMIF('${m}'!${cats}, ${catRef}, '${m}'!${amts})`);
  let f = '=' + parts.join(' + ');
  if (negate) f = '=-1 * (' + parts.join(' + ') + ')';
  return f;
}

function buildAnnualSum(income) {
  const block = income ? 'E10:E28' : 'E33:E62';
  return '=SUM(' + MONTHS.map(m => `'${m}'!${block}`).join(', ') + ')';
}

function buildTrendFormula(curCell, priCell) {
  const cur = `${SHEET_NAMES.engine}!${curCell}`;
  const pri = `${SHEET_NAMES.engine}!${priCell}`;
  return `=IF(${pri}=0, "-", IF(${cur} >= ${pri}, "▲ " & TEXT((${cur} - ${pri}) / ${pri}, "0.0%"), "▼ " & TEXT((${cur} - ${pri}) / ${pri}, "0.0%")))`;
}
