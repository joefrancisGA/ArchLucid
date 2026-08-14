/**
 * TB-937: block finalize when required agents are incomplete or the run is explicitly partial.
 * TB-965: also block when quality gate rejected (distinct copy from execution failure).
 */

import {
  isQualityRejectedRunStatus,
  resolveQualityRejectedCommitBlockedReason,
} from "@/lib/execution-vs-quality-outcome-copy";

export type AgentExecutionOutcomeWire = {
  readonly agentType?: string | null;
  readonly outcome?: string | null;
};

export type PartialRunCommitBlockPresentation = {
  readonly summary: string;
  readonly technicalDetail: string | null;
};

import { ARCHITECTURE_STRUCTURE_BUYER_LABEL_LOWER } from "@/lib/usability/canonical-product-terms";

const ASSESSMENT_DIMENSION_LABELS: Readonly<Record<string, string>> = {
  Topology: ARCHITECTURE_STRUCTURE_BUYER_LABEL_LOWER,
  Cost: "cost",
  Compliance: "compliance",
  Critic: "quality review",
  Security: "security",
};

function formatAssessmentDimensionLabel(agentType: string): string {
  const trimmed = agentType.trim();

  if (trimmed.length === 0) {
    return "assessment";
  }

  return ASSESSMENT_DIMENSION_LABELS[trimmed] ?? trimmed.toLowerCase();
}

function formatIncompleteAssessmentCoverageSummary(
  incomplete: readonly AgentExecutionOutcomeWire[],
): PartialRunCommitBlockPresentation {
  const dimensions = incomplete.map((row) => formatAssessmentDimensionLabel(row.agentType ?? ""));
  const uniqueDimensions = [...new Set(dimensions.filter((label) => label.length > 0))];
  const dimensionList =
    uniqueDimensions.length === 1
      ? uniqueDimensions[0]
      : uniqueDimensions.length === 2
        ? `${uniqueDimensions[0]} and ${uniqueDimensions[1]}`
        : `${uniqueDimensions.slice(0, -1).join(", ")}, and ${uniqueDimensions[uniqueDimensions.length - 1]}`;

  const technicalDetail = incomplete
    .map((row) => {
      const agent = (row.agentType ?? "agent").trim() || "agent";
      const outcome = (row.outcome ?? "Missing").trim() || "Missing";

      return `${agent} (${outcome})`;
    })
    .join(", ");

  return {
    summary: `Assessment coverage is incomplete for ${dimensionList}. Re-run the review before finalizing.`,
    technicalDetail,
  };
}

export function resolvePartialRunCommitBlockPresentation(args: {
  readonly legacyRunStatus?: string | null;
  readonly agentExecutionOutcomes?: readonly AgentExecutionOutcomeWire[] | null;
  readonly findingCoverageAlreadyBlocking: boolean;
}): PartialRunCommitBlockPresentation | null {
  if (args.findingCoverageAlreadyBlocking) {
    return null;
  }

  const status = (args.legacyRunStatus ?? "").trim();

  if (isQualityRejectedRunStatus(status)) {
    return {
      summary: resolveQualityRejectedCommitBlockedReason(),
      technicalDetail: null,
    };
  }

  if (status === "PartiallyCompleted") {
    return {
      summary:
        "Assessment coverage is incomplete for this architecture review. Re-run the review before finalizing.",
      technicalDetail: null,
    };
  }

  if (status === "FailedPartial") {
    return {
      summary:
        "This review only partially completed — one or more required assessments did not finish. Re-run the review before finalizing.",
      technicalDetail: null,
    };
  }

  if (status === "Failed") {
    return {
      summary:
        "Review assessment failed — check configuration, then re-run the review before finalizing.",
      technicalDetail: null,
    };
  }

  const outcomes = args.agentExecutionOutcomes ?? [];

  if (outcomes.length === 0) {
    return null;
  }

  const incomplete = outcomes.filter((row) => {
    const outcome = (row.outcome ?? "").trim();

    return outcome.length > 0 && outcome !== "Succeeded";
  });

  if (incomplete.length === 0) {
    return null;
  }

  const staleCritic = incomplete.find(
    (row) => (row.agentType ?? "").trim() === "Critic" && (row.outcome ?? "").trim() === "Stale",
  );

  if (staleCritic) {
    return {
      summary: "Critic out of date — re-run required.",
      technicalDetail: formatIncompleteAssessmentCoverageSummary(incomplete).technicalDetail,
    };
  }

  return formatIncompleteAssessmentCoverageSummary(incomplete);
}

export function resolvePartialRunCommitBlockedReason(args: {
  readonly legacyRunStatus?: string | null;
  readonly agentExecutionOutcomes?: readonly AgentExecutionOutcomeWire[] | null;
  readonly findingCoverageAlreadyBlocking: boolean;
}): string | null {
  return resolvePartialRunCommitBlockPresentation(args)?.summary ?? null;
}
