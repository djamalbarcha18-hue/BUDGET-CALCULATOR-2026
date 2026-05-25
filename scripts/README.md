# Apps Script Installer for BUDGET-CALCULATOR-2026

A one-click Google Apps Script that builds the entire 5-phase fintech workbook
in your own Google Sheet, in your own Google account, in about 60 seconds.

## Why this exists

The repository ships **architectural blueprints + CSV seeds**, not a hosted
Google Sheets file. Google Sheets workbooks live on Google's servers under a
specific user account. There is no way to publish a "copy this template" link
from a static Git repository alone.

Apps Script is the official Google-supported way to bootstrap a workbook from
code. You paste this script into your own Sheet, run it once, and it creates
all 17 tabs, formulas, named ranges, validation rules, conditional formatting,
and protection rules in your own copy.

## What the installer builds (Phases 1-5)

| Phase | Sheets created | What you get |
|---|---|---|
| 1 | `الإعدادات وأسعار الصرف` | 14-currency engine, category lists, 11 named ranges (`rng_*`) |
| 2 | `يناير` ... `ديسمبر` (12 sheets) | Income/expense blocks, alert engine (🔴/🟡/🟢), KPI panel formulas |
| 3 | `الأهداف المالية والادخار` | 4 baseline goals, status engine (🟢/🟡/⚪), smart recommendations |
| 4 | `اللوحة الرئيسية والتقرير السنوي` + hidden `_DashboardEngine` | 6 KPI cards with trend strings, 3 SPARKLINE progress bars, latest-5 transactions QUERY ledger, composite health score |
| 5 | `📖 دليل الاستخدام والترحيب` (tab #1) | Hero header, 3 quick-start cards with HYPERLINKs, restricted developer signature |

Plus: tab order set, RTL on every sheet, dark theme on dashboard + welcome,
protection layer with Arabic warnings, `_DashboardEngine` hidden.

## Step-by-step usage

### 1. Open a fresh Google Sheet

Visit https://sheets.new and rename it to `نظام مالي ذكي متكامل 2026`.

Set `File → Settings → Locale` to `Saudi Arabia` (or any Arabic locale) and
click **Save settings**. This is important so dates and decimals parse the way
the formulas expect.

### 2. Open the Apps Script editor

`Extensions → Apps Script`. A new tab opens with `Code.gs` containing a
placeholder `function myFunction() {}`.

### 3. Paste the installer

1. Open [`install.gs`](./install.gs) on GitHub.
2. Click the **Raw** button at the top of the file viewer. You'll see the
   plain `.gs` source.
3. `Ctrl+A`, `Ctrl+C`.
4. Back in your Apps Script editor, **delete everything** in `Code.gs` and
   `Ctrl+V` to paste.
5. `Ctrl+S` to save. Give the project any name, e.g.
   `BUDGET-CALCULATOR-2026 Installer`.

### 4. Run the installer

1. At the top of the Apps Script editor, the function dropdown probably says
   `myFunction`. Change it to **`installBudgetCalculator2026`**.
2. Click the **Run** button (▶).
3. Google will pop up an authorization dialog. Click **Review permissions**,
   pick your Google account, and approve.
   - The script asks for one permission only: edit the active spreadsheet.
   - It does NOT request access to your Drive, your other sheets, your email,
     or any external service.
4. The script runs for ~30-60 seconds. You can watch progress in the
   "Execution log" panel at the bottom.
5. When done, a Google Sheets-side alert says:
   `تم تركيب القالب بنجاح`.

### 5. Switch back to your sheet

Close the Apps Script tab. Your spreadsheet now has 17 tabs (including the
hidden `_DashboardEngine`). The active tab is
`📖 دليل الاستخدام والترحيب`.

### 6. Charts are auto-injected

The installer automatically creates three dark-mode charts on the dashboard
sheet as its final step (via `automateDashboardVisualsCore_`):

| Chart | Anchor | Named Range | Type |
|---|---|---|---|
| Income sources doughnut | `B29:G44` | `rng_dash_doughnut_income` | Pie (60% hole) |
| Expense categories doughnut | `H29:M44` | `rng_dash_doughnut_expense` | Pie (60% hole) |
| Annual income vs expense | `B11:M26` | `rng_dash_annual_bars` | Bar (horizontal) |

The Waterfall and Health Gauge charts still require manual insertion from the
GUI because their styling (subtotal flags, gauge band ranges) cannot be fully
configured via the EmbeddedChartBuilder API. Follow
[`docs/07_dashboard_architecture.md`](../docs/07_dashboard_architecture.md)
sections 4.2 and 5.1 for those two.

If you need to re-inject the three automated charts without re-running the
full installer, pick `automateDashboardVisuals` from the function dropdown and
click Run. It cleans up existing charts first, so duplicates are impossible.

## Re-running

Safe. The script asks for confirmation if the workbook already has content,
and uses `getOrCreateSheet` so existing sheets are reused (it overwrites their
formulas with the same formulas).

To do a completely clean install: create a brand new empty Google Sheet,
paste the script, run.

## Troubleshooting

**"Authorization required" loop** - Make sure your Google account has
permission to run Apps Script. Workspace admins sometimes restrict this.

**Currency symbols look like boxes (□)** - Your browser is missing an Arabic
font. Install Cairo / IBM Plex Sans Arabic / Tajawal, or rely on the system
default.

**Charts didn't appear** - The three automated charts (two doughnuts + one bar)
are injected automatically during installation. If they're missing, run
`automateDashboardVisuals` from the Apps Script function dropdown — it will
rebuild them. The Waterfall and Health Gauge charts still require manual
insertion (see section 6 above).

**`#REF!` in dashboard cells** - If you ran the script before any monthly
sheet had data, the cross-sheet references will resolve once you enter
income/expense rows. The errors will clear automatically.

**Smart recommendation in the goals sheet shows `#NAME?` for `rng_ActiveFormat`**
- Named ranges sometimes need the spreadsheet to "settle" after creation. Reload
the tab once. If it persists, run `defineNamedRanges()` from the Apps Script
editor (function dropdown → `defineNamedRanges` → Run).

## What the installer does NOT do

- It does not insert the Waterfall or Health Gauge charts (manual, ~2 minutes
  total — the three other charts are auto-injected by the installer).
- It does not pre-fill any actual income/expense data - those rows stay empty
  for you to enter.
- It does not refresh exchange rates (those are placeholders in
  `data/currencies.csv` - you must update them via `GOOGLEFINANCE` or by hand).
- It does not change your Locale or RTL workbook setting (you must set those
  manually in step 1; the script enables RTL per-sheet but not workbook-wide).

## Verifying a clean install

After running, do these three checks:

1. `Ctrl+F` for `Boulahdid` across the whole workbook → must return exactly
   **one** match (in the welcome sheet only).
2. Open `الإعدادات وأسعار الصرف`, change `B3` from `USD` to `SAR`. Switch to
   any monthly tab → all monetary cells should retint with `ر.س`.
3. Open `الأهداف المالية والادخار`. The `الحالة` column should show
   `🟡 قيد الادخار` for all four seeded goals (none are at 0% or 100%). The
   `التوصية الذكية` column should embed the active currency symbol in the
   Arabic recommendation text.

If all three pass, the install is correct.
