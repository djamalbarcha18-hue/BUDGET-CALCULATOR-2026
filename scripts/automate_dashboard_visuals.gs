/**
 * BUDGET-CALCULATOR-2026 - Visuals Engine v2 (Linear / Stripe / Apple aesthetic)
 * =============================================================================
 *
 * Public:
 *   automateDashboardVisuals()         - runnable from menu / button / dropdown
 *   automateDashboardVisualsCore_(ss)  - silent core, returns structured report
 *
 * Charts injected (3-cell grid, no overlap)
 * -----------------------------------------
 *   1. Vertical Column chart  | top, B11:M26    | rng_dash_annual_columns
 *        - Series 0 (Income)  = #4ADE80  (green)
 *        - Series 1 (Expense) = #F87171  (red)
 *        - Series 2 (Savings) = #38BDF8  (sky blue, primary accent)
 *   2. Income doughnut        | bottom-left, B29:G44 | rng_dash_doughnut_income
 *   3. Expense doughnut       | bottom-right, H29:M44| rng_dash_doughnut_expense
 *
 * Design system (Linear / Stripe / Apple)
 * ---------------------------------------
 *   Palette (Linear):     bg #09090B, card #18181B, border #27272A
 *                         primary #38BDF8, income #4ADE80, expense #F87171
 *   Slice palette:        ['#38BDF8', '#818CF8', '#C084FC', '#E879F9', '#FB7185']
 *   Typography:           'Inter' / SF Pro (browser fallback to system sans)
 *                         18px title, 12px body, 11px legend
 *   Spacing:              24px chartArea inset, bottom legend on doughnuts
 *
 * Apps Script Charts API limitations - documented honestly
 * --------------------------------------------------------
 *   1. Chart-container rounded corners (16px radius) are NOT supported by
 *      EmbeddedChartBuilder. The container is always rectangular. We
 *      approximate the soft-card look via:
 *         - tight chartArea insets (24px on every side)
 *         - dark card surface (#18181B) matching the dashboard background
 *         - thinner bar groupWidth (50%)
 *      The dashboard cell behind each chart already has the rounded-feel
 *      via background colour, which is what the eye actually reads.
 *   2. Custom fonts ('Inter', 'SF Pro') are accepted by the API and passed
 *      to the renderer. Whether the viewer SEES Inter depends on the
 *      viewer's browser font cache. Falls back to the default sans-serif
 *      gracefully when Inter isn't loaded.
 *   3. The slice palette accepts up to 16 colors; Sheets cycles after that.
 *      Our palette is 5 colors which covers all realistic category counts.
 *
 * UX guarantees
 * -------------
 *   - Strict sheet resolution: only the canonical name resolves; no fallback
 *     to the active sheet. Eliminates the "charts land on wrong tab" class
 *     of bugs that came from prefix matching.
 *   - Pre-flight data validation: every chart's source range is checked
 *     for #REF!/#VALUE!/empty BEFORE chart insertion. Failed validation
 *     writes an Arabic empty-state message to the chart's anchor cell
 *     instead of inserting a broken-looking chart.
 *   - Self-healing cleanup: getCharts().forEach(removeChart) + flush()
 *     ensures no orphan chart objects survive the rebuild.
 *   - Anchor resolution by label: findAnchorCell() locates each chart by
 *     scanning for the matching placeholder text, with hardcoded
 *     coordinates as a fallback if the user has stripped the placeholders.
 *
 * Anti-collision design
 * ---------------------
 * Apps Script puts every .gs file in one shared global scope. Every
 * top-level identifier in this file is prefixed `ADV_`; shared constants
 * from install.gs are accessed via `typeof X !== 'undefined'` guards.
 */

// =============================================================================
// LINEAR DESIGN SYSTEM
// =============================================================================

/** Palette + slice palette - the "Linear" aesthetic. */
const ADV_THEME_LINEAR = {
  bgPage:       '#09090B',
  bgCard:       '#18181B',
  border:       '#27272A',
  fgPrimary:    '#FAFAFA',
  fgMuted:      '#A1A1AA',
  gridline:     '#27272A',
  accentSavings: '#38BDF8',
  accentIncome:  '#4ADE80',
  accentExpense: '#F87171',
  slicePalette: [
    '#38BDF8',  // sky-400 (primary)
    '#818CF8',  // indigo-400
    '#C084FC',  // purple-400
    '#E879F9',  // fuchsia-400
    '#FB7185',  // rose-400
  ],
};

/** Typography - mirrors Linear's chart conventions. */
const ADV_TYPOGRAPHY = {
  fontName:    'Inter',  // browser falls back to system sans if Inter not loaded
  titleSize:   18,
  bodySize:    12,
  legendSize:  11,
};

/** Internal padding inside each chart's plot area, in pixels. */
const ADV_CHART_PADDING_PX = 24;

// =============================================================================
// SHEET / NAMED-RANGE NAMING
// =============================================================================

/** Canonical dashboard sheet name (strict — see ADV_resolveDashboardSheet_). */
const ADV_DASHBOARD_NAME = (typeof SHEET_NAMES !== 'undefined' && SHEET_NAMES.dashboard)
  ? SHEET_NAMES.dashboard
  : 'اللوحة الرئيسية والتقرير السنوي';

/** Hidden engine sheet that backs every chart's data source. */
const ADV_ENGINE_NAME = (typeof SHEET_NAMES !== 'undefined' && SHEET_NAMES.engine)
  ? SHEET_NAMES.engine
  : '_DashboardEngine';

/** Named ranges. annualColumns is auto-created if absent. */
const ADV_NR = {
  doughnutIncome:  'rng_dash_doughnut_income',     // engine!I1:J9
  doughnutExpense: 'rng_dash_doughnut_expense',    // engine!L1:M13
  annualColumns:   'rng_dash_annual_columns',      // engine!A1:D13 (auto-created)
};

/**
 * Anchor descriptors. Each chart is positioned by finding a label substring
 * on the dashboard sheet first, then falling back to hardcoded (row, col)
 * coordinates if the label is not present. See ADV_resolveAnchor_().
 *
 * The label substrings match the placeholder text written by `buildDashboard`
 * in install.gs. If the user has customised the dashboard layout, the label
 * search will fail gracefully and the fallback coordinates take over.
 */
const ADV_ANCHORS = {
  annualColumns: {
    label:          'Chart 1',
    fallbackRow:    11,
    fallbackCol:    2,                  // column B
    width:          1200,
    height:         336,
    descriptionAr:  'الرسم العمودي السنوي',
  },
  incomeDoughnut: {
    label:          'Chart 3',
    fallbackRow:    29,
    fallbackCol:    2,                  // column B
    width:          600,
    height:         336,
    descriptionAr:  'دونات أكثر مصادر الدخل',
  },
  expenseDoughnut: {
    label:          'Chart 4',
    fallbackRow:    29,
    fallbackCol:    8,                  // column H
    width:          600,
    height:         336,
    descriptionAr:  'دونات أكثر فئات الإنفاق استنزافاً',
  },
};

// =============================================================================
// PUBLIC ENTRY POINT
// =============================================================================
/**
 * Run from the Apps Script function dropdown, a custom menu item, or a
 * drawing-based button on the dashboard. Wraps the silent core in try/catch
 * and surfaces a single Arabic UI alert summarising the result.
 */
function automateDashboardVisuals() {
  const ui = SpreadsheetApp.getUi();

  let result;
  try {
    result = automateDashboardVisualsCore_(SpreadsheetApp.getActive());
  } catch (err) {
    Logger.log('automateDashboardVisuals: fatal: ' +
      (err && err.stack ? err.stack : err));
    ui.alert(
      'فشل تنفيذ أتمتة الرسوم البيانية',
      (err && err.message) ? err.message : String(err),
      ui.ButtonSet.OK);
    return;
  }

  // Compose the Arabic UI summary.
  const lines = [
    'تمت إزالة ' + result.removed + ' رسم(ة) موجود(ة) سابقاً.',
    '',
  ];

  if (result.built.length) {
    lines.push('تمّ إنشاء ' + result.built.length + ' رسم(ات) بنجاح:');
    result.built.forEach(function (label) { lines.push('  • ' + label); });
  }

  if (result.placeholders.length) {
    lines.push('');
    lines.push('تمّ عرض حالة فارغة لـ ' + result.placeholders.length + ' رسم(ات) (بيانات غير كافية):');
    result.placeholders.forEach(function (p) {
      lines.push('  • ' + p.label + ': ' + p.reason);
    });
  }

  if (result.failed.length) {
    lines.push('');
    lines.push('تعذّر إنشاء ' + result.failed.length + ' رسم(ات):');
    result.failed.forEach(function (f) {
      lines.push('  • ' + f.label + ': ' + f.error);
    });
    lines.push('');
    lines.push('راجع View -> Logs في محرّر Apps Script لمزيد من التفاصيل.');
  }

  const allOk = result.failed.length === 0 && result.placeholders.length === 0;
  ui.alert(
    allOk ? 'تمّ تركيب الرسوم البيانية بنجاح' : 'تمّ التنفيذ مع تحفّظات',
    lines.join('\n'),
    ui.ButtonSet.OK);
}

// =============================================================================
// SILENT CORE
// =============================================================================
/**
 * Performs the full chart-rebuild pipeline. Each phase is bounded:
 *   - sheet resolution / cleanup are atomic and throw on failure
 *   - chart construction is per-chart try/catch; one failure does not block
 *     the others, and data-validation failures yield empty-state placeholders
 *     instead of broken charts.
 *
 * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} ss
 * @return {{
 *   removed:      number,
 *   built:        string[],
 *   placeholders: Array<{label:string, reason:string}>,
 *   failed:       Array<{label:string, error:string}>
 * }}
 */
function automateDashboardVisualsCore_(ss) {
  // STEP 1 - STRICT sheet resolution. Throws if canonical name not found.
  const sheet = ADV_resolveDashboardSheet_(ss);

  // STEP 2 - Self-healing cleanup. Removes all charts + flushes state.
  const removed = ADV_clearAllCharts_(sheet);

  // STEP 3 - Make sure every named range the charts depend on exists.
  ADV_ensureAnnualColumnsRange_(ss);

  // STEP 4 - Build the three charts INDEPENDENTLY.
  const builders = [
    function () { return ADV_buildAnnualColumnChart_(sheet, ss); },
    function () { return ADV_buildIncomeDoughnut_(sheet, ss); },
    function () { return ADV_buildExpenseDoughnut_(sheet, ss); },
  ];

  const built        = [];
  const placeholders = [];
  const failed       = [];

  builders.forEach(function (fn) {
    const r = fn();
    if (r.ok)              built.push(r.label);
    else if (r.placeholder) placeholders.push({ label: r.label, reason: r.placeholder });
    else                   failed.push({ label: r.label, error: r.error });
  });

  return {
    removed:      removed,
    built:        built,
    placeholders: placeholders,
    failed:       failed,
  };
}

// =============================================================================
// PHASE 1 - STRICT SHEET RESOLUTION
// =============================================================================
/**
 * Resolves the dashboard sheet using ONLY the canonical name. No fallback to
 * the active sheet, no prefix matching. If the user has renamed the dashboard
 * tab, this function fails loudly with an Arabic alert telling them which
 * sheets currently exist - so they can rename back without guessing.
 *
 * This is the fix for the "charts land on a duplicated dashboard tab" bug
 * from the previous version, where any sheet name starting with 'اللوحة'
 * could silently catch the prefix match.
 *
 * @throws {Error} if a sheet matching ADV_DASHBOARD_NAME does not exist.
 */
function ADV_resolveDashboardSheet_(ss) {
  const sheet = ss.getSheetByName(ADV_DASHBOARD_NAME);
  if (sheet) return sheet;

  // Build a debug list of currently-existing sheet names to help the user
  // identify the typo / rename / accidental duplication.
  const allNames = ss.getSheets()
    .map(function (s) { return s.getName(); })
    .filter(function (n) { return n.indexOf('_') !== 0; });   // hide engine/internal sheets

  throw new Error(
    'لم يتم العثور على ورقة اللوحة الرئيسية بالاسم الدقيق:\n' +
    '   "' + ADV_DASHBOARD_NAME + '"\n\n' +
    'الأوراق الموجودة حالياً في المصنّف:\n' +
    '   • ' + allNames.join('\n   • ') + '\n\n' +
    'يرجى إعادة تسمية ورقة اللوحة الرئيسية لتطابق الاسم الدقيق أعلاه ثم ' +
    'إعادة تشغيل الدالة.');
}

// =============================================================================
// PHASE 2 - SELF-HEALING CLEANUP
// =============================================================================
/**
 * Removes every chart on the sheet, flushes the spreadsheet state to ensure
 * no chart-metadata orphans survive, and returns the count for the UI report.
 *
 * Idempotent: safe to call any number of times.
 */
function ADV_clearAllCharts_(sheet) {
  const charts = sheet.getCharts();
  charts.forEach(function (chart) { sheet.removeChart(chart); });

  // Force the spreadsheet engine to commit the chart deletions before we
  // start inserting new ones. Without this, the new charts can occasionally
  // race against the in-flight removals and end up duplicated.
  SpreadsheetApp.flush();

  return charts.length;
}

// =============================================================================
// PHASE 3 - NAMED RANGE WIRING
// =============================================================================
/**
 * Ensures `rng_dash_annual_columns` exists. Source: `_DashboardEngine!A1:D13`,
 * which is months (col A) + income (B) + expense (C) + savings/net (D).
 * Idempotent.
 */
function ADV_ensureAnnualColumnsRange_(ss) {
  if (ss.getRangeByName(ADV_NR.annualColumns)) return;
  const engine = ss.getSheetByName(ADV_ENGINE_NAME);
  if (!engine) {
    Logger.log('ADV_ensureAnnualColumnsRange_: engine sheet "' +
      ADV_ENGINE_NAME + '" not found - skipping. Column chart will report ' +
      'a clear error when its builder runs.');
    return;
  }
  ss.setNamedRange(ADV_NR.annualColumns, engine.getRange('A1:D13'));
}

/** Returns the Range for a named range, or throws an Arabic error. */
function ADV_requireRange_(ss, name) {
  const r = ss.getRangeByName(name);
  if (!r) {
    throw new Error('النطاق المُسمّى "' + name + '" غير معرَّف. ' +
      'شغّل المُركِّب الرئيسي أو دالة repairDashboard2026 أوّلاً.');
  }
  return r;
}

// =============================================================================
// PHASE 3.5 - DATA VALIDATION (pre-flight) + EMPTY-STATE PLACEHOLDER
// =============================================================================
/**
 * Pre-flight check on a chart's source range. Returns a structured verdict
 * that downstream code uses to decide between (a) inserting the chart vs.
 * (b) writing an Arabic "empty state" message to the anchor cell instead.
 *
 * Detects:
 *   - Range with only a header row (no data rows)
 *   - Spreadsheet errors (#REF!, #VALUE!, #NAME?, #DIV/0!, etc.)
 *   - All-zero numeric data (visually meaningless chart)
 *
 * @return {{ok:boolean, reason?:string}}
 */
function ADV_validateChartData_(range) {
  const values = range.getValues();
  if (values.length < 2) {
    return { ok: false, reason: 'لا توجد صفوف بيانات بعد رأس الجدول' };
  }

  const ERR_TOKENS = ['#REF!', '#VALUE!', '#NAME?', '#ERROR!', '#N/A', '#DIV/0!', '#NULL!'];
  for (let r = 0; r < values.length; r++) {
    for (let c = 0; c < values[r].length; c++) {
      const cellStr = String(values[r][c] == null ? '' : values[r][c]);
      if (ERR_TOKENS.indexOf(cellStr) !== -1) {
        return { ok: false, reason: 'يحتوي النطاق على خطأ ' + cellStr };
      }
    }
  }

  // Require at least one non-zero numeric value in any data row+column.
  // Column 0 is the category/month label, so we scan from column 1 onwards.
  let foundNumeric = false;
  for (let r = 1; r < values.length && !foundNumeric; r++) {
    for (let c = 1; c < values[r].length && !foundNumeric; c++) {
      const v = values[r][c];
      if (typeof v === 'number' && isFinite(v) && v !== 0) {
        foundNumeric = true;
      }
    }
  }
  if (!foundNumeric) {
    return {
      ok: false,
      reason: 'لا توجد قيم رقمية لعرضها — أدخل بيانات في الأشهر أوّلاً',
    };
  }

  return { ok: true };
}

/**
 * Writes a styled Arabic empty-state message to the chart's anchor cell.
 * Used when ADV_validateChartData_ rejects the source range. Visually
 * adjacent to where the chart would have been; user sees a clear "this
 * chart has no data yet" instead of a broken-looking chart frame.
 */
function ADV_writeEmptyStatePlaceholder_(sheet, descriptor, reason) {
  try {
    const anchor = ADV_resolveAnchor_(sheet, descriptor);
    const cell = sheet.getRange(anchor.row, anchor.col);
    cell.setValue('⚠ ' + descriptor.descriptionAr + ' — ' + reason)
      .setFontStyle('italic')
      .setFontSize(ADV_TYPOGRAPHY.bodySize)
      .setFontColor(ADV_THEME_LINEAR.fgMuted)
      .setBackground(ADV_THEME_LINEAR.bgCard)
      .setHorizontalAlignment('center')
      .setVerticalAlignment('middle')
      .setWrap(true);
  } catch (err) {
    Logger.log('ADV_writeEmptyStatePlaceholder_: ' + err);
    // Non-fatal - the chart was already skipped, this is just visual feedback.
  }
}

// =============================================================================
// PHASE 5 - ANCHOR RESOLUTION (label-based with fallback)
// =============================================================================
/**
 * Locate a cell on the sheet whose value contains `labelSubstring`. Returns
 * {row, col} (1-indexed) or null if not found. Wrapped in try/catch because
 * createTextFinder can throw on certain protected ranges.
 */
function ADV_findAnchorCell_(sheet, labelSubstring) {
  try {
    const finder = sheet.createTextFinder(labelSubstring).matchEntireCell(false);
    const cell = finder.findNext();
    if (!cell) return null;
    return { row: cell.getRow(), col: cell.getColumn() };
  } catch (err) {
    Logger.log('ADV_findAnchorCell_: search for "' + labelSubstring +
      '" failed: ' + err);
    return null;
  }
}

/**
 * Resolves the (row, col) where a chart should be anchored. Uses the
 * label-based finder first; falls back to hardcoded coordinates if the
 * placeholder text has been removed from the dashboard.
 */
function ADV_resolveAnchor_(sheet, descriptor) {
  const found = ADV_findAnchorCell_(sheet, descriptor.label);
  if (found) return found;
  return { row: descriptor.fallbackRow, col: descriptor.fallbackCol };
}

// =============================================================================
// PHASE 4a - SHARED LINEAR-STYLE THEME APPLICATOR
// =============================================================================
/**
 * Applies the unified Linear-aesthetic theme to any EmbeddedChartBuilder.
 * Centralising styling here is what guarantees visual consistency: change
 * a colour or font once in ADV_THEME_LINEAR / ADV_TYPOGRAPHY and every
 * chart picks it up.
 *
 * @param {GoogleAppsScript.Charts.EmbeddedChartBuilder} builder
 * @param {string} title - shown at the top of the chart
 * @param {Object} [extra] - extra options merged on top of the base theme
 */
function ADV_applyLinearTheme_(builder, title, extra) {
  const t = ADV_THEME_LINEAR;
  const ty = ADV_TYPOGRAPHY;

  const baseOptions = {
    title: title,
    backgroundColor: t.bgCard,

    // 18px Inter title - matches Linear's chart heading conventions.
    titleTextStyle: {
      color:     t.fgPrimary,
      fontSize:  ty.titleSize,
      fontName:  ty.fontName,
      bold:      true,
    },

    // Default legend: top, Inter, primary foreground. Charts override
    // (e.g., doughnuts move legend to bottom via `extra`).
    legend: {
      position:  'top',
      textStyle: {
        color:    t.fgPrimary,
        fontSize: ty.legendSize,
        fontName: ty.fontName,
      },
    },

    // 24px chartArea inset on every side. This is how we approximate the
    // 16px rounded-corner / 24px padding aesthetic given that the chart
    // container itself can't have rounded corners in Apps Script.
    chartArea: {
      backgroundColor: t.bgCard,
      left:   ADV_CHART_PADDING_PX,
      top:    ADV_CHART_PADDING_PX,
      right:  ADV_CHART_PADDING_PX,
      bottom: ADV_CHART_PADDING_PX,
    },

    hAxis: {
      textStyle: {
        color:    t.fgMuted,
        fontSize: ty.bodySize,
        fontName: ty.fontName,
      },
      gridlines:     { color: t.gridline },
      baselineColor: t.gridline,
    },
    vAxis: {
      textStyle: {
        color:    t.fgMuted,
        fontSize: ty.bodySize,
        fontName: ty.fontName,
      },
      gridlines:     { color: t.gridline },
      baselineColor: t.gridline,
    },
  };

  const merged = Object.assign({}, baseOptions, extra || {});
  Object.keys(merged).forEach(function (key) {
    builder.setOption(key, merged[key]);
  });
}

// =============================================================================
// PHASE 4b - CHART 1: VERTICAL COLUMN (Income / Expense / Savings)
// =============================================================================
/**
 * Source: rng_dash_annual_columns -> _DashboardEngine!A1:D13
 *   Col A  = month (axis)
 *   Col B  = actual income     | series 0 | green     #4ADE80
 *   Col C  = actual expense    | series 1 | red       #F87171
 *   Col D  = net (savings)     | series 2 | sky blue  #38BDF8 (Linear primary)
 *
 * Anchor: descriptor in ADV_ANCHORS.annualColumns. Uses findAnchorCell
 * first, falls back to (row=11, col=2) if the label is not present.
 *
 * The legend label for series 2 is overridden to 'الادخار' so it reads as
 * Savings rather than the engine-internal column header 'صافي الربح'.
 */
function ADV_buildAnnualColumnChart_(sheet, ss) {
  const t = ADV_THEME_LINEAR;
  const ty = ADV_TYPOGRAPHY;
  const desc = ADV_ANCHORS.annualColumns;
  const label = desc.descriptionAr;

  try {
    const range = ADV_requireRange_(ss, ADV_NR.annualColumns);

    // Pre-flight data validation. If the engine has #REF! / no data, skip
    // the chart entirely and write an empty-state message at the anchor.
    const validation = ADV_validateChartData_(range);
    if (!validation.ok) {
      ADV_writeEmptyStatePlaceholder_(sheet, desc, validation.reason);
      return { ok: false, label: label, placeholder: validation.reason };
    }

    const anchor = ADV_resolveAnchor_(sheet, desc);

    const builder = sheet.newChart()
      .setChartType(Charts.ChartType.COLUMN)            // vertical bars
      .addRange(range)
      .setNumHeaders(1)                                 // first row = headers
      .setPosition(anchor.row, anchor.col, 0, 0)
      .setOption('width',  desc.width)
      .setOption('height', desc.height);

    ADV_applyLinearTheme_(builder, 'الإنفاق السنوي — الدخل والمصروف والادخار', {
      // Series binding: each chart series gets its Linear-palette color.
      // labelInLegend overrides the column header so 'صافي الربح' reads as
      // 'الادخار' (Savings) in the legend.
      series: {
        0: { color: t.accentIncome,   labelInLegend: 'الدخل' },
        1: { color: t.accentExpense,  labelInLegend: 'المصروف' },
        2: { color: t.accentSavings,  labelInLegend: 'الادخار' },
      },
      // Thinner bar groups - higher contrast, matches Stripe's chart density.
      bar: { groupWidth: '50%' },
      isStacked: false,                                 // explicit: side-by-side
      legend: {
        position:  'top',
        alignment: 'end',                               // top-right legend
        textStyle: {
          color:    t.fgPrimary,
          fontSize: ty.legendSize,
          fontName: ty.fontName,
        },
      },
    });

    sheet.insertChart(builder.build());
    return { ok: true, label: label };

  } catch (err) {
    const msg = (err && err.message) ? err.message : String(err);
    Logger.log('ADV_buildAnnualColumnChart_: ' + msg);
    return { ok: false, label: label, error: msg };
  }
}

// =============================================================================
// PHASE 4c - CHART 2: INCOME DOUGHNUT (top income sources)
// =============================================================================
/**
 * Source: rng_dash_doughnut_income -> _DashboardEngine!I1:J9
 * Anchor: ADV_ANCHORS.incomeDoughnut (B29:G44 fallback)
 *
 * Style: "Ghost Legend" - legend at bottom, Linear slice palette,
 * 65% pieHole for a thinner doughnut ring.
 */
function ADV_buildIncomeDoughnut_(sheet, ss) {
  const t = ADV_THEME_LINEAR;
  const ty = ADV_TYPOGRAPHY;
  const desc = ADV_ANCHORS.incomeDoughnut;
  const label = desc.descriptionAr;

  try {
    const range = ADV_requireRange_(ss, ADV_NR.doughnutIncome);

    const validation = ADV_validateChartData_(range);
    if (!validation.ok) {
      ADV_writeEmptyStatePlaceholder_(sheet, desc, validation.reason);
      return { ok: false, label: label, placeholder: validation.reason };
    }

    const anchor = ADV_resolveAnchor_(sheet, desc);

    const builder = sheet.newChart()
      .setChartType(Charts.ChartType.PIE)
      .addRange(range)
      .setNumHeaders(1)
      .setPosition(anchor.row, anchor.col, 0, 0)
      .setOption('width',  desc.width)
      .setOption('height', desc.height);

    ADV_applyLinearTheme_(builder, 'أكثر مصادر الدخل', {
      pieHole: 0.65,                                    // thinner ring than 0.6
      pieSliceTextStyle: {
        color:    t.fgPrimary,
        fontSize: ty.bodySize,
        fontName: ty.fontName,
      },
      colors: t.slicePalette,                           // Linear slice palette
      legend: {                                         // "Ghost Legend" at bottom
        position:  'bottom',
        alignment: 'center',
        textStyle: {
          color:    t.fgMuted,                          // muted, ghost-like
          fontSize: ty.legendSize,
          fontName: ty.fontName,
        },
      },
    });

    sheet.insertChart(builder.build());
    return { ok: true, label: label };

  } catch (err) {
    const msg = (err && err.message) ? err.message : String(err);
    Logger.log('ADV_buildIncomeDoughnut_: ' + msg);
    return { ok: false, label: label, error: msg };
  }
}

// =============================================================================
// PHASE 4d - CHART 3: EXPENSE DOUGHNUT (drain categories)
// =============================================================================
/**
 * Source: rng_dash_doughnut_expense -> _DashboardEngine!L1:M13
 * Anchor: ADV_ANCHORS.expenseDoughnut (H29:M44 fallback)
 *
 * Same Ghost-Legend style as the income doughnut for visual symmetry.
 */
function ADV_buildExpenseDoughnut_(sheet, ss) {
  const t = ADV_THEME_LINEAR;
  const ty = ADV_TYPOGRAPHY;
  const desc = ADV_ANCHORS.expenseDoughnut;
  const label = desc.descriptionAr;

  try {
    const range = ADV_requireRange_(ss, ADV_NR.doughnutExpense);

    const validation = ADV_validateChartData_(range);
    if (!validation.ok) {
      ADV_writeEmptyStatePlaceholder_(sheet, desc, validation.reason);
      return { ok: false, label: label, placeholder: validation.reason };
    }

    const anchor = ADV_resolveAnchor_(sheet, desc);

    const builder = sheet.newChart()
      .setChartType(Charts.ChartType.PIE)
      .addRange(range)
      .setNumHeaders(1)
      .setPosition(anchor.row, anchor.col, 0, 0)
      .setOption('width',  desc.width)
      .setOption('height', desc.height);

    ADV_applyLinearTheme_(builder, 'أكثر فئات الإنفاق استنزافاً', {
      pieHole: 0.65,
      pieSliceTextStyle: {
        color:    t.fgPrimary,
        fontSize: ty.bodySize,
        fontName: ty.fontName,
      },
      colors: t.slicePalette,
      legend: {
        position:  'bottom',
        alignment: 'center',
        textStyle: {
          color:    t.fgMuted,
          fontSize: ty.legendSize,
          fontName: ty.fontName,
        },
      },
    });

    sheet.insertChart(builder.build());
    return { ok: true, label: label };

  } catch (err) {
    const msg = (err && err.message) ? err.message : String(err);
    Logger.log('ADV_buildExpenseDoughnut_: ' + msg);
    return { ok: false, label: label, error: msg };
  }
}

// =============================================================================
// PHASE 6 - PER-MONTH RELATIVE DOUGHNUTS (PR #14)
// =============================================================================
//
// Injects two doughnut charts onto EACH monthly sheet:
//   - Income doughnut  | anchor I10  | source P1:Q9   (8 income categories)
//   - Expense doughnut | anchor I33  | source R1:S13  (12 expense categories)
//
// The source ranges P:S are written by `applyMonthlyChartDataHelpers_` in
// install.gs (helper columns are hidden after install). Each chart shows
// the category breakdown for THAT month only - hence "relative" doughnuts -
// in contrast to the main-dashboard doughnuts which aggregate the full year.
//
// Self-healing: each monthly sheet's existing charts are wiped before
// injection, so duplicates are impossible across re-runs.

/**
 * Public entry point. Run from the Apps Script function dropdown to (re)build
 * the per-month relative doughnut charts on every existing monthly sheet.
 * Wraps the silent core in try/catch and surfaces a single Arabic UI alert.
 */
function automateMonthlyDashboardVisuals() {
  const ui = SpreadsheetApp.getUi();
  let report;
  try {
    report = automateMonthlyDashboardVisualsCore_(SpreadsheetApp.getActive());
  } catch (err) {
    Logger.log('automateMonthlyDashboardVisuals: fatal: ' +
      (err && err.stack ? err.stack : err));
    ui.alert(
      'فشل تنفيذ أتمتة الرسوم الشهريّة',
      (err && err.message) ? err.message : String(err),
      ui.ButtonSet.OK);
    return;
  }

  const lines = [
    'الأوراق الشهريّة المعالَجة: ' + report.totalSheets,
    'الرسوم البيانيّة المُدرَجة بنجاح: ' + report.builtCharts,
  ];
  if (report.skipped.length) {
    lines.push('');
    lines.push('أوراق متجاوَزة (' + report.skipped.length + '):');
    report.skipped.forEach(function (s) {
      lines.push('  • ' + s.month + ': ' + s.reason);
    });
  }
  if (report.failed.length) {
    lines.push('');
    lines.push('أخطاء (' + report.failed.length + '):');
    report.failed.forEach(function (f) {
      lines.push('  • ' + f.month + ' / ' + f.kind + ': ' + f.error);
    });
  }

  const allOk = report.failed.length === 0;
  ui.alert(
    allOk ? 'تمّ إدراج الرسوم الشهريّة بنجاح' : 'تمّ التنفيذ مع تحفّظات',
    lines.join('\n'),
    ui.ButtonSet.OK);
}

/**
 * Silent core. Iterates the canonical month list (resolved from install.gs's
 * MONTHS const if available, else a bundled fallback) and injects two
 * relative doughnuts per sheet. Returns a structured report; never throws on
 * a per-sheet/per-chart failure (those are collected in `report.failed`).
 *
 * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} ss
 * @return {{
 *   totalSheets:  number,
 *   builtCharts:  number,
 *   skipped:      Array<{month:string, reason:string}>,
 *   failed:       Array<{month:string, kind:string, error:string}>
 * }}
 */
function automateMonthlyDashboardVisualsCore_(ss) {
  // Canonical Maghreb month list (PR #14). Fallback included so this file
  // works as a standalone drop-in even without install.gs in the project.
  const months = (typeof MONTHS !== 'undefined') ? MONTHS : [
    'جانفي', 'فيفري', 'مارس', 'أفريل', 'ماي', 'جوان',
    'جويلية', 'أوت', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
  ];

  const report = { totalSheets: 0, builtCharts: 0, skipped: [], failed: [] };

  months.forEach(function (monthName) {
    const sheet = ss.getSheetByName(monthName);
    if (!sheet) {
      report.skipped.push({ month: monthName, reason: 'الورقة غير موجودة' });
      return;
    }
    report.totalSheets++;

    // Self-healing cleanup: wipe existing charts on this monthly sheet so
    // re-runs don't accumulate duplicates.
    try {
      sheet.getCharts().forEach(function (chart) { sheet.removeChart(chart); });
    } catch (err) {
      Logger.log('automateMonthlyDashboardVisualsCore_: cleanup failed for "' +
        monthName + '": ' + err);
    }

    // Build the two doughnuts. Each is independent: a failure in one does not
    // skip the other.
    [
      { kind: 'income',  source: 'P1:Q9',  position: { row: 10, col: 9 }, title: 'مصادر الدخل لهذا الشهر' },
      { kind: 'expense', source: 'R1:S13', position: { row: 33, col: 9 }, title: 'استنزاف المصاريف لهذا الشهر' },
    ].forEach(function (spec) {
      const result = ADV_buildMonthlyDoughnut_(sheet, spec);
      if (result.ok) {
        report.builtCharts++;
      } else if (!result.placeholder) {
        report.failed.push({ month: monthName, kind: spec.kind, error: result.error });
      }
    });
  });

  return report;
}

/**
 * Builds a single relative doughnut on a monthly sheet. Parametrised on a
 * `spec` object so we don't duplicate this code path between income/expense -
 * minimalist, per the project's "one chart builder, two configurations" rule.
 *
 * The pre-flight `ADV_validateChartData_` rejects sheets where the helper
 * columns sum to zero (e.g., a brand-new month with no rows entered yet).
 * Rejected sheets are silently skipped: no broken-looking empty pie shown.
 *
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet  - monthly sheet
 * @param {{kind:string, source:string, position:{row:number,col:number}, title:string}} spec
 * @return {{ok:boolean, placeholder?:boolean, error?:string}}
 */
function ADV_buildMonthlyDoughnut_(sheet, spec) {
  const t = ADV_THEME_LINEAR;
  const ty = ADV_TYPOGRAPHY;

  try {
    const range = sheet.getRange(spec.source);
    const validation = ADV_validateChartData_(range);
    if (!validation.ok) {
      // Brand-new month with no entries yet - skip silently. Don't write an
      // empty-state placeholder onto every monthly sheet (would clutter 12
      // sheets with the same banner). The user sees the count in the alert.
      return { ok: false, placeholder: true };
    }

    const builder = sheet.newChart()
      .setChartType(Charts.ChartType.PIE)
      .addRange(range)
      .setNumHeaders(1)
      .setPosition(spec.position.row, spec.position.col, 0, 0)
      .setOption('width',  480)
      .setOption('height', 280);

    ADV_applyLinearTheme_(builder, spec.title, {
      pieHole: 0.65,
      pieSliceTextStyle: {
        color:    t.fgPrimary,
        fontSize: ty.bodySize,
        fontName: ty.fontName,
      },
      colors: t.slicePalette,
      legend: {
        position:  'bottom',
        alignment: 'center',
        textStyle: {
          color:    t.fgMuted,
          fontSize: ty.legendSize,
          fontName: ty.fontName,
        },
      },
    });

    sheet.insertChart(builder.build());
    return { ok: true };

  } catch (err) {
    const msg = (err && err.message) ? err.message : String(err);
    Logger.log('ADV_buildMonthlyDoughnut_: "' + spec.kind + '" on "' +
      sheet.getName() + '": ' + msg);
    return { ok: false, error: msg };
  }
}

/* ============================================================================
   HOW TO LINK THIS TO A ONE-CLICK BUTTON ON THE DASHBOARD
   ============================================================================

   Option A - Drawing-based button (visual button on the dashboard sheet):
   ----------------------------------------------------------------------
   1. Open the dashboard sheet ('اللوحة الرئيسية والتقرير السنوي').
   2. Insert -> Drawing.
   3. Draw a rectangle. Add the text "تحديث الرسوم البيانية" inside it.
      Suggested style: fill #38BDF8 (sky-400, the new Linear primary),
      text colour #FAFAFA, weight 500.
   4. Click "Save and close" - the drawing appears on the sheet.
   5. Click the drawing once to select it. Click the three-dot menu in
      the upper-right of the drawing -> "Assign script".
   6. Type exactly:  automateDashboardVisuals
   7. Click OK. The first click after assignment will prompt for
      authorisation - approve.

   Option B - Custom menu item:
   ---------------------------
   If your project does NOT yet have an `onOpen`, add this:

       function onOpen() {
         SpreadsheetApp.getUi()
           .createMenu('🎨 الرسوم البيانية')
           .addItem('تحديث الرسوم البيانية الآن', 'automateDashboardVisuals')
           .addToUi();
       }

   If your project ALREADY has an `onOpen`, just add the menu lines
   inside your existing onOpen body.

   Option C - Run directly from the editor:
   ----------------------------------------
   In the Apps Script editor, pick `automateDashboardVisuals` from the
   function dropdown and press Run. Useful while developing.
   ============================================================================ */
