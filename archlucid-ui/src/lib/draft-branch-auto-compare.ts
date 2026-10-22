import type { RunSummary } from "@/types/authority";

export const DRAFT_BRANCH_AUTO_COMPARE_QUERY_KEY = "autoCompare";

const AUTO_COMPARE_DONE_KEY_PREFIX = "archlucid_what_if_auto_compare_done:";

export function whatIfAutoCompareDoneStorageKey(parentRunId: string, branchRunId: string): string {
  return `${AUTO_COMPARE_DONE_KEY_PREFIX}${parentRunId.trim()}:${branchRunId.trim()}`;
}

export function isWhatIfAutoCompareDone(parentRunId: string, branchRunId: string): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return (
      window.sessionStorage.getItem(whatIfAutoCompareDoneStorageKey(parentRunId, branchRunId)) === "1"
    );
  } catch {
    return false;
  }
}

export function markWhatIfAutoCompareDone(parentRunId: string, branchRunId: string): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(whatIfAutoCompareDoneStorageKey(parentRunId, branchRunId), "1");
  } catch {
    /* ignore quota / private mode */
  }
}

/** True when both runs have committed golden manifests and Compare can run (R12). */
export function bothRunsReadyForBranchCompare(
  parent: Pick<RunSummary, "hasGoldenManifest"> | null,
  branch: Pick<RunSummary, "hasGoldenManifest"> | null,
): boolean {
  return parent?.hasGoldenManifest === true && branch?.hasGoldenManifest === true;
}
