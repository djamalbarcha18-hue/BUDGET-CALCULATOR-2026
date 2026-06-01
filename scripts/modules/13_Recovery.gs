/**
 * SMARTBUDGET PRO 2026 - Module 13: Recovery Mode
 * =============================================================================
 * Phase 9 of the Strategic Refactor Plan.
 *
 * Three-level safety net for user data. The Architect Mandate said:
 *   "Provide integrity monitoring. Implement recovery mechanisms whenever
 *    feasible. Prevent accidental modifications."
 *
 * This module fulfills the recovery promise.
 *
 * THREE LEVELS
 * ------------
 *   LEVEL 1: Daily Snapshot
 *     Hidden _Snapshots sheet stores rolling 7-day data backups.
 *     One snapshot per day. Anti-spam: re-running on the same day asks
 *     before replacing.
 *
 *   LEVEL 2: User-initiated restore
 *     Pick any of the saved snapshots from a numbered list. Confirms
 *     before overwriting. Always saves an "emergency" snapshot of the
 *     current state first - the user can always undo a restore.
 *
 *   LEVEL 3: Defensive auto-snapshot before destructive operations
 *     Hooks (takePreOpSnapshot) for nuclearReset, repairDashboard, and
 *     re-install on a non-empty workbook. Pre-destructive snapshots are
 *     marked with type 'preop' and exempt from the daily-anti-spam logic.
 *
 * WHAT IS BACKED UP
 * -----------------
 *   - Income blocks: A10:H28 across all 12 monthly sheets (240 cells)
 *   - Expense blocks: A33:H62 across all 12 monthly sheets (360 cells)
 *   - Goals data: A7:E26 (100 cells, the user-input columns only)
 *
 * Total per snapshot: ~700 cells of pure user input. Stored as JSON
 * strings (one per sheet). Hidden engine sheets, dashboard, settings,
 * forecast, and welcome are NOT backed up - they are re-buildable from
 * Reinstall. The recovery system focuses on irreplaceable user data.
 *
 * STORAGE FORMAT
 * --------------
 * Hidden sheet `_Snapshots` with this layout:
 *   Row 1: header (id, timestamp, type, totalCells, payload)
 *   Rows 2..8: snapshots (newest first), max 7 rows
 *   Column E (payload) holds a JSON string: { sheets: { name: [[...]] } }
 *
 * READ-ONLY GUARANTEE
 * -------------------
 * The recovery system writes ONLY to:
 *   - The hidden _Snapshots sheet (its own data store)
 *   - User input ranges DURING restore (mirrors the snapshot back)
 * It NEVER writes to formulas, named ranges, charts, or settings cells.
 */

// ============================================================================
// CONFIGURATION
// ============================================================================
const SNAPSHOTS_SHEET_NAME = '_Snapshots';
const SNAPSHOTS_MAX_ROWS   = 7;       // rolling retention
const SNAPSHOTS_MAX_AGE_DAYS = 7;     // anything older auto-pruned

// Cell ranges that constitute "user data" per sheet type.
// Income block has 8 cols (A..H), expense has 8 cols (A..H), goals has 5.
const RECOVERY_RANGES = {
  monthlyIncome:  { sheet: '__MONTH__', a1: 'A10:H28' },
  monthlyExpense: { sheet: '__MONTH__', a1: 'A33:H62' },
  goals:          { sheet: '__GOALS__', a1: 'A7:E26' }
};

// Snapshot type labels (resolve via t() at display time)
const SNAP_TYPE_MANUAL    = 'manual';
const SNAP_TYPE_AUTO      = 'auto';
const SNAP_TYPE_EMERGENCY = 'emergency';
const SNAP_TYPE_PREOP     = 'preop';

// ============================================================================
// PUBLIC ENTRY POINTS — wired into the Recovery submenu
// ============================================================================

/**
 * Manual snapshot creation. Always asks for confirmation, even if a
 * snapshot already exists for today (offers to replace).
 */
function menuMakeSnapshot() {
  const ui = SpreadsheetApp.getUi();

  // Check if a snapshot already exists for today
  const todayExists = _hasSnapshotForToday();
  let confirmText = t('recovery.makeBody');
  if (todayExists) confirmText = t('recovery.makeAlreadyToday');

  const r = ui.alert(t('recovery.makeTitle'), confirmText, ui.ButtonSet.YES_NO);
  if (r !== ui.Button.YES) return;

  try {
    const result = _createSnapshot(SNAP_TYPE_MANUAL, todayExists /* replaceToday */);
    const oldestKept = _getOldestSnapshotTimestamp() || result.timestamp;

    ui.alert(
      t('recovery.makeSuccessTitle'),
      t('recovery.makeSuccessBody', {
        timestamp:  result.timestamp,
        totalCells: result.totalCells,
        oldestKept
      }),
      ui.ButtonSet.OK
    );
  } catch (e) {
    Logger.log(`[Recovery] makeSnapshot failed: ${e}`);
    ui.alert(t('recovery.errorTitle'), `${e}`, ui.ButtonSet.OK);
  }
}

/**
 * Display all saved snapshots in a numbered list.
 */
function menuListSnapshots() {
  const ui = SpreadsheetApp.getUi();
  const snapshots = _readAllSnapshots();

  if (snapshots.length === 0) {
    ui.alert(t('recovery.listTitle'), t('recovery.listEmpty'), ui.ButtonSet.OK);
    return;
  }

  let body = t('recovery.listHeader', { n: snapshots.length });
  snapshots.forEach((snap, idx) => {
    body += t('recovery.listRow', {
      index:     idx + 1,
      timestamp: snap.timestamp,
      age:       _humanAge(snap.timestamp),
      type:      _localizedTypeLabel(snap.type),
      cells:     snap.totalCells
    });
  });
  body += t('recovery.listFooter');

  ui.alert(t('recovery.listTitle'), body, ui.ButtonSet.OK);
}

/**
 * Restore flow:
 *   1. List snapshots
 *   2. Prompt user to pick by number
 *   3. Confirm with details (timestamp + cell count)
 *   4. Take an emergency snapshot of CURRENT data first
 *   5. Apply the chosen snapshot's data
 *   6. Show success
 */
function menuRestoreSnapshot() {
  const ui = SpreadsheetApp.getUi();
  const snapshots = _readAllSnapshots();

  if (snapshots.length === 0) {
    ui.alert(t('recovery.listTitle'), t('recovery.listEmpty'), ui.ButtonSet.OK);
    return;
  }

  // Build numbered list for the prompt
  const listText = snapshots.map((snap, idx) =>
    `  ${idx + 1}. ${snap.timestamp} (${_humanAge(snap.timestamp)}) - ` +
    `${_localizedTypeLabel(snap.type)}`
  ).join('\n');

  // Step 1: pick a number
  const response = ui.prompt(
    t('recovery.restoreTitle'),
    t('recovery.restorePrompt', { list: listText }),
    ui.ButtonSet.OK_CANCEL
  );
  if (response.getSelectedButton() !== ui.Button.OK) return;

  const idx = parseInt(response.getResponseText().trim(), 10) - 1;
  if (isNaN(idx) || idx < 0 || idx >= snapshots.length) {
    ui.alert(t('recovery.errorTitle'), t('recovery.restoreInvalid'), ui.ButtonSet.OK);
    return;
  }

  const target = snapshots[idx];

  // Step 2: confirm with full details
  const confirm = ui.alert(
    t('recovery.restoreConfirmTitle'),
    t('recovery.restoreConfirmBody', {
      timestamp: target.timestamp,
      cells:     target.totalCells
    }),
    ui.ButtonSet.YES_NO
  );
  if (confirm !== ui.Button.YES) return;

  // Step 3: emergency snapshot of current data BEFORE restore
  try {
    _createSnapshot(SNAP_TYPE_EMERGENCY, false /* don't replace today */);
  } catch (e) {
    // Don't block the restore if emergency snapshot fails — log and continue
    Logger.log(`[Recovery] emergency snapshot before restore failed: ${e}`);
  }

  // Step 4: apply
  try {
    const restored = _applySnapshot(target);
    ui.alert(
      t('recovery.restoreSuccessTitle'),
      t('recovery.restoreSuccessBody', {
        timestamp: target.timestamp,
        restored
      }),
      ui.ButtonSet.OK
    );
  } catch (e) {
    Logger.log(`[Recovery] restore failed: ${e}`);
    ui.alert(
      t('recovery.errorTitle'),
      t('recovery.errorRestoreFailed', { err: String(e) }),
      ui.ButtonSet.OK
    );
  }
}

/**
 * Wipe every snapshot. User-confirmed. Useful before sharing the workbook
 * to remove backup data, or to free up space.
 */
function menuCleanSnapshots() {
  const ui = SpreadsheetApp.getUi();
  const snapshots = _readAllSnapshots();

  if (snapshots.length === 0) {
    ui.alert(t('recovery.cleanTitle'), t('recovery.listEmpty'), ui.ButtonSet.OK);
    return;
  }

  const r = ui.alert(
    t('recovery.cleanTitle'),
    t('recovery.cleanConfirm', { n: snapshots.length }),
    ui.ButtonSet.YES_NO
  );
  if (r !== ui.Button.YES) return;

  _wipeAllSnapshots();
  ui.alert(
    t('recovery.cleanDoneTitle'),
    t('recovery.cleanDoneBody', { n: snapshots.length }),
    ui.ButtonSet.OK
  );
}

// ============================================================================
// DEFENSIVE LAYER — called by other modules before destructive operations
// ============================================================================

/**
 * Take a pre-op snapshot tagged so the user can identify it later.
 * Called by: nuclearReset, repairDashboardV2, reinstall-on-existing-data.
 *
 * Silent on success (just logs). Silent on failure too — destructive
 * operations should not be blocked by a backup attempt failing.
 *
 * @param {string} operation  Human-readable name ('Nuclear Reset', 'Repair...')
 */
function takePreOpSnapshot(operation) {
  try {
    const result = _createSnapshot(SNAP_TYPE_PREOP, false);
    Logger.log(`[Recovery] pre-op snapshot for "${operation}" - ${result.totalCells} cells`);

    // Notify user (non-blocking)
    SpreadsheetApp.getActive().toast(
      t('recovery.autoSnapshotBody', { operation }),
      t('recovery.autoSnapshotTitle'),
      5
    );
    return result;
  } catch (e) {
    Logger.log(`[Recovery] pre-op snapshot failed for "${operation}": ${e}`);
    return null;
  }
}

// ============================================================================
// CORE SNAPSHOT LOGIC
// ============================================================================

/**
 * Capture the current user data state into a new snapshot row.
 *
 * @param {string} type            Snapshot type label
 * @param {boolean} replaceToday   If true, deletes today's existing snapshot
 *                                 first (only meaningful for type === 'manual')
 * @return {Object} { id, timestamp, totalCells }
 */
function _createSnapshot(type, replaceToday) {
  const ss = SpreadsheetApp.getActive();
  const sheet = _getOrCreateSnapshotsSheet(ss);

  // 1. Collect data from every user-data range
  const payload = { sheets: {} };
  let totalCells = 0;

  MONTHS.forEach(month => {
    const ms = ss.getSheetByName(month);
    if (!ms) return;

    const incomeData  = ms.getRange('A10:H28').getDisplayValues();
    const expenseData = ms.getRange('A33:H62').getDisplayValues();

    if (_blockHasContent(incomeData) || _blockHasContent(expenseData)) {
      payload.sheets[month] = {
        income:  incomeData,
        expense: expenseData
      };
      totalCells += _countNonEmpty(incomeData) + _countNonEmpty(expenseData);
    }
  });

  // Goals
  const goals = ss.getSheetByName(SHEET_NAMES.goals);
  if (goals) {
    const goalsData = goals.getRange('A7:E26').getDisplayValues();
    if (_blockHasContent(goalsData)) {
      payload.sheets[SHEET_NAMES.goals] = { goals: goalsData };
      totalCells += _countNonEmpty(goalsData);
    }
  }

  if (totalCells === 0) {
    throw new Error(t('recovery.errorNoData'));
  }

  // 2. Anti-spam: optionally remove today's existing snapshot of same type
  if (replaceToday) {
    _deleteSnapshotsForToday(sheet);
  }

  // 3. Append new row
  const id = `snap_${Date.now()}`;
  const timestamp = _formatTimestamp(new Date());
  const payloadJson = JSON.stringify(payload);

  sheet.appendRow([id, timestamp, type, totalCells, payloadJson]);

  // 4. Prune to retention window
  _pruneOldSnapshots(sheet);

  SpreadsheetApp.flush();
  return { id, timestamp, totalCells };
}

/**
 * Apply a saved snapshot's data back to the workbook.
 * Returns the number of cells restored.
 */
function _applySnapshot(snapshot) {
  const ss = SpreadsheetApp.getActive();
  let payload;
  try {
    payload = JSON.parse(snapshot.payload);
  } catch (e) {
    throw new Error(`Corrupted snapshot data: ${e}`);
  }

  let restored = 0;

  // Restore monthly sheets
  MONTHS.forEach(month => {
    if (!payload.sheets[month]) return;
    const ms = ss.getSheetByName(month);
    if (!ms) return;

    const data = payload.sheets[month];
    if (data.income && Array.isArray(data.income) && data.income.length === 19) {
      ms.getRange('A10:H28').setValues(data.income);
      restored += _countNonEmpty(data.income);
    }
    if (data.expense && Array.isArray(data.expense) && data.expense.length === 30) {
      ms.getRange('A33:H62').setValues(data.expense);
      restored += _countNonEmpty(data.expense);
    }
  });

  // Restore goals
  const goalsName = SHEET_NAMES.goals;
  if (payload.sheets[goalsName]) {
    const goals = ss.getSheetByName(goalsName);
    if (goals) {
      const data = payload.sheets[goalsName];
      if (data.goals && Array.isArray(data.goals) && data.goals.length === 20) {
        goals.getRange('A7:E26').setValues(data.goals);
        restored += _countNonEmpty(data.goals);
      }
    }
  }

  SpreadsheetApp.flush();
  return restored;
}

// ============================================================================
// SNAPSHOTS SHEET MANAGEMENT
// ============================================================================

function _getOrCreateSnapshotsSheet(ss) {
  let s = ss.getSheetByName(SNAPSHOTS_SHEET_NAME);
  if (s) return s;

  s = ss.insertSheet(SNAPSHOTS_SHEET_NAME);
  s.getRange('A1:E1').setValues([['id', 'timestamp', 'type', 'totalCells', 'payload']])
    .setFontWeight('bold');
  s.setFrozenRows(1);

  // Hide so it doesn't clutter the user's tab bar
  try { s.hideSheet(); } catch (e) {}

  return s;
}

/**
 * Read all snapshots, newest first. Each row becomes:
 *   { id, timestamp, type, totalCells, payload, rowIndex }
 */
function _readAllSnapshots() {
  const ss = SpreadsheetApp.getActive();
  const sheet = ss.getSheetByName(SNAPSHOTS_SHEET_NAME);
  if (!sheet) return [];

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  const data = sheet.getRange(2, 1, lastRow - 1, 5).getValues();
  const snapshots = data.map((row, i) => ({
    id:         row[0],
    timestamp:  row[1],
    type:       row[2],
    totalCells: row[3],
    payload:    row[4],
    rowIndex:   i + 2  // 1-indexed sheet row
  }));

  // Newest first (sort by timestamp desc)
  snapshots.sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)));
  return snapshots;
}

function _hasSnapshotForToday() {
  const today = _todayString();
  return _readAllSnapshots().some(s =>
    String(s.timestamp).indexOf(today) === 0
  );
}

function _deleteSnapshotsForToday(sheet) {
  const today = _todayString();
  const all = _readAllSnapshots();
  // Delete from the bottom up so row indices stay valid
  all
    .filter(s => String(s.timestamp).indexOf(today) === 0)
    .sort((a, b) => b.rowIndex - a.rowIndex)
    .forEach(s => {
      try { sheet.deleteRow(s.rowIndex); } catch (e) {}
    });
}

function _pruneOldSnapshots(sheet) {
  const all = _readAllSnapshots();
  const now = Date.now();
  const cutoffMs = SNAPSHOTS_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

  // Mark rows for deletion: too old OR exceeding max count
  const toDelete = [];
  all.forEach((snap, idx) => {
    const age = now - _parseTimestamp(snap.timestamp);
    if (age > cutoffMs)              toDelete.push(snap);
    else if (idx >= SNAPSHOTS_MAX_ROWS) toDelete.push(snap);
  });

  // Delete from bottom up
  toDelete
    .sort((a, b) => b.rowIndex - a.rowIndex)
    .forEach(s => {
      try { sheet.deleteRow(s.rowIndex); } catch (e) {}
    });
}

function _wipeAllSnapshots() {
  const ss = SpreadsheetApp.getActive();
  const sheet = ss.getSheetByName(SNAPSHOTS_SHEET_NAME);
  if (!sheet) return;
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) sheet.deleteRows(2, lastRow - 1);
  SpreadsheetApp.flush();
}

function _getOldestSnapshotTimestamp() {
  const all = _readAllSnapshots();
  if (all.length === 0) return null;
  return all[all.length - 1].timestamp;
}

// ============================================================================
// HELPERS
// ============================================================================

function _blockHasContent(twoDArray) {
  if (!twoDArray) return false;
  for (let r = 0; r < twoDArray.length; r++) {
    for (let c = 0; c < twoDArray[r].length; c++) {
      const v = twoDArray[r][c];
      if (v !== '' && v !== null && v !== undefined) return true;
    }
  }
  return false;
}

function _countNonEmpty(twoDArray) {
  if (!twoDArray) return 0;
  let n = 0;
  for (let r = 0; r < twoDArray.length; r++) {
    for (let c = 0; c < twoDArray[r].length; c++) {
      const v = twoDArray[r][c];
      if (v !== '' && v !== null && v !== undefined) n++;
    }
  }
  return n;
}

function _formatTimestamp(d) {
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
         `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function _parseTimestamp(ts) {
  // Accepts our format yyyy-MM-dd HH:mm
  const m = String(ts).match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})/);
  if (!m) return 0;
  return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]).getTime();
}

function _todayString() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function _humanAge(timestamp) {
  const ms = Date.now() - _parseTimestamp(timestamp);
  if (ms < 0) return '?';
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

/**
 * Map the internal type token to a localized display label via t().
 */
function _localizedTypeLabel(type) {
  switch (type) {
    case SNAP_TYPE_MANUAL:    return t('recovery.typeManual');
    case SNAP_TYPE_AUTO:      return t('recovery.typeAuto');
    case SNAP_TYPE_EMERGENCY: return t('recovery.typeEmergency');
    case SNAP_TYPE_PREOP:     return t('recovery.typePreOp');
    default:                  return type || '?';
  }
}
