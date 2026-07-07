import type { RunDetail } from "@/types/authority";

/** Mirrors `RunDetailBuyerMapper` — buyer-summary must not ship snapshot subgraphs or agent results. */
export function toMockBuyerRunDetailSummary(full: RunDetail): RunDetail {
  const buyerSafe = { ...full };
  delete buyerSafe.results;
  delete buyerSafe.contextSnapshot;
  delete buyerSafe.graphSnapshot;
  delete buyerSafe.findingsSnapshot;
  delete buyerSafe.goldenManifest;
  delete buyerSafe.artifactBundle;
  delete buyerSafe.decisionTrace;

  const run = full.run;
  const goldenManifestId = run.goldenManifestId?.trim() || undefined;

  return {
    ...buyerSafe,
    run: {
      runId: run.runId,
      projectId: run.projectId,
      scopeProjectId: run.scopeProjectId,
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
