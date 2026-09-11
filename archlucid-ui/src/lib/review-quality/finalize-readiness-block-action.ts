import { buildArchitectureActivityFinalizeReadinessHref } from "@/lib/architecture/architecture-created-finalize-readiness-href";
import { buildReviewFindingsTabHref } from "@/lib/findings/review-findings-job-view-url";
import type { FindingJobView } from "@/lib/findings/finding-job-view";
import { REVIEW_DETAIL_TAB_PARAM } from "@/lib/review-detail-workspace-tabs";
import type { FinalizeReadinessBlock } from "@/types/finalize-readiness";

export type FinalizeReadinessBlockAction = {
  readonly href: string;
  readonly label: string;
};

export function resolveFinalizeReadinessBlockAction(
  runId: string,
  block: FinalizeReadinessBlock,
): FinalizeReadinessBlockAction | null {
  const trimmedRunId = runId.trim();

  if (trimmedRunId.length === 0) {
    return null;
  }

  switch (block.code) {
    case "skipped_must_questions":
      return {
        href: buildArchitectureActivityFinalizeReadinessHref(trimmedRunId),
        label: "Complete required intake questions",
      };
    case "transparency_trail_incomplete":
      return {
        href: buildArchitectureActivityFinalizeReadinessHref(trimmedRunId),
        label: "Review intake provenance",
      };
    case "degraded_finding_coverage":
      return {
        href: buildReviewActivityHref(trimmedRunId),
        label: "Review finding engine coverage",
      };
    case "scorecard":
      return resolveScorecardBlockAction(trimmedRunId, block.message);
    case "pre_commit_gate":
      return {
        href: buildArchitectureActivityFinalizeReadinessHref(trimmedRunId),
        label: "Review pre-commit gate",
      };
    case "agent_output_quality":
      return {
        href: buildReviewActivityHref(trimmedRunId),
        label: "Review agent output quality",
      };
    case "unsupported_semantic_support":
      return {
        href: buildReviewFindingsTabHref(trimmedRunId),
        label: "Review semantic support gaps",
      };
    case "structural_execution_mode":
      return {
        href: buildReviewActivityHref(trimmedRunId),
        label: "Review execution mode",
      };
    case "decision_grade_provenance":
      return {
        href: buildReviewFindingsTabHref(trimmedRunId),
        label: "Review finding provenance",
      };
    case "existential_assumption":
      return {
        href: buildArchitectureActivityFinalizeReadinessHref(trimmedRunId),
        label: "Acknowledge assumptions",
      };
    case "lifecycle_phase_incomplete":
      return {
        href: buildReviewActivityHref(trimmedRunId),
        label: "Complete the review pipeline",
      };
    default:
      return null;
  }
}

function buildReviewActivityHref(runId: string): string {
  const params = new URLSearchParams({ [REVIEW_DETAIL_TAB_PARAM]: "activity" });

  return `/architecture/reviews/${encodeURIComponent(runId)}?${params.toString()}`;
}

function resolveScorecardBlockAction(
  runId: string,
  message: string,
): FinalizeReadinessBlockAction {
  const normalizedMessage = message.toLowerCase();

  if (normalizedMessage.includes("deferred")) {
    return {
      href: buildReviewFindingsTabHref(runId, "deferred"),
      label: "Resolve deferred findings",
    };
  }

  if (normalizedMessage.includes("contradiction")) {
    return {
      href: buildReviewFindingsTabHref(runId, "resolve-contradictions"),
      label: "Resolve contradictions",
    };
  }

  if (normalizedMessage.includes("open question") || normalizedMessage.includes("cannot determine")) {
    return {
      href: buildReviewFindingsTabHref(runId, "answer-these-questions"),
      label: "Answer open questions",
    };
  }

  if (normalizedMessage.includes("hypothesis")) {
    return {
      href: buildReviewFindingsTabHref(runId, "verify-hypotheses"),
      label: "Verify hypotheses",
    };
  }

  if (normalizedMessage.includes("mandatory requirement") || normalizedMessage.includes("design decision")) {
    return {
      href: buildReviewFindingsTabHref(runId, "coverage-gaps"),
      label: "Close coverage gaps",
    };
  }

  if (normalizedMessage.includes("unverified assumptions")) {
    return {
      href: buildArchitectureActivityFinalizeReadinessHref(runId),
      label: "Acknowledge assumptions",
    };
  }

  const jobView = resolveScorecardJobView(normalizedMessage);

  if (jobView !== null) {
    return {
      href: buildReviewFindingsTabHref(runId, jobView),
      label: "Review blocking findings",
    };
  }

  return {
    href: buildReviewFindingsTabHref(runId),
    label: "Review findings",
  };
}

function resolveScorecardJobView(normalizedMessage: string): FindingJobView | null {
  if (normalizedMessage.includes("unresolved blocking") || normalizedMessage.includes("accepted-risk")) {
    return "needs-my-decision";
  }

  return null;
}
