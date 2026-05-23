/**
 * Module: 33_tabs.gs
 * Layer: 3 (IO)
 *
 * Reorders the workbook tabs into the canonical sequence:
 *   1. Welcome
 *   2. Settings
 *   3. Goals
 *   4..15. The 12 monthly sheets (يناير .. ديسمبر)
 *   16. Dashboard
 *   17. _DashboardEngine (later hidden by the entry point)
 *
 * Reads (globals): SHEET_NAMES, MONTHS.
 * No A1 references are changed by PR 1.
 */

function reorderTabs(ss) {
  const order = [
    SHEET_NAMES.welcome,
    SHEET_NAMES.settings,
    SHEET_NAMES.goals,
    ...MONTHS,
    SHEET_NAMES.dashboard,
    SHEET_NAMES.engine,
  ];

  for (let i = 0; i < order.length; i++) {
    const sheet = ss.getSheetByName(order[i]);
    if (sheet) {
      ss.setActiveSheet(sheet);
      ss.moveActiveSheet(i + 1); // 1-based position
    }
  }
}
