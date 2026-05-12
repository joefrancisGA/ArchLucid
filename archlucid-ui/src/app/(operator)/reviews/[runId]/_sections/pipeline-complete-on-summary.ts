import type { RunSummary } from "@/types/authority";

/** Pipeline UI treats the run as complete when all snapshot gates are present on the summary. */
export function pipelineCompleteOnSummary(s: RunSummary | null): boolean {
  return (
    s !== null &&
    s.hasContextSnapshot === true &&
    s.hasGraphSnapshot === true &&
    s.hasFindingsSnapshot === true &&
    s.hasGoldenManifest === true
  );
}
