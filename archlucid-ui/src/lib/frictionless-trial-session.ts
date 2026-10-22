export const FRICTIONLESS_TRIAL_SESSION_STORAGE_KEY = "archlucid.frictionlessTrial.session.v1";

/** Client-only flag: operator UI serves curated showcase payloads without sign-in. */
export function readFrictionlessTrialSessionEnabled(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.localStorage.getItem(FRICTIONLESS_TRIAL_SESSION_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeFrictionlessTrialSessionEnabled(enabled: boolean): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    if (enabled) {
      window.localStorage.setItem(FRICTIONLESS_TRIAL_SESSION_STORAGE_KEY, "1");
    } else {
      window.localStorage.removeItem(FRICTIONLESS_TRIAL_SESSION_STORAGE_KEY);
    }
  } catch {
    /* private mode */
  }
}

export const FRICTIONLESS_TRIAL_SESSION_CHANGED_EVENT = "archlucid-frictionless-trial-changed";
