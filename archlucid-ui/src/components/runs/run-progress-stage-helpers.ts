import type { RunSummary } from "@/types/authority";

export function stageDone(flag: boolean | undefined): boolean {
  return flag === true;
}

export function analysisStagesComplete(s: RunSummary | null): boolean {
  if (s === null) {
    return false;
  }

  return (
    stageDone(s.hasContextSnapshot) &&
    stageDone(s.hasGraphSnapshot) &&
    stageDone(s.hasFindingsSnapshot)
  );
}

export function allStagesReady(s: RunSummary | null): boolean {
  if (s === null) {
    return false;
  }

  return analysisStagesComplete(s) && stageDone(s.hasGoldenManifest);
}

export function resolvePreFinalizeTerminal(
  initialSummary: RunSummary | null,
  preFinalizeReadyToFinalize: boolean | undefined,
): boolean {
  if (preFinalizeReadyToFinalize === true) {
    return true;
  }

  if (preFinalizeReadyToFinalize === false) {
    return false;
  }

  return analysisStagesComplete(initialSummary) && !stageDone(initialSummary?.hasGoldenManifest);
}
