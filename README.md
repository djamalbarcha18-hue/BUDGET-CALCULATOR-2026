# BUDGET-CALCULATOR-2026
## نظام مالي ذكي متكامل · Premium Arabic Budget Template

[![Sheet](https://img.shields.io/badge/Google%20Sheets-Compatible-success)]()
[![Locale](https://img.shields.io/badge/Locale-Arabic%20RTL-blue)]()
[![Status](https://img.shields.io/badge/Phase-3%2F13-orange)]()

---

### English summary

`BUDGET-CALCULATOR-2026` is a premium Arabic-first personal finance template engineered for Google Sheets. The repository ships the full architectural blueprint, importable seed data, and exact formulas required to assemble a multi-currency budget workbook covering all twelve months of the year. Phase 1 delivers the **foundational settings layer**, "الإعدادات وأسعار الصرف", which acts as the single source of truth for currencies, exchange rates, expense and income categories, payment methods, and number formats. Phase 2 delivers the **twelve RTL monthly ledger sheets** (يناير → ديسمبر) with their built-in financial intelligence layer (savings rate, spending rate, top expense category, dynamic alert engine). Phase 3 delivers the **savings goals & emergency fund engine**, "الأهداف المالية والادخار", a dedicated RTL sheet with a 9-column goals table, dynamic status engine (🟢 مكتمل / 🟡 قيد الادخار / ⚪ لم يبدأ بعد), and contextual smart-recommendation messages tiered by months remaining.

### الملخّص العربي

`BUDGET-CALCULATOR-2026` قالب ميزانية عربي احترافي مُهندَس لـ Google Sheets. يحتوي المستودع على المخطّط المعماري الكامل، وملفات البيانات المرجعية القابلة للاستيراد، والصيغ الدقيقة اللازمة لبناء مصنّف ميزانية متعدّد العملات يُغطّي شهور السنة الاثني عشر. تُسلّم المرحلة الأولى **طبقة الإعدادات التأسيسية** "الإعدادات وأسعار الصرف"، التي تعمل كمصدر الحقيقة الوحيد للعملات وأسعار الصرف وفئات الدخل والمصاريف وطرق الدفع وتنسيقات الأرقام. وتُسلّم المرحلة الثانية **الأوراق الشهرية الاثنتي عشرة** (يناير → ديسمبر) بطبقتها الذكية المدمجة (نسبة الادخار، نسبة الإنفاق، أعلى فئة استنزاف، محرّك التنبيهات الديناميكي). وتُسلّم المرحلة الثالثة **نظام الأهداف المالية والادخار** "الأهداف المالية والادخار"، وهو ورقة RTL مخصّصة بجدول من تسعة أعمدة، ومحرّك حالات ديناميكي (🟢 مكتمل / 🟡 قيد الادخار / ⚪ لم يبدأ بعد)، وتوصيات ذكيّة تُولَّد آلياً بحسب الأشهر المتبقية.

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
│   └── 06_savings_goals_formulas_reference.md     ← Phase 3 formula quick-reference (Arabic, RTL)
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
    └── savings_goals/                  ← Phase 3 paste-ready seeds (UTF-8 BOM)
        ├── goals_seed.csv                  ← 9-column header + 4 baseline goals (RTL from col A)
        └── summary_panel_labels.csv        ← 7 summary-panel KPI labels for ورقة الأهداف
```

- **[docs/01_settings_and_exchange_rates.md](docs/01_settings_and_exchange_rates.md)** - Phase 1: cell-by-cell layout, currency engine, named ranges configuration, validation rules, and integration plan with the monthly sheets.
- **[docs/02_formulas_reference.md](docs/02_formulas_reference.md)** - Phase 1: every settings-layer formula in copy-pasteable form with named-range equivalents.
- **[docs/03_monthly_sheets_architecture.md](docs/03_monthly_sheets_architecture.md)** - Phase 2: RTL layout, KPI panel, income/expenses blocks, dynamic alert engine, conditional formatting, step-by-step assembly procedure for the 12 monthly sheets.
- **[docs/04_monthly_formulas_reference.md](docs/04_monthly_formulas_reference.md)** - Phase 2: every monthly-sheet formula in copy-pasteable form (per-row, ARRAYFORMULA, IFS, INDEX/MATCH, annual-summary aggregator).
- **[docs/05_savings_goals_architecture.md](docs/05_savings_goals_architecture.md)** - Phase 3: RTL layout for ورقة "الأهداف المالية والادخار"، لوحة المؤشّرات الكليّة، 9-column goals table، dynamic status engine، and smart-recommendation engine.
- **[docs/06_savings_goals_formulas_reference.md](docs/06_savings_goals_formulas_reference.md)** - Phase 3: every savings-goals formula in copy-pasteable form (نسبة الإنجاز، الأشهر المتبقية بصيغتي DATEDIF والحسابيّة، القسط الشهري، الحالة بـ IFS وIF، التوصية الذكيّة الكاملة، صيغ لوحة المؤشّرات السبع).
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

ستبني المرحلة الرابعة ورقة "الملخّص السنوي" التي تضمّ نتائج الـ 12 شهراً في جدول واحد عبر النمط `SUMIF + INDIRECT` الموثَّق في [القسم 21 من مرجع الصيغ الشهرية](docs/04_monthly_formulas_reference.md#21-مُجمِّع-شهري-لاستهلاكه-في-ورقة-الملخّص-السنوي-لاحقاً)، وستقرأ من ورقة الأهداف قيم لوحة المؤشّرات الكليّة عبر مراجع `='الأهداف المالية والادخار'!B2` ونحوها كما في [القسم 21 من مرجع صيغ الأهداف](docs/06_savings_goals_formulas_reference.md#21-مرجع-للأوراق-المستقبليّة-cross-sheet-lookups).

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
