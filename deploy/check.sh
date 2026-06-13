#!/usr/bin/env bash
# ============================================================================
#  SmartBudget Pro 2026 · syntax verification · deploy/check.sh
# ----------------------------------------------------------------------------
#  أداة node --check لا تتعرّف على امتداد ".gs_NN"، لذا ننسخ كل وحدة إلى ملفّ
#  مؤقّت بامتداد .js ثمّ نفحص صحّتها النحويّة. تُرجع الأداة رمز خروج غير صفري
#  إذا فشلت أيّ وحدة، لتسهيل دمجها في أيّ تدفّق تحقّق آلي.
# ============================================================================
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="$ROOT/scripts"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

fail=0
checked=0
for f in "$SRC"/*.gs_*; do
  [ -e "$f" ] || continue
  base="$(basename "$f")"
  cp "$f" "$TMP/$base.js"
  if node --check "$TMP/$base.js" 2>"$TMP/err.txt"; then
    echo "  OK   $base"
  else
    echo "  FAIL $base"
    sed 's/^/       /' "$TMP/err.txt"
    fail=1
  fi
  checked=$((checked + 1))
done

echo "--------------------------------------------"
if [ "$fail" -eq 0 ]; then
  echo "All $checked modules passed node --check."
else
  echo "Syntax check FAILED for one or more modules."
fi
exit "$fail"
