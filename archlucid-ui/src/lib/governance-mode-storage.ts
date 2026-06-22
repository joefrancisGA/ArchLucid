export const GOVERNANCE_MODE_STORAGE_KEY = "archlucid_governance_mode_enabled";

export function readGovernanceModeEnabledFromStorage(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const raw = window.localStorage.getItem(GOVERNANCE_MODE_STORAGE_KEY);

    if (raw === null) {
      return false;
    }

    return raw === "1" || raw === "true";
  }
  catch {
    return false;
  }
}

export function writeGovernanceModeEnabledToStorage(enabled: boolean): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(GOVERNANCE_MODE_STORAGE_KEY, enabled ? "1" : "0");
  }
  catch {
    /* private mode */
  }
}
