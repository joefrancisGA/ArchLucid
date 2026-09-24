const OPERATOR_HOME_RUNS_STALE_STORAGE_KEY = "archlucid:operator-home-runs-stale";

const OPERATOR_HOME_LIFECYCLE_REFRESH_EVENT = "archlucid:operator-home-lifecycle-refresh";

/** Marks the Overview runs snapshot stale after review lifecycle writes (finalize, spawn). */
export function markOperatorHomeRunsSnapshotStale(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(OPERATOR_HOME_RUNS_STALE_STORAGE_KEY, "1");
  } catch {
    // Session storage may be unavailable.
  }
}

/** Clears lifecycle stale marker on tenant/workspace scope change (parity with other session clears). */
export function clearOperatorHomeRunsSnapshotStale(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.removeItem(OPERATOR_HOME_RUNS_STALE_STORAGE_KEY);
  } catch {
    // Session storage may be unavailable.
  }
}

/** True once after lifecycle writes; cleared when the runs dashboard reloads. */
export function consumeOperatorHomeRunsSnapshotStale(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const stale = window.sessionStorage.getItem(OPERATOR_HOME_RUNS_STALE_STORAGE_KEY) === "1";

    if (stale) {
      window.sessionStorage.removeItem(OPERATOR_HOME_RUNS_STALE_STORAGE_KEY);
    }

    return stale;
  } catch {
    return false;
  }
}

export function subscribeOperatorHomeLifecycleRefresh(listener: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener(OPERATOR_HOME_LIFECYCLE_REFRESH_EVENT, listener);

  return () => {
    window.removeEventListener(OPERATOR_HOME_LIFECYCLE_REFRESH_EVENT, listener);
  };
}

export function notifyOperatorHomeLifecycleRefresh(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(OPERATOR_HOME_LIFECYCLE_REFRESH_EVENT));
}
