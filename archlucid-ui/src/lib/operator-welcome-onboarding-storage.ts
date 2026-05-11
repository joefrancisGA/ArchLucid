/** Persists permanent dismissal of the operator welcome onboarding dialog (assessment: `hasSeenOnboarding`). */
export const HAS_SEEN_ONBOARDING_STORAGE_KEY = "hasSeenOnboarding";

export function readHasSeenWelcomeOnboarding(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.localStorage.getItem(HAS_SEEN_ONBOARDING_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function persistHasSeenWelcomeOnboarding(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(HAS_SEEN_ONBOARDING_STORAGE_KEY, "true");
  } catch {
    /* ignore quota / private mode */
  }
}
