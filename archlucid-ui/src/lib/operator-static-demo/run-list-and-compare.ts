import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
import {
  getShowcaseStaticDemoPayload,
  SHOWCASE_STATIC_DEMO_LATER_COMPARE_RUN_ID,
  SHOWCASE_STATIC_DEMO_MANIFEST_ID,
  SHOWCASE_STATIC_DEMO_PRIOR_COMPARE_RUN_ID,
  SHOWCASE_STATIC_DEMO_RUN_ID,
  SHOWCASE_STATIC_DEMO_SPINE_COUNTS,
} from "@/lib/showcase-static-demo";
import type { GoldenManifestComparison } from "@/types/comparison";
import type { RunComparison, RunSummary } from "@/types/authority";

import {
  DEMO_RUN_IDS_FOR_STATIC_FALLBACK,
  isDemoRunIdEligibleForStaticFallback,
  isStaticDemoPayloadFallbackActiveForRun,
  isStaticDemoPayloadFallbackEnabled,
} from "./eligibility";

export type StaticDemoRunsListFallbackOptions = {
  /**
   * When `listRunsByProjectPaged` throws or returns JSON that fails coercion, inject the curated sample row even if
   * demo env vars are unset (keeps reviews list + pickers aligned with review detail static fallback).
   */
  readonly afterAuthorityListFailure?: boolean;
  /**
   * When the authority API returns **zero** rows for the project (successful empty page), inject the curated Claims
   * Intake sample — same trust model as {@link afterAuthorityListFailure} for demo/staging hosts without seeded data.
   */
  readonly afterEmptyLiveList?: boolean;
};

function isRunsListCuratedShowcaseAllowed(): boolean {
  return isStaticDemoPayloadFallbackEnabled();
}

/**
 * When the runs list API fails (or returns unusable JSON), serve one curated Claims Intake row so
 * primary nav + `/runs` screenshots stay credible in demo / static-operator deploys.
 */
export function tryStaticDemoRunSummariesPaged(
  projectId: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _options?: StaticDemoRunsListFallbackOptions,
): { items: RunSummary[]; totalCount: number } | null {
  if (!isRunsListCuratedShowcaseAllowed()) {
    return null;
  }

  const d = getShowcaseStaticDemoPayload(SHOWCASE_STATIC_DEMO_RUN_ID);
  const chain = d.authorityChain;

  const item: RunSummary = {
    runId: SHOWCASE_STATIC_DEMO_RUN_ID,
    projectId,
    description: d.run.description,
    createdUtc: d.run.createdUtc,
    hasContextSnapshot: !!chain.contextSnapshotId,
    hasGraphSnapshot: !!chain.graphSnapshotId,
    hasFindingsSnapshot: !!chain.findingsSnapshotId,
    hasGoldenManifest: true,
    // Showcase narrative is approved-with-monitoring (PHI residual risk under sampling).
    hasGovernanceWarnings: true,
    findingCount: SHOWCASE_STATIC_DEMO_SPINE_COUNTS.findingCount,
    warningCount: SHOWCASE_STATIC_DEMO_SPINE_COUNTS.warningCount,
    packageOrigin: "Reviewed",
  };

  return { items: [item], totalCount: 1 };
}

/**
 * When Compare needs two distinct run rows and the live list is empty, serve baseline/updated labels for the Claims
 * Intake demo spine (same eligibility as {@link tryStaticDemoRunSummariesPaged}).
 */
export function tryStaticDemoCompareRunSummaries(
  projectId: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _options?: StaticDemoRunsListFallbackOptions,
): { items: RunSummary[]; totalCount: number } | null {
  if (!isRunsListCuratedShowcaseAllowed()) {
    return null;
  }

  const d = getShowcaseStaticDemoPayload(SHOWCASE_STATIC_DEMO_RUN_ID);
  const chain = d.authorityChain;

  const row = (runId: string, description: string): RunSummary => ({
    runId,
    projectId,
    description,
    createdUtc: d.run.createdUtc,
    hasContextSnapshot: !!chain.contextSnapshotId,
    hasGraphSnapshot: !!chain.graphSnapshotId,
    hasFindingsSnapshot: !!chain.findingsSnapshotId,
    hasGoldenManifest: true,
  });

  return {
    items: [row("claims-intake-run-v1", "Claims Intake — baseline"), row("claims-intake-run-v2", "Claims Intake — updated")],
    totalCount: 2,
  };
}

function isShowcaseClaimsIntakeComparePair(leftRunId: string, rightRunId: string): boolean {
  const left = canonicalizeDemoRunId(leftRunId.trim());
  const right = canonicalizeDemoRunId(rightRunId.trim());

  return left === SHOWCASE_STATIC_DEMO_PRIOR_COMPARE_RUN_ID && right === SHOWCASE_STATIC_DEMO_LATER_COMPARE_RUN_ID;
}

function isStaticDemoComparePairActive(leftRunId: string, rightRunId: string): boolean {
  if (!isShowcaseClaimsIntakeComparePair(leftRunId, rightRunId)) {
    return false;
  }

  if (isStaticDemoPayloadFallbackEnabled()) {
    return true;
  }

  return (
    isStaticDemoPayloadFallbackActiveForRun(leftRunId) && isStaticDemoPayloadFallbackActiveForRun(rightRunId)
  );
}

/** Curated Claims Intake v1 vs v2 structured manifest delta when compare APIs are unavailable. */
export function tryStaticDemoGoldenManifestComparison(
  baseRunId: string,
  targetRunId: string,
): GoldenManifestComparison | null {
  if (!isStaticDemoComparePairActive(baseRunId, targetRunId)) {
    return null;
  }

  return {
    baseRunId: SHOWCASE_STATIC_DEMO_PRIOR_COMPARE_RUN_ID,
    targetRunId: SHOWCASE_STATIC_DEMO_LATER_COMPARE_RUN_ID,
    decisionChanges: [
      {
        decisionKey: "claims.intake.phi.minimization",
        displayLabel: "PHI minimization control posture",
        baseValue: "Sampling-only monitoring (baseline)",
        targetValue: "Sampling with automated exception routing (updated)",
        changeType: "Modified",
      },
      {
        decisionKey: "claims.intake.ocr.bypass",
        displayLabel: "Unstructured attachment OCR bypass",
        baseValue: "Manual review queue",
        targetValue: "Guard-railed bypass with audit hooks",
        changeType: "Modified",
      },
    ],
    requirementChanges: [
      {
        requirementName: "HIPAA minimum-necessary handling for claim attachments",
        changeType: "Modified",
      },
    ],
    securityChanges: [
      {
        controlName: "PHI field redaction at ingestion boundary",
        baseStatus: "Partial",
        targetStatus: "Implemented with monitoring",
      },
    ],
    topologyChanges: [
      {
        resource: "claims-intake-ocr-worker",
        changeType: "Added",
      },
    ],
    costChanges: [{ baseCost: 42000, targetCost: 48500 }],
    summaryHighlights: [
      "Updated review adds guard-railed OCR bypass monitoring — the monitored PHI minimization risk remains accepted with sampling.",
      "Two architecture decisions changed between baseline and updated finalized reviews; topology adds an OCR worker path.",
    ],
    totalDeltaCount: 7,
  };
}

/** Legacy flat compare payload paired with {@link tryStaticDemoGoldenManifestComparison}. */
export function tryStaticDemoRunComparison(leftRunId: string, rightRunId: string): RunComparison | null {
  if (!isStaticDemoComparePairActive(leftRunId, rightRunId)) {
    return null;
  }

  return {
    leftRunId: SHOWCASE_STATIC_DEMO_PRIOR_COMPARE_RUN_ID,
    rightRunId: SHOWCASE_STATIC_DEMO_LATER_COMPARE_RUN_ID,
    runLevelDiffs: [
      {
        section: "governance",
        key: "phi.minimization.disposition",
        diffKind: "Changed",
        beforeValue: "Accepted with manual sampling",
        afterValue: "Accepted with automated exception routing and monitoring",
        notes: "Non-blocking monitored risk tracked in both reviews.",
      },
    ],
    manifestComparison: {
      leftManifestId: `${SHOWCASE_STATIC_DEMO_MANIFEST_ID}-v1`,
      rightManifestId: `${SHOWCASE_STATIC_DEMO_MANIFEST_ID}-v2`,
      leftManifestHash: "sha256:claims-intake-v1-demo",
      rightManifestHash: "sha256:claims-intake-v2-demo",
      addedCount: 1,
      removedCount: 0,
      changedCount: 2,
      diffs: [
        {
          section: "decisions",
          key: "claims.intake.phi.minimization",
          diffKind: "Changed",
          beforeValue: "Baseline monitoring",
          afterValue: "Updated monitoring with routing",
        },
      ],
    },
    runLevelDiffCount: 1,
    hasManifestComparison: true,
  };
}
