import type { RunSummary } from "@/types/authority";

/** Browser localStorage key for the operator-chosen compare baseline run id. */
export const COMPARE_BASELINE_RUN_STORAGE_KEY = "archlucid_compare_baseline_run_id_v1";

/** Same-tab notification when baseline changes ({@link persistCompareBaselineRunId}). */
export const COMPARE_BASELINE_CHANGED_EVENT = "archlucid:compare-baseline-changed";

/** True when the run has a committed golden manifest suitable as a compare anchor. */
export function isRunCommittedForBaseline(run: RunSummary): boolean {
  return run.hasGoldenManifest === true;
}

export function readCompareBaselineRunId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(COMPARE_BASELINE_RUN_STORAGE_KEY)?.trim() ?? "";

    return raw.length > 0 ? raw : null;
  } catch {
    return null;
  }
}

export function persistCompareBaselineRunId(runId: string): void {
  const id = runId.trim();

  if (id.length === 0 || typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(COMPARE_BASELINE_RUN_STORAGE_KEY, id);
    window.dispatchEvent(new Event(COMPARE_BASELINE_CHANGED_EVENT));
  } catch {
    /* ignore quota / private mode */
  }
}
