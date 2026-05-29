import type { FirstPilotOperatingRailSignals } from "@/lib/first-pilot-operating-rail-status";



export type FirstPilotCommandCenterPhase =

  | "platform-ready"

  | "evidence-needed"

  | "review-in-progress"

  | "ready-to-commit"

  | "sponsor-packet-send"

  | "sponsor-packet-hold"

  | "deferred-buyer-requirement";



export type FirstPilotSponsorDisposition = "send" | "hold" | "readiness-only" | "deferred";

/** Maps command-center phases to operator-path doc sections for runbook alignment. */
export const FIRST_PILOT_COMMAND_CENTER_OPERATOR_PATH_PHASE: Readonly<
  Record<FirstPilotCommandCenterPhase, string>
> = {
  "platform-ready": "Phase A — Platform ready",
  "evidence-needed": "Phase B — Evidence ingest",
  "review-in-progress": "Phase C — Review lifecycle",
  "ready-to-commit": "Phase C — Review lifecycle",
  "sponsor-packet-send": "Phase D — Review package and sponsor export",
  "sponsor-packet-hold": "Phase D — Review package and sponsor export",
  "deferred-buyer-requirement": "Phase D — Review package and sponsor export",
};

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

  deferredBuyerRequirements?: readonly string[];

}): FirstPilotCommandCenterPhaseSummary {

  const { signals, baselinesEntered, canExecute, hasBlockingRow } = input;

  const deferredBuyerRequirements = input.deferredBuyerRequirements ?? [];



  if (!signals.setupReady || signals.setupUnhealthy) {

    return {

      phase: "platform-ready",

      headline: "Platform setup needed",

      summary:

        "Confirm SQL, auth, and API readiness before ingesting evidence or creating the first architecture review.",

      href: "/health",

      cta: "Check readiness",

      sponsorDisposition: "readiness-only",

    };

  }



  if (!signals.evidenceReady && !signals.hasAnyRun && !signals.hasCommittedManifest) {

    return {

      phase: "evidence-needed",

      headline: "Evidence needed",

      summary:

        "Upload an Azure extractor ZIP or acknowledge the sample package before starting the first architecture review.",

      href: "/settings/extract-upload",

      cta: "Extract and upload",

      sponsorDisposition: "readiness-only",

    };

  }



  if (signals.setupReady && signals.evidenceReady && !signals.hasAnyRun) {

    return {

      phase: "platform-ready",

      headline: "Platform ready",

      summary: canExecute

        ? "Platform and evidence look ready. Start the first architecture review when you are ready to execute the pipeline."

        : "Platform and evidence look ready, but the current principal cannot create reviews. Ask an operator or admin to continue.",

      href: canExecute ? "/reviews/new" : "/help",

      cta: canExecute ? "New review" : "Review permissions",

      sponsorDisposition: "readiness-only",

    };

  }



  if (signals.hasAnyRun && !signals.hasCommittedManifest && !signals.readyToFinalize) {

    return {

      phase: "review-in-progress",

      headline: "Review in progress",

      summary:

        "Continue the in-flight architecture review until the pipeline is ready to finalize. Use review detail for timeline and findings.",

      href: signals.latestRunId ? `/reviews/${encodeURIComponent(signals.latestRunId)}` : "/reviews?projectId=default",

      cta: signals.latestRunId ? "Open latest review" : "Open reviews",

      sponsorDisposition: "readiness-only",

    };

  }



  if (signals.hasAnyRun && !signals.hasCommittedManifest) {

    return {

      phase: "ready-to-commit",

      headline: "Ready to finalize review",

      summary:

        "The review pipeline looks complete. Finalize the architecture snapshot before sponsor export or proof collection.",

      href: signals.latestRunId ? `/reviews/${encodeURIComponent(signals.latestRunId)}` : "/reviews?projectId=default",

      cta: signals.latestRunId ? "Open latest review" : "Open reviews",

      sponsorDisposition: "readiness-only",

    };

  }



  if (signals.hasCommittedManifest && (!baselinesEntered || hasBlockingRow || !canExecute)) {

    return {

      phase: "sponsor-packet-hold",

      headline: "Sponsor handoff — review needed",

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



  if (signals.hasCommittedManifest && deferredBuyerRequirements.length > 0) {

    return {

      phase: "deferred-buyer-requirement",

      headline: "Deferred buyer requirement",

      summary:

        "V1 proof looks ready, but recorded buyer requirements (for example SOC 2 CPA or V1.1 connectors) remain explicitly deferred. Use DEFERRED_SCOPE disposition in the proof pipeline — do not present them as first-pilot blockers.",

      href: committedReviewHref(signals),

      cta: "Open review for export",

      sponsorDisposition: "deferred",

    };

  }



  return {

    phase: "sponsor-packet-send",

    headline: "Sponsor packet SEND",

    summary:

      "Review package and ROI baselines look ready. Collect the first-pilot proof bundle and follow the sponsor handoff runbook before sending externally.",

    href: committedReviewHref(signals),

    cta: "Open review for export",

    sponsorDisposition: "send",

  };

}

