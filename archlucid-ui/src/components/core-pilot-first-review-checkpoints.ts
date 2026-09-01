import type { EnterpriseStatusKind } from "@/lib/design-tokens";
import type { CorePilotCommitProgressState } from "@/lib/core-pilot-commit-progress";
import { SPONSOR_DASHBOARD_HREF } from "@/lib/sponsor-dashboard-route";

export type FirstReviewCheckpointStatus = "complete" | "active" | "pending";
export type FirstReviewCheckpointId = "intake" | "execute" | "commit" | "export" | "sponsor-ready";

export type FirstReviewCheckpoint = {
  readonly id: FirstReviewCheckpointId;
  readonly label: string;
  readonly href: string;
  readonly status: FirstReviewCheckpointStatus;
};

export const FIRST_REVIEW_CHECKPOINT_ORDER: readonly FirstReviewCheckpointId[] = [
  "intake",
  "execute",
  "commit",
  "export",
  "sponsor-ready",
];

export function buildFirstReviewCheckpointStrip(
  pilotState: CorePilotCommitProgressState,
  latestRunId: string | null,
  firstCommittedRunId: string | null,
  latestRunReadyToFinalize: boolean,
): readonly FirstReviewCheckpoint[] {
  const reviewHref = latestRunId !== null ? `/architecture/reviews/${latestRunId}` : "/architecture/reviews";
  const committedReviewHref =
    firstCommittedRunId !== null ? `/architecture/reviews/${firstCommittedRunId}` : "/architecture/reviews";

  const statusById: Record<FirstReviewCheckpointId, FirstReviewCheckpointStatus> = {
    intake: "pending",
    execute: "pending",
    commit: "pending",
    export: "pending",
    "sponsor-ready": "pending",
  };

  if (pilotState === "no-run") {
    statusById.intake = "active";
  } else if (pilotState === "has-run") {
    statusById.intake = "complete";

    if (latestRunReadyToFinalize) {
      statusById.execute = "complete";
      statusById.commit = "active";
    } else {
      statusById.execute = "active";
    }
  } else {
    statusById.intake = "complete";
    statusById.execute = "complete";
    statusById.commit = "complete";
    statusById.export = "complete";
    statusById["sponsor-ready"] = "active";
  }

  return [
    { id: "intake", label: "Intake", href: "/architecture/reviews/new", status: statusById.intake },
    { id: "execute", label: "Execute", href: reviewHref, status: statusById.execute },
    { id: "commit", label: "Finalize", href: reviewHref, status: statusById.commit },
    { id: "export", label: "Export", href: committedReviewHref, status: statusById.export },
    { id: "sponsor-ready", label: "Export-ready", href: SPONSOR_DASHBOARD_HREF, status: statusById["sponsor-ready"] },
  ] as const;
}

export function checkpointNextAction(
  activeCheckpointId: FirstReviewCheckpointId,
  latestRunId: string | null,
): string {
  switch (activeCheckpointId) {
    case "intake":
      return "Next action: start your first architecture request so execution can begin.";
    case "execute":
      return latestRunId === null
        ? "Next action: open Reviews and run Execute to generate findings."
        : "Next action: open this review and run Execute to generate findings.";
    case "commit":
      return "Next action: open review detail and finalize the architecture review.";
    case "export":
      return "Next action: export sponsor-facing markdown or PDF from review detail.";
    case "sponsor-ready":
      return "Next action: open Report and use the sponsor report for sponsor readout.";
  }
}

export function statusChipLabel(status: FirstReviewCheckpointStatus): string {
  switch (status) {
    case "complete":
      return "Ready";
    case "active":
      return "In progress";
    case "pending":
      return "Needs attention";
  }
}

export function statusChipKind(status: FirstReviewCheckpointStatus): EnterpriseStatusKind {
  if (status === "complete") {
    return "ready";
  }

  if (status === "active") {
    return "in-progress";
  }

  return "neutral";
}
