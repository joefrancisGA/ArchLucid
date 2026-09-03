export const EXPERT_INTAKE_POSTURE_STORAGE_KEY = "archlucid.expert-intake-posture.v1.enabled";

export const EXPERT_INTAKE_POSTURE_LABEL = "Expert intake" as const;

export const EXPERT_INTAKE_POSTURE_LEAD =
  "Brief-first with a MUST checklist you control. Socratic one-at-a-time questions stay available when you need them for a requester in the room.";

/** Principal-architect lane: minimize teaching flow, maximize checklist control. */
export function readExpertIntakePostureEnabled(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.localStorage.getItem(EXPERT_INTAKE_POSTURE_STORAGE_KEY) === "1";
  }
  catch {
    return false;
  }
}

export function writeExpertIntakePostureEnabled(enabled: boolean): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(EXPERT_INTAKE_POSTURE_STORAGE_KEY, enabled ? "1" : "0");
    window.dispatchEvent(new CustomEvent("archlucid.expert-intake-posture.changed", { detail: { enabled } }));
  }
  catch {
    /* ignore */
  }
}
