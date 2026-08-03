import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
import { SHOWCASE_STATIC_DEMO_RUN_ID, SHOWCASE_STATIC_DEMO_SPINE_COUNTS } from "@/lib/showcase-static-demo";
import type { RunSummary } from "@/types/authority";

export type ReviewsWorkspaceSummary = {
  readonly inProgress: number;
  readonly committed: number;
  readonly findings: number;
  readonly openRisks: number;
  readonly readyForGovernance: number;
};

function finiteCount(value: number | null | undefined): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.trunc(value));
}

function runFindingCount(run: RunSummary): number {
  const wire = finiteCount(run.findingCount);

  if (wire > 0) {
    return wire;
  }

  if (canonicalizeDemoRunId(run.runId) === canonicalizeDemoRunId(SHOWCASE_STATIC_DEMO_RUN_ID)) {
    return SHOWCASE_STATIC_DEMO_SPINE_COUNTS.findingCount;
  }

  return run.hasFindingsSnapshot === true ? 1 : 0;
}

function runRiskCount(run: RunSummary): number {
  const wire = finiteCount(run.warningCount);

  if (wire > 0) {
    return wire;
  }

  if (canonicalizeDemoRunId(run.runId) === canonicalizeDemoRunId(SHOWCASE_STATIC_DEMO_RUN_ID)) {
    return SHOWCASE_STATIC_DEMO_SPINE_COUNTS.warningCount;
  }

  return run.hasWarnings === true || run.hasGovernanceWarnings === true ? 1 : 0;
}

/** Compact workspace counters for the `/architecture/reviews` hub summary row. */
export function deriveReviewsWorkspaceSummary(runs: readonly RunSummary[]): ReviewsWorkspaceSummary {
  let inProgress = 0;
  let committed = 0;
  let findings = 0;
  let openRisks = 0;
  let readyForGovernance = 0;

  for (const run of runs) {
    if (run.hasGoldenManifest === true) {
      committed += 1;
      readyForGovernance += 1;
    } else {
      inProgress += 1;
    }

    findings += runFindingCount(run);
    openRisks += runRiskCount(run);
  }

  return {
    inProgress,
    committed,
    findings,
    openRisks,
    readyForGovernance,
  };
}
