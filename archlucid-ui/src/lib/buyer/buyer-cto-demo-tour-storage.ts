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

export function readBuyerCtoDemoTourActive(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.localStorage.getItem(BUYER_CTO_DEMO_TOUR_ACTIVE_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeBuyerCtoDemoTourActive(active: boolean): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    if (active) {
      window.localStorage.setItem(BUYER_CTO_DEMO_TOUR_ACTIVE_STORAGE_KEY, "1");
    } else {
      window.localStorage.removeItem(BUYER_CTO_DEMO_TOUR_ACTIVE_STORAGE_KEY);
    }
  } catch {
    /* private mode */
  }
}

export function readBuyerCtoDemoTourCollapsed(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.sessionStorage.getItem(BUYER_CTO_DEMO_TOUR_COLLAPSED_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeBuyerCtoDemoTourCollapsed(collapsed: boolean): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    if (collapsed) {
      window.sessionStorage.setItem(BUYER_CTO_DEMO_TOUR_COLLAPSED_STORAGE_KEY, "1");
    } else {
      window.sessionStorage.removeItem(BUYER_CTO_DEMO_TOUR_COLLAPSED_STORAGE_KEY);
    }
  } catch {
    /* private mode */
  }
}

export function readBuyerCtoDemoPresenterNotesVisible(): boolean {
  if (typeof window === "undefined") {
    return true;
  }

  try {
    const raw = window.sessionStorage.getItem(BUYER_CTO_DEMO_TOUR_NOTES_VISIBLE_STORAGE_KEY);

    if (raw === "0") {
      return false;
    }

    return true;
  } catch {
    return true;
  }
}

export function writeBuyerCtoDemoPresenterNotesVisible(visible: boolean): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    if (visible) {
      window.sessionStorage.removeItem(BUYER_CTO_DEMO_TOUR_NOTES_VISIBLE_STORAGE_KEY);
    } else {
      window.sessionStorage.setItem(BUYER_CTO_DEMO_TOUR_NOTES_VISIBLE_STORAGE_KEY, "0");
    }
  } catch {
    /* private mode */
  }
}

export function readBuyerCtoDemoVisitedSteps(): ReadonlySet<number> {
  if (typeof window === "undefined") {
    return new Set<number>();
  }

  try {
    const raw = window.sessionStorage.getItem(BUYER_CTO_DEMO_TOUR_VISITED_STEPS_STORAGE_KEY);

    if (raw === null || raw.trim().length === 0) {
      return new Set<number>();
    }

    const parsed: unknown = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return new Set<number>();
    }

    const indices = parsed.filter((value): value is number => typeof value === "number" && Number.isInteger(value));

    return new Set<number>(indices);
  } catch {
    return new Set<number>();
  }
}

export function writeBuyerCtoDemoVisitedStep(stepIndex: number): void {
  if (typeof window === "undefined") {
    return;
  }

  if (!Number.isInteger(stepIndex) || stepIndex < 0) {
    return;
  }

  try {
    const visited = readBuyerCtoDemoVisitedSteps();
    const next = new Set<number>(visited);
    next.add(stepIndex);
    window.sessionStorage.setItem(
      BUYER_CTO_DEMO_TOUR_VISITED_STEPS_STORAGE_KEY,
      JSON.stringify([...next].sort((a, b) => a - b)),
    );
  } catch {
    /* private mode */
  }
}

export function clearBuyerCtoDemoVisitedSteps(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.removeItem(BUYER_CTO_DEMO_TOUR_VISITED_STEPS_STORAGE_KEY);
  } catch {
    /* private mode */
  }
}

export function readBuyerCtoDemoAutoplay(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.localStorage.getItem(BUYER_CTO_DEMO_TOUR_AUTOPLAY_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeBuyerCtoDemoAutoplay(on: boolean): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    if (on) {
      window.localStorage.setItem(BUYER_CTO_DEMO_TOUR_AUTOPLAY_STORAGE_KEY, "1");
    } else {
      window.localStorage.removeItem(BUYER_CTO_DEMO_TOUR_AUTOPLAY_STORAGE_KEY);
    }
  } catch {
    /* private mode */
  }
}

export function readBuyerCtoDemoSpotlight(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.sessionStorage.getItem(BUYER_CTO_DEMO_SPOTLIGHT_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeBuyerCtoDemoSpotlight(on: boolean): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    if (on) {
      window.sessionStorage.setItem(BUYER_CTO_DEMO_SPOTLIGHT_STORAGE_KEY, "1");
    } else {
      window.sessionStorage.removeItem(BUYER_CTO_DEMO_SPOTLIGHT_STORAGE_KEY);
    }
  } catch {
    /* private mode */
  }
}

export function readBuyerCtoDemoStoryId(): string {
  if (typeof window === "undefined") {
    return "healthcare";
  }

  try {
    const raw = window.sessionStorage.getItem(BUYER_CTO_DEMO_STORY_STORAGE_KEY);

    if (raw === null || raw.trim().length === 0) {
      return "healthcare";
    }

    return raw.trim();
  } catch {
    return "healthcare";
  }
}

export function writeBuyerCtoDemoStoryId(id: string): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(BUYER_CTO_DEMO_STORY_STORAGE_KEY, id.trim());
  } catch {
    /* private mode */
  }
}

export function readBuyerCtoDemoExploreMode(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.sessionStorage.getItem(BUYER_CTO_DEMO_EXPLORE_MODE_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeBuyerCtoDemoExploreMode(on: boolean): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    if (on) {
      window.sessionStorage.setItem(BUYER_CTO_DEMO_EXPLORE_MODE_STORAGE_KEY, "1");
    } else {
      window.sessionStorage.removeItem(BUYER_CTO_DEMO_EXPLORE_MODE_STORAGE_KEY);
    }
  } catch {
    /* private mode */
  }
}

export function readBuyerCtoDemoPresenterLayerVisible(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.sessionStorage.getItem(BUYER_CTO_DEMO_PRESENTER_LAYER_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function readBuyerCtoDemoPreflightAcknowledged(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.sessionStorage.getItem(BUYER_CTO_DEMO_PREFLIGHT_ACKNOWLEDGED_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeBuyerCtoDemoPreflightAcknowledged(acknowledged: boolean): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    if (acknowledged) {
      window.sessionStorage.setItem(BUYER_CTO_DEMO_PREFLIGHT_ACKNOWLEDGED_STORAGE_KEY, "1");
    } else {
      window.sessionStorage.removeItem(BUYER_CTO_DEMO_PREFLIGHT_ACKNOWLEDGED_STORAGE_KEY);
    }
  } catch {
    /* private mode */
  }
}

export function writeBuyerCtoDemoPresenterLayerVisible(visible: boolean): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    if (visible) {
      window.sessionStorage.setItem(BUYER_CTO_DEMO_PRESENTER_LAYER_STORAGE_KEY, "1");
    } else {
      window.sessionStorage.removeItem(BUYER_CTO_DEMO_PRESENTER_LAYER_STORAGE_KEY);
    }
  } catch {
    /* private mode */
  }
}

export function readBuyerCtoDemoPresenterNotesFullScript(): boolean {
  if (typeof window === "undefined") {
    return true;
  }

  try {
    const raw = window.sessionStorage.getItem(BUYER_CTO_DEMO_TOUR_NOTES_FULL_SCRIPT_STORAGE_KEY);

    if (raw === "0") {
      return false;
    }

    return true;
  } catch {
    return true;
  }
}

export function writeBuyerCtoDemoPresenterNotesFullScript(fullScript: boolean): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    if (fullScript) {
      window.sessionStorage.removeItem(BUYER_CTO_DEMO_TOUR_NOTES_FULL_SCRIPT_STORAGE_KEY);
    } else {
      window.sessionStorage.setItem(BUYER_CTO_DEMO_TOUR_NOTES_FULL_SCRIPT_STORAGE_KEY, "0");
    }
  } catch {
    /* private mode */
  }
}

/**
 * Hard-resets all CTO demo tour state: localStorage active flag, autoplay, and all sessionStorage
 * tour keys (collapsed, visited steps, notes prefs, spotlight, story selection).
 * Use before starting a fresh audience or after a botched demo attempt.
 */
export function clearBuyerCtoDemoState(): void {
  if (typeof window === "undefined") {
    return;
  }

  const localKeys = [
    BUYER_CTO_DEMO_TOUR_ACTIVE_STORAGE_KEY,
    BUYER_CTO_DEMO_TOUR_AUTOPLAY_STORAGE_KEY,
  ];

  const sessionKeys = [
    BUYER_CTO_DEMO_TOUR_COLLAPSED_STORAGE_KEY,
    BUYER_CTO_DEMO_TOUR_NOTES_VISIBLE_STORAGE_KEY,
    BUYER_CTO_DEMO_TOUR_NOTES_FULL_SCRIPT_STORAGE_KEY,
    BUYER_CTO_DEMO_TOUR_VISITED_STEPS_STORAGE_KEY,
    BUYER_CTO_DEMO_SPOTLIGHT_STORAGE_KEY,
    BUYER_CTO_DEMO_STORY_STORAGE_KEY,
    BUYER_CTO_DEMO_EXPLORE_MODE_STORAGE_KEY,
    BUYER_CTO_DEMO_PRESENTER_LAYER_STORAGE_KEY,
    BUYER_CTO_DEMO_PREFLIGHT_ACKNOWLEDGED_STORAGE_KEY,
  ];

  try {
    for (const key of localKeys) {
      window.localStorage.removeItem(key);
    }

    for (const key of sessionKeys) {
      window.sessionStorage.removeItem(key);
    }
  } catch {
    /* private mode — best effort */
  }
}
