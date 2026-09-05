import { resolveRunFindingCountDisplay } from "@/lib/operator/operator-home-run-list-insight";
import { formatOperatorHomeApprovalCheckWarningCount } from "@/lib/operator/operator-home-approval-check-warning-copy";
import { resolveRunHomeStatusTag } from "@/components/operator-home/runs-dashboard-helpers";
import type { RunSummary } from "@/types/authority";

export const OPERATOR_HOME_WORKSPACE_METRICS_EMPTY_COPY =
  "Workspace is ready for a first review. Metrics will populate after a sample or real review is completed.";

export type OperatorHomeWorkspaceMetricsSnapshot = {
  readonly reviewPackagesTotal: number;
  readonly reviewPackagesCommitted: number;
  readonly reviewPackagesActive: number;
  readonly openFindings: number;
  readonly governanceWarnings: number;
  readonly evidenceSources: number;
  readonly hasReviews: boolean;
};

function runHasEvidenceSource(run: RunSummary): boolean {
  return (
    run.hasContextSnapshot === true ||
    run.hasArtifactBundle === true ||
    run.hasGraphSnapshot === true ||
    run.hasFindingsSnapshot === true
  );
}

function isDraftRun(run: RunSummary): boolean {
  return resolveRunHomeStatusTag(run).kind === "draft";
}

/** Aggregates workspace metrics from operator-home runs dashboard data already on the page. */
export function deriveOperatorHomeWorkspaceMetrics(
  items: readonly RunSummary[],
  totalCount: number,
): OperatorHomeWorkspaceMetricsSnapshot {
  const reviewPackagesTotal = Math.max(0, totalCount);

  let reviewPackagesCommitted = 0;
  let reviewPackagesActive = 0;
  let openFindings = 0;
  let governanceWarnings = 0;
  let evidenceSources = 0;

  for (const run of items) {

    if (run.isArchived === true) {
      continue;
    }

    if (run.hasGoldenManifest === true) {
      reviewPackagesCommitted += 1;
    } else if (!isDraftRun(run)) {
      reviewPackagesActive += 1;
    }

    const findingCount = resolveRunFindingCountDisplay(run);

    if (findingCount !== null && (run.hasGoldenManifest === true || run.hasFindingsSnapshot === true)) {
      openFindings += findingCount;
    }

    if (run.hasGovernanceWarnings === true) {
      governanceWarnings += 1;
    }

    if (runHasEvidenceSource(run)) {
      evidenceSources += 1;
    }
  }

  return {
    reviewPackagesTotal,
    reviewPackagesCommitted,
    reviewPackagesActive,
    openFindings,
    governanceWarnings,
    evidenceSources,
    hasReviews: reviewPackagesTotal > 0,
  };
}

export function formatSetupReadinessLabel(readyCount: number, totalCount: number): string {
  return `${readyCount} of ${totalCount} ready`;
}

export function formatSetupReadinessCompactLabel(readyCount: number, totalCount: number): string {
  return `Setup ${readyCount}/${totalCount}`;
}

export type OperatorHomeCompactMetricsLineInput = {
  readonly metrics: OperatorHomeWorkspaceMetricsSnapshot;
  readonly setupReadyCount: number;
  readonly setupTotalCount: number;
  readonly setupReadinessLoading: boolean;
};

/** Single-line KPI strip for populated workspaces — e.g. `2 Active reviews · 0 Open findings`. */
export function formatOperatorHomeCompactMetricsLine(
  input: OperatorHomeCompactMetricsLineInput,
): string {
  const activeReviews = input.metrics.reviewPackagesActive;
  const activeLabel = `${activeReviews} Active review${activeReviews === 1 ? "" : "s"}`;
  const finalizedLabel = `${input.metrics.reviewPackagesCommitted} Finalized package${input.metrics.reviewPackagesCommitted === 1 ? "" : "s"}`;
  const findingsLabel = `${input.metrics.openFindings} Open finding${input.metrics.openFindings === 1 ? "" : "s"}`;
  const warningsLabel = formatOperatorHomeApprovalCheckWarningCount(input.metrics.governanceWarnings);
  const setupLabel = input.setupReadinessLoading
    ? "Setup …"
    : formatSetupReadinessCompactLabel(input.setupReadyCount, input.setupTotalCount);

  const parts = [
    activeLabel,
    finalizedLabel,
    findingsLabel,
    warningsLabel,
    setupLabel,
  ];

  return parts.join(" · ");
}

export function formatSetupReadinessCompleteLabel(readyCount: number, totalCount: number): string {
  return `${readyCount} of ${totalCount} complete`;
}
