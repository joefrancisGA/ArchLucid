/**
 * Canonical four-step first-hour operator path — keep in sync with docs/library/FIRST_HOUR_OPERATOR_PATH.md
 * and in-page journey chrome (`OperatorFirstHourJourneyStrip`, route-adjacent next/prev).
 */
export const OPERATOR_FIRST_HOUR_JOURNEY_STEP_DEFINITIONS = [
  {
    step: 1,
    label: "New architecture request",
    href: "/reviews/new",
    nextAction: "Submit a new architecture review request.",
    chipTooltip: "Start one architecture review — the only required action in the first 15 minutes.",
  },
  {
    step: 2,
    label: "Open active review",
    href: "/reviews",
    nextAction: "Read the findings and address any issues before finalizing.",
    chipTooltip: "Open your in-progress review, read findings, and refine before finalizing.",
  },
  {
    step: 3,
    label: "Finalize review package",
    href: "/reviews",
    nextAction: "Finalize the signed review record when findings look right.",
    chipTooltip: "Finalization produces the versioned signed package sponsors expect.",
  },
  {
    step: 4,
    label: "Review artifacts",
    href: "/signed-records",
    nextAction: "Inspect signed outputs before sponsor handoff.",
    chipTooltip: "Download or preview the review package artifacts for sponsor readout or diligence.",
  },
] as const;

export type OperatorFirstHourJourneyNavLink = {
  readonly label: string;
  readonly href: string;
};

export type ResolvedOperatorFirstHourJourneyNav = {
  readonly summaryLine: string;
  readonly nextAction: string;
  readonly prev: OperatorFirstHourJourneyNavLink | null;
  readonly next: OperatorFirstHourJourneyNavLink | null;
  readonly currentStepIndex: number | null;
};

function normalizedPath(pathname: string): string {
  return (pathname.split("?")[0] ?? "").trim().replace(/\/$/, "") || "/";
}

/**
 * Resolves adjacent first-hour journey links for operator-shell surfaces.
 */
export function resolveOperatorFirstHourJourneyNav(pathname: string): ResolvedOperatorFirstHourJourneyNav | null {
  const path = normalizedPath(pathname);
  const defs = OPERATOR_FIRST_HOUR_JOURNEY_STEP_DEFINITIONS;

  let stepIdx: number | null = null;

  if (path === "/reviews/new" || path.startsWith("/reviews/new/")) {
    stepIdx = 0;
  } else if (path === "/reviews" || /^\/reviews\/[^/]+$/.test(path)) {
    const workspace = /^\/reviews\/([^/]+)$/.exec(path);

    if (workspace !== null) {
      stepIdx = 1;
    } else {
      stepIdx = 1;
    }
  } else if (path.startsWith("/signed-records")) {
    stepIdx = 3;
  } else if (path === "/" || path.startsWith("/help")) {
    return {
      summaryLine: "First-hour path — Pilot first, Operate later",
      nextAction: defs[0].nextAction,
      prev: null,
      next: { label: defs[0].label, href: defs[0].href },
      currentStepIndex: null,
    };
  } else {
    return null;
  }

  const current = defs[stepIdx];

  return {
    summaryLine: `Step ${current.step} of ${defs.length} · ${current.label}`,
    nextAction: current.nextAction,
    prev: stepIdx > 0 ? { label: defs[stepIdx - 1].label, href: defs[stepIdx - 1].href } : null,
    next: stepIdx < defs.length - 1 ? { label: defs[stepIdx + 1].label, href: defs[stepIdx + 1].href } : null,
    currentStepIndex: stepIdx,
  };
}
