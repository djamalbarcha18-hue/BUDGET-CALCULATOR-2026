/**
 * Module: 01_seed_data.gs
 * Layer: 1 (data only)
 *
 * Seed data for the workbook. Pure data. No SpreadsheetApp calls.
 * No dependencies on other modules. Loaded second (numeric prefix `01_`).
 *
 * Each constant mirrors a CSV file under data/. The two stay in sync by hand
 * for now; PR 2 will reduce these to a single source of truth.
 *
 * Sources of truth:
 *   CURRENCIES          -> mirrors data/currencies.csv
 *   INCOME_CATEGORIES   -> mirrors data/income_categories.csv
 *   EXPENSE_CATEGORIES  -> mirrors data/expense_categories.csv
 *   PAYMENT_METHODS     -> mirrors data/payment_methods.csv
 *   MONTHS              -> mirrors data/monthly_template/month_names.csv
 *   GOALS_SEED          -> mirrors data/savings_goals/goals_seed.csv
 */

const CURRENCIES = [
  ['DZD', 'الدينار الجزائري',  134.5000, '#,##0.00 "د.ج"'],
  ['SAR', 'الريال السعودي',     3.7500,  '#,##0.00 "ر.س"'],
  ['AED', 'الدرهم الإماراتي',   3.6725,  '#,##0.00 "د.إ"'],
  ['QAR', 'الريال القطري',      3.6400,  '#,##0.00 "ر.ق"'],
  ['KWD', 'الدينار الكويتي',    0.3100,  '#,##0.000 "د.ك"'],
  ['BHD', 'الدينار البحريني',   0.3760,  '#,##0.000 "د.ب"'],
  ['OMR', 'الريال العماني',     0.3845,  '#,##0.000 "ر.ع"'],
  ['EGP', 'الجنيه المصري',     48.0000, '#,##0.00 "ج.م"'],
  ['JOD', 'الدينار الأردني',    0.7090,  '#,##0.00 "د.أ"'],
  ['TND', 'الدينار التونسي',    3.1500,  '#,##0.000 "د.ت"'],
  ['MAD', 'الدرهم المغربي',     9.9500,  '#,##0.00 "د.م"'],
  ['EUR', 'اليورو',             0.9200,  '#,##0.00 €'],
  ['USD', 'الدولار الأمريكي',   1.0000,  '#,##0.00 $'],
  ['GBP', 'الجنيه الإسترليني',  0.7900,  '#,##0.00 £'],
];

const INCOME_CATEGORIES = [
  'راتب أساسي', 'مكافآت وحوافز', 'عمل حر', 'دخل استثماري',
  'إيجارات', 'أرباح تجارية', 'هدايا', 'أخرى',
];

const EXPENSE_CATEGORIES = [
  'الطعام', 'النقل', 'السكن', 'الفواتير', 'الصحة', 'التعليم',
  'التسوق', 'الترفيه', 'الاشتراكات', 'السفر', 'الطوارئ', 'أخرى',
];

const PAYMENT_METHODS = ['نقداً', 'بطاقة بنكية', 'تحويل الكتروني', 'أخرى'];

const MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

const GOALS_SEED = [
  ['شراء سيارة',         80000,   12000, '', new Date('2027-12-31'), '', '', '', ''],
  ['شراء منزل',        1200000,   50000, '', new Date('2030-12-31'), '', '', '', ''],
  ['صندوق الطوارئ',      60000,   15000, '', new Date('2026-12-31'), '', '', '', ''],
  ['السفر والاستثمار',   25000,    5000, '', new Date('2026-08-31'), '', '', '', ''],
];
