/**
 * Client-side cache: whether the default project has any runs (set by welcome banner + other consumers that refresh).
 */
export const HAS_EXISTING_RUNS_CACHE_KEY = "archlucid_has_existing_runs";

export function readHasExistingRunsCache(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.localStorage.getItem(HAS_EXISTING_RUNS_CACHE_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeHasExistingRunsCache(hasRuns: boolean): void {
  try {
    window.localStorage.setItem(HAS_EXISTING_RUNS_CACHE_KEY, hasRuns ? "1" : "0");
  } catch {
    /* private mode */
  }
}
