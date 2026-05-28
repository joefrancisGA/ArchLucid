import type { FirstPilotOperatingRailSignals } from "@/lib/first-pilot-operating-rail-status";

export type FirstPilotCommandCenterPhase =
  | "not-started"
  | "ready-to-create"
  | "ready-to-commit"
  | "ready-to-collect-proof"
  | "hold-before-sponsor-send";

export type FirstPilotSponsorDisposition = "send" | "hold" | "readiness-only";

export type FirstPilotCommandCenterPhaseSummary = {
  phase: FirstPilotCommandCenterPhase;
  headline: string;
  summary: string;
  href: string;
  cta: string;
  sponsorDisposition: FirstPilotSponsorDisposition;
};

function committedReviewHref(signals: FirstPilotOperatingRailSignals): string {
  if (signals.firstCommittedRunId)
    return `/reviews/${encodeURIComponent(signals.firstCommittedRunId)}`;

  if (signals.latestRunId)
    return `/reviews/${encodeURIComponent(signals.latestRunId)}`;

  return "/reviews?projectId=default";
}

/** Maps live cockpit signals to the single next first-pilot phase operators should act on. */
export function resolveFirstPilotCommandCenterPhase(input: {
  signals: FirstPilotOperatingRailSignals;
  baselinesEntered: boolean;
  canExecute: boolean;
  hasBlockingRow: boolean;
}): FirstPilotCommandCenterPhaseSummary {
  const { signals, baselinesEntered, canExecute, hasBlockingRow } = input;

  if (!signals.setupReady || (!signals.evidenceReady && !signals.hasAnyRun && !signals.hasCommittedManifest)) {
    return {
      phase: "not-started",
      headline: "Not started",
      summary: "Confirm platform readiness and attach buyer or sample evidence before creating the first architecture review.",
      href: "/health",
      cta: "Check readiness",
      sponsorDisposition: "readiness-only",
    };
  }

  if (signals.setupReady && signals.evidenceReady && !signals.hasAnyRun) {
    return {
      phase: "ready-to-create",
      headline: "Ready to create review",
      summary: canExecute
        ? "Evidence is in place. Start the first architecture review when you are ready to execute the pipeline."
        : "Evidence is in place, but the current principal cannot create reviews. Ask an operator or admin to continue.",
      href: canExecute ? "/reviews/new" : "/help",
      cta: canExecute ? "New review" : "Review role guidance",
      sponsorDisposition: "readiness-only",
    };
  }

  if (signals.hasAnyRun && !signals.hasCommittedManifest) {
    return {
      phase: "ready-to-commit",
      headline: "Ready to finalize review",
      summary: signals.readyToFinalize
        ? "The review pipeline looks complete. Finalize the architecture snapshot before sponsor export."
        : "Continue the in-flight review until the pipeline is ready to finalize.",
      href: signals.latestRunId ? `/reviews/${encodeURIComponent(signals.latestRunId)}` : "/reviews?projectId=default",
      cta: signals.latestRunId ? "Open latest review" : "Open reviews",
      sponsorDisposition: "readiness-only",
    };
  }

  if (signals.hasCommittedManifest && (!baselinesEntered || hasBlockingRow || !canExecute)) {
    return {
      phase: "hold-before-sponsor-send",
      headline: "Hold before sponsor send",
      summary: !baselinesEntered
        ? "A review package is finalized, but buyer ROI baselines are missing. Capture scorecard baselines before sponsor handoff."
        : hasBlockingRow
          ? "A review package is finalized, but one or more readiness checks still need attention before sponsor handoff."
          : "A review package is finalized, but the current principal cannot complete sponsor handoff steps.",
      href: !baselinesEntered ? "/scorecard" : committedReviewHref(signals),
      cta: !baselinesEntered ? "Open scorecard" : "Review handoff blockers",
      sponsorDisposition: "hold",
    };
  }

  return {
    phase: "ready-to-collect-proof",
    headline: "Ready to collect proof",
    summary:
      "Review package and ROI baselines look ready. Collect the first-pilot proof bundle and follow the sponsor handoff runbook before sending externally.",
    href: committedReviewHref(signals),
    cta: "Open review for export",
    sponsorDisposition: "send",
  };
}
