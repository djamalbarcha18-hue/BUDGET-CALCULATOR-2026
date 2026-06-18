# SmartBudget Pro 2026 — Modular Architecture

Phases 1, 2 & 3 of the Strategic Refactor Plan. Apps Script loads every `.gs`
file in a project into one global scope, so this is a **visual** split with
zero runtime cost.

## Module Map

| File | Purpose | Lines | Functions |
|---|---|---:|---:|
| `00_Config.gs` | Theme palette, seed data, format constants, manifests | 185 | 0 |
| `00_Texts.gs` | **AR + EN dictionary, runtime language switching, `t()`** | 461 | 6 |
| `01_Helpers.gs` | DRY helpers (style, format, formula, reset) | 281 | 14 |
| `02_Sheets.gs` | Settings, Goals, Monthly, FX, Welcome builders | 381 | 5 |
| `03_Dashboard.gs` | Dashboard layout, engine, charts | 390 | 8 |
| `04_System.gs` | Named ranges, validations, protection, tab order | 113 | 3 |
| `05_Demo_QA.gs` | Demo data, monthly analytics, repair, reset | 264 | 11 |
| `06_Core.gs` | Entry points, onOpen menu, navigation, health check | 339 | 11 |
| `07_Manifest.gs` | **Formula integrity manifest + auto-repair** | 342 | 6 |

**Total: 2,756 lines, 61 functions** (vs. monolith: 1,754 lines, 42 functions).

## Loading Order

Apps Script loads files alphabetically. The `00_` / `01_` / ... prefix
guarantees:

1. Config constants exist before any helper references them
2. Helpers exist before any sheet builder calls them
3. Sheet builders exist before the dashboard wires them
4. System wiring exists before the entry point orchestrates everything
5. Entry point + menu live last (they reference everything else)

## DRY Wins

### Phase 1 — Style helpers
| Helper | Replaces | Call sites |
|---|---|---:|
| `wipeSheetSurfaces()` | 4 inline `clearDataValidations` + `getProtections().remove()` blocks | 3 |
| `applyGlassBorder()` | 18 inline `setBorder(true,true,true,true,false,false,...)` calls | 5 |
| `applyCardSurface()` | 14 inline 3-call card-painting sequences | 9 |
| `styleHeader()` | 12 inline header style chains | 17 |
| `styleTintedHeader()` | 5 inline tinted-panel style chains | 1 |
| `applyBandedRows()` | 3 inline banded-row for-loops | 3 |
| `alphaSplit()` | 5 inline regex + destructure | 5 |
| `nuclearReset()` | 3 duplicate copies of full-reset logic | 2 |
| `FORMATS` constant | Hardcoded `'[$-en-US]...'` strings repeated 41 times | 41 |

### Phase 2 — Centralized UI text dictionary
| Helper | Replaces | Call sites |
|---|---|---:|
| `t('section.key')` | ~80 hardcoded Arabic UI strings spread across 4 modules | 76 |
| `TEXTS.<lang>.<section>` | Strings inside alerts, menu items, log messages, hyperlink labels | — |

### i18n readiness
- `ACTIVE_LANG = 'ar'` is the single language switch
- Adding English = define a `TEXTS.en` object with the same shape as `TEXTS.ar`
- No other module needs changes — every UI string flows through `t()` already

## Removed

- `paintCard()` — dead code, fully replaced by `applyCardSurface()`.

## Modernization

- `var` → `const` / `let` everywhere
- ES6 destructuring: `const { colStart, colEnd } = alphaSplit(c.range)`
- Template literals: `` `=IFERROR(SUM(${eng}!B2:B13),0)` ``
- Spread: `const all = [welcome, settings, goals, ...MONTHS, ...]`
- Arrow functions: `MONTHS.forEach(m => ...)` instead of `for (var i = 0; ...)`
- `.filter()` / `.map()` / `.forEach()` instead of for-loops where natural

## Compatibility Guarantee

Every formula, every cell address, every range, every named range, every
conditional formatting rule, every chart configuration, every protection
rule is byte-identical to the monolithic `install_v2.gs`. The Phase 1
refactor is a pure restructuring — zero behavioral change.

## Entry Points

Same as before, all callable from the Apps Script function dropdown OR the
`💎 SmartBudget` custom menu (auto-installed on workbook open):

- `installSmartBudgetPro2026()` — main installer
- `tryFullDemoSmartBudget()` — install + populate demo + add monthly charts
- `menuFreshDemo()` — bulletproof reset → install → populate
- `fillAllMonthsWithDemoData()` / `clearAllDemoData()`
- `addMonthlyVisualAnalytics()` / `removeMonthlyVisualAnalytics()`
- `repairDashboardV2()` — rewrite engine + charts without rebuild
- `resetWorkbookCompletely()` — nuclear reset with UI confirmation
- `runHealthCheck()` — System Health Center diagnostic

## Legacy

`scripts/legacy/` holds the pre-refactor snapshots for git-archeology. Do
not paste them into new projects — they're kept for diff/blame purposes only.
