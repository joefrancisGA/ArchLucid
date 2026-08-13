import {
  BUYER_GOLDEN_JOURNEY_STEP_DEFINITIONS,
  resolveBuyerGoldenJourneyNav,
  type BuyerGoldenJourneyNavLink,
} from "@/lib/buyer/buyer-golden-journey-nav";

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

export type BuyerCtoDemoTourNavigation = {
  readonly stepIndex: number | null;
  readonly stepCount: number;
  readonly summaryLine: string;
  readonly presenterLine: string;
  readonly presenterScript: string;
  readonly prev: BuyerGoldenJourneyNavLink | null;
  readonly next: BuyerGoldenJourneyNavLink | null;
  readonly onSpine: boolean;
};

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

export function readCtoDemoPresenterLayerVisible(): boolean {
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

export function writeCtoDemoPresenterLayerVisible(visible: boolean): void {
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

/** Minutes remaining from the current step through the end of the 30-minute demo script. */
export function buyerCtoDemoRemainingBudgetMinutes(stepIndex: number): number {
  const safeIndex = Math.max(0, Math.min(stepIndex, BUYER_CTO_DEMO_STEP_BUDGET_MINUTES.length - 1));

  return BUYER_CTO_DEMO_STEP_BUDGET_MINUTES.slice(safeIndex).reduce((sum, minutes) => sum + minutes, 0);
}

export type CtoDemoStepTimerState = {
  readonly display: string;
  readonly isOvertime: boolean;
};

/** Formats remaining seconds for the live step countdown (M:SS or +M:SS over). */
export function formatCtoDemoStepTimer(remainingSeconds: number): CtoDemoStepTimerState {
  if (remainingSeconds < 0) {
    const over = Math.abs(remainingSeconds);
    const minutes = Math.floor(over / 60);
    const seconds = over % 60;

    return {
      display: `+${minutes}:${String(seconds).padStart(2, "0")} over`,
      isOvertime: true,
    };
  }

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;

  return {
    display: `${minutes}:${String(seconds).padStart(2, "0")}`,
    isOvertime: false,
  };
}

export function buyerCtoDemoStepBudgetSeconds(stepIndex: number): number {
  const safeIndex = Math.max(0, Math.min(stepIndex, BUYER_CTO_DEMO_STEP_BUDGET_MINUTES.length - 1));
  const minutes = BUYER_CTO_DEMO_STEP_BUDGET_MINUTES[safeIndex] ?? 0;

  return minutes * 60;
}

/** Presenter-facing label for the current step pacing budget (e.g. "Budget: 6 min"). */
export function formatCtoDemoStepBudgetLabel(stepIndex: number): string {
  const safeIndex = Math.max(0, Math.min(stepIndex, BUYER_CTO_DEMO_STEP_BUDGET_MINUTES.length - 1));
  const minutes = BUYER_CTO_DEMO_STEP_BUDGET_MINUTES[safeIndex] ?? 0;

  return `Budget: ${minutes} min`;
}

export function buyerCtoDemoTourPresenterLine(stepIndex: number): string {
  const lines = BUYER_CTO_DEMO_TOUR_PRESENTER_SUMMARY_LINES;
  const safeIndex = Math.max(0, Math.min(stepIndex, lines.length - 1));

  return lines[safeIndex] ?? "";
}

export function buyerCtoDemoTourPresenterScript(stepIndex: number): string {
  const scripts = BUYER_CTO_DEMO_TOUR_PRESENTER_SCRIPTS;
  const safeIndex = Math.max(0, Math.min(stepIndex, scripts.length - 1));

  return scripts[safeIndex] ?? "";
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

const BUYER_CTO_DEMO_TOUR_PRESENTER_SUMMARY_LINES: readonly string[] = [
  "Show the board condensed outcomes, posture, and monitored risks — the diligence starting point.",
  "Open the signed package: decisions, findings, and downloadable deliverables.",
  "Trace evidence → findings → decisions in the graph — not a chat transcript.",
  "Walk segregation of duties, approvals, and policy enforcement for this review.",
  "Close with the append-only audit trail and export for GRC follow-up.",
];

const BUYER_CTO_DEMO_TOUR_PRESENTER_SCRIPTS: readonly string[] = [
  "What you are seeing is the sponsor report for the Claims Intake Modernization review. Every number here comes from a structured analysis of the submitted architecture brief, not from a consultant slide deck. The monitored risks at the bottom are explicitly tracked — they are accepted with monitoring, not ignored. If you want proof, I can open any finding and show the evidence that backs it.",
  "This signed review record is the versioned record of decisions, findings, and downloadable deliverables for this review. Sponsors receive the same artifact your governance team approved — nothing is regenerated silently after sign-off. Notice the review record version and export bundle: those are what GRC and architecture boards attach to their decision records.",
  "The evidence trail links inputs through findings to decisions — this is traceability, not a chat transcript. Each node in the graph maps to a persisted artifact in the audit record. That is how we answer “why did the AI recommend this?” without asking you to trust a black box.",
  "Governance approval shows segregation of duties: the requester and approver are different principals. Policy packs enforced during the review are visible here, along with the approval state for this review. This is the control surface enterprise security teams expect before production changes.",
  "The audit trail is append-only — every create, execute, commit, and export event is durable and searchable. You can filter by this review and export for GRC follow-up. This closes the loop: sponsor outcomes, signed package, evidence, governance, and compliance record in one walkthrough.",
];

export function resolveBuyerCtoDemoTourNavigation(pathname: string): BuyerCtoDemoTourNavigation {
  const defs = BUYER_GOLDEN_JOURNEY_STEP_DEFINITIONS;
  const stepCount = defs.length;
  const journeyNav = resolveBuyerGoldenJourneyNav(pathname);

  if (journeyNav === null) {
    return {
      stepIndex: null,
      stepCount,
      summaryLine: "Off the CTO demo path",
      presenterLine: "Return to the sponsor report to continue the five-step diligence walkthrough.",
      presenterScript: buyerCtoDemoTourPresenterScript(0),
      prev: null,
      next: { label: defs[0].label, href: defs[0].href },
      onSpine: false,
    };
  }

  const stepIndex = journeyNav.currentStepIndex;
  const presenterIndex = stepIndex ?? inferSatellitePresenterIndex(journeyNav);

  return {
    stepIndex,
    stepCount,
    summaryLine: journeyNav.summaryLine,
    presenterLine: buyerCtoDemoTourPresenterLine(presenterIndex),
    presenterScript: buyerCtoDemoTourPresenterScript(presenterIndex),
    prev: journeyNav.prev,
    next: journeyNav.next,
    onSpine: stepIndex !== null,
  };
}

function inferSatellitePresenterIndex(journeyNav: NonNullable<ReturnType<typeof resolveBuyerGoldenJourneyNav>>): number {
  if (journeyNav.next !== null) {
    const nextIdx = BUYER_GOLDEN_JOURNEY_STEP_DEFINITIONS.findIndex((def) => def.href === journeyNav.next?.href);

    if (nextIdx > 0) {
      return nextIdx - 1;
    }

    if (nextIdx === 0) {
      return 0;
    }
  }

  if (journeyNav.prev !== null) {
    const prevIdx = BUYER_GOLDEN_JOURNEY_STEP_DEFINITIONS.findIndex((def) => def.href === journeyNav.prev?.href);

    if (prevIdx >= 0) {
      return prevIdx;
    }
  }

  return 0;
}

export function getStartCtoDemoTourHref(): string {
  return appendBuyerCtoDemoTourStartQuery(BUYER_GOLDEN_JOURNEY_STEP_DEFINITIONS[0].href);
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

/** Printable/downloadable 30-minute CTO demo run-of-show for presenters. */
export function buildCtoDemoRunOfShowMarkdown(): string {
  const lines: string[] = [
    "# ArchLucid CTO Demo — 30-Minute Run of Show",
    "",
    "Use **Start CTO demo** on the home page, confirm **Demo ready**, then follow the five steps below.",
    "",
    "**Keyboard shortcuts:** Press 1–5 to jump between journey steps. Toggle presenter notes in the tour overlay. End tour when finished.",
    "",
  ];

  BUYER_GOLDEN_JOURNEY_STEP_DEFINITIONS.forEach((def, index) => {
    const budget = BUYER_CTO_DEMO_STEP_BUDGET_MINUTES[index] ?? 0;
    const presenterLine = buyerCtoDemoTourPresenterLine(index);

    lines.push(`## Step ${def.step}: ${def.label} (~${budget} min)`);
    lines.push("");
    lines.push(def.chipTooltip);
    lines.push("");
    lines.push(`**Presenter line:** ${presenterLine}`);
    lines.push("");
    lines.push(`**Route:** ${def.href}`);
    lines.push("");
  });

  lines.push("---");
  lines.push("");
  lines.push("*Generated from the buyer golden journey definitions in ArchLucid.*");

  return lines.join("\n");
}
