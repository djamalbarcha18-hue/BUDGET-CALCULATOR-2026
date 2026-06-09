# Apps Script for SmartBudget Pro 2026

A modular Google Apps Script project that builds the entire Arabic fintech
budgeting workbook in your own Google Sheet — multi-currency engine, 12 monthly
sheets, savings goals, a **debts ledger**, a dark-mode dashboard, a
**dynamic multi-year engine (2025–2035)** with automatic archiving,
**demo-data injection for 2025**, and a **Recovery Snapshots** safety system
with **installable time-based triggers**.

> **هندسة عربيّة بالكامل، أرقام لاتينيّة دائماً:** الواجهة عربيّة (RTL) لكن كل
> الأرقام والتواريخ تُعرَض وتُحسَب بالأرقام اللاتينيّة (1, 2, 3) لحماية المعادلات.

---

## 1. Architecture — the 14 numbered modules (+ 3 HTML views)

The original monolithic `install.gs` was split into **fourteen numbered `.gs`
files** plus three HTML views. The numeric suffix encodes **load/dependency
order** in the Apps Script global namespace: lower numbers are defined first, so
later files can safely reference their constants and helpers.

| # | File | Responsibility (المسؤوليّة) |
|---|------|------------------------------|
| 00 | **`Config.gs_00`** | المتغيّرات العامة، أسماء الأوراق، ألوان الوضع المظلم (`T`)، تخطيط الصفوف (`LAYOUT`)، إعدادات السنوات والطوارئ والمشغّلات |
| 00 | **`Texts.gs_00`** | كل النصوص العربيّة: العناوين، التسميات، رسائل التنبيهات، عناصر القائمة، ونصوص لوحة التحكّم (`TXT_*`) |
| 01 | **`Helpers.gs_01`** | الأدوات المساعدة: **فرض الأرقام اللاتينيّة** (`toLatinDigits`, `enforceLatinLocale`)، تنسيق التواريخ/النِسب، إنشاء الأوراق، دوال السنوات |
| 02 | **`Sheets.gs_02`** | إنشاء/إخفاء/تجميد/ترتيب الأوراق، ورقة الإعدادات، النطاقات المُسمّاة، الحماية، **محرّك السنوات وأرشيف السنوات** |
| 03 | **`Dashboard.gs_03`** | الواجهة المتجاوبة، المحرّك الخلفي `_DashboardEngine`، **تثبيت مواقع الرسوم (Charts Locking)**، ورقة الترحيب |
| 04 | **`System.gs_04`** | المشغّلات `onOpen`/`onEdit`، القائمة العلويّة، التركيب/الإصلاح، لوحة التحكّم وواجهتها البرمجيّة |
| 05 | **`Demo_QA.gs_05`** | **حقن بيانات 2025 التجريبيّة** وتنظيف باقي السنوات |
| 06 | **`Core.gs_06`** | المنطق المحاسبي: الورقة الشهريّة، الأهداف، **مفكرة الدائن والمدين**، دوال بناء الصيغ المشتركة |
| 07 | **`Manifest.gs_07`** | سجلّ المشروع (الإصدار/الوحدات)، مسارات الأوراق (Routing)، أعلام تفعيل الميزات |
| 08 | **`Export.gs_08`** | **محرّك التصدير إلى PDF** والطباعة وحفظ التقارير في Drive |
| 09 | **`Onboarding.gs_09`** | **نظام تهيئة المستخدم الجديد** والشريط الجانبي التوجيهي |
| 10 | **`Notifications.gs_10`** | **التنبيهات الذكيّة** (تجاوز/ادخار/أهداف/ديون) + ملخّص يومي بالبريد |
| 11 | **`Forecast.gs_11`** | **التوقّعات المالية المستقبلية** وإسقاط الأشهر القادمة |
| 12 | **`UserGuide.gs_12`** | **دليل الاستخدام المدمج** عبر شريط جانبي |
| 13 | **`Recovery.gs_13`** | **نظام الطوارئ (Snapshots)**: إنشاء/تدوير/استرجاع + المشغّلات الدوريّة |
| — | **`TopDialog.html`** | لوحة التحكّم السريعة المنبثقة (Dark Mode + RTL + أرقام لاتينيّة) |
| — | **`OnboardingSidebar.html`** | شريط تهيئة المستخدم الجديد (Dark Mode + RTL) |
| — | **`UserGuideSidebar.html`** | شريط دليل الاستخدام (Dark Mode + RTL + بحث) |

### Dependency flow

```
Config.gs_00 ─┐
Texts.gs_00  ─┤→ Helpers.gs_01 → Sheets.gs_02 → Dashboard.gs_03 ─┐
              │                    ↑                              │
              │              Core.gs_06 (buildMonth/buildGoals/buildDebts)
              │                    ↑                              │
              └──────────→ System.gs_04 (orchestrates install + triggers + dialog)
                                   ↑
                           Demo_QA.gs_05 (uses buildYearMonthlySheets)
```

---

## 2. Feature highlights

### 🗓️ Dynamic Years Engine (2025–2035)
- Monthly sheets are named per-year (e.g. `يناير 2025`).
- `activateYear(ss, year)` builds/shows the requested year's 12 sheets,
  **auto-archives** all other years (hidden + grey tab), and re-points the
  dashboard engine to the active year.
- The active year is editable from `الإعدادات!F3`; `onEdit` detects the change
  and switches automatically. It is also persisted in Document Properties.

### 🧾 Debts Ledger (مفكرة السلف والديون)
- Double-entry style: `🟢 لي (دائن)` (asset) vs `🔴 عليّ (مدين)` (liability).
- Auto-computed **remaining amount** and **status** (مسدد / جزئي / غير مسدد),
  plus a summary panel (total owed to me / by me / net position / open count).
- Feeds the dashboard **Liabilities** KPI card via `_DashboardEngine!H6`.

### 🧪 Demo data (2025)
- `injectDemoData2025(ss)` fills all 12 months with realistic income/expense
  rows (Latin digits + dates), then activates 2025.
- `cleanOtherYears(ss, keepYear)` clears input columns of every other year
  while preserving formulas.

### 🛟 Recovery Snapshots + installable triggers
- `createSnapshot()` captures all input data (monthly sheets + goals + debts)
  as JSON in Document Properties, with **auto-rotation** (max 10).
- `maybeAutoSnapshot()` runs on open (rate-limited).
- **Installable time-based triggers** (`installSnapshotTriggers`) take an
  automatic snapshot every `SNAPSHOT_CONFIG.triggerEveryHours` hours
  **without the user opening the file**. Toggle from the menu or the dialog.

### 🎛️ Quick-control dialog (`TopDialog.html`)
- Opens from the menu (`🎛️ فتح لوحة التحكّم السريعة`) as a modal over the
  Sheets toolbar.
- Dark-mode Arabic UI with one-click actions for every operation, calling the
  server via `google.script.run` → `dialogRunAction(action, params)`.
- Enforces Latin digits in the UI both on display and on input before sending
  to the server.

---

## 3. Installation

1. Open a fresh sheet at https://sheets.new. Set `File → Settings → Locale` to
   an Arabic locale, then **Save settings**.
2. `Extensions → Apps Script`.
3. Create the files **with the exact names above** (Apps Script shows `.gs`
   files without the numeric suffix in the UI; keep the names unique, e.g.
   `Config`, `Texts`, `Helpers`, `Sheets`, `Dashboard`, `System`, `Demo_QA`,
   `Core`) and add an **HTML file** named `TopDialog`. Paste each file's
   contents from this repo.
4. Save. In the function dropdown choose **`installBudgetCalculator2026`** and
   click **Run**. Approve the authorization prompt (it needs to edit the active
   spreadsheet and manage its own triggers).
5. ~30–60s later you'll see `تم تركيب القالب بنجاح`. The workbook is built, the
   first snapshot is taken, and the periodic backup trigger is installed.

> The script asks for confirmation before overwriting a non-empty workbook.
> Re-running is safe (idempotent): sheets are reused and triggers are
> de-duplicated.

---

## 4. The custom menu (`⚙️ نظام مالي ذكي`)

| Item | Function |
|------|----------|
| 🎛️ فتح لوحة التحكّم السريعة | `showTopDialog` |
| 🚀 تركيب / إعادة بناء المصنّف | `installBudgetCalculator2026` |
| 📅 تغيير السنة النشطة… | `menuSwitchYear` |
| 🗄️ أرشفة سنة… | `menuArchiveYear` |
| 🧪 حقن بيانات 2025 التجريبيّة | `menuInjectDemo2025` |
| 🧹 تنظيف بيانات السنوات الأخرى | `menuCleanOtherYears` |
| 💾 إنشاء نسخة طوارئ الآن | `menuCreateSnapshot` |
| ♻️ استرجاع نسخة طوارئ… | `menuRestoreSnapshot` |
| ⏰ تفعيل النسخ الاحتياطي التلقائي الدوري | `menuInstallSnapshotTriggers` |
| ⏹️ إيقاف النسخ الاحتياطي الدوري | `menuRemoveSnapshotTriggers` |
| 🛠️ إصلاح اللوحة الرئيسيّة | `repairDashboard2026` |

---

## 5. (Optional) Insert the charts manually

The installer locks chart **anchors** and exposes stable **named ranges**, but
does not insert the charts themselves (styling is faster in the GUI). Bind each
chart to its named range so it survives engine rebuilds and year switches:

| Chart | Anchor | Named range | Type |
|---|---|---|---|
| Combo (monthly comparison) | `B11:M26` | `rng_dash_monthly_grid` | Combo (column + line) |
| Waterfall (cash flow) | `N11:Y26` | `rng_dash_waterfall` | Waterfall (mark `صافي الربح` as Subtotal) |
| Doughnut: income | `B29:G44` | `rng_dash_doughnut_income` | Pie → Donut hole 60% |
| Doughnut: expenses | `H29:M44` | `rng_dash_doughnut_expense` | Pie → Donut hole 60% |

---

## 6. Maintenance notes

- **Single source of truth for text** is `Texts.gs_00` — change wording there,
  never inline in logic files.
- **Single source of truth for layout** is `LAYOUT` in `Config.gs_00` — change
  a row/column once and every module follows.
- **Latin-digit rule**: any string written to a cell goes through
  `toLatinDigits`; the workbook locale is forced to `en_US`; `onEdit` rewrites
  Eastern-Arabic digits typed by the user. Never bypass these.
- **Adding a year beyond 2035**: bump `YEAR_MAX` in `Config.gs_00` — everything
  else (validation, archiving, snapshots) adapts automatically.
- **Verify a clean install**: search `Boulahdid` across the workbook → exactly
  one match (welcome sheet). Change `الإعدادات!B3` currency → monthly monetary
  cells retint. The debts `الحالة` column auto-fills as you enter paid amounts.

## What the installer does NOT do

- It does not insert the charts (manual, ~5 minutes — see §5).
- It does not pre-fill real data (use the 2025 demo injector for sample data).
- It does not refresh exchange rates (placeholders in `data/currencies.csv` —
  update via `GOOGLEFINANCE` or by hand).
