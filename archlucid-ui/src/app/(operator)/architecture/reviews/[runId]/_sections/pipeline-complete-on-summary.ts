import type { RunSummary } from "@/types/authority";

function snapshotReady(flag: boolean | undefined): boolean {
  return flag === true;
}

/** Analysis stages (context, graph, findings) are present without requiring a signed review record. */
export function analysisStagesCompleteOnSummary(s: RunSummary | null): boolean {
  return (
    s !== null &&
    snapshotReady(s.hasContextSnapshot) &&
    snapshotReady(s.hasGraphSnapshot) &&
    snapshotReady(s.hasFindingsSnapshot)
  );
}

/** Pipeline UI treats the run as complete when all snapshot gates are present on the summary. */
export function pipelineCompleteOnSummary(s: RunSummary | null): boolean {
  if (!analysisStagesCompleteOnSummary(s)) {
    return false;
  }

  return snapshotReady(s?.hasGoldenManifest);
}
