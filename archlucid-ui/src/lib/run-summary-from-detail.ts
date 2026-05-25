import type { RunDetail, RunSummary } from "@/types/authority";

function mergeDistinctSortedAgentNames(
  a?: readonly string[] | null,
  b?: readonly string[] | null,
): string[] | undefined {
  const out = new Set<string>();

  for (const x of a ?? []) {
    const t = x.trim();

    if (t.length > 0) {
      out.add(t);
    }
  }

  for (const x of b ?? []) {
    const t = x.trim();

    if (t.length > 0) {
      out.add(t);
    }
  }

  if (out.size === 0) {
    return undefined;
  }

  return [...out].sort((x, y) => x.localeCompare(y, undefined, { sensitivity: "base" }));
}

/**
 * Builds a {@link RunSummary} from run detail so {@link deriveRunListPipelineLabel} / {@link RunStatusBadge}
 * can use the same snapshot-ID presence rules as the runs list when `getRunSummary` is unavailable.
 */
export function runFromDetailToRunSummary(detail: RunDetail): RunSummary {
  const run = detail.run;

  return {
    runId: run.runId,
    projectId: run.projectId,
    description: run.description,
    createdUtc: run.createdUtc,
    hasContextSnapshot: Boolean(run.contextSnapshotId),
    hasGraphSnapshot: Boolean(run.graphSnapshotId),
    hasFindingsSnapshot: Boolean(run.findingsSnapshotId),
    hasGoldenManifest: Boolean(run.goldenManifestId),
    hasDecisionTrace: Boolean(run.decisionTraceId),
    hasArtifactBundle: Boolean(run.artifactBundleId),
    runDegradedExecution: detail.runDegradedExecution,
    degradedExecutionAgents: detail.degradedExecutionAgents ?? undefined,
  };
}

/**
 * Prefer `GET …/runs/{id}/summary` when it matches this run; otherwise fall back to the detail row.
 * OR-merge pipeline booleans so a malformed or empty summary (common in mock / screenshot stubs) cannot
 * contradict a finalized run that already lists snapshot IDs on the detail envelope.
 */
export function effectiveRunSummaryForPipeline(
  apiSummary: RunSummary | null,
  detail: RunDetail,
): RunSummary {
  const fromDetail = runFromDetailToRunSummary(detail);

  const run = detail.run;

  if (apiSummary === null || typeof apiSummary.runId !== "string" || apiSummary.runId !== run.runId) {
    return fromDetail;
  }

  return {
    ...fromDetail,
    ...apiSummary,
    hasContextSnapshot: apiSummary.hasContextSnapshot === true || fromDetail.hasContextSnapshot === true,
    hasGraphSnapshot: apiSummary.hasGraphSnapshot === true || fromDetail.hasGraphSnapshot === true,
    hasFindingsSnapshot: apiSummary.hasFindingsSnapshot === true || fromDetail.hasFindingsSnapshot === true,
    hasGoldenManifest: apiSummary.hasGoldenManifest === true || fromDetail.hasGoldenManifest === true,
    hasDecisionTrace: apiSummary.hasDecisionTrace === true || fromDetail.hasDecisionTrace === true,
    hasArtifactBundle: apiSummary.hasArtifactBundle === true || fromDetail.hasArtifactBundle === true,
    runDegradedExecution:
      apiSummary.runDegradedExecution === true ||
      fromDetail.runDegradedExecution === true ||
      run.realModeFellBackToSimulator === true,
    degradedExecutionAgents: mergeDistinctSortedAgentNames(
      apiSummary.degradedExecutionAgents,
      fromDetail.degradedExecutionAgents,
    ),
  };
}
