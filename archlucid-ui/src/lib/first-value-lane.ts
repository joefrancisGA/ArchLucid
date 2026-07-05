import type { CorePilotCommitContext } from "@/lib/core-pilot-commit-context";

import { BUYER_START_ARCHITECTURE_REVIEW_CTA, CREATE_REVIEW_PACKAGE_HEADING } from "@/lib/buyer-polish-copy";

/** Canonical first-value lane phase identifiers — keep aligned with docs/runbooks/FIRST_VALUE_LANE.md. */
export type FirstValueLanePhaseId =
  | "create-review"
  | "execute-review"
  | "commit-package"
  | "retrieve-sponsor-artifact";

/** Operator-facing lane status markers (assessment improvement #2). */
export type FirstValueLanePhaseStatus = "not_started" | "in_progress" | "completed" | "blocked";

export type FirstValueLanePhase = {
  readonly id: FirstValueLanePhaseId;
  readonly title: string;
  readonly summary: string;
  readonly primaryHref: string;
  readonly primaryLabel: string;
  readonly advancedNote?: string;
};

export const FIRST_VALUE_LANE_HEADING = "First-value lane";

export const FIRST_VALUE_LANE_PHASES: readonly FirstValueLanePhase[] = [
  {
    id: "create-review",
    title: CREATE_REVIEW_PACKAGE_HEADING,
    summary: "Start an architecture review request with evidence and constraints.",
    primaryHref: "/reviews/new",
    primaryLabel: BUYER_START_ARCHITECTURE_REVIEW_CTA,
  },
  {
    id: "execute-review",
    title: "Execute review",
    summary: "Execute the review and track coordinator progress until results are ready.",
    primaryHref: "/reviews?projectId=default",
    primaryLabel: "Open reviews",
    advancedNote: "Compare, replay, and graph views are optional — out of lane until after first commit.",
  },
  {
    id: "commit-package",
    title: "Commit package",
    summary: "Finalize on review detail to lock the signed review record and unlock exports.",
    primaryHref: "/reviews?projectId=default",
    primaryLabel: "Open review detail",
  },
  {
    id: "retrieve-sponsor-artifact",
    title: "Retrieve sponsor artifact",
    summary: "Download or share the first-value report / proof packet from the committed review.",
    primaryHref: "/scorecard",
    primaryLabel: "Open scorecard",
    advancedNote: "Executive ROI and procurement surfaces stay optional for the first proof.",
  },
] as const;

export type FirstValueLaneSignals = {
  readonly hasAnyRun: boolean;
  readonly hasUncommittedRun: boolean;
  readonly commitContext: CorePilotCommitContext;
  readonly healthBlocked: boolean;
};

export type FirstValueLanePhaseView = FirstValueLanePhase & {
  readonly status: FirstValueLanePhaseStatus;
  readonly statusLabel: string;
};

const STATUS_LABELS: Record<FirstValueLanePhaseStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  completed: "Completed",
  blocked: "Blocked",
};

export function mapFirstValueLaneStatusLabel(status: FirstValueLanePhaseStatus): string {
  return STATUS_LABELS[status];
}

/** Pure resolver — unit-testable without React. */
export function resolveFirstValueLanePhases(signals: FirstValueLaneSignals): FirstValueLanePhaseView[] {
  const { hasAnyRun, hasUncommittedRun, commitContext, healthBlocked } = signals;
  const hasCommitted = commitContext.hasCommittedManifest;
  const sponsorRunId = commitContext.firstCommittedRunId;

  return FIRST_VALUE_LANE_PHASES.map((phase) => {
    let status: FirstValueLanePhaseStatus = "not_started";

    switch (phase.id) {
      case "create-review":
        if (healthBlocked) {
          status = "blocked";
        } else if (hasAnyRun) {
          status = "completed";
        } else {
          status = "in_progress";
        }

        break;

      case "execute-review":
        if (healthBlocked) {
          status = "blocked";
        } else if (!hasAnyRun) {
          status = "not_started";
        } else if (hasCommitted) {
          status = "completed";
        } else {
          status = "in_progress";
        }

        break;

      case "commit-package":
        if (healthBlocked) {
          status = "blocked";
        } else if (hasCommitted) {
          status = "completed";
        } else if (hasUncommittedRun || hasAnyRun) {
          status = "in_progress";
        } else {
          status = "not_started";
        }

        break;

      case "retrieve-sponsor-artifact":
        if (healthBlocked) {
          status = "blocked";
        } else if (sponsorRunId !== null) {
          status = "completed";
        } else if (hasCommitted) {
          status = "in_progress";
        } else {
          status = "not_started";
        }

        break;

      default: {
        const _exhaustive: never = phase.id;
        void _exhaustive;

        return { ...phase, status: "not_started", statusLabel: STATUS_LABELS.not_started };
      }
    }

    return {
      ...phase,
      status,
      statusLabel: STATUS_LABELS[status],
      primaryHref:
        phase.id === "retrieve-sponsor-artifact" && sponsorRunId !== null
          ? `/reviews/${encodeURIComponent(sponsorRunId)}`
          : phase.primaryHref,
      primaryLabel:
        phase.id === "retrieve-sponsor-artifact" && sponsorRunId !== null
          ? "Open sponsor exports"
          : phase.primaryLabel,
    };
  });
}

export function isFirstValueLaneComplete(phases: readonly FirstValueLanePhaseView[]): boolean {
  return phases.every((phase) => phase.status === "completed");
}
