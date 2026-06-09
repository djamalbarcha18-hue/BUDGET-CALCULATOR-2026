# دليل النشر عبر clasp · SmartBudget Pro 2026

نشر القالب إلى مشروع Google Apps Script الخاص بك مباشرةً من سطر الأوامر، دون
نسخ الملفّات الثمانية يدوياً.

> **لماذا خطوة بناء (build)؟** أداة `clasp` تتعرّف فقط على امتدادات
> `.gs` / `.js` / `.html`. ملفّاتنا المرقّمة (`Config.gs_00` …) هي **مصدر الحقيقة**
> في `scripts/`، ويقوم `deploy/build.sh` بتوليد نسخ صالحة لـ clasp داخل
> `deploy/dist/` بأسماء ذات بادئة رقميّة (`00_Config.gs` …) تحافظ على ترتيب
> التحميل الأبجدي نفسه (مهمّ: `Config` يُحمَّل قبل `Texts` لأنّ الأخير يستهلك ثوابته).

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

# (اختياري) استخدام فرع إعادة الهيكلة قبل الدمج إلى main
git checkout refactor/master-smartbudget-pro-2026
```

---

## 3) الحصول على معرّف السكربت (Script ID)

افتح جدولك في Google Sheets ← `الإضافات/Extensions → Apps Script`، ثمّ من
`Project Settings (⚙️)` انسخ قيمة **Script ID**.

ضَع المعرّف داخل `.clasp.json` بدل النصّ النائب:

```jsonc
{
  "scriptId": "<<ضع_معرّف_السكربت_هنا_SCRIPT_ID>>",
  "rootDir": "deploy/dist",
  "filePushOrder": [ "appsscript.json", "00_Config.gs", "00_Texts.gs",
    "01_Helpers.gs", "02_Sheets.gs", "03_Dashboard.gs", "04_System.gs",
    "05_Demo_QA.gs", "06_Core.gs", "TopDialog.html" ]
}
```

> بديل: إنشاء مشروع جديد مرتبط بجدول جديد عبر
> `clasp create --type sheets --title "SmartBudget Pro 2026"` (سيكتب `scriptId`
> تلقائياً، لكن عدِّل `rootDir` إلى `deploy/dist` بعدها).

---

## 4) البناء والرفع (Push)

```bash
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
   صلاحيّات OAuth (تعديل الجدول الحالي + واجهات HTML + إدارة المشغّلات).
2. أعد تحميل الجدول → ستظهر القائمة **`⚙️ نظام مالي ذكي`** وزرّ
   **`🎛️ فتح لوحة التحكّم السريعة`**.

---

## 6) دورة العمل المستقبليّة (التحديث)

```bash
# بعد أيّ تعديل على ملفّات scripts/*.gs_NN
bash deploy/build.sh && clasp push

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
| `script.container.ui` | القوائم المخصّصة والنوافذ المنبثقة (`TopDialog.html`) |
| `script.scriptapp` | تركيب/إزالة المشغّلات الدوريّة لنسخ الطوارئ |
