/** Session flag: operator explicitly opted into the sample/demo workspace this tab. */
export const OPERATOR_SAMPLE_WORKSPACE_VISIT_STORAGE_KEY =
  "archlucid_operator_sample_workspace_visit_v1" as const;

export function isSampleWorkspaceVisitActive(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.sessionStorage.getItem(OPERATOR_SAMPLE_WORKSPACE_VISIT_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function markSampleWorkspaceVisitActive(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(OPERATOR_SAMPLE_WORKSPACE_VISIT_STORAGE_KEY, "1");
  } catch {
    /* private mode */
  }
}

export function clearSampleWorkspaceVisitActive(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.removeItem(OPERATOR_SAMPLE_WORKSPACE_VISIT_STORAGE_KEY);
  } catch {
    /* */
  }
}
