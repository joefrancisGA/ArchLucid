/** Query flag on the Start CTO demo link — activates the guided tour on landing. */
export const BUYER_CTO_DEMO_TOUR_QUERY_PARAM = "ctoDemoTour";

/** localStorage: tour overlay stays visible until the presenter ends the demo. */
export const BUYER_CTO_DEMO_TOUR_ACTIVE_STORAGE_KEY = "archlucid.buyerCtoDemoTour.active.v1";

/** sessionStorage: collapsed rail vs expanded panel (per browser tab). */
export const BUYER_CTO_DEMO_TOUR_COLLAPSED_STORAGE_KEY = "archlucid.buyerCtoDemoTour.collapsed.v1";

/** sessionStorage: presenter notes visible in the tour overlay (#19). */
export const BUYER_CTO_DEMO_TOUR_NOTES_VISIBLE_STORAGE_KEY = "archlucid.buyerCtoDemoTour.notesVisible.v1";

/** sessionStorage: full script vs one-line summary in presenter notes. */
export const BUYER_CTO_DEMO_TOUR_NOTES_FULL_SCRIPT_STORAGE_KEY = "archlucid.buyerCtoDemoTour.notesFullScript.v1";

/** sessionStorage: golden-journey step indices the presenter has actually visited. */
export const BUYER_CTO_DEMO_TOUR_VISITED_STEPS_STORAGE_KEY = "archlucid.buyerCtoDemoTour.visitedSteps.v1";

/** localStorage: auto-play advances steps on the 6/4/6/5/5 budget. */
export const BUYER_CTO_DEMO_TOUR_AUTOPLAY_STORAGE_KEY = "archlucid.buyerCtoDemoTour.autoplay.v1";

/** sessionStorage: spotlight dims the page for presenter focus. */
export const BUYER_CTO_DEMO_SPOTLIGHT_STORAGE_KEY = "archlucid.buyerCtoDemoTour.spotlight.v1";

/** sessionStorage: selected vertical story id for presenter narrative. */
export const BUYER_CTO_DEMO_STORY_STORAGE_KEY = "archlucid.buyerCtoDemoTour.storyId.v1";

/** sessionStorage: overlay hidden so the CTO can drive ("hand the keyboard"). */
export const BUYER_CTO_DEMO_EXPLORE_MODE_STORAGE_KEY = "archlucid.buyerCtoDemoTour.exploreMode.v1";

/** sessionStorage: presenter-only layer visible in the tour overlay (default off = audience-safe). */
export const BUYER_CTO_DEMO_PRESENTER_LAYER_STORAGE_KEY = "archlucid.buyerCtoDemoTour.presenterLayer.v1";

/** sessionStorage: agenda + readiness preflight acknowledged for the current tab session. */
export const BUYER_CTO_DEMO_PREFLIGHT_ACKNOWLEDGED_STORAGE_KEY = "archlucid.buyerCtoDemoTour.preflightAck.v1";

/** `window` CustomEvent — spotlight mode toggled (tests, spotlight overlay). */
export const ARCHLUCID_CTO_DEMO_SPOTLIGHT_CHANGED_EVENT = "archlucid-cto-demo-spotlight-changed";

/** `window` CustomEvent — vertical story selection changed. */
export const ARCHLUCID_CTO_DEMO_STORY_CHANGED_EVENT = "archlucid-cto-demo-story-changed";

/** Per-step pacing budget in minutes for a 30-minute CTO demo (sums to 26; 4 min buffer for open/close). */
export const BUYER_CTO_DEMO_STEP_BUDGET_MINUTES: readonly number[] = [6, 4, 6, 5, 5];

/** `window` CustomEvent — programmatic tour start (tests, future shell actions). */
export const ARCHLUCID_BUYER_CTO_DEMO_TOUR_START_EVENT = "archlucid-buyer-cto-demo-tour-start";

export function appendBuyerCtoDemoTourStartQuery(href: string): string {
  const trimmed = href.trim();

  if (trimmed.length === 0) {
    return `?${BUYER_CTO_DEMO_TOUR_QUERY_PARAM}=1`;
  }

  const separator = trimmed.includes("?") ? "&" : "?";

  return `${trimmed}${separator}${BUYER_CTO_DEMO_TOUR_QUERY_PARAM}=1`;
}
