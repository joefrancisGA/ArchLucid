/** localStorage: set when the operator finishes or skips the guided onboarding tour. */
export const ONBOARDING_TOUR_COMPLETED_KEY = "archlucid-onboarding-tour-completed";

/** `window` event name — Help, welcome modal, and tests dispatch to open the guided tour. */
export const ARCHLUCID_ONBOARDING_TOUR_START_EVENT = "archlucid-onboarding-tour-start";

/** Opens the guided tour coachmark; does not affect welcome-modal dismissal state. */
export function dispatchOnboardingTourStart(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(ARCHLUCID_ONBOARDING_TOUR_START_EVENT));
}

export function readOnboardingTourCompleted(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.localStorage.getItem(ONBOARDING_TOUR_COMPLETED_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeOnboardingTourCompleted(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(ONBOARDING_TOUR_COMPLETED_KEY, "1");
  } catch {
    /* private mode */
  }
}

/** Anchor values match `[data-onboarding="…"]` on shell / home targets. */
export function onboardingTourAnchorForHref(href: string): string | undefined {
  if (href === "/architecture/reviews/new") {
    return "tour-new-run";
  }

  if (href === "/help") {
    return "tour-help";
  }

  return undefined;
}
