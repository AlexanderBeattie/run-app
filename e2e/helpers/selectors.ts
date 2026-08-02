/**
 * Selector constants for E2E tests.
 * Based on actual component structure from KLUB codebase.
 */

// ────────────────────────────────────────────────────────────
// LOGIN PAGE
// ────────────────────────────────────────────────────────────

export const LOGIN_SELECTORS = {
  emailInput: 'input[type="email"]',
  passwordInput: 'input[type="password"]',
  submitButton: 'button.submit',
  forgotPasswordLink: 'a[routerLink="/forgot-password"]',
  registerLink: 'a[routerLink="/register"]',
  logo: '.logo',
  errorMessage: '.error',
};

// ────────────────────────────────────────────────────────────
// BOTTOM NAVIGATION
// ────────────────────────────────────────────────────────────

export const NAV_SELECTORS = {
  nav: 'app-bottom-nav nav.bottom-nav',
  homeLink: 'a[routerLink="/home"]',
  mapLink: 'a[routerLink="/map"]',
  clubsLink: 'a[routerLink="/clubs"]',
  profileLink: 'a[routerLink="/profile"]',
  navItem: '.nav-item',
  navItemActive: '.nav-item.active',
};

// ────────────────────────────────────────────────────────────
// PROFILE / RUNNER PAGE
// ────────────────────────────────────────────────────────────

export const PROFILE_SELECTORS = {
  page: '.page',
  heroCard: '.hero-card',
  settingsButton: 'button.settings-btn',
  heroAvatar: '.hero-avatar',
  heroName: '.hero-name',
  roleLabel: '.role',
  heroStats: '.hero-stats',
  // Mode toggle (for organizers)
  modeToggle: '.mode-toggle',
  modeRunnerBtn: '.mode-btn',
  modeOrganiserBtn: '.mode-btn',
  // Tabs
  tabContainer: '.tabs-container',
  tabBtn: '.tab-btn',
  upcomingTab: '.tab-btn',
  pastTab: '.tab-btn',
  // List
  runList: '.list',
  emptyState: '.empty',
  // Error banner
  errorBanner: '.error-banner',
};

// ────────────────────────────────────────────────────────────
// SETTINGS MENU
// ────────────────────────────────────────────────────────────

export const SETTINGS_SELECTORS = {
  overlay: '.overlay',
  sheet: '.sheet',
  sheetTitle: '.sheet-title',
  closeButton: '.close-btn',
  stravaButton: '.strava-btn',
  stravaConnectedBadge: '.connected-badge',
  logoutButton: '.logout-btn',
};

// ────────────────────────────────────────────────────────────
// RUN CARD CAROUSEL (Map View)
// ────────────────────────────────────────────────────────────

export const CAROUSEL_SELECTORS = {
  carouselDock: '.carousel-dock',
  carouselWrapper: '.carousel-wrapper',
  scrollContainer: '.scroll-container',
  miniCard: '.mini-card',
  miniCardActive: '.mini-card.active',
  cardTitle: '.card-title',
  cardMeta: '.card-meta',
  cardBanner: '.card-banner',
};

// ────────────────────────────────────────────────────────────
// MAP VIEW
// ────────────────────────────────────────────────────────────

export const MAP_SELECTORS = {
  mapWrap: '.map-wrap',
  mapElement: '.map-el',
  mapHeader: '.map-header',
  mapTitle: '.map-title',
  runsCount: '.runs-count',
  fab: '.fab', // Create run button (for organizers)
  locateButton: '.locate-btn',
  carouselDock: '.carousel-dock',
};

// ────────────────────────────────────────────────────────────
// CREATE RUN WIZARD
// ────────────────────────────────────────────────────────────

export const WIZARD_SELECTORS = {
  page: '.wizard-page',
  progressBar: '.progress-bar-track',
  progressFill: '.progress-bar-fill',
  stepIndicator: '.step-indicator',
  stepNum: '.step-num',
  stepName: '.step-name',
  stepContent: '.step-content',
  backButton: '.btn-back',
  nextButton: '.btn-next',
  submitButton: '.btn-submit',
  errorBanner: '.error-banner',
};

// Step-specific selectors (based on actual component templates)
export const WIZARD_STEP_LOGISTICS = {
  clubSelect: 'select.field-input',
  titleInput: 'input[placeholder="e.g. Saturday Morning 10K"]',
  startAddressInput: 'input[placeholder="e.g. Central Park South Entrance"]',
  endAddressInput: 'input[placeholder="e.g. Central Park Boathouse"]',
  clubSelectOption: 'select.field-input option',
};

export const WIZARD_STEP_SCHEDULE = {
  dateInput: 'input[type="date"]',
  timeInput: 'input[type="time"]',
  hintBox: '.hint-box',
};

export const WIZARD_STEP_VIBE = {
  vibeCard: '.vibe-card',
  vibeCardSelected: '.vibe-card.selected',
  paceSection: '.step-container',
  runTypeSection: '.step-container',
};

export const WIZARD_STEP_DETAILS = {
  maxAttendeesInput: 'input[type="number"]',
  tagsGrid: '.tags-grid',
  tagPill: '.tag-pill',
  tagPillActive: '.tag-pill.active',
  notesTextarea: 'textarea.field-input',
};

// ────────────────────────────────────────────────────────────
// RUN CARD (Reusable component)
// ────────────────────────────────────────────────────────────

export const RUN_CARD_SELECTORS = {
  card: 'app-run-card',
  joinButton: '.join-btn',
  detailsButton: '.details-btn',
};

// ────────────────────────────────────────────────────────────
// RUN DETAIL DIALOG
// ────────────────────────────────────────────────────────────

export const RUN_DETAIL_SELECTORS = {
  dialog: 'app-run-detail-dialog',
  overlay: '.overlay',
  closeButton: '.close-btn',
  joinButton: '.join-btn',
};
