/**
 * SMARTBUDGET PRO 2026 - Module 09: Onboarding Wizard
 * =============================================================================
 * Phase 5 of the Strategic Refactor Plan.
 *
 * 5-step HTML sidebar that walks a first-time user through:
 *   1. Welcome / value proposition
 *   2. Language selection (ar / en)
 *   3. Main currency selection
 *   4. Demo data choice (yes / no)
 *   5. Final summary + dashboard launch
 *
 * THIS IS THE FIRST HTML SIDEBAR IN THE PROJECT.
 * It establishes the pattern for future SaaS-style UIs (sidebars, dialogs,
 * web apps). Notes on how the bridge works:
 *
 * SERVER <-> CLIENT BRIDGE
 * ------------------------
 *   - Server (Apps Script .gs): exposes functions on the global scope.
 *   - Client (HTML): calls them via google.script.run.<functionName>(args)
 *                    .withSuccessHandler(cb).withFailureHandler(cb)
 *   - All UI strings on both sides flow through t() — server reads
 *     getActiveLang(), client receives the translated bundle on init.
 *
 * STATE PERSISTENCE
 * -----------------
 *   - Onboarding completion flag stored in DocumentProperties under
 *     key 'sb_onboarding_done'. Lets us skip the auto-prompt on
 *     subsequent opens.
 *   - User can always re-run the wizard from the menu.
 *
 * READ-ONLY GUARANTEE
 * -------------------
 * The wizard does NOT touch formulas, validations, or chart configurations.
 * It only:
 *   - Calls setActiveLang(lang) which already exists from Phase 2
 *   - Writes to Settings!B3 via setValue() — same cell the user would
 *     manually edit if no wizard existed (it's an input cell, not a
 *     formula cell)
 *   - Calls fillAllMonthsWithDemoData(true) which is the same
 *     existing demo function from Module 05
 * No new write paths are introduced.
 */

// ============================================================================
// PROPERTY KEYS
// ============================================================================
const ONBOARDING_DONE_KEY = 'sb_onboarding_done';

// ============================================================================
// MENU ENTRY POINT
// ============================================================================

/**
 * Opens the onboarding wizard sidebar. Called from:
 *   - The 💎 SmartBudget custom menu (always available)
 *   - maybePromptOnboarding() on first install (auto-suggested)
 */
function menuOpenOnboarding() {
  const ui = SpreadsheetApp.getUi();
  const props = PropertiesService.getDocumentProperties();
  const done = props.getProperty(ONBOARDING_DONE_KEY) === 'true';

  // If already completed, ask before re-running
  if (done) {
    const r = ui.alert(
      t('onboarding.alreadyDoneTitle'),
      t('onboarding.alreadyDoneBody'),
      ui.ButtonSet.YES_NO
    );
    if (r !== ui.Button.YES) return;
  }

  _showWizardSidebar();
}

/**
 * Auto-prompt on first ever open. Called by onOpen if the wizard has
 * never been completed AND the workbook seems freshly installed.
 *
 * Does NOT auto-open the sidebar — only suggests it via a friendly
 * alert. Apps Script restricts auto-opening sidebars from onOpen
 * triggers anyway, so we must wait for explicit user consent.
 */
function maybePromptOnboarding() {
  try {
    const props = PropertiesService.getDocumentProperties();
    if (props.getProperty(ONBOARDING_DONE_KEY) === 'true') return;

    // Only prompt if workbook looks installed (welcome sheet exists).
    // If install hasn't run, no point in onboarding yet.
    const ss = SpreadsheetApp.getActive();
    if (!ss.getSheetByName(SHEET_NAMES.welcome)) return;

    // Only prompt once per session — store a session marker.
    const userProps = PropertiesService.getUserProperties();
    const sessionKey = 'sb_onboarding_prompted_today';
    const today = new Date().toDateString();
    if (userProps.getProperty(sessionKey) === today) return;
    userProps.setProperty(sessionKey, today);

    const ui = SpreadsheetApp.getUi();
    const r = ui.alert(
      t('menu.onboarding'),
      t('onboarding.firstOpenPrompt'),
      ui.ButtonSet.YES_NO
    );
    if (r === ui.Button.YES) _showWizardSidebar();
  } catch (e) {
    Logger.log(`[Onboarding] maybePrompt skipped: ${e}`);
  }
}

/**
 * Internal: builds and shows the sidebar.
 * Separated so both menuOpenOnboarding and maybePromptOnboarding
 * share the exact same launch path.
 */
function _showWizardSidebar() {
  const html = HtmlService
    .createHtmlOutputFromFile('OnboardingSidebar')
    .setTitle(t('onboarding.sidebarTitle'))
    .setWidth(380);
  SpreadsheetApp.getUi().showSidebar(html);
}

// ============================================================================
// CLIENT <-> SERVER API (called via google.script.run from the HTML)
// ============================================================================

/**
 * Bootstrap the client UI with everything it needs to render in the
 * correct language without making round-trips for every label.
 *
 * Shape:
 *   {
 *     lang:        'ar' | 'en',
 *     direction:   'rtl' | 'ltr',
 *     fontFamily:  'Cairo',
 *     texts:       { all onboarding.* keys, pre-resolved },
 *     currencies:  [{ code, name, format }, ...],
 *     state:       { langChosen, currencyChosen, demoChosen }
 *   }
 */
function getWizardBootstrap() {
  const lang = getActiveLang();
  const isAr = lang === 'ar';

  // Pre-resolve all onboarding strings so client doesn't need to know
  // about the t() machinery.
  const onboardingKeys = TEXTS[lang].onboarding;
  const texts = {};
  Object.keys(onboardingKeys).forEach(k => {
    const v = onboardingKeys[k];
    // Skip function templates — client passes data and calls them via API
    if (typeof v !== 'function') texts[k] = v;
  });

  // Currency list for the picker
  const currencies = CURRENCIES.map(row => ({
    code:   row[0],
    name:   row[1],
    rate:   row[2],
    format: row[3]
  }));

  // Read current settings so wizard can pre-fill
  let currentCurrency = 'USD';
  try {
    const ss = SpreadsheetApp.getActive();
    const settings = ss.getSheetByName(SHEET_NAMES.settings);
    if (settings) {
      const v = settings.getRange('B3').getValue();
      if (v) currentCurrency = String(v);
    }
  } catch (e) {}

  return {
    lang,
    direction: isAr ? 'rtl' : 'ltr',
    fontFamily: 'Cairo',
    totalSteps: 5,
    texts,
    currencies,
    currentLang: lang,
    currentCurrency
  };
}

/**
 * Apply the wizard choices in one server call.
 *
 * @param {Object} choices
 *   { language: 'ar'|'en', currency: 'USD'|'SAR'|..., fillDemo: bool }
 *
 * @return {Object} { ok: bool, error?: string, demoStats?: {...} }
 */
function applyWizardChoices(choices) {
  try {
    Logger.log(`[Onboarding] applyWizardChoices: ${JSON.stringify(choices)}`);
    const ss = SpreadsheetApp.getActive();

    // 1) Language
    if (choices.language && SUPPORTED_LANGS.indexOf(choices.language) >= 0) {
      setActiveLang(choices.language);
    }

    // 2) Currency — write to Settings!B3, the same cell the user would
    //    edit manually. The XLOOKUP in B4/B5 cascades automatically.
    if (choices.currency) {
      const settings = ss.getSheetByName(SHEET_NAMES.settings);
      if (settings) {
        // Validate against the currency table to avoid breaking the dropdown.
        const validCodes = CURRENCY_CODES;
        if (validCodes.indexOf(choices.currency) >= 0) {
          settings.getRange('B3').setValue(choices.currency);
        }
      }
    }

    // 3) Demo data (optional)
    let demoStats = null;
    if (choices.fillDemo === true) {
      demoStats = fillAllMonthsWithDemoData(true); // silent
    }

    // 4) Mark wizard complete
    PropertiesService.getDocumentProperties()
      .setProperty(ONBOARDING_DONE_KEY, 'true');

    SpreadsheetApp.flush();

    return { ok: true, demoStats };
  } catch (e) {
    Logger.log(`[Onboarding] applyWizardChoices failed: ${e}`);
    return { ok: false, error: String(e) };
  }
}

/**
 * Client-callable navigation: jump to the dashboard at end of wizard.
 * Returns true on success. Wrapped here (rather than calling gotoDashboard
 * from client) because google.script.run only invokes server functions
 * by name, and it's nicer to have one purpose-built endpoint.
 */
function wizardFinishOpenDashboard() {
  try {
    const ss = SpreadsheetApp.getActive();
    const dash = ss.getSheetByName(SHEET_NAMES.dashboard);
    if (dash) {
      ss.setActiveSheet(dash);
      return true;
    }
    return false;
  } catch (e) {
    Logger.log(`[Onboarding] open dashboard failed: ${e}`);
    return false;
  }
}

/**
 * Client-callable navigation: stay on the welcome sheet.
 */
function wizardFinishOpenWelcome() {
  try {
    const ss = SpreadsheetApp.getActive();
    const welcome = ss.getSheetByName(SHEET_NAMES.welcome);
    if (welcome) {
      ss.setActiveSheet(welcome);
      return true;
    }
    return false;
  } catch (e) {
    return false;
  }
}

// ============================================================================
// QA / RESET HOOKS
// ============================================================================

/**
 * Resets the onboarding-done flag so the wizard auto-prompts again on
 * the next open. Useful for testing and for users who want to re-run
 * setup without manually opening the menu.
 */
function resetOnboardingFlag() {
  PropertiesService.getDocumentProperties().deleteProperty(ONBOARDING_DONE_KEY);
  PropertiesService.getUserProperties().deleteProperty('sb_onboarding_prompted_today');
  Logger.log('[Onboarding] reset complete');
}
