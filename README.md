# BUDGET-CALCULATOR-2026
## نظام مالي ذكي متكامل · Premium Arabic Budget Template

[![Sheet](https://img.shields.io/badge/Google%20Sheets-Compatible-success)]()
[![Locale](https://img.shields.io/badge/Locale-Arabic%20RTL-blue)]()
[![Status](https://img.shields.io/badge/Phase-6%2F13-orange)]()

---

### English summary

`BUDGET-CALCULATOR-2026` is a premium Arabic-first personal finance template engineered for Google Sheets. The repository ships the full architectural blueprint, importable seed data, and exact formulas required to assemble a multi-currency budget workbook covering all twelve months of the year. Phase 1 delivers the **foundational settings layer**, "الإعدادات وأسعار الصرف", which acts as the single source of truth for currencies, exchange rates, expense and income categories, payment methods, and number formats. Phase 2 delivers the **twelve RTL monthly ledger sheets** (يناير → ديسمبر) with their built-in financial intelligence layer (savings rate, spending rate, top expense category, dynamic alert engine). Phase 3 delivers the **savings goals & emergency fund engine**, "الأهداف المالية والادخار", a dedicated RTL sheet with a 9-column goals table, dynamic status engine (🟢 مكتمل / 🟡 قيد الادخار / ⚪ لم يبدأ بعد), and contextual smart-recommendation messages tiered by months remaining. Phase 4 delivers the **Ultimate Fintech Dashboard**, "اللوحة الرئيسية والتقرير السنوي", a luxury dark-mode RTL sheet (`#0F172A` background, `#1F2937` cards) with six top-row KPI cards (with micro-trend arrows), four mid-section charts (combo, waterfall, two doughnuts), a financial-health gauge, three goal progress bars driven by SPARKLINE, a dynamic latest-5-transactions ledger compiled across the 12 months, and a soft-lock protection layer with Arabic warning messages. Phase 5 delivers the **branded onboarding & welcome sheet**, "📖 دليل الاستخدام والترحيب", positioned as the first tab so it opens by default; it carries the Hero Header (`نظام ميزان المالي الذكي - BUDGET CALCULATOR 2026`), the developer-signature card (RESTRICTED to this sheet only), and three accent-bordered Quick Start cards that hyperlink to the settings, monthly, and dashboard sheets.

### الملخّص العربي

`BUDGET-CALCULATOR-2026` قالب ميزانية عربي احترافي مُهندَس لـ Google Sheets. يحتوي المستودع على المخطّط المعماري الكامل، وملفات البيانات المرجعية القابلة للاستيراد، والصيغ الدقيقة اللازمة لبناء مصنّف ميزانية متعدّد العملات يُغطّي شهور السنة الاثني عشر. تُسلّم المرحلة الأولى **طبقة الإعدادات التأسيسية** "الإعدادات وأسعار الصرف"، التي تعمل كمصدر الحقيقة الوحيد للعملات وأسعار الصرف وفئات الدخل والمصاريف وطرق الدفع وتنسيقات الأرقام. وتُسلّم المرحلة الثانية **الأوراق الشهرية الاثنتي عشرة** (يناير → ديسمبر) بطبقتها الذكية المدمجة (نسبة الادخار، نسبة الإنفاق، أعلى فئة استنزاف، محرّك التنبيهات الديناميكي). وتُسلّم المرحلة الثالثة **نظام الأهداف المالية والادخار** "الأهداف المالية والادخار"، وهو ورقة RTL مخصّصة بجدول من تسعة أعمدة، ومحرّك حالات ديناميكي (🟢 مكتمل / 🟡 قيد الادخار / ⚪ لم يبدأ بعد)، وتوصيات ذكيّة تُولَّد آلياً بحسب الأشهر المتبقية. وتُسلّم المرحلة الرابعة **اللوحة الرئيسية والتقرير السنوي**، وهي ورقة فنتك فاخرة بوضع داكن (خلفية `#0F172A` وبطاقات `#1F2937`) تحوي ستّ بطاقات KPI علويّة بمؤشّرات اتجاه دقيقة، وأربعة رسوم بيانيّة وسطى (Combo + Waterfall + دونات الدخل + دونات المصاريف)، ومقياس \"درجة الصحّة المالية\"، وثلاثة أشرطة تقدّم للأهداف عبر SPARKLINE، وسجلّ \"أحدث المعاملات\" يُجمَّع ديناميكيّاً من الأوراق الشهريّة، وطبقة حماية ناعمة برسائل تحذير عربيّة. وتُسلّم المرحلة الخامسة **ورقة الترحيب ودليل الاستخدام** "📖 دليل الاستخدام والترحيب" كأوّل تبويب في المصنّف بحيث يفتح تلقائياً، وتحوي الترويسة المزدوجة (`نظام ميزان المالي الذكي - BUDGET CALCULATOR 2026`)، وكتلة توقيع المطوّر **محصورة في هذه الورقة فقط**، وثلاث بطاقات Quick Start بحدود ملوَّنة وروابط Hyperlink لأوراق الإعدادات والشهر الحالي واللوحة الرئيسيّة.

---

## محتويات المستودع · Repository Layout

```
BUDGET-CALCULATOR-2026/
├── README.md                                       ← this file
├── docs/
│   ├── 01_settings_and_exchange_rates.md          ← Phase 1 architecture (Arabic, RTL)
│   ├── 02_formulas_reference.md                   ← Phase 1 formula quick-reference (Arabic, RTL)
│   ├── 03_monthly_sheets_architecture.md          ← Phase 2 architecture: 12 monthly sheets (Arabic, RTL)
│   ├── 04_monthly_formulas_reference.md           ← Phase 2 formula quick-reference (Arabic, RTL)
│   ├── 05_savings_goals_architecture.md           ← Phase 3 architecture: savings goals sheet (Arabic, RTL)
│   ├── 06_savings_goals_formulas_reference.md     ← Phase 3 formula quick-reference (Arabic, RTL)
│   ├── 07_dashboard_architecture.md               ← Phase 4 architecture: fintech dashboard (Arabic, RTL)
│   ├── 08_dashboard_formulas_reference.md         ← Phase 4 formula quick-reference (Arabic, RTL)
│   ├── 09_onboarding_welcome_architecture.md      ← Phase 5 architecture: onboarding/welcome sheet (Arabic, RTL)
│   └── 10_onboarding_assembly_checklist.md        ← Phase 5 assembly checklist + paste-ready text (Arabic, RTL)
└── data/
    ├── currencies.csv                  ← 14 currencies × 4 columns (UTF-8 BOM)
    ├── income_categories.csv           ← 8 income categories
    ├── expense_categories.csv          ← 12 expense categories (exact spec order)
    ├── payment_methods.csv             ← 4 payment methods
    ├── monthly_template/               ← Phase 2 paste-ready row seeds (UTF-8 BOM)
    │   ├── income_block_header.csv         ← 7-column header for قسم الدخل (RTL from col A)
    │   ├── expenses_block_header.csv       ← 8-column header for قسم المصاريف (RTL from col A)
    │   ├── kpi_panel_labels.csv            ← KPI panel label list for أعلى يمين الورقة الشهرية
    │   └── month_names.csv                 ← The 12 Arabic month names in calendar order
    ├── savings_goals/                  ← Phase 3 paste-ready seeds (UTF-8 BOM)
    │   ├── goals_seed.csv                  ← 9-column header + 4 baseline goals (RTL from col A)
    │   └── summary_panel_labels.csv        ← 7 summary-panel KPI labels for ورقة الأهداف
    ├── dashboard/                      ← Phase 4 dashboard seeds (UTF-8 BOM)
    │   ├── kpi_card_labels.csv             ← 6 KPI card titles for the top row
    │   ├── engine_monthly_grid.csv         ← 12-month skeleton for the hidden engine sheet
    │   ├── theme_palette.csv               ← All 18 theme tokens with their hex codes
    │   ├── progress_bar_goals.csv          ← The 3 goal names rendered as SPARKLINE progress bars
    │   └── protection_rules.csv            ← 14 soft-lock protection rules with Arabic warnings
    └── onboarding/                     ← Phase 5 welcome-sheet seeds (UTF-8 BOM)
        ├── welcome_sheet_layout.csv        ← Cell-by-cell layout for the onboarding sheet
        ├── quick_start_steps.csv           ← The 3 quick-start cards (number, title, body, link target, accent)
        └── developer_signature.csv         ← The 2-line developer signature (THIS sheet only)
```

- **[docs/01_settings_and_exchange_rates.md](docs/01_settings_and_exchange_rates.md)** - Phase 1: cell-by-cell layout, currency engine, named ranges configuration, validation rules, and integration plan with the monthly sheets.
- **[docs/02_formulas_reference.md](docs/02_formulas_reference.md)** - Phase 1: every settings-layer formula in copy-pasteable form with named-range equivalents.
- **[docs/03_monthly_sheets_architecture.md](docs/03_monthly_sheets_architecture.md)** - Phase 2: RTL layout, KPI panel, income/expenses blocks, dynamic alert engine, conditional formatting, step-by-step assembly procedure for the 12 monthly sheets.
- **[docs/04_monthly_formulas_reference.md](docs/04_monthly_formulas_reference.md)** - Phase 2: every monthly-sheet formula in copy-pasteable form (per-row, ARRAYFORMULA, IFS, INDEX/MATCH, annual-summary aggregator).
- **[docs/05_savings_goals_architecture.md](docs/05_savings_goals_architecture.md)** - Phase 3: RTL layout for ورقة "الأهداف المالية والادخار"، لوحة المؤشّرات الكليّة، 9-column goals table، dynamic status engine، and smart-recommendation engine.
- **[docs/06_savings_goals_formulas_reference.md](docs/06_savings_goals_formulas_reference.md)** - Phase 3: every savings-goals formula in copy-pasteable form (نسبة الإنجاز، الأشهر المتبقية بصيغتي DATEDIF والحسابيّة، القسط الشهري، الحالة بـ IFS وIF، التوصية الذكيّة الكاملة، صيغ لوحة المؤشّرات السبع).
- **[docs/07_dashboard_architecture.md](docs/07_dashboard_architecture.md)** - Phase 4: ورقة `اللوحة الرئيسية والتقرير السنوي`، Luxury Dark-Mode palette، layout الأربع وحدات (KPIs, Charts, Gauge+Bars+Ledger, Soft-Lock)، ورقة المحرّك الخلفي `_DashboardEngine`، إجراء التركيب التفصيلي.
- **[docs/08_dashboard_formulas_reference.md](docs/08_dashboard_formulas_reference.md)** - Phase 4: every dashboard formula in copy-pasteable form (annual sums، per-category 12-sheet aggregator، compact INDIRECT variant، trend strings، health-score composite، SPARKLINE bars، QUERY ledger in two variants).
- **[docs/09_onboarding_welcome_architecture.md](docs/09_onboarding_welcome_architecture.md)** - Phase 5: ورقة `📖 دليل الاستخدام والترحيب`، الترويسة المزدوجة، بطاقات Quick Start الثلاث، كتلة توقيع المطوّر (محصورة في هذه الورقة فقط)، السياسة المُعزَّزة لطبقة الحماية الناعمة عبر المصنّف.
- **[docs/10_onboarding_assembly_checklist.md](docs/10_onboarding_assembly_checklist.md)** - Phase 5: قائمة مراجعة سريعة + نصوص جاهزة للنسخ + صيغ Hyperlink + رسائل التحذير العربيّة الموحَّدة.
- **[data/](data/)** - UTF-8-with-BOM CSV seeds importable directly into the documented ranges.

---

## التركيب خطوة بخطوة في Google Sheets · Step-by-step Setup

### 1. إنشاء المصنّف · Create the workbook
1. افتح [sheets.new](https://sheets.new) لإنشاء جدول بيانات جديد.
2. سمّ المصنّف: `نظام مالي ذكي متكامل 2026`.
3. من `File → Settings`، اضبط: `Locale = Saudi Arabia` (أو أيّ منطقة عربية)، `Time zone` المناسبة، ثم فعِّل العرض من اليمين إلى اليسار عبر `View → Right-to-Left`.

### 2. إنشاء ورقة الإعدادات · Create the settings sheet
1. أعِد تسمية الورقة الافتراضية إلى: **`الإعدادات وأسعار الصرف`** (الاسم بالضبط - تعتمد عليه كل الأوراق الشهرية).
2. أدخل العنوان في `A1`: `نظام مالي ذكي متكامل - الإعدادات وأسعار الصرف`، ودَمج النطاق `A1:D1`.
3. أدخل في `A3` التسمية `العملة الرئيسية للعرض`، وفي `B3` القيمة الافتراضية `USD` (سيتمّ ربط Data Validation بها لاحقاً).
4. أدخل في `A4` التسمية `تنسيق العملة النشط` وفي `B4` الصيغة:
   ```
   =XLOOKUP(B3, A7:A20, D7:D20)
   ```
5. أدخل في `A5` التسمية `سعر صرف العملة الرئيسية مقابل الدولار` وفي `B5` الصيغة:
   ```
   =XLOOKUP(B3, A7:A20, C7:C20)
   ```

### 3. استيراد ملفات CSV إلى النطاقات المرجعية · Import the CSV seeds
استخدم `File → Import → Upload`، ثم اختر `Replace data at selected cell` ووجّه الاستيراد إلى الخلية الجذر لكل ملف:

| الملف | الخلية الجذر للاستيراد | تخطيط الاستيراد |
|---|---|---|
| `data/currencies.csv` | `A6` | يملأ `A6:D20` (ترويسة + 14 صفاً) |
| `data/income_categories.csv` | `F6` | يملأ `F6:F14` (ترويسة + 8 عناصر) |
| `data/expense_categories.csv` | `G6` | يملأ `G6:G18` (ترويسة + 12 عنصراً) |
| `data/payment_methods.csv` | `H6` | يملأ `H6:H10` (ترويسة + 4 عناصر) |

> **ملاحظة:** عند الاستيراد، اختر `Comma` كفاصل و`Detect automatically` لنوع البيانات. ملفات CSV تستخدم UTF-8 مع BOM لضمان عرض النصوص العربية بشكل صحيح.

### 4. تعريف النطاقات المُسمّاة · Define the named ranges
من `Data → Named ranges → + Add a range`، أنشئ النطاقات التالية بالضبط (انظر [الجدول الكامل في الوثيقة](docs/01_settings_and_exchange_rates.md#4-النطاقات-المسمّاة-named-ranges-configuration)):

| الاسم | المرجع |
|---|---|
| `rng_MainCurrency` | `'الإعدادات وأسعار الصرف'!$B$3` |
| `rng_ActiveFormat` | `'الإعدادات وأسعار الصرف'!$B$4` |
| `rng_MainRate` | `'الإعدادات وأسعار الصرف'!$B$5` |
| `rng_Currencies` | `'الإعدادات وأسعار الصرف'!$A$7:$A$20` |
| `rng_CurrencyNames` | `'الإعدادات وأسعار الصرف'!$B$7:$B$20` |
| `rng_CurrencyRates` | `'الإعدادات وأسعار الصرف'!$C$7:$C$20` |
| `rng_FormatStrings` | `'الإعدادات وأسعار الصرف'!$D$7:$D$20` |
| `rng_CurrencyTable` | `'الإعدادات وأسعار الصرف'!$A$7:$D$20` |
| `rng_IncomeCategories` | `'الإعدادات وأسعار الصرف'!$F$7:$F$14` |
| `rng_ExpenseCategories` | `'الإعدادات وأسعار الصرف'!$G$7:$G$18` |
| `rng_PaymentMethods` | `'الإعدادات وأسعار الصرف'!$H$7:$H$10` |

### 5. تطبيق قواعد التحقق من البيانات · Apply data validation
1. حدّد الخلية `B3` (العملة الرئيسية)، ثم `Data → Data validation → Add rule`، اختر `Dropdown (from a range)` وأدخل المصدر `=rng_Currencies`.
2. كرّر الخطوة لاحقاً على أعمدة الأوراق الشهرية كما هو موضّح في [القسم 5 من الوثيقة المعمارية](docs/01_settings_and_exchange_rates.md#5-قواعد-التحقّق-من-البيانات-data-validation-rules-للأوراق-الشهرية).

### 6. حماية ورقة الإعدادات · Protect the sheet
من `Data → Protect sheet`، اضبط الورقة بحيث لا يُسمح بالتعديل إلا في الخلايا:
- `B3` (العملة الرئيسية)
- `C7:C20` (تحديث أسعار الصرف)
- `F7:F14`, `G7:G18`, `H7:H10` (توسعة قوائم المدخلات).

---

## المرحلة الثانية: الأوراق الشهرية الاثنتا عشرة · Phase 2: 12 Monthly Sheets Architecture

تمتدّ المرحلة الثانية إلى ثنتي عشرة ورقة شهرية، كلّها مُهندَسة من اليمين إلى اليسار (RTL)، وكلّها تستهلك بيانات المرجع من المرحلة الأولى عبر النطاقات المُسمّاة `rng_*` حصراً (دون أيّ قائمة محليّة).

> أسماء الأوراق الإلزاميّة (يجب أن تطابق تماماً): `يناير` · `فبراير` · `مارس` · `أبريل` · `مايو` · `يونيو` · `يوليو` · `أغسطس` · `سبتمبر` · `أكتوبر` · `نوفمبر` · `ديسمبر`.

### ما تحتويه كل ورقة شهرية

1. **لوحة المؤشّرات الذكيّة** (الصفوف `1:6`، الأعمدة `A:G`، تظهر تحت RTL في أعلى يمين الورقة): العملة الرئيسية للعرض، الشهر، إجماليات الدخل والمصروف (المتوقّع والفعلي)، صافي الفائض/العجز، نسبة الادخار، نسبة الإنفاق، أعلى فئة استنزاف ومبلغها، ومؤشّر التنبيه الذكي على مستوى الشهر.
2. **كتلة الدخل** (الصفوف `9:29`): ترويسة سبعة أعمدة بترتيب RTL من العمود `A` (`التاريخ، الفئة، الوصف، الدخل المتوقع، الدخل الفعلي، الفرق، طريقة الدفع`)، 19 صفّ إدخال، صفّ إجماليات.
3. **كتلة المصاريف** (الصفوف `32:63`): ترويسة سبعة أعمدة بنفس ترتيب RTL (`التاريخ، الفئة، الوصف، المصروف المتوقع، المصروف الفعلي، الفرق، طريقة الدفع`) بالإضافة إلى عمود `حالة التنبيه` في `H`، 30 صفّ إدخال، صفّ إجماليات.
4. **محرّك التنبيهات الديناميكي** (في `H33:H62` على مستوى الصف، وفي `F2` على مستوى الشهر) بثلاث إشارات إلزاميّة:
   - 🔴 `تجاوز الميزانية` عندما `المصروف الفعلي > المصروف المتوقع`.
   - 🟡 `اقتراب من الحد` عندما `المصروف الفعلي ≥ 0.9 × المصروف المتوقع`.
   - 🟢 `أداء مالي ممتاز` فيما عدا ذلك.
5. **التنسيق المالي الديناميكي** عبر `rng_ActiveFormat`: تغيير العملة الرئيسيّة في ورقة الإعدادات يُحدِّث رمز كل المبالغ في الأشهر الـ 12 فوراً.

### كيف تركّب ورقة شهريّة واحدة · How to assemble one monthly sheet

1. أنشئ ورقة جديدة وأعد تسميتها إلى اسم الشهر بالضبط، ثم فعّل `View → Right-to-Left`.
2. الصق ترويسة كتلة الدخل من [`data/monthly_template/income_block_header.csv`](data/monthly_template/income_block_header.csv) في `A9`.
3. الصق ترويسة كتلة المصاريف من [`data/monthly_template/expenses_block_header.csv`](data/monthly_template/expenses_block_header.csv) في `A32`.
4. الصق تسميات لوحة المؤشّرات من [`data/monthly_template/kpi_panel_labels.csv`](data/monthly_template/kpi_panel_labels.csv) (للاسترشاد بالقائمة الكاملة لتسميات لوحة `A1:G6`).
5. اكتب الصيغ من [`docs/04_monthly_formulas_reference.md`](docs/04_monthly_formulas_reference.md): الفرق، التنبيه على مستوى الصف، الإجماليات، نسبة الادخار، نسبة الإنفاق، أعلى فئة استنزاف، مؤشّر التنبيه الإجمالي.
6. طبّق قواعد التحقّق من البيانات على أعمدة الفئة وطريقة الدفع والتاريخ والمبالغ كما هو موثّق في [القسم 5 من وثيقة العمارة](docs/03_monthly_sheets_architecture.md#5-قواعد-التحقّق-من-البيانات-data-validation-rules).
7. طبّق التنسيق الشرطي بصيغ `Custom formula is` على عمود `H33:H62` (3 قواعد).
8. ضاعف الورقة عبر `Right-click → Duplicate` 11 مرّة، وأعد تسمية كل نسخة لاسم الشهر التالي. أسماء الأشهر الكاملة موجودة في [`data/monthly_template/month_names.csv`](data/monthly_template/month_names.csv).

> الإجراء التفصيلي خطوة بخطوة موجود في [القسم 11 من `docs/03_monthly_sheets_architecture.md`](docs/03_monthly_sheets_architecture.md#11-إجراء-التركيب-التفصيلي-لورقة-شهريّة-واحدة-step-by-step-assembly).

---

## المرحلة الثالثة: نظام الأهداف المالية والادخار · Phase 3: Savings Goals & Emergency Fund System

تضيف المرحلة الثالثة ورقة مخصّصة باسم `الأهداف المالية والادخار`، مُهندَسة من اليمين إلى اليسار (RTL)، تستهلك من المرحلة الأولى نطاقاً مُسمّى واحداً فقط (`rng_ActiveFormat`) لتنسيق المبالغ داخل التوصيات الذكيّة. الورقة منفصلة عن سجلّ المعاملات الشهرية، لكنّ ورقة "الملخّص السنوي" القادمة ستقرأ منها قيم لوحة المؤشّرات الكليّة.

### ما تحتويه ورقة الأهداف

1. **الترويسة الرئيسية** في `A1:I1` (مدموجة): `الأهداف المالية والادخار - نظام مالي ذكي متكامل`.
2. **لوحة المؤشّرات الكليّة** على الصفوف `2 → 4` (تجميعات `SUM`، `SUMIF`، `COUNTIF` فوق جدول الأهداف): إجمالي تكلفة الأهداف، إجمالي المدخر، نسبة الإنجاز الكليّة، إجمالي القسط الشهري المطلوب، عدد الأهداف المكتملة، عدد الأهداف قيد الادخار، عدد الأهداف التي لم تبدأ.
3. **جدول الأهداف** بترويسة على الصف 6 ونطاق إدخال `A7:I26` (20 صفّاً)، بترتيب RTL إلزامي للأعمدة التسعة من العمود `A` إلى `I`:
   1. `الهدف`
   2. `التكلفة التقديرية`
   3. `المبلغ المدخر حالياً`
   4. `نسبة الإنجاز` (محسوبة)
   5. `الموعد المستهدف`
   6. `الأشهر المتبقية` (محسوبة)
   7. `القسط الشهري المطلوب` (محسوبة)
   8. `الحالة` (محسوبة)
   9. `التوصية الذكية` (محسوبة)
4. **محرّك الحالات الديناميكي** في عمود `H` بثلاث إشارات حرفيّة إلزاميّة:
   - 🟢 `مكتمل` عندما `نسبة الإنجاز ≥ 100%`.
   - 🟡 `قيد الادخار` عندما `1% ≤ نسبة الإنجاز < 100%`.
   - ⚪ `لم يبدأ بعد` عندما `نسبة الإنجاز < 1%`.
5. **التوصيات الذكيّة** في عمود `I` تُولَّد بـ `IFS` تأخذ في الاعتبار حالة الإكمال، وانتهاء الموعد، والقسط الشهري المطلوب مقابل الأشهر المتبقية، مع تدرّج النصّ بحسب الأفق الزمني (`F7 > 24` ⏳ هادئ، `6 < F7 ≤ 24` 🟡 متوازن، `F7 ≤ 6` 🔴 إلحاحيّ). المبلغ داخل النصّ يُولَّد ديناميكيّاً عبر `TEXT(G7, rng_ActiveFormat)` فيتغيّر رمز العملة تلقائياً مع تغيّر العملة الرئيسية في ورقة الإعدادات.

### الأهداف الافتراضيّة الأربعة (Baseline Goals)

تُلصَق من [`data/savings_goals/goals_seed.csv`](data/savings_goals/goals_seed.csv) كنقطة بداية، وعلى المستخدم تحديثها لتعكس وضعه الماليّ الفعلي:

| الهدف | التكلفة التقديرية | المبلغ المدخر حالياً | الموعد المستهدف |
|---|---|---|---|
| `شراء سيارة` | 80,000 | 12,000 | 2027-12-31 |
| `شراء منزل` | 1,200,000 | 50,000 | 2030-12-31 |
| `صندوق الطوارئ` | 60,000 | 15,000 | 2026-12-31 |
| `السفر والاستثمار` | 25,000 | 5,000 | 2026-08-31 |

> الأرقام والتواريخ أعلاه **مؤشّرات افتراضيّة** فقط. الأرقام بدون رمز عملة لأنّ الرمز يأتي حصراً من `rng_ActiveFormat`، والتواريخ بصيغة ISO-8601 لضمان قراءة Google Sheets الصحيحة بصرف النظر عن المنطقة.

### كيف تركّب ورقة الأهداف · How to assemble the goals sheet

1. أنشئ ورقة جديدة وأعد تسميتها إلى `الأهداف المالية والادخار` بالضبط، ثمّ فعّل `View → Right-to-Left`.
2. أدخل العنوان `الأهداف المالية والادخار - نظام مالي ذكي متكامل` في `A1` ودَمج `A1:I1`.
3. الصق تسميات لوحة المؤشّرات من [`data/savings_goals/summary_panel_labels.csv`](data/savings_goals/summary_panel_labels.csv) واتبع شبكة الفقرة 3.1 من وثيقة العمارة لتوزيعها على الصفوف `2 → 4`.
4. اكتب صيغ لوحة المؤشّرات السبع من [الفقرات 13 → 19 من `docs/06`](docs/06_savings_goals_formulas_reference.md): `=SUM(B7:B26)`، `=SUM(C7:C26)`، `=IFERROR(SUM(C7:C26)/SUM(B7:B26), 0)`، `=SUMIF(H7:H26, "🟡 قيد الادخار", G7:G26)`، وثلاث `COUNTIF`.
5. الصق ترويسة جدول الأهداف والأهداف الأربعة الافتراضيّة من [`data/savings_goals/goals_seed.csv`](data/savings_goals/goals_seed.csv) في `A6` (ترويسة + 4 صفوف).
6. اكتب الصيغ في الصف 7 من [`docs/06_savings_goals_formulas_reference.md`](docs/06_savings_goals_formulas_reference.md): نسبة الإنجاز (`D7`)، الأشهر المتبقية بصيغة DATEDIF أو الحسابيّة (`F7`)، القسط الشهري المطلوب (`G7`)، الحالة بـ `IFS` (`H7`)، والتوصية الذكيّة الكاملة (`I7`).
7. حدّد `D7:I7` واسحب مقبض التعبئة حتى الصف 26.
8. طبّق قواعد التحقّق من البيانات على `B7:B26`, `C7:C26`, `E7:E26`, `G7:G26` كما في [القسم 11 من وثيقة العمارة](docs/05_savings_goals_architecture.md#11-قواعد-التحقّق-من-البيانات-data-validation-rules).
9. طبّق التنسيق الشرطي بصيغ `Custom formula is` على عمود `H7:H26` (3 قواعد لكلٍّ من 🟢/🟡/⚪) وعلى عمود `D7:D26` (قاعدة `=$D7>=1`).
10. نسِّق الأعمدة الماليّة `B7:B26`, `C7:C26`, `G7:G26` وخلايا لوحة المؤشّرات `B2, D2, B3` بسلسلة `rng_ActiveFormat`، ونسِّق `D7:D26` و`F2` كنسبة مئويّة.

> الإجراء التفصيلي خطوة بخطوة موجود في [القسم 15 من `docs/05_savings_goals_architecture.md`](docs/05_savings_goals_architecture.md#15-إجراء-التركيب-التفصيلي-step-by-step-assembly).

### المرحلة القادمة · Upcoming phase

ستجمع المرحلة الرابعة كل ما سبق في **اللوحة الرئيسية والتقرير السنوي** (انظر القسم التالي).

---

## المرحلة الرابعة: اللوحة الرئيسية والتقرير السنوي · Phase 4: Ultimate Fintech Dashboard

تختم المرحلة الرابعة المنظومة بورقة فنتك فاخرة باسم `اللوحة الرئيسية والتقرير السنوي`، مُهندَسة من اليمين إلى اليسار (RTL) بوضع داكن (Luxury Dark Mode). تستهلك الورقة بيانات الأوراق الشهريّة الـ 12 وورقة الأهداف عبر مُجمِّعات `SUM`/`SUMIF` وصيغ `QUERY`، وتُخفي الحسابات الداعمة في ورقة مساعدة `_DashboardEngine` تُحمى بطبقة Soft-Lock مع رسائل تحذير عربيّة.

### لوحة الألوان · Theme Palette

| Token | الاستخدام | Hex |
|---|---|---|
| `bg-page` | خلفيّة الورقة | `#0F172A` |
| `bg-card` | خلفيّة كل بطاقة | `#1F2937` |
| `fg-primary` | النصّ الأساسي | `#F1F5F9` |
| `fg-muted` | النصّ الثانوي | `#94A3B8` |
| `accent-income` | الأخضر النيوني (الدخل، اتجاه صاعد) | `#10B981` |
| `accent-expense` | الأحمر القرمزي (المصروفات، اتجاه هابط) | `#DC2626` |
| `accent-net` | الأزرق السماوي (خط صافي الربح) | `#06B6D4` |
| Donut palette | البرتقالي / الأزرق / البنفسجي / الوردي | `#F97316` / `#3B82F6` / `#8B5CF6` / `#EC4899` |

> القائمة الكاملة (18 token) في [`data/dashboard/theme_palette.csv`](data/dashboard/theme_palette.csv).

### الوحدات الأربع · The four modules

1. **Module 1 - بطاقات المؤشّرات الستّ (الصف العلوي):** `إجمالي الدخل`، `إجمالي المصروفات`، `صافي الربح`، `إجمالي الأصول`، `إجمالي الالتزامات`، `معدل الادخار %`. كل بطاقة تحوي رقماً كبيراً + خط اتجاه (▲/▼) ملوَّن شرطياً.
2. **Module 2 - الرسوم البيانية الكبرى:**
   - **Chart 1 (Combo - المقارنة الشهريّة):** أعمدة الدخل خضراء `#10B981`، أعمدة المصروف حمراء `#DC2626`، خط صافي الربح أزرق سماوي `#06B6D4`.
   - **Chart 2 (Waterfall - تدفّق النقد السنوي):** يُظهر تتالي إجمالي الدخل ← السكن ← الطعام ← المواصلات (= الفئة `النقل`) ← باقي المصاريف ← صافي الربح.
   - **Chart 3 (Doughnut - أكثر مصادر الدخل)** و**Chart 4 (Doughnut - أكثر فئات الإنفاق استنزافاً):** بلوحة ألوان (برتقالي/أزرق/بنفسجي/وردي).
3. **Module 3 - الصف الثالث:**
   - **مقياس \"درجة الصحّة المالية\"** (Gauge من 0 إلى 100) مع تسمية نصّيّة (`ممتاز` / `جيد` / `مقبول` / `يحتاج إلى تحسين`). الصيغة المُركَّبة تَزن: نسبة الادخار 40 نقطة + الانضباط الميزاني 30 نقطة + تقدّم الأهداف 30 نقطة.
   - **أشرطة تقدّم SPARKLINE** لثلاثة أهداف: `صندوق الطوارئ`، `شراء منزل`، `صندوق التقاعد` (لون الشريط يتدرّج: أحمر < 33%، كهرماني 33-66%، أخضر > 66%).
   - **سجلّ \"أحدث المعاملات\"** عبر `QUERY` على مصفوفة موحَّدة من 12 ورقة، يعرض آخر 5 معاملات، مع وسوم لونيّة `[دخل]` خضراء و`[مصروف]` حمراء.
4. **Module 4 - طبقة الحماية الناعمة (Soft-Lock):** 14 قاعدة حماية على بطاقات الـ KPI ومرجعيّات الرسوم وسجلّ المعاملات وورقة المحرّك، كلّها تعرض رسالة تحذير عربيّة دون رفض التعديل تماماً (انظر [`data/dashboard/protection_rules.csv`](data/dashboard/protection_rules.csv)).

### كيف تركّب اللوحة الرئيسية · How to assemble the dashboard sheet

1. أنشئ ورقة جديدة وأعد تسميتها إلى `اللوحة الرئيسية والتقرير السنوي` بالضبط، ثمّ فعّل `View → Right-to-Left`.
2. أنشئ ورقة ثانية باسم `_DashboardEngine` (الشرطة السفليّة في البداية إلزاميّة)، فعّل عليها RTL أيضاً.
3. طبّق ثيم Luxury Dark Mode (الفقرة 1.1 في [`docs/07_dashboard_architecture.md`](docs/07_dashboard_architecture.md)) باستخدام الـ tokens من [`data/dashboard/theme_palette.csv`](data/dashboard/theme_palette.csv).
4. الصق هيكل المحرّك من [`data/dashboard/engine_monthly_grid.csv`](data/dashboard/engine_monthly_grid.csv) في `_DashboardEngine!A1`، ثم اكتب صيغ `B2..B13` و`C2..C13` و`D2..D13` من [`docs/08_dashboard_formulas_reference.md`](docs/08_dashboard_formulas_reference.md) (الفقرة 9).
5. الصق تسميات بطاقات المؤشّرات من [`data/dashboard/kpi_card_labels.csv`](data/dashboard/kpi_card_labels.csv) كمرجع للبطاقات الستّ، ثمّ اكتب الصيغ من docs/08 (الفقرات 1-7).
6. أدرج الرسوم البيانية الأربعة (Combo, Waterfall, Doughnut x2) من القائمة `Insert → Chart` بإرسائها على النطاقات المذكورة في القسم 2 من docs/07.
7. أدرج Gauge chart للصحّة المالية، واكتب صيغ SPARKLINE الثلاث لأشرطة التقدّم من docs/08 الفقرة 15.
8. اكتب صيغة سجلّ المعاملات في `H48` من docs/08 الفقرة 18 (Variant A الموصى به).
9. طبّق التنسيق الشرطي (لون الاتجاه، وسوم النوع في السجلّ، تدرّج لون النسب).
10. طبّق طبقة الحماية الناعمة من [`data/dashboard/protection_rules.csv`](data/dashboard/protection_rules.csv)، ثم أخفِ ورقة `_DashboardEngine` عبر `Right-click tab → Hide sheet`.

> الإجراء التفصيلي خطوة بخطوة في [القسم 9 من `docs/07_dashboard_architecture.md`](docs/07_dashboard_architecture.md#9-إجراء-التركيب-التفصيلي-step-by-step-assembly).

### المرحلة القادمة · Upcoming phase

تختتم المرحلة الرابعة لوحة المعلومات. ورقة الترحيب القادمة (المرحلة 5) تختم الإصدار 1.0.0 (انظر القسم التالي).

---

## المرحلة الخامسة: ورقة الترحيب ودليل الاستخدام · Phase 5: Onboarding & Welcome Sheet

تُتوِّج المرحلة الخامسة المنظومة بورقة استقبال احترافيّة باسم `📖 دليل الاستخدام والترحيب`. الورقة تُوضع في الموضع الأوّل من المصنّف، فتفتح تلقائيّاً عند فتح الملفّ، وتحمل ثلاث وظائف مركَّزة في صفحة واحدة: تعريف بالمنتج بهويّة بصريّة موحَّدة، توقيع المطوّر **محصور هنا حصراً**، ودليل بدء سريع من ثلاث خطوات.

> الورقة تستخدم نفس Luxury Dark Mode من المرحلة الرابعة (`#0F172A` خلفيّة، `#1F2937` بطاقات) لاتساق التجربة من أوّل لقاء.

### ما تحتويه ورقة الترحيب

1. **كتلة الترويسة (Hero Header)** على `B2:O4` المدموجة، بسطرين:
   - السطر العربي: `نظام ميزان المالي الذكي` (32pt عريض جداً).
   - السطر الإنجليزي: `BUDGET CALCULATOR 2026` (16pt).
2. **نبذة تعريفيّة قصيرة** على `B6:O9` تُلخّص مكوّنات القالب الأربعة (محرّك العملات، 12 شهراً بالتنبيهات، الأهداف بالتوصيات، اللوحة الفاخرة).
3. **ثلاث بطاقات Quick Start** متجاورة أفقيّاً (تتدفّق من اليمين إلى اليسار):
   - **البطاقة 01 (`B11:F23`، حدّ علوي سماوي `#06B6D4`):** `اضبط الإعدادات أوّلاً` - رابط Hyperlink لورقة الإعدادات.
   - **البطاقة 02 (`G11:K23`، حدّ علوي أخضر `#10B981`):** `أدخل بياناتك الشهريّة` - رابط لورقة `يناير`.
   - **البطاقة 03 (`L11:P23`، حدّ علوي برتقالي `#F97316`):** `اقرأ اللوحة الرئيسيّة بأمان` - رابط للوحة الرئيسيّة.
4. **كتلة توقيع المطوّر** على `B26:O29` المدموجة، بسطرين:
   - `💎 تم التطوير والهندسة بواسطة: Boulahdid Djamal Eddine - المهندس`
   - `📩 للتواصل والدعم الفني: boulahdiddjamaleddine`
   > **سياسة إلزاميّة:** هذه الكتلة هي **المكان الوحيد في كامل المصنّف** الذي يُعرَض فيه توقيع المطوّر. باقي الأوراق (الإعدادات، 12 شهر، الأهداف، اللوحة الرئيسيّة) تبقى نظيفة من أيّ شريط نصّي إعلاني، حفاظاً على تركيز كل ورقة على وظيفتها التشغيليّة.
5. **شريط Footer** على الصفوف 32..34 برقم الإصدار وإخلاء مسؤوليّة أسعار الصرف وملاحظة توافق Google Sheets.

### السياسة المُعزَّزة لطبقة الحماية الناعمة (Soft-Lock Layer)

المرحلة الخامسة تُعمِّم قاعدة `Data → Protect range → Show a warning` على نطاقات حسّاسة في كل أوراق المصنّف، مع رسائل تحذير عربيّة موحَّدة (انظر [القسم 8 من docs/09](docs/09_onboarding_welcome_architecture.md#8-السياسة-المُعزَّزة-لطبقة-الحماية-الناعمة-soft-lock-layer-عبر-المصنّف-بالكامل)). كل قاعدة تُظهر للمستخدم رسالة عربيّة قبل تطبيق أيّ تعديل، فتمنع الحوادث الناتجة عن النقر الخاطئ أو لصق نطاق ضخم بطريق الخطأ، دون منع التعديل المتعمَّد عند الحاجة الفعليّة.

### ترتيب التبويبات النهائي بعد المرحلة 5

| المرتبة | الورقة | المرحلة |
|---|---|---|
| 1 | `📖 دليل الاستخدام والترحيب` | 5 (تفتح تلقائيّاً) |
| 2 | `الإعدادات وأسعار الصرف` | 1 |
| 3 | `الأهداف المالية والادخار` | 3 |
| 4..15 | `يناير` ← `ديسمبر` | 2 |
| 16 | `اللوحة الرئيسية والتقرير السنوي` | 4 |
| 17 | `_DashboardEngine` (مخفيّة) | 4 |

### كيف تركّب ورقة الترحيب · How to assemble the welcome sheet

1. أنشئ ورقة جديدة وأعد تسميتها إلى `📖 دليل الاستخدام والترحيب` بالضبط، ثمّ اسحب التبويب إلى الموضع رقم 1، وفعّل `View → Right-to-Left`.
2. طبّق الثيم الداكن: حدّد كل الورقة وضع خلفيّة `#0F172A` ولون نصّ `#F1F5F9`.
3. الصق محتوى الترويسة في `B2:O4` المدموجة (سطران مفصولان بـ Alt+Enter).
4. الصق النبذة التعريفيّة في `B6:O9` المدموجة.
5. ابنِ بطاقات Quick Start الثلاث من [`data/onboarding/quick_start_steps.csv`](data/onboarding/quick_start_steps.csv)، مع تطبيق الحدّ العلوي الملوَّن لكل بطاقة وصيغة `HYPERLINK` للوصول السريع.
6. الصق توقيع المطوّر في `B26:O29` من [`data/onboarding/developer_signature.csv`](data/onboarding/developer_signature.csv).
7. طبّق `Data → Protect range → Show a warning` على كتلة التوقيع برسالة `هذه الكتلة جزء من الهويّة البصريّة للقالب. التعديل غير مرغوب.`
8. الصق Footer في الصفوف 32..34 من [`data/onboarding/welcome_sheet_layout.csv`](data/onboarding/welcome_sheet_layout.csv).
9. وسِّع طبقة الحماية الناعمة على باقي الأوراق حسب جدول [القسم 8 من docs/09](docs/09_onboarding_welcome_architecture.md#8-السياسة-المُعزَّزة-لطبقة-الحماية-الناعمة-soft-lock-layer-عبر-المصنّف-بالكامل).
10. **التحقّق النهائي:** ابحث في كامل المصنّف عن `Boulahdid` (`Ctrl+F` على مستوى المصنّف) - يجب أن تُعيد نتيجة واحدة فقط في `📖 دليل الاستخدام والترحيب`.

> الإجراء التفصيلي خطوة بخطوة في [القسم 9 من `docs/09_onboarding_welcome_architecture.md`](docs/09_onboarding_welcome_architecture.md#9-إجراء-التركيب-التفصيلي-لورقة-الترحيب-step-by-step-assembly)، وقائمة المراجعة السريعة + النصوص الجاهزة للنسخ في [`docs/10_onboarding_assembly_checklist.md`](docs/10_onboarding_assembly_checklist.md).

---

## دليل تركيب المصنّف الكامل · Full Workbook Compile Guide

بعد اكتمال المراحل الخمس (5/13)، يمكنك بناء المصنّف بالكامل بالترتيب التالي:

1. **افتح Google Sheets جديد** عبر [sheets.new](https://sheets.new)، سمِّه `نظام مالي ذكي متكامل 2026`، واضبط `Locale = Saudi Arabia` وفعّل `View → Right-to-Left`.
2. **المرحلة 1 (الإعدادات):** اتبع القسم 2-6 من قسم "التركيب خطوة بخطوة في Google Sheets" أعلاه. استورد الأربع ملفات من `data/*.csv` (currencies, income_categories, expense_categories, payment_methods)، وعرّف النطاقات المُسمّاة الـ 11.
3. **المرحلة 2 (12 ورقة شهريّة):** ابنِ ورقة `يناير` كاملة من docs/03 + docs/04 + ملفات `data/monthly_template/`، ثمّ ضاعفها 11 مرّة وأعد التسمية لكل شهر.
4. **المرحلة 3 (الأهداف):** اتبع docs/05 + docs/06، الصق `data/savings_goals/goals_seed.csv` في `A6` من ورقة `الأهداف المالية والادخار`.
5. **المرحلة 4 (اللوحة الرئيسيّة):** أنشئ ورقتي `اللوحة الرئيسية والتقرير السنوي` و`_DashboardEngine`، اتبع docs/07 + docs/08 وطبّق ملفات `data/dashboard/` لبناء البطاقات والرسوم والـ Gauge والسجلّ.
6. **المرحلة 5 (الترحيب):** أنشئ `📖 دليل الاستخدام والترحيب` في الموضع الأوّل، اتبع docs/09 + docs/10 وطبّق ملفات `data/onboarding/`.
7. **التحقّق النهائي:** غيّر العملة الرئيسيّة في `الإعدادات وأسعار الصرف!B3` من `USD` إلى `SAR` (مثلاً) وتأكّد من تحديث رمز العملة في كل أوراق الشهر، وفي بطاقات اللوحة، وفي صفحة الأهداف، وداخل نصوص التوصيات الذكيّة - دفعة واحدة. اضغط `Ctrl+F` على كلمة `Boulahdid` في كامل المصنّف ← يجب أن تُعيد نتيجة واحدة فقط في ورقة الترحيب.

> هذه السبع خطوات تُنتج المصنّف الكامل بالحالة 5/13. المرحلة 6 (Apps Script Installer) تختصر هذه السبع خطوات إلى نقرة واحدة (انظر القسم التالي).

---

## المرحلة السادسة: مُركِّب التطبيق ذو النقرة الواحدة · Phase 6: Apps Script One-Click Installer

تختصر المرحلة السادسة دليل التركيب اليدوي السباعي إلى **سكربت واحد** يُلصَق ويُشغَّل، فيُنشئ كل أوراق المراحل 1 إلى 5 في جوجل شيتس مباشرة (~60 ثانية).

### الملفات

- **[`scripts/install.gs`](scripts/install.gs)** - سكربت Google Apps Script (~700 سطراً) يبني المصنّف بالكامل: 17 ورقة، كل النطاقات المُسماة، كل الصيغ، التحقّق من البيانات، التنسيق الشرطي، طبقة الحماية الناعمة، إخفاء ورقة المحرّك، وإعادة ترتيب التبويبات.
- **[`scripts/README.md`](scripts/README.md)** - دليل المستخدم بستّ خطوات + قسم استكشاف الأخطاء + قائمة التحقّق بثلاث خطوات بعد التركيب.

### كيف تستخدمه (مختصر)

1. افتح [sheets.new](https://sheets.new) وسمِّ الملف `نظام مالي ذكي متكامل 2026`.
2. `File → Settings → Locale = Saudi Arabia` (أو أيّ منطقة عربيّة) ثمّ `Save settings`.
3. `Extensions → Apps Script`.
4. الصق محتوى [`scripts/install.gs`](scripts/install.gs) (انقر على Raw في GitHub، ثمّ `Ctrl+A` و`Ctrl+C`، ثمّ ألصق في `Code.gs` بعد حذف ما به).
5. احفظ (`Ctrl+S`)، اختر من قائمة الدوال `installBudgetCalculator2026`، وانقر **Run**.
6. اقبل صلاحيّة "تعديل جدول البيانات الحالي". انتظر ~60 ثانية.
7. أغلق محرّر Apps Script. ستجد نفسك على ورقة `📖 دليل الاستخدام والترحيب`.

> الإجراء التفصيلي + استكشاف الأخطاء + قائمة التحقّق في [`scripts/README.md`](scripts/README.md).

### ما يفعله ولا يفعله

| ✅ يفعله | ⚠️ لا يفعله (تُتمَّم يدوياً) |
|---|---|
| إنشاء 17 ورقة بأسمائها العربيّة الصحيحة | إدراج الرسوم البيانيّة الأربعة + Gauge (لأنّ التنسيق البصري أسرع في GUI) |
| تفعيل RTL على كل ورقة | تغيير Locale المصنّف (يجب على المستخدم في الخطوة 2) |
| تطبيق الثيم الداكن على الترحيب واللوحة | تعبئة بيانات معاملات حقيقيّة (تبقى الصفوف فارغة للمستخدم) |
| كتابة كل الصيغ من Phase 1-5 | تحديث أسعار الصرف من API خارجي |
| تعريف 11 نطاقاً مُسمّى | حماية كاملة (Edit-only-by-owner) - يستخدم Show-a-warning عمداً |
| تطبيق Data Validation للقوائم المنسدلة | |
| تطبيق التنسيق الشرطي (🟢/🟡/⚪، 🔴/🟡/🟢، ▲/▼) | |
| تطبيق Soft-Lock + رسائل التحذير العربيّة الأربع | |
| إخفاء `_DashboardEngine` وإعادة ترتيب التبويبات | |

### المراحل القادمة · Upcoming phases

- **Phase 7:** إدراج الرسوم البيانيّة آلياً عبر `SpreadsheetApp.newChart()`.
- **Phase 8:** تحديث أسعار الصرف الأسبوعي عبر Time-driven trigger.
- **Phase 9:** تغليف السكربت كـ Google Workspace Add-on للتوزيع التجاري.

---

## تنبيه بشأن أسعار الصرف · Exchange Rates Disclaimer

القيم المُدرَجة في `data/currencies.csv` هي **مؤشرات تقريبية إرشادية** فقط. يجب على المستخدم تحديثها يدوياً قبل أيّ استخدام محاسبي فعلي، أو أتمتة التحديث عبر:

```
=IFERROR( GOOGLEFINANCE("CURRENCY:USD"&A7), <last_known_rate> )
```

> Indicative rates only. The end user MUST refresh them before relying on the workbook for any real accounting purpose.

---

## الترخيص · License

سيُحدَّد لاحقاً · TBD.
