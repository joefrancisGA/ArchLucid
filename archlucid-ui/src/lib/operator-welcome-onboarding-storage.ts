/**
 * Persists permanent dismissal of the operator welcome modal (legacy key `hasSeenOnboarding`).
 * Separate from {@link ONBOARDING_TOUR_COMPLETED_KEY} — skipping the welcome modal does not complete the tour.
 */
export const HAS_SEEN_ONBOARDING_STORAGE_KEY = "hasSeenOnboarding";

/** Alias for callers that distinguish welcome-modal state from guided-tour state. */
export const WELCOME_MODAL_DISMISSED_STORAGE_KEY = HAS_SEEN_ONBOARDING_STORAGE_KEY;

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
