import {
  BUYER_GOLDEN_JOURNEY_STEP_DEFINITIONS,
  resolveBuyerGoldenJourneyNav,
  type BuyerGoldenJourneyNavLink,
} from "@/lib/buyer/buyer-golden-journey-nav";
import {
  appendBuyerCtoDemoTourStartQuery,
  BUYER_CTO_DEMO_STEP_BUDGET_MINUTES,
} from "@/lib/buyer/buyer-cto-demo-tour-storage";

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

const BUYER_CTO_DEMO_TOUR_PRESENTER_SUMMARY_LINES: readonly string[] = [
  "Show the board condensed outcomes, posture, and monitored risks — the diligence starting point.",
  "Open the signed package: decisions, findings, and downloadable deliverables.",
  "Trace evidence → findings → decisions in the graph — not a chat transcript.",
  "Walk segregation of duties, approvals, and policy enforcement for this review.",
  "Close with the append-only audit trail and export for GRC follow-up.",
];

const BUYER_CTO_DEMO_TOUR_PRESENTER_SCRIPTS: readonly string[] = [
  "What you are seeing is the sponsor report for the Claims Intake Modernization review. Every number here comes from a structured analysis of the submitted architecture brief, not from a consultant slide deck. The monitored risks at the bottom are explicitly tracked — they are accepted with monitoring, not ignored. If you want proof, I can open any finding and show the evidence that backs it.",
  "This finalized review record is the versioned record of decisions, findings, and downloadable deliverables for this review. Sponsors receive the same artifact your approval team signed off on — nothing is regenerated silently after sign-off. Notice the review record version and export bundle: those are what GRC and architecture boards attach to their decision records.",
  "The evidence trail links inputs through findings to decisions — this is traceability, not a chat transcript. Each node in the graph maps to a persisted artifact in the audit record. That is how we answer “why did the AI recommend this?” without asking you to trust a black box.",
  "Resolve outcomes shows segregation of duties: the requester and approver are different principals. Policy packs enforced during the review are visible here, along with the approval state for this review. This is the control surface enterprise security teams expect before production changes.",
  "The audit trail is append-only — every create, execute, commit, and export event is durable and searchable. You can filter by this review and export for GRC follow-up. This closes the loop: sponsor outcomes, signed package, evidence, approval, and compliance record in one walkthrough.",
];

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
