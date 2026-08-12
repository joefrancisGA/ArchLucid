/** localStorage key — permanent dismiss for draft-vs-review guidance on Architectures. */
export const ARCHITECTURE_DRAFT_GUIDANCE_DISMISS_STORAGE_KEY =
  "archlucid.architectureDraftGuidance.dismissed.v1" as const;

export function isArchitectureDraftGuidanceDismissed(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(ARCHITECTURE_DRAFT_GUIDANCE_DISMISS_STORAGE_KEY) === "1";
}

export function persistArchitectureDraftGuidanceDismissed(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(ARCHITECTURE_DRAFT_GUIDANCE_DISMISS_STORAGE_KEY, "1");
}
