/**
 * SMARTBUDGET PRO 2026 - Module 10: Smart Notifications Engine
 * =============================================================================
 * Phase 6 of the Strategic Refactor Plan.
 *
 * Surfaces actionable alerts to the user without them having to dig through
 * 12 monthly sheets. Five alert categories:
 *
 *   1. BUDGET EXCEEDED      Monthly actual expense > planned expense
 *   2. APPROACHING LIMIT    Monthly actual expense >= 90% of planned
 *   3. GOAL DEADLINE SOON   Goal with < 3 months left and not 100% complete
 *   4. DATA ENTRY REMINDER  Past month with zero rows entered
 *   5. FORMULA INTEGRITY    Manifest detected missing or altered formulas
 *
 * BEHAVIOR
 * --------
 *   - menuShowNotifications()   Always-available inspection from menu.
 *   - autoCheckOnOpen()         Wired into onOpen. Silent if no alerts.
 *                               Otherwise prompts user once per session.
 *   - menuToggleAutoCheck()     Lets user disable auto-check entirely
 *                               (some workflows only need on-demand).
 *
 * READ-ONLY GUARANTEE
 * -------------------
 * This module is 100% READ-only. NO setFormula. NO setValue. NO chart writes.
 * Only PropertiesService writes are:
 *   - sb_notify_auto_check (user toggle for auto-check on open)
 *   - sb_notify_session_prompted (per-session anti-spam marker)
 *
 * SCALABILITY
 * -----------
 * The runChecks pipeline is built around a list of check functions, each
 * returning an array of alert items. Adding a new alert category in the
 * future is one new function + one entry in the CHECK_FUNCTIONS array.
 */

// ============================================================================
// PROPERTY KEYS
// ============================================================================
const NOTIFY_AUTO_CHECK_KEY     = 'sb_notify_auto_check';     // 'true' | 'false'
const NOTIFY_SESSION_PROMPT_KEY = 'sb_notify_session_prompted'; // ISO date string

// ============================================================================
// THRESHOLDS - tunable in one place
// ============================================================================
const NOTIFY_THRESHOLDS = {
  warningRatio:      0.9,   // expense / budget >= 0.9 -> yellow
  goalDeadlineMonths: 3,    // months remaining <= 3 -> goal alert
  reminderGracePeriod: 0    // 0 = past months only; raise to skip current
};

// ============================================================================
// PUBLIC ENTRY POINTS
// ============================================================================

/**
 * Always-available inspection. Shows the full notifications report
 * regardless of user toggles or session state.
 */
function menuShowNotifications() {
  const ui = SpreadsheetApp.getUi();
  const result = runAllNotificationChecks();
  ui.alert(t('notifications.reportTitle'),
           formatNotificationReport(result),
           ui.ButtonSet.OK);
}

/**
 * Auto-prompt on workbook open. Wired into onOpen after maybePromptOnboarding.
 * Three gates before prompting:
 *   1. Auto-check must be enabled (default: true).
 *   2. User hasn't been prompted today (anti-spam).
 *   3. There must actually be alerts to surface.
 */
function autoCheckOnOpen() {
  try {
    const props = PropertiesService.getDocumentProperties();
    const userProps = PropertiesService.getUserProperties();

    // Gate 1: auto-check toggle (defaults to enabled)
    const autoCheck = props.getProperty(NOTIFY_AUTO_CHECK_KEY);
    if (autoCheck === 'false') return;

    // Gate 2: per-session anti-spam
    const today = new Date().toDateString();
    if (userProps.getProperty(NOTIFY_SESSION_PROMPT_KEY) === today) return;

    // Gate 3: only prompt if welcome sheet exists (post-install)
    const ss = SpreadsheetApp.getActive();
    if (!ss.getSheetByName(SHEET_NAMES.welcome)) return;

    const result = runAllNotificationChecks();
    if (result.totalCount === 0) return; // silent — nothing to surface

    // Mark prompted for today before showing UI (so a refusal still counts)
    userProps.setProperty(NOTIFY_SESSION_PROMPT_KEY, today);

    const ui = SpreadsheetApp.getUi();
    const r = ui.alert(
      t('notifications.autoPromptTitle'),
      t('notifications.autoPromptBody', { n: result.totalCount }),
      ui.ButtonSet.YES_NO
    );
    if (r === ui.Button.YES) {
      ui.alert(t('notifications.reportTitle'),
               formatNotificationReport(result),
               ui.ButtonSet.OK);
    }
  } catch (e) {
    Logger.log(`[Notifications] autoCheck skipped: ${e}`);
  }
}

/**
 * Toggle the auto-check on workbook open. Defaults to enabled; users
 * who only want on-demand inspection can switch it off here.
 */
function menuToggleAutoCheck() {
  const props = PropertiesService.getDocumentProperties();
  const ui = SpreadsheetApp.getUi();

  const current = props.getProperty(NOTIFY_AUTO_CHECK_KEY) !== 'false';
  const stateLabel = current
    ? t('notifications.autoCheckEnabled')
    : t('notifications.autoCheckDisabled');

  const r = ui.alert(
    t('notifications.settingsTitle'),
    t('notifications.toggleAutoCheck', { state: stateLabel }),
    ui.ButtonSet.YES_NO
  );
  if (r !== ui.Button.YES) return;

  props.setProperty(NOTIFY_AUTO_CHECK_KEY, current ? 'false' : 'true');
  ui.alert(
    t('notifications.doneTitle'),
    t('notifications.doneBody'),
    ui.ButtonSet.OK
  );
}

// ============================================================================
// CHECK PIPELINE
// ============================================================================

/**
 * Master check runner. Returns:
 *   {
 *     exceeded:   [...],     // monthly budget exceeded
 *     warning:    [...],     // approaching 90% threshold
 *     goalSoon:   [...],     // goals < 3 months out
 *     reminders:  [...],     // past months with no entries
 *     integrity:  [...],     // formula manifest issues
 *     totalCount: <number>
 *   }
 */
function runAllNotificationChecks() {
  const ss = SpreadsheetApp.getActive();
  const result = {
    exceeded:  [],
    warning:   [],
    goalSoon:  [],
    reminders: [],
    integrity: [],
    totalCount: 0
  };

  try { result.exceeded  = checkBudgetExceeded(ss); }   catch (e) { Logger.log(`[checkExceeded] ${e}`); }
  try { result.warning   = checkApproachingLimit(ss); } catch (e) { Logger.log(`[checkWarning] ${e}`); }
  try { result.goalSoon  = checkGoalDeadlines(ss); }    catch (e) { Logger.log(`[checkGoals] ${e}`); }
  try { result.reminders = checkDataEntryReminders(ss); } catch (e) { Logger.log(`[checkReminders] ${e}`); }
  try { result.integrity = checkFormulaIntegrity(); }   catch (e) { Logger.log(`[checkIntegrity] ${e}`); }

  result.totalCount =
    result.exceeded.length + result.warning.length +
    result.goalSoon.length + result.reminders.length +
    result.integrity.length;

  return result;
}

// ----------------------------------------------------------------------------
// Check 1 + 2: budget exceeded / approaching limit
// ----------------------------------------------------------------------------
// Each monthly sheet exposes:
//   D63 = SUM(D33:D62)  - planned expense
//   E63 = SUM(E33:E62)  - actual expense
// Ratio actual / planned drives both states.
// ----------------------------------------------------------------------------
function checkBudgetExceeded(ss) {
  return _scanMonthlyBudgetRatio(ss, ratio => ratio > 1);
}

function checkApproachingLimit(ss) {
  return _scanMonthlyBudgetRatio(ss, ratio =>
    ratio >= NOTIFY_THRESHOLDS.warningRatio && ratio <= 1);
}

function _scanMonthlyBudgetRatio(ss, predicate) {
  const hits = [];
  MONTHS.forEach(month => {
    const sheet = ss.getSheetByName(month);
    if (!sheet) return;

    // Read both cells in one batch
    const values = sheet.getRange('D63:E63').getValues()[0];
    const planned = Number(values[0]) || 0;
    const actual  = Number(values[1]) || 0;

    if (planned <= 0 || actual <= 0) return;  // not enough data yet
    const ratio = actual / planned;
    if (!predicate(ratio)) return;

    hits.push({
      month,
      actual:  Math.round(actual),
      budget:  Math.round(planned),
      percent: Math.round(ratio * 100)
    });
  });
  return hits;
}

// ----------------------------------------------------------------------------
// Check 3: goal deadlines approaching
// ----------------------------------------------------------------------------
// Goals sheet structure:
//   Col A: name
//   Col D: progress %
//   Col F: months remaining (formula DATEDIF)
//   Col H: status emoji
// ----------------------------------------------------------------------------
function checkGoalDeadlines(ss) {
  const goals = ss.getSheetByName(SHEET_NAMES.goals);
  if (!goals) return [];

  const hits = [];
  // Read the full goals block in one shot (rows 7..26 = 20 rows, cols A..H)
  const values = goals.getRange(7, 1, 20, 8).getValues();

  values.forEach(row => {
    const name        = row[0];
    const progress    = row[3];
    const monthsLeft  = row[5];
    const status      = row[7];

    if (!name) return;
    // Skip completed goals
    if (typeof status === 'string' && status.indexOf('🟢') >= 0) return;
    // Only flag if months remaining is finite, > 0, and below threshold
    const m = Number(monthsLeft);
    if (!isFinite(m) || m <= 0) return;
    if (m > NOTIFY_THRESHOLDS.goalDeadlineMonths) return;

    const progressDisplay = (typeof progress === 'number')
      ? `${(progress * 100).toFixed(1)}%`
      : String(progress);

    hits.push({ name, monthsLeft: m, progress: progressDisplay });
  });
  return hits;
}

// ----------------------------------------------------------------------------
// Check 4: data entry reminders for past months
// ----------------------------------------------------------------------------
// "Past month" = month index < current month. We check both the income block
// (B10:B28 is the date column post-Revenue-shift) and the expense block
// (A33:A62) for any non-empty cells. If both are empty, we flag a reminder.
// ----------------------------------------------------------------------------
function checkDataEntryReminders(ss) {
  const hits = [];
  const currentMonthIdx = new Date().getMonth(); // 0..11

  for (let i = 0; i < currentMonthIdx; i++) {
    const month = MONTHS[i];
    const sheet = ss.getSheetByName(month);
    if (!sheet) continue;

    const incomeDates  = sheet.getRange('B10:B28').getValues();
    const expenseDates = sheet.getRange('A33:A62').getValues();

    const hasIncome  = incomeDates.some(r => r[0] !== '' && r[0] !== null);
    const hasExpense = expenseDates.some(r => r[0] !== '' && r[0] !== null);

    if (!hasIncome && !hasExpense) {
      hits.push({ month });
    }
  }
  return hits;
}

// ----------------------------------------------------------------------------
// Check 5: formula integrity (delegates to Phase 3 manifest)
// ----------------------------------------------------------------------------
function checkFormulaIntegrity() {
  // The manifest may not exist if Phase 3 wasn't loaded. Guard accordingly.
  if (typeof verifyFormulaIntegrity !== 'function') return [];

  const report = verifyFormulaIntegrity();
  const hits = [];

  // Surface as much detail as fits in the alert dialog (cap at 5 per type).
  report.missing.slice(0, 5).forEach(item => {
    hits.push({
      sheet: item.sheet,
      cell:  item.cell,
      status: t('integrity.statusMissing')
    });
  });
  report.altered.slice(0, 5).forEach(item => {
    hits.push({
      sheet: item.sheet,
      cell:  item.cell,
      status: t('integrity.statusAltered')
    });
  });
  return hits;
}

// ============================================================================
// REPORT FORMATTER
// ============================================================================

/**
 * Pure function: takes the structured check result and produces the
 * single multi-line string that goes into the alert dialog.
 *
 * Each section is conditional: nothing renders if its array is empty.
 */
function formatNotificationReport(result) {
  if (result.totalCount === 0) {
    return t('notifications.noAlertsBody');
  }

  const ts = new Date().toLocaleString(getActiveLang() === 'ar' ? 'ar-DZ' : 'en-US');
  let body = t('notifications.header', { timestamp: ts });

  if (result.exceeded.length > 0) {
    body += t('notifications.sectionExceeded', { n: result.exceeded.length });
    result.exceeded.forEach(item => {
      body += t('notifications.itemExceeded', item);
    });
    body += '\n';
  }

  if (result.warning.length > 0) {
    body += t('notifications.sectionWarning', { n: result.warning.length });
    result.warning.forEach(item => {
      body += t('notifications.itemWarning', item);
    });
    body += '\n';
  }

  if (result.goalSoon.length > 0) {
    body += t('notifications.sectionGoals', { n: result.goalSoon.length });
    result.goalSoon.forEach(item => {
      body += t('notifications.itemGoalSoon', item);
    });
    body += '\n';
  }

  if (result.reminders.length > 0) {
    body += t('notifications.sectionReminders', { n: result.reminders.length });
    result.reminders.forEach(item => {
      body += t('notifications.itemReminder', item);
    });
    body += '\n';
  }

  if (result.integrity.length > 0) {
    body += t('notifications.sectionIntegrity', { n: result.integrity.length });
    result.integrity.forEach(item => {
      body += t('notifications.itemIntegrity', item);
    });
    body += '\n';
  }

  body += t('notifications.footer');
  return body;
}

// ============================================================================
// QA HOOK
// ============================================================================

/**
 * Clears the per-session prompted flag so the next workbook open
 * re-fires the auto-check. Useful when developing or testing.
 */
function resetNotificationSession() {
  PropertiesService.getUserProperties()
    .deleteProperty(NOTIFY_SESSION_PROMPT_KEY);
  Logger.log('[Notifications] session flag cleared');
}
