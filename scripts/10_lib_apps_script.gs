/**
 * Module: 10_lib_apps_script.gs
 * Layer: 3 (IO - calls SpreadsheetApp)
 *
 * Thin reusable wrappers around SpreadsheetApp. Used by every phase builder.
 *
 * Functions:
 *   getOrCreateSheet(ss, name) -> Sheet (RTL applied)
 *   paintSheet(s, fg, bg)
 *   mergeAndStyle(s, a1, value, opts) -> Range
 *   paintCard(s, a1)
 *
 * Note on paintCard: in the original monolithic install.gs, paintCard was
 * defined BETWEEN buildDashboard and buildAnnualSum. It is logically a generic
 * IO helper (it takes a Sheet and an A1, paints background + foreground using
 * theme constants), so it lives here in the IO library. Apps Script's flat
 * global scope means the move is callable-equivalent: every existing caller
 * (buildDashboard, buildWelcome) finds it the same way.
 */

function getOrCreateSheet(ss, name) {
  let s = ss.getSheetByName(name);
  if (!s) s = ss.insertSheet(name);
  s.setRightToLeft(true);
  return s;
}

function paintSheet(s, fg, bg) {
  s.getRange(1, 1, s.getMaxRows(), s.getMaxColumns())
    .setBackground(bg).setFontColor(fg);
}

function mergeAndStyle(s, a1, value, opts) {
  const r = s.getRange(a1);
  r.merge();
  if (value !== undefined && value !== null) r.setValue(value);
  if (opts) {
    if (opts.bg)         r.setBackground(opts.bg);
    if (opts.fg)         r.setFontColor(opts.fg);
    if (opts.size)       r.setFontSize(opts.size);
    if (opts.bold)       r.setFontWeight('bold');
    if (opts.align)      r.setHorizontalAlignment(opts.align);
    if (opts.vAlign)     r.setVerticalAlignment(opts.vAlign);
    if (opts.wrap)       r.setWrap(true);
    if (opts.fontFamily) r.setFontFamily(opts.fontFamily);
  }
  return r;
}

function paintCard(s, a1) {
  s.getRange(a1).setBackground(T.bgCard).setFontColor(T.fgPrimary);
}
