import type { RunDetail } from "@/types/authority";

/** Mirrors `RunDetailBuyerMapper` — buyer-summary must not ship snapshot subgraphs or agent results. */
export function toMockBuyerRunDetailSummary(full: RunDetail): RunDetail {
  const {
    results: _results,
    contextSnapshot: _contextSnapshot,
    graphSnapshot: _graphSnapshot,
    findingsSnapshot: _findingsSnapshot,
    goldenManifest: _goldenManifest,
    artifactBundle: _artifactBundle,
    decisionTrace: _decisionTrace,
    ...buyerSafe
  } = full;

  const run = full.run;
  const goldenManifestId = run.goldenManifestId?.trim() || undefined;

  return {
    ...buyerSafe,
    run: {
      runId: run.runId,
      projectId: run.projectId,
      description: run.description,
      displayName: run.displayName ?? run.description,
      createdUtc: run.createdUtc,
      goldenManifestId,
      hasGoldenManifest: run.hasGoldenManifest ?? Boolean(goldenManifestId),
      hasGraphSnapshot: Boolean(run.graphSnapshotId),
      hasFindingsSnapshot: Boolean(run.findingsSnapshotId),
      runDegradedExecution: run.runDegradedExecution,
      degradedExecutionAgents: run.degradedExecutionAgents,
      isDeadLettered: run.isDeadLettered,
    },
  };
}
