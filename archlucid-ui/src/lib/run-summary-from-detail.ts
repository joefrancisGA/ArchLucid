import type { RunDetail, RunSummary } from "@/types/authority";

/**
 * Builds a {@link RunSummary} from run detail so {@link deriveRunListPipelineLabel} / {@link RunStatusBadge}
 * can use the same snapshot-ID presence rules as the runs list when `getRunSummary` is unavailable.
 */
export function runFromDetailToRunSummary(run: RunDetail["run"]): RunSummary {
  return {
    runId: run.runId,
    projectId: run.projectId,
    description: run.description,
    createdUtc: run.createdUtc,
    contextSnapshotId: run.contextSnapshotId,
    graphSnapshotId: run.graphSnapshotId,
    findingsSnapshotId: run.findingsSnapshotId,
    goldenManifestId: run.goldenManifestId,
    decisionTraceId: run.decisionTraceId,
    artifactBundleId: run.artifactBundleId,
    hasContextSnapshot: Boolean(run.contextSnapshotId),
    hasGraphSnapshot: Boolean(run.graphSnapshotId),
    hasFindingsSnapshot: Boolean(run.findingsSnapshotId),
    hasGoldenManifest: Boolean(run.goldenManifestId),
    hasDecisionTrace: Boolean(run.decisionTraceId),
    hasArtifactBundle: Boolean(run.artifactBundleId),
  };
}
