# BUDGET-CALCULATOR-2026
## نظام مالي ذكي متكامل · Premium Arabic Budget Template

[![Sheet](https://img.shields.io/badge/Google%20Sheets-Compatible-success)]()
[![Locale](https://img.shields.io/badge/Locale-Arabic%20RTL-blue)]()
[![Status](https://img.shields.io/badge/Phase-1%2F13-orange)]()

---

### English summary

`BUDGET-CALCULATOR-2026` is a premium Arabic-first personal finance template engineered for Google Sheets. The repository ships the full architectural blueprint, importable seed data, and exact formulas required to assemble a multi-currency budget workbook covering all twelve months of the year. This phase delivers the **foundational settings layer**, "الإعدادات وأسعار الصرف", which acts as the single source of truth for currencies, exchange rates, expense and income categories, payment methods, and number formats consumed by the twelve monthly sheets that follow.

### الملخّص العربي

`BUDGET-CALCULATOR-2026` قالب ميزانية عربي احترافي مُهندَس لـ Google Sheets. يحتوي المستودع على المخطّط المعماري الكامل، وملفات البيانات المرجعية القابلة للاستيراد، والصيغ الدقيقة اللازمة لبناء مصنّف ميزانية متعدّد العملات يُغطّي شهور السنة الاثني عشر. تُسلّم هذه المرحلة **طبقة الإعدادات التأسيسية** "الإعدادات وأسعار الصرف"، والتي تعمل كمصدر الحقيقة الوحيد للعملات وأسعار الصرف وفئات الدخل والمصاريف وطرق الدفع وتنسيقات الأرقام التي ستستهلكها الأوراق الشهرية الاثنتا عشرة اللاحقة.

---

## محتويات المستودع · Repository Layout

```
BUDGET-CALCULATOR-2026/
├── README.md                                  ← this file
├── docs/
│   ├── 01_settings_and_exchange_rates.md     ← architecture blueprint (Arabic, RTL)
│   └── 02_formulas_reference.md              ← copy-pasteable formula reference (Arabic, RTL)
└── data/
    ├── currencies.csv          ← 14 currencies × 4 columns (UTF-8 BOM)
    ├── income_categories.csv   ← 8 income categories
    ├── expense_categories.csv  ← 12 expense categories (exact spec order)
    └── payment_methods.csv     ← 4 payment methods
```

- **[docs/01_settings_and_exchange_rates.md](docs/01_settings_and_exchange_rates.md)** - Cell-by-cell layout, currency engine, named ranges configuration, validation rules, and integration plan with the monthly sheets.
- **[docs/02_formulas_reference.md](docs/02_formulas_reference.md)** - Every formula in copy-pasteable form with named-range equivalents.
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

## الأوراق الشهرية القادمة · Upcoming Monthly Sheets

سيُلحق بالمصنّف لاحقاً الأوراق الاثنتا عشرة التالية، وكلٌّ منها سيُشير إلى ورقة "الإعدادات وأسعار الصرف" حصراً عبر النطاقات المُسمّاة، بدون أيّ بيانات مرجعية محلية:

> `يناير` · `فبراير` · `مارس` · `أبريل` · `مايو` · `يونيو` · `يوليو` · `أغسطس` · `سبتمبر` · `أكتوبر` · `نوفمبر` · `ديسمبر`

كل ورقة شهرية ستحوي صفوف معاملات بالأعمدة:
`A: التاريخ | B: نوع المعاملة | C: الفئة | D: المبلغ بعملة المعاملة | E: عملة المعاملة | F: المبلغ بعملة العرض | G: طريقة الدفع | H: ملاحظات`.

تفاصيل الصيغ المستخدمة في كل ورقة شهرية موثّقة في [مرجع الصيغ](docs/02_formulas_reference.md).

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
