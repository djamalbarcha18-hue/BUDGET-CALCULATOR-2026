/**
 * BUDGET-CALCULATOR-2026 - Real-time currency rate updater
 * ========================================================
 *
 * Public entry point:
 *   updateExchangeRates()   - run from menu / drawing-button / function dropdown
 *
 * What it does
 * ------------
 *   1. Reads the currency-code column from the settings sheet (via the named
 *      range `rng_Currencies`, with a fallback to the canonical A7:A20 anchor
 *      if the named range is missing).
 *   2. For each non-USD code, builds `=GOOGLEFINANCE("CURRENCY:USD<code>")`,
 *      writes them to a temporary scratch column (P), calls flush() + sleep
 *      to let the network fetch complete, then reads the resolved values in
 *      one batch.
 *   3. USD is hardcoded to 1.0 (GOOGLEFINANCE returns N/A on self-pairs).
 *   4. Successful numeric results overwrite C7:C20 (the rate column,
 *      `rng_CurrencyRates`). Failed lookups (`#N/A`, `Loading...`, `#ERROR!`,
 *      etc.) are skipped - the cell KEEPS its previous value. This is the
 *      "manual edits survive an API failure" guarantee.
 *   5. Stamps a human-readable "Last Updated" timestamp into Settings!E1+F1.
 *      (NOTE: the user's spec said D1, but D1 is part of the merged A1:D1
 *      title cell from install.gs - writing to D1 alone errors. E1+F1 is
 *      outside the merge and visually adjacent.)
 *   6. Surfaces a single Arabic UI alert summarising N updated / M skipped.
 *
 * Idempotency
 * -----------
 * The function performs a full overwrite of the rate column with fresh
 * GOOGLEFINANCE data on every successful invocation. The "don't overwrite
 * manual edits unless triggered by the button" directive is satisfied by:
 *   - This file installs NO automatic triggers (no onEdit, no time-based).
 *     The function only runs when the user explicitly invokes it.
 *   - On per-currency API failure, the existing value is preserved (manual
 *     edits survive failures automatically).
 * Running it twice in succession with the same network state produces an
 * identical result; there are no accumulating side effects.
 *
 * Anti-collision design
 * ---------------------
 * Apps Script puts every .gs file in one shared global scope. To avoid
 * the "Identifier X has already been declared" SyntaxError, every top-level
 * const here is namespaced with a `CSY_` prefix (Currency SYnc), and shared
 * constants from install.gs (SHEET_NAMES, etc.) are accessed via the
 * `typeof X !== 'undefined' ? X : <local fallback>` pattern - so this file
 * works alongside install.gs AND as a standalone drop-in.
 *
 * Linking to a one-click button
 * -----------------------------
 * See the README section at the bottom of this file (after the code).
 */

// =============================================================================
// LOCAL CONSTANTS (CSY_ prefix prevents any collision with install.gs)
// =============================================================================

/** Settings sheet name. Falls back to the install.gs canonical name. */
const CSY_SETTINGS_SHEET_NAME = (typeof SHEET_NAMES !== 'undefined' && SHEET_NAMES.settings)
  ? SHEET_NAMES.settings
  : 'الإعدادات وأسعار الصرف';

/** Named ranges (canonical) and A1 fallbacks (in case the named range was deleted). */
const CSY_NR_CODES = 'rng_Currencies';      // settings!A7:A20
const CSY_NR_RATES = 'rng_CurrencyRates';   // settings!C7:C20
const CSY_FALLBACK_CODES_A1 = 'A7:A20';
const CSY_FALLBACK_RATES_A1 = 'C7:C20';

/**
 * Scratch column for the GOOGLEFINANCE batch fetch. We chose `P` because
 * the install.gs settings layout uses A:D (currencies), F (income cats),
 * G (expense cats), H (payment methods), and the engine sheet's K/M/N/O
 * columns - leaving P safely empty. We clear it after every run.
 */
const CSY_SCRATCH_COLUMN = 'P';

/** Where the timestamp goes. See the architecture note in the header doc. */
const CSY_TIMESTAMP_LABEL_CELL = 'E1';
const CSY_TIMESTAMP_VALUE_CELL = 'F1';
const CSY_TIMESTAMP_LABEL_TEXT = 'آخر تحديث:';

/**
 * Milliseconds to sleep AFTER flush() so GOOGLEFINANCE has time to fetch
 * the live rates from the network. 2000 ms is the documented sweet spot:
 * enough for a small batch (~14 currencies) to resolve, short enough that
 * the user does not notice a hang.
 */
const CSY_GOOGLEFINANCE_SETTLE_MS = 2000;

/**
 * GOOGLEFINANCE returns these sentinel strings on transient failure. We
 * treat any of them as "skip this row, keep the existing value".
 */
const CSY_TRANSIENT_FAILURE_TOKENS = ['Loading...', '#N/A', '#ERROR!', 'ERR', '#REF!', '#NAME?'];

// =============================================================================
// PUBLIC ENTRY POINT
// =============================================================================
/**
 * Run from the Apps Script function dropdown, a custom menu item, or a
 * drawing-based button on the dashboard. Wraps the silent core in a
 * try/catch and shows a single Arabic UI alert summarising the result.
 */
function updateExchangeRates() {
  const ui = SpreadsheetApp.getUi();

  let report;
  try {
    report = updateExchangeRatesCore_(SpreadsheetApp.getActive());
  } catch (err) {
    Logger.log('updateExchangeRates: fatal error: ' +
      (err && err.stack ? err.stack : err));
    ui.alert(
      'فشل تحديث أسعار الصرف',
      (err && err.message) ? err.message : String(err),
      ui.ButtonSet.OK);
    return;
  }

  // Build the user-facing Arabic alert from the structured report.
  const lines = [
    'تم تحديث ' + report.updated.length + ' سعر صرف من أصل ' +
      report.attempted + ' عملة.',
    '',
    'وقت آخر تحديث: ' + report.timestamp,
  ];
  if (report.updated.length) {
    lines.push('');
    lines.push('أمثلة على الأسعار المحدّثة:');
    // Show up to 4 examples to keep the alert readable.
    report.updated.slice(0, 4).forEach(function (u) {
      lines.push('  • ' + u.code + ' = ' + u.rate);
    });
  }
  if (report.skipped.length) {
    lines.push('');
    lines.push('عملات تم تخطّيها (' + report.skipped.length +
      ') - تمّ الإبقاء على القيم القديمة:');
    report.skipped.forEach(function (s) {
      lines.push('  • ' + s.code + ': ' + s.reason);
    });
    lines.push('');
    lines.push('أعد المحاولة بعد بضع ثوانٍ - قد تكون GOOGLEFINANCE في حالة تحميل.');
  }

  ui.alert(
    report.skipped.length ? 'تم تحديث الأسعار مع تحفّظات' : 'تم تحديث جميع الأسعار بنجاح',
    lines.join('\n'),
    ui.ButtonSet.OK);
}

// =============================================================================
// SILENT CORE
// =============================================================================
/**
 * Performs the actual rate-update pipeline. Returns a structured report.
 * Throws ONLY on unrecoverable preconditions (missing settings sheet,
 * range mismatch); per-currency failures are collected in `report.skipped`
 * and the loop continues.
 *
 * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} ss
 * @return {{
 *   attempted: number,
 *   updated:   Array<{code:string, rate:number}>,
 *   skipped:   Array<{code:string, reason:string}>,
 *   timestamp: string
 * }}
 * @throws {Error} if the settings sheet cannot be found OR the code/rate
 *                 ranges have mismatched dimensions.
 */
function updateExchangeRatesCore_(ss) {
  // -------- 1) Resolve the settings sheet --------
  const settings = ss.getSheetByName(CSY_SETTINGS_SHEET_NAME);
  if (!settings) {
    throw new Error('لم يتم العثور على ورقة \"' + CSY_SETTINGS_SHEET_NAME +
      '\". تأكّد من وجود ورقة الإعدادات قبل تشغيل هذه الدالة.');
  }

  // -------- 2) Resolve the currency-code and rate ranges --------
  // Named ranges first (canonical); A1 fallback if missing.
  const codeRange = ss.getRangeByName(CSY_NR_CODES) ||
                    settings.getRange(CSY_FALLBACK_CODES_A1);
  const rateRange = ss.getRangeByName(CSY_NR_RATES) ||
                    settings.getRange(CSY_FALLBACK_RATES_A1);

  if (codeRange.getNumRows() !== rateRange.getNumRows()) {
    throw new Error('عدم تطابق بين عدد العملات (' + codeRange.getNumRows() +
      ') وعدد خلايا الأسعار (' + rateRange.getNumRows() + '). ' +
      'يرجى التحقّق من النطاقين المُسمَّيين rng_Currencies و rng_CurrencyRates.');
  }

  const codes = codeRange.getValues().map(function (row) {
    return String(row[0] == null ? '' : row[0]).trim().toUpperCase();
  });

  // -------- 3) Build the GOOGLEFINANCE batch --------
  // Scratch column P, rows aligned with the code range. We construct one
  // formula per row, USD getting a literal 1, blank rows staying blank.
  const startRow  = codeRange.getRow();
  const numRows   = codeRange.getNumRows();
  const scratch   = settings.getRange(CSY_SCRATCH_COLUMN + startRow + ':' +
                                      CSY_SCRATCH_COLUMN + (startRow + numRows - 1));

  const formulaMatrix = codes.map(function (code) {
    if (!code)         return [''];                                    // empty source row
    if (code === 'USD') return [1];                                    // self-pair = 1.0
    // IFERROR wrapper: makes the failure detectable as text 'ERR' rather
    // than letting a #N/A bubble up and contaminate dependent formulas.
    return ['=IFERROR(GOOGLEFINANCE("CURRENCY:USD' + code + '"), "ERR")'];
  });

  scratch.setValues(formulaMatrix);
  SpreadsheetApp.flush();
  // GOOGLEFINANCE often returns 'Loading...' until the network fetch
  // completes. flush() does not wait for that fetch - we have to sleep.
  Utilities.sleep(CSY_GOOGLEFINANCE_SETTLE_MS);

  // -------- 4) Read results and decide what to apply --------
  const resolved     = scratch.getValues();
  const currentRates = rateRange.getValues();
  const newRates     = currentRates.map(function (r) { return r.slice(); }); // deep-ish copy

  const updated = [];
  const skipped = [];
  let   attempted = 0;

  codes.forEach(function (code, i) {
    if (!code) return;                              // skip blank source rows
    attempted++;

    const value = resolved[i][0];

    // Tier 1: numeric and positive -> apply.
    if (typeof value === 'number' && isFinite(value) && value > 0) {
      newRates[i] = [value];
      updated.push({ code: code, rate: roundForDisplay_(value) });
      return;
    }

    // Tier 2: known transient-failure token -> log + skip (keep old value).
    const asString = String(value);
    if (CSY_TRANSIENT_FAILURE_TOKENS.indexOf(asString) !== -1) {
      const reason = (asString === 'Loading...')
        ? 'لا يزال GOOGLEFINANCE يحمّل البيانات'
        : 'لم يتم العثور على رمز العملة في GOOGLEFINANCE';
      Logger.log('updateExchangeRates: skipping "' + code + '" (' + asString + ')');
      skipped.push({ code: code, reason: reason });
      return;
    }

    // Tier 3: unexpected non-numeric -> log + skip.
    Logger.log('updateExchangeRates: unexpected value for "' + code + '": ' +
      JSON.stringify(value));
    skipped.push({
      code:   code,
      reason: 'استجابة غير متوقّعة: ' + (asString || '(فارغة)'),
    });
  });

  // -------- 5) Write the new rates and clear scratch --------
  // We write even on partial failure so the successful currencies land
  // immediately. Skipped rows just keep their existing values (we copied
  // them into `newRates` upfront).
  rateRange.setValues(newRates);
  scratch.clearContent();

  // -------- 6) Stamp the timestamp --------
  const timestamp = stampLastUpdated_(ss, settings);

  // Force a final recalculation so dependent formulas (rng_ActiveFormat,
  // monthly KPI rows, etc.) pick up the new rates immediately.
  SpreadsheetApp.flush();

  return {
    attempted: attempted,
    updated:   updated,
    skipped:   skipped,
    timestamp: timestamp,
  };
}

// =============================================================================
// HELPERS
// =============================================================================
/**
 * Writes the "Last Updated" label + timestamp into the settings sheet.
 * Wrapped in try/catch because the sheet has warning-only protection
 * (set by install.gs); scripts can write through it, but if the user later
 * tightened the protection to "no editing" this would otherwise crash the
 * whole pipeline. Better to log the failure and continue.
 *
 * @return {string} the formatted timestamp that was (attempted to be) written
 */
function stampLastUpdated_(ss, settingsSheet) {
  const tz   = ss.getSpreadsheetTimeZone() || 'UTC';
  const now  = new Date();
  const text = Utilities.formatDate(now, tz, 'yyyy-MM-dd HH:mm:ss');

  try {
    settingsSheet.getRange(CSY_TIMESTAMP_LABEL_CELL)
      .setValue(CSY_TIMESTAMP_LABEL_TEXT)
      .setFontWeight('bold')
      .setHorizontalAlignment('right');
    settingsSheet.getRange(CSY_TIMESTAMP_VALUE_CELL)
      .setValue(text)
      .setNumberFormat('@');     // preserve exact text formatting
  } catch (err) {
    Logger.log('updateExchangeRates: timestamp write to ' +
      CSY_TIMESTAMP_LABEL_CELL + '/' + CSY_TIMESTAMP_VALUE_CELL +
      ' failed: ' + err);
    // Non-fatal - we still return the text so the alert can show it.
  }

  return text;
}

/**
 * Currency rates need 4 decimal places for most pairs but 6 for very low-
 * value pairs (e.g., USD/KWD = 0.310500). Round defensively for display.
 */
function roundForDisplay_(value) {
  if (value >= 1)  return Math.round(value * 10000) / 10000;       // 4 dp
  if (value > 0)   return Math.round(value * 1000000) / 1000000;   // 6 dp
  return value;
}

// =============================================================================
// OPTIONAL: CUSTOM MENU INSTALLER
// =============================================================================
/**
 * Adds a "🔄 الأدوات المالية -> تحديث أسعار الصرف الآن" item to the
 * spreadsheet menu bar so the user gets a one-click trigger from any tab.
 *
 * Usage:
 *   - If your project does NOT already have an `onOpen` function, copy the
 *     three lines below into a function literally named `onOpen()` and
 *     Apps Script will install the menu automatically every time the
 *     spreadsheet is opened (it is a "simple trigger").
 *   - If your project ALREADY has an `onOpen`, just call this helper from
 *     inside it: `addCurrencySyncMenu_(SpreadsheetApp.getUi());`
 *
 * Defining `onOpen` directly in this file would conflict with any existing
 * `onOpen` in install.gs or elsewhere, so we expose a HELPER instead and
 * leave the trigger wiring to the user. That keeps the file collision-free.
 */
function addCurrencySyncMenu_(ui) {
  ui.createMenu('🔄 الأدوات المالية')
    .addItem('تحديث أسعار الصرف الآن', 'updateExchangeRates')
    .addToUi();
}

/* ============================================================================
   HOW TO LINK THIS TO A ONE-CLICK BUTTON ON THE DASHBOARD
   ============================================================================

   Option A - Drawing-based button (visual button on the dashboard sheet):
   ----------------------------------------------------------------------
   1. Open the dashboard sheet ('اللوحة الرئيسية والتقرير السنوي').
   2. Insert -> Drawing.
   3. Draw a rectangle. Add the text "تحديث أسعار الصرف" inside it.
      Style it however you like (suggested: fill #06B6D4 / text #FFFFFF
      to match the theme accent).
   4. Click "Save and close" - the drawing appears on the sheet.
   5. Click the drawing once to select it. Click the three-dot menu in
      the upper-right of the drawing -> "Assign script".
   6. Type exactly:  updateExchangeRates
      (NO parentheses, NO leading/trailing spaces.)
   7. Click OK. The first click after assignment will prompt for
      authorisation - approve.
   8. From now on, one click on the drawing updates every rate.

   Option B - Custom menu item (one-click from the menu bar):
   ----------------------------------------------------------
   Add the three lines below to your project. If you DO NOT yet have an
   `onOpen` anywhere, paste the whole block. If you DO have one, copy
   only the addCurrencySyncMenu_ line into your existing onOpen body:

       function onOpen() {
         addCurrencySyncMenu_(SpreadsheetApp.getUi());
       }

   After the next reload of the spreadsheet, the menu bar will show a
   new "🔄 الأدوات المالية" item.

   Option C - Keyboard-equivalent / fast path:
   -------------------------------------------
   In the Apps Script editor, pick `updateExchangeRates` from the function
   dropdown and press the Run button. This is the same code path the
   button calls; useful while developing.
   ============================================================================ */
