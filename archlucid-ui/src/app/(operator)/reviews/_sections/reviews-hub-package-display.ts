import { buyerDemoPackageCardMeta } from "@/lib/buyer-demo-package-card-meta";
import {
  getBuyerSafeReviewsTableLinkForRun,
  type PrimaryReviewExploreLink,
} from "@/lib/buyer-safe-review-navigation";
import { buyerFacingReviewTitleFromSummary } from "@/lib/buyer-facing-review-title";
import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
import { formatRelativeTime } from "@/lib/relative-time";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator-static-demo";
import { SHOWCASE_STATIC_DEMO_RUN_ID, SHOWCASE_STATIC_DEMO_SPINE_COUNTS } from "@/lib/showcase-static-demo";
import type { RunSummary } from "@/types/authority";

export type ReviewsHubPackageRowDisplay = {
  readonly runId: string;
  readonly name: string;
  readonly statusLabel: string;
  readonly lastUpdated: string;
  readonly findingsCount: number;
  readonly riskCount: number;
  readonly evidenceCount: number;
  readonly governanceState: string;
  readonly primaryAction: PrimaryReviewExploreLink;
  readonly isSamplePackage: boolean;
};

function finiteCount(value: number | null | undefined): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.trunc(value));
}

function formatLastUpdated(run: RunSummary): string {
  if (
    isStaticDemoPayloadFallbackEnabled() ||
    canonicalizeDemoRunId(run.runId) === canonicalizeDemoRunId(SHOWCASE_STATIC_DEMO_RUN_ID)
  ) {
    return new Date(run.createdUtc).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  return formatRelativeTime(run.createdUtc);
}

function packageStatusLabel(run: RunSummary): string {
  if (run.hasGoldenManifest === true) {
    return "Committed";
  }

  if (run.hasFindingsSnapshot === true || run.hasGraphSnapshot === true) {
    return "In progress";
  }

  return "Starting";
}

function packageGovernanceState(run: RunSummary): string {
  const demoMeta = buyerDemoPackageCardMeta(run.runId);

  if (demoMeta !== null) {
    if (demoMeta.lastAuditEvent.toLowerCase().includes("approval")) {
      return "Approved";
    }

    if (demoMeta.decisionSummary.toLowerCase().includes("in progress")) {
      return "Pending approval";
    }
  }

  if (run.hasGoldenManifest !== true) {
    return "Not ready";
  }

  if (run.hasGovernanceWarnings === true) {
    return "Monitoring";
  }

  return "Ready for governance";
}

function packageEvidenceCount(run: RunSummary): number {
  const artifacts = finiteCount(run.artifactCount);

  if (artifacts > 0) {
    return artifacts;
  }

  if (canonicalizeDemoRunId(run.runId) === canonicalizeDemoRunId(SHOWCASE_STATIC_DEMO_RUN_ID)) {
    return 4;
  }

  let score = 0;

  if (run.hasContextSnapshot === true) {
    score += 1;
  }

  if (run.hasGraphSnapshot === true) {
    score += 1;
  }

  if (run.hasFindingsSnapshot === true) {
    score += 1;
  }

  if (run.hasGoldenManifest === true) {
    score += 1;
  }

  return score;
}

function packageFindingCount(run: RunSummary): number {
  const wire = finiteCount(run.findingCount);

  if (wire > 0) {
    return wire;
  }

  if (canonicalizeDemoRunId(run.runId) === canonicalizeDemoRunId(SHOWCASE_STATIC_DEMO_RUN_ID)) {
    return SHOWCASE_STATIC_DEMO_SPINE_COUNTS.findingCount;
  }

  return run.hasFindingsSnapshot === true ? 1 : 0;
}

function packageRiskCount(run: RunSummary): number {
  const wire = finiteCount(run.warningCount);

  if (wire > 0) {
    return wire;
  }

  if (canonicalizeDemoRunId(run.runId) === canonicalizeDemoRunId(SHOWCASE_STATIC_DEMO_RUN_ID)) {
    return SHOWCASE_STATIC_DEMO_SPINE_COUNTS.warningCount;
  }

  return run.hasWarnings === true || run.hasGovernanceWarnings === true ? 1 : 0;
}

/** Row presentation model for the `/reviews` hub package table. */
export function toReviewsHubPackageRowDisplay(run: RunSummary): ReviewsHubPackageRowDisplay {
  const runId = canonicalizeDemoRunId(run.runId);

  return {
    runId,
    name: buyerFacingReviewTitleFromSummary(run),
    statusLabel: packageStatusLabel(run),
    lastUpdated: formatLastUpdated(run),
    findingsCount: packageFindingCount(run),
    riskCount: packageRiskCount(run),
    evidenceCount: packageEvidenceCount(run),
    governanceState: packageGovernanceState(run),
    primaryAction: getBuyerSafeReviewsTableLinkForRun(run),
    isSamplePackage:
      run.isSample === true ||
      runId === canonicalizeDemoRunId(SHOWCASE_STATIC_DEMO_RUN_ID) ||
      run.isDemoWelcomeRun === true,
  };
}
