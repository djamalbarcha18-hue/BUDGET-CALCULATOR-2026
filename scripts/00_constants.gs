/**
 * Module: 00_constants.gs
 * Layer: 1 (data only)
 *
 * Theme palette, sheet name catalog, and warning strings.
 * Pure data. No SpreadsheetApp calls. No dependencies on other modules.
 * Loaded first (numeric prefix `00_`) so every other module can reference it.
 *
 * Sources of truth:
 *   T            -> mirrors data/dashboard/theme_palette.csv
 *   SHEET_NAMES  -> mirrors the canonical sheet names referenced across docs/
 *   WARN_*       -> mirrors data/dashboard/protection_rules.csv (warning text)
 */

// ============================================================================
// THEME PALETTE - mirrors data/dashboard/theme_palette.csv
// ============================================================================
const T = {
  bgPage:           '#0F172A',
  bgCard:           '#1F2937',
  fgPrimary:        '#F1F5F9',
  fgMuted:          '#94A3B8',
  accentIncome:     '#10B981',
  accentExpense:    '#DC2626',
  accentNet:        '#06B6D4',
  accentTrendDown:  '#EF4444',
  gridline:         '#334155',
  paletteOrange:    '#F97316',
  paletteBlue:      '#3B82F6',
  palettePurple:    '#8B5CF6',
  palettePink:      '#EC4899',
  gaugeAmber:       '#F59E0B',
  gaugeLightGreen:  '#84CC16',
  white:            '#FFFFFF',
};

// ============================================================================
// SHEET NAMES - canonical names referenced by every formula and named range
// ============================================================================
const SHEET_NAMES = {
  welcome:  '📖 دليل الاستخدام والترحيب',
  settings: 'الإعدادات وأسعار الصرف',
  goals:    'الأهداف المالية والادخار',
  dashboard: 'اللوحة الرئيسية والتقرير السنوي',
  engine:   '_DashboardEngine',
};

// ============================================================================
// WARNING STRINGS - displayed by the soft-lock protection layer
// ============================================================================
const WARN_BRANDING   = 'هذه الكتلة جزء من الهويّة البصريّة للقالب. التعديل غير مرغوب.';
const WARN_SETTINGS   = 'هذه الورقة هي مصدر الحقيقة الوحيد للإعدادات. التعديل قد يكسر كل المصنّف.';
const WARN_CALC_CELL  = 'هذه الخلية محسوبة آلياً، لا تُعدَّل يدوياً.';
const WARN_ENGINE     = 'هذه الورقة جزء من المحرك الخلفي للوحة المعلومات. التعديل قد يكسر الصيغ والرسوم البيانية.';
