# دليل النشر عبر clasp · SmartBudget Pro 2026

نشر القالب إلى مشروع Google Apps Script الخاص بك مباشرةً من سطر الأوامر، دون
نسخ الوحدات الثماني عشرة (18) وملفّات الواجهة يدوياً.

> **لماذا خطوة بناء (build)؟** أداة `clasp` تتعرّف فقط على امتدادات
> `.gs` / `.js` / `.html`. ملفّاتنا المرقّمة (`Config.gs_00` …) هي **مصدر الحقيقة**
> في `scripts/`، ويقوم `deploy/build.sh` بتوليد نسخ صالحة لـ clasp داخل
> `deploy/dist/` بأسماء ذات بادئة رقميّة (`00_Config.gs` …) تحافظ على ترتيب
> التحميل الأبجدي نفسه (مهمّ: `Config` يُحمَّل قبل `Texts` لأنّ الأخير يستهلك ثوابته).

---

## 0) خريطة الوحدات (18 وحدة + 5 ملفّات واجهة)

| # | المصدر (`scripts/`) | اسم clasp (`deploy/dist/`) | الدور |
|---|---|---|---|
| 00 | `Config.gs_00` | `00_Config.gs` | الثوابت والألوان وأسماء الأوراق |
| 00 | `Texts.gs_00` | `00_Texts.gs` | النصوص والرسائل العربيّة |
| 01 | `Helpers.gs_01` | `01_Helpers.gs` | الأدوات وفرض الأرقام اللاتينيّة |
| 02 | `Sheets.gs_02` | `02_Sheets.gs` | الأوراق والأرشيف والحماية |
| 03 | `Dashboard.gs_03` | `03_Dashboard.gs` | الواجهة والمحرّك والرسوم |
| 04 | `System.gs_04` | `04_System.gs` | المشغّلات والقائمة ولوحة التحكّم |
| 05 | `Demo_QA.gs_05` | `05_Demo_QA.gs` | محرّك السنوات والبيانات التجريبيّة |
| 06 | `Core.gs_06` | `06_Core.gs` | المحاسبة والدائن والمدين |
| 07 | `Manifest.gs_07` | `07_Manifest.gs` | سجلّ المشروع وأعلام الميزات |
| 08 | `Export.gs_08` | `08_Export.gs` | التصدير إلى PDF والطباعة |
| 09 | `Onboarding.gs_09` | `09_Onboarding.gs` | تهيئة المستخدم الجديد |
| 10 | `Notifications.gs_10` | `10_Notifications.gs` | التنبيهات الذكيّة |
| 11 | `Forecast.gs_11` | `11_Forecast.gs` | التوقّعات المالية |
| 12 | `UserGuide.gs_12` | `12_UserGuide.gs` | دليل الاستخدام المدمج |
| 13 | `Recovery.gs_13` | `13_Recovery.gs` | نظام الطوارئ والنسخ |
| 14 | `Charts.gs_14` | `14_Charts.gs` | مصادر الرسوم البيانيّة |
| 15 | `DebtTracker.gs_15` | `15_DebtTracker.gs` | مفكرة السلف والديون |
| 16 | `AI_Engine.gs_16` | `16_AI_Engine.gs` | **المساعد المالي الذكي (Gemini)** |

**ملفّات الواجهة (HTML):** `TopDialog.html` · `OnboardingSidebar.html` ·
`UserGuideSidebar.html` · **`Assistant.html`** (واجهة المساعد) ·
**`ApiKeySetup.html`** (معالج إدخال مفتاح Gemini).

> ملاحظة الترتيب: الوحدة `16_AI_Engine.gs` تُحمَّل أخيراً (بادئة 16) ولا تُخلّ
> بترتيب الثوابت، فهي معزولة ولا يستهلك أحد ثوابتها وقت التحميل.

---

## 1) المتطلّبات (مرّة واحدة)

```bash
# تثبيت Node.js (إن لم يكن مثبّتاً)، ثمّ تثبيت clasp عالميّاً
npm install -g @google/clasp

# تسجيل الدخول بحساب Google الذي يملك الجدول
clasp login
```

> فعّل أيضاً Apps Script API من: https://script.google.com/home/usersettings (مرّة واحدة).

---

## 2) سحب المشروع من GitHub

```bash
git clone https://github.com/djamalbarcha18-hue/BUDGET-CALCULATOR-2026.git
cd BUDGET-CALCULATOR-2026
```

> العمل يجري على الفرع `main` بعد دمج طلبات السحب. لمعاينة ميزة المساعد قبل
> دمجها استخدم فرعها: `git checkout feat/smart-budget-assistant`.

---

## 3) الحصول على معرّف السكربت (Script ID)

افتح جدولك في Google Sheets ← `الإضافات/Extensions → Apps Script`، ثمّ من
`Project Settings (⚙️)` انسخ قيمة **Script ID** وضعها في `.clasp.json` بدل النصّ
النائب `<<ضع_معرّف_السكربت_هنا_SCRIPT_ID>>`. بقيّة الحقول (`rootDir`,
`filePushOrder`) مضبوطة مسبقاً وتشمل الوحدات الـ18 وملفّات الواجهة الخمسة.

> بديل: إنشاء مشروع جديد مرتبط بجدول جديد عبر
> `clasp create --type sheets --title "SmartBudget Pro 2026"` (سيكتب `scriptId`
> تلقائياً، لكن عدِّل `rootDir` إلى `deploy/dist` بعدها).

---

## 4) التحقّق ثمّ البناء والرفع (Push)

```bash
# 0) (اختياري لكن موصى به) فحص نحوي لكل الوحدات الـ18 عبر node --check
bash deploy/check.sh

# 1) توليد مجلّد النشر deploy/dist من الملفّات المرقّمة
bash deploy/build.sh

# 2) رفع الملفّات إلى مشروع Apps Script
clasp push
```

افتح المشروع في المتصفّح للتأكّد:

```bash
clasp open
```

---

## 5) أوّل تشغيل داخل Apps Script

1. من قائمة الدوال اختر **`installBudgetCalculator2026`** ثمّ Run، ووافِق على
   صلاحيّات OAuth (تعديل الجدول الحالي + واجهات HTML + إدارة المشغّلات + الاتصال
   الخارجي + Drive).
2. أعد تحميل الجدول → ستظهر القائمة المخصّصة وفيها العناصر الجديدة:
   - **`🤖 المساعد المالي الذكي (Gemini)`**
   - **`🔑 إعداد المساعد الذكي (مفتاح Gemini)`**

---

## 6) تفعيل المساعد المالي الذكي (Gemini) — خطوة المستخدم

المساعد يعتمد نموذج **BYOK** (مفتاح المستخدم)، فلا تكلفة تشغيليّة على ناشر القالب.
التفعيل أصبح بخطوة واحدة عبر **معالج داخل التطبيق** (لا حاجة لخصائص السكربت يدوياً):

1. من القائمة افتح **`🔑 إعداد المساعد الذكي (مفتاح Gemini)`** (أو اضغط زرّ
   «إعداد المفتاح الآن» داخل واجهة المساعد عند غياب المفتاح).
2. اضغط رابط **Google AI Studio** للحصول على مفتاح مجاني، والصقه في الحقل.
3. اضغط **«تحقّق واحفظ»** — يُختبر المفتاح بنداء خفيف (دون استهلاك توكِنات)
   ثمّ يُحفظ تلقائياً عبر `PropertiesService.getScriptProperties()`.

**ضبط متقدّم (اختياري) عبر Script Properties:**

| الخاصيّة | القيمة | ملاحظات |
|---|---|---|
| `GEMINI_API_KEY` | مفتاحك | يُضبط آلياً عبر المعالج (أو يدوياً) |
| `GEMINI_MODEL` | `gemini-2.5-flash` | اختياري — لتغيير النموذج |

> يمكن إيقاف/تشغيل الميزة كلّياً عبر علم الميزة `assistant` في
> `PROJECT_MANIFEST.features` داخل `Manifest.gs_07`.

---

## 7) دورة العمل المستقبليّة (التحديث)

```bash
# بعد أيّ تعديل على ملفّات scripts/*.gs_NN
bash deploy/check.sh && bash deploy/build.sh && clasp push

# لسحب أيّ تعديل أجريته من محرّر Apps Script إلى ملفّات النشر
clasp pull   # (ينزل إلى deploy/dist — انقل التغييرات يدوياً إلى scripts/ المرقّمة)
```

> **تنبيه:** المصدر الرسمي هو `scripts/*.gs_NN`. مجلّد `deploy/dist/` مُولَّد
> وغير متعقَّب في git (مُدرَج في `.gitignore`)، فلا تعدّله مباشرةً.

---

## ملاحظات الصلاحيّات (OAuth Scopes)

| الصلاحيّة | الغرض |
|----------|-------|
| `spreadsheets.currentonly` | قراءة/تعديل الجدول المرتبط فقط (بناء الأوراق والصيغ والحماية) |
| `script.container.ui` | القوائم المخصّصة والنوافذ المنبثقة (`TopDialog` · `Assistant` · `ApiKeySetup`) |
| `script.scriptapp` | تركيب/إزالة المشغّلات الدوريّة لنسخ الطوارئ |
| `drive` | حفظ تقارير PDF (اللوحة/الشهر/تقرير المساعد) في Drive |
| `script.external_request` | استدعاء Gemini API عبر `UrlFetchApp` (المساعد الذكي) |
| `script.send_mail` | إرسال ملخّص التنبيهات بالبريد (وحدة Notifications) |
| `userinfo.email` | تعريف المستخدم في التذييلات/التوقيع |

> الصلاحيّتان `drive` و`script.external_request` ضروريّتان للمساعد الذكي
> (التصدير + استدعاء Gemini). إن كنت تُحدّث نسخة قديمة، تأكّد من وجودهما في
> `appsscript.json` ثمّ أعد الموافقة على الصلاحيّات عند أوّل تشغيل.
