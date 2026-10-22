export const REMEDIATION_PATTERN_IMPORT_PANEL_SESSION_KEY =
  "archlucid.remediation-patterns.import-panel-open" as const;

export function readRemediationPatternImportPanelOpenFromSession(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.sessionStorage.getItem(REMEDIATION_PATTERN_IMPORT_PANEL_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeRemediationPatternImportPanelOpenToSession(open: boolean): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(REMEDIATION_PATTERN_IMPORT_PANEL_SESSION_KEY, open ? "1" : "0");
  } catch {
    // Session storage may be unavailable in restricted contexts.
  }
}
