#!/usr/bin/env bash
# ============================================================================
#  SmartBudget Pro 2026 · clasp build step · deploy/build.sh
# ----------------------------------------------------------------------------
#  لماذا هذا الملف؟
#   أداة clasp تتعرّف فقط على امتدادات .gs / .js / .html، ولا تدفع ملفّات
#   مثل "Config.gs_00". لذا نُبقي الملفّات المرقّمة كمصدر حقيقة في scripts/،
#   ثمّ نولّد منها مجلّد نشر (deploy/dist) بأسماء صالحة لـ clasp مع بادئة رقميّة
#   تحافظ على ترتيب التحميل الأبجدي نفسه (مهمّ: Config يجب أن يُحمَّل قبل Texts).
# ============================================================================
set -euo pipefail

# الجذر = مجلّد المستودع (الأب لمجلّد deploy)
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="$ROOT/scripts"
DIST="$ROOT/deploy/dist"

echo "🧹 تنظيف مجلّد النشر…"
rm -rf "$DIST"
mkdir -p "$DIST"

echo "📜 نسخ الـ Manifest…"
cp "$ROOT/deploy/appsscript.json" "$DIST/appsscript.json"

# خريطة إعادة التسمية: المصدر  →  اسم clasp صالح (بادئة رقميّة تحفظ الترتيب)
# ملاحظة حاسمة: 00_Config قبل 00_Texts (C < T) لأنّ Texts يستهلك ثوابت Config.
declare -A MAP=(
  ["Config.gs_00"]="00_Config.gs"
  ["Texts.gs_00"]="00_Texts.gs"
  ["Helpers.gs_01"]="01_Helpers.gs"
  ["Sheets.gs_02"]="02_Sheets.gs"
  ["Dashboard.gs_03"]="03_Dashboard.gs"
  ["System.gs_04"]="04_System.gs"
  ["Demo_QA.gs_05"]="05_Demo_QA.gs"
  ["Core.gs_06"]="06_Core.gs"
)

echo "🔁 تحويل ملفّات .gs_NN إلى أسماء صالحة لـ clasp…"
for src in "${!MAP[@]}"; do
  cp "$SRC/$src" "$DIST/${MAP[$src]}"
  echo "   $src → ${MAP[$src]}"
done

echo "🎛️ نسخ واجهة HTML…"
cp "$SRC/TopDialog.html" "$DIST/TopDialog.html"

echo "✅ تم البناء في: $DIST"
echo "   شغّل الآن:  clasp push   (من جذر المستودع)"
