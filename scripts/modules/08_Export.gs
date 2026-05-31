/**
 * SMARTBUDGET PRO 2026 - Module 08: PDF Export Engine
 * =============================================================================
 * Phase 4 of the Strategic Refactor Plan.
 *
 * Lets the user export polished PDF reports straight into Google Drive
 * without ever leaving the workbook. Three export modes:
 *
 *   exportMonthAsPdf()      Active monthly sheet (or prompt for one)
 *   exportDashboardAsPdf()  The annual dashboard alone
 *   exportAnnualReport()    All 12 months + dashboard + goals in ONE PDF
 *
 * DESIGN GUARANTEES (per Architect Mandate)
 * -----------------------------------------
 *   - Read-only with respect to formulas + data: NO setFormula, NO setValue,
 *     NO chart manipulation. Pure read-and-export pipeline.
 *   - Bilingual reports: every UI string flows through t() so reports inherit
 *     the user's current language (ar/en) automatically.
 *   - Fail-safe: every Drive/UrlFetch call wrapped in try/catch with a
 *     readable t('export.failureBody') alert if anything goes wrong.
 *   - Idempotent: each export creates a new timestamped file. Never
 *     overwrites previous reports.
 *
 * HOW PDF EXPORT WORKS IN APPS SCRIPT
 * -----------------------------------
 * Google Sheets exposes a hidden export endpoint:
 *   https://docs.google.com/spreadsheets/d/<id>/export?format=pdf&gid=<gid>...
 *
 * We hit it with UrlFetchApp + the OAuth token from ScriptApp, get the PDF
 * bytes back as a blob, then DriveApp.createFile() puts it in Drive.
 *
 * For multi-sheet exports we omit `gid` and pass `id_range` parameters or
 * just leave `gid` off to grab all visible sheets in tab order.
 */

// ============================================================================
// MENU ENTRY POINTS
// ============================================================================

function exportMonthAsPdf() {
  const ss = SpreadsheetApp.getActive();
  const ui = SpreadsheetApp.getUi();
  const active = ss.getActiveSheet();

  // Resolve the target month: prefer active sheet if it IS a month, else prompt.
  let monthSheet;
  if (MONTHS.indexOf(active.getName()) >= 0) {
    monthSheet = active;
  } else {
    const response = ui.prompt(
      t('export.pickerTitle'),
      t('export.pickerPrompt'),
      ui.ButtonSet.OK_CANCEL
    );
    if (response.getSelectedButton() !== ui.Button.OK) return;
    const name = response.getResponseText().trim();
    monthSheet = ss.getSheetByName(name);
    if (!monthSheet || MONTHS.indexOf(name) < 0) {
      ui.alert(t('export.failureTitle'),
        t('export.monthNotFound', { name }), ui.ButtonSet.OK);
      return;
    }
  }

  _runExport({
    sheets: [monthSheet],
    fileName: `${t('export.filePrefixMonth')}_${monthSheet.getName()}_${_timestamp()}.pdf`,
    options: _pdfOptionsForSingleSheet(monthSheet)
  });
}

function exportDashboardAsPdf() {
  const ss = SpreadsheetApp.getActive();
  const dash = ss.getSheetByName(SHEET_NAMES.dashboard);
  if (!dash) {
    SpreadsheetApp.getUi().alert(
      t('export.failureTitle'),
      t('common.sheetMissingBody'),
      SpreadsheetApp.getUi().ButtonSet.OK);
    return;
  }
  _runExport({
    sheets: [dash],
    fileName: `${t('export.filePrefixDash')}_${_timestamp()}.pdf`,
    options: _pdfOptionsForSingleSheet(dash, /*landscape=*/true)
  });
}

function exportAnnualReport() {
  const ui = SpreadsheetApp.getUi();
  const r = ui.alert(
    t('menu.exportAnnual'),
    t('export.annualConfirm'),
    ui.ButtonSet.YES_NO);
  if (r !== ui.Button.YES) return;

  const ss = SpreadsheetApp.getActive();
  // Annual report = welcome stays out, engine + fx are hidden = excluded.
  // Order: Dashboard first (executive summary), then 12 months, then goals.
  const order = [
    SHEET_NAMES.dashboard,
    ...MONTHS,
    SHEET_NAMES.goals
  ];
  const sheets = order
    .map(name => ss.getSheetByName(name))
    .filter(s => s !== null);

  _runExport({
    sheets,
    fileName: `${t('export.filePrefixAnnual')}_${_timestamp()}.pdf`,
    options: _pdfOptionsForMultiSheet(sheets, ss)
  });
}

// ============================================================================
// CORE EXPORT PIPELINE
// ============================================================================

/**
 * The single point through which every export flows.
 * Builds the export URL, fetches the PDF blob, saves it to the SmartBudget
 * Reports folder in Drive, and shows a success or failure dialog.
 *
 * Wrapped in one big try/catch so any auth / quota / network failure
 * surfaces a translated message instead of a raw stack trace.
 */
function _runExport({ sheets, fileName, options }) {
  const ui = SpreadsheetApp.getUi();

  try {
    const ss  = SpreadsheetApp.getActive();
    const url = _buildExportUrl(ss.getId(), sheets, options);

    const response = UrlFetchApp.fetch(url, {
      headers: { Authorization: `Bearer ${ScriptApp.getOAuthToken()}` },
      muteHttpExceptions: true
    });

    if (response.getResponseCode() !== 200) {
      throw new Error(`HTTP ${response.getResponseCode()}: ${response.getContentText().slice(0, 200)}`);
    }

    const blob = response.getBlob().setName(fileName);
    const folder = _getOrCreateReportsFolder();
    const file = folder.createFile(blob);

    let successMsg;
    try {
      const fileUrl = file.getUrl();
      successMsg = t('export.successWithLink', {
        fileName,
        folderName: folder.getName(),
        url: fileUrl
      });
    } catch (urlErr) {
      // Some accounts restrict getUrl() — fall back to plain success.
      successMsg = t('export.successBody', {
        fileName,
        folderName: folder.getName()
      });
    }

    ui.alert(t('export.successTitle'), successMsg, ui.ButtonSet.OK);
    Logger.log(`[Export] OK -> ${fileName}`);

  } catch (err) {
    Logger.log(`[Export] FAILED: ${err}`);
    ui.alert(
      t('export.failureTitle'),
      t('export.failureBody', { err: String(err) }),
      ui.ButtonSet.OK);
  }
}

/**
 * Builds the Google Sheets PDF export URL.
 *
 * Reference: the export endpoint accepts the same parameters the "Print"
 * dialog uses internally. Documented across multiple Apps Script community
 * threads since it is not part of the official API surface.
 *
 * @param {string} ssId        Spreadsheet ID
 * @param {Sheet[]} sheets     Sheets to include (1 = single, N = multi)
 * @param {Object} options     PDF options (size, orientation, fit-to-width...)
 */
function _buildExportUrl(ssId, sheets, options) {
  const params = {
    format:        'pdf',
    size:          options.size       || 'A4',
    portrait:      options.portrait   != null ? options.portrait : true,
    fitw:          options.fitw       != null ? options.fitw : true,
    sheetnames:    options.sheetnames != null ? options.sheetnames : true,
    printtitle:    options.printtitle != null ? options.printtitle : true,
    pagenumbers:   options.pagenumbers!= null ? options.pagenumbers : true,
    gridlines:     false,
    fzr:           true,           // freeze repeated headers
    horizontal_alignment: 'CENTER',
    vertical_alignment:   'TOP'
  };

  // Single sheet => target gid. Multi-sheet => omit gid (exports all visible).
  if (sheets.length === 1) {
    params.gid = sheets[0].getSheetId();
  }

  const queryString = Object.keys(params)
    .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
    .join('&');

  return `https://docs.google.com/spreadsheets/d/${ssId}/export?${queryString}`;
}

/**
 * PDF options for a single monthly sheet.
 * Portrait by default (monthly sheet is taller than wide).
 * Landscape override for the dashboard (which is wide).
 */
function _pdfOptionsForSingleSheet(sheet, landscape) {
  return {
    size:        'A4',
    portrait:    !landscape,
    fitw:        true,
    sheetnames:  false,    // single sheet — no need to label which sheet
    printtitle:  false,
    pagenumbers: true
  };
}

/**
 * PDF options for the multi-sheet annual report.
 * Sheet names visible at the top of each section so the reader knows
 * which page belongs to which month.
 */
function _pdfOptionsForMultiSheet(sheets, ss) {
  return {
    size:        'A4',
    portrait:    true,
    fitw:        true,
    sheetnames:  true,
    printtitle:  true,
    pagenumbers: true
  };
}

// ============================================================================
// DRIVE FOLDER MANAGEMENT
// ============================================================================

/**
 * Returns the SmartBudget Reports folder, creating it on first use.
 * Searched by exact name in Drive root. If multiple matches exist (rare but
 * possible if the user manually created one), uses the first hit so we never
 * silently scatter reports across duplicate folders.
 */
function _getOrCreateReportsFolder() {
  const folderName = t('export.folderName');
  const it = DriveApp.getFoldersByName(folderName);
  if (it.hasNext()) return it.next();
  return DriveApp.createFolder(folderName);
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * yyyy-MM-dd_HHmm timestamp for filenames. Latin numerals only so filenames
 * remain valid across all locales / OSes.
 */
function _timestamp() {
  const d  = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_` +
         `${pad(d.getHours())}${pad(d.getMinutes())}`;
}
