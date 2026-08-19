const GROUP_BY_RESOURCE_STORAGE_KEY = "archlucid.governance-findings.group-by-resource";

export function readGroupByResourcePreference(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.localStorage.getItem(GROUP_BY_RESOURCE_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeGroupByResourcePreference(enabled: boolean): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(GROUP_BY_RESOURCE_STORAGE_KEY, enabled ? "1" : "0");
  } catch {
    // localStorage may be unavailable (e.g. private browsing with storage blocked)
  }
}
