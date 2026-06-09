import {
  BUYER_GOLDEN_JOURNEY_STEP_DEFINITIONS,
  resolveBuyerGoldenJourneyNav,
  type BuyerGoldenJourneyNavLink,
} from "@/lib/buyer-golden-journey-nav";

/** Query flag on the Start CTO demo link — activates the guided tour on landing. */
export const BUYER_CTO_DEMO_TOUR_QUERY_PARAM = "ctoDemoTour";

/** localStorage: tour overlay stays visible until the presenter ends the demo. */
export const BUYER_CTO_DEMO_TOUR_ACTIVE_STORAGE_KEY = "archlucid.buyerCtoDemoTour.active.v1";

/** sessionStorage: collapsed rail vs expanded panel (per browser tab). */
export const BUYER_CTO_DEMO_TOUR_COLLAPSED_STORAGE_KEY = "archlucid.buyerCtoDemoTour.collapsed.v1";

/** `window` CustomEvent — programmatic tour start (tests, future shell actions). */
export const ARCHLUCID_BUYER_CTO_DEMO_TOUR_START_EVENT = "archlucid-buyer-cto-demo-tour-start";

export type BuyerCtoDemoTourNavigation = {
  readonly stepIndex: number | null;
  readonly stepCount: number;
  readonly summaryLine: string;
  readonly presenterLine: string;
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

export function buyerCtoDemoTourPresenterLine(stepIndex: number): string {
  const lines = BUYER_CTO_DEMO_TOUR_PRESENTER_LINES;
  const safeIndex = Math.max(0, Math.min(stepIndex, lines.length - 1));

  return lines[safeIndex] ?? "";
}

const BUYER_CTO_DEMO_TOUR_PRESENTER_LINES: readonly string[] = [
  "Show the board condensed outcomes, posture, and monitored risks — the diligence starting point.",
  "Open the signed package: decisions, findings, and downloadable deliverables.",
  "Trace evidence → findings → decisions in the graph — not a chat transcript.",
  "Walk segregation of duties, approvals, and policy enforcement for this review.",
  "Close with the append-only audit trail and export for GRC follow-up.",
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
      presenterLine: "Return to the executive summary to continue the five-step diligence walkthrough.",
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
