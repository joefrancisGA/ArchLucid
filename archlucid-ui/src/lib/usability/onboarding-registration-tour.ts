import { dispatchOnboardingTourStart } from "@/lib/onboarding-tour";

export const REGISTRATION_TOUR_AUTO_START_KEY = "archlucid.registrationTourAutoStart.v1";

export function shouldAutoStartRegistrationTour(search: string): boolean {
  const params = new URLSearchParams(search);

  return params.get("source") === "registration";
}

export function markRegistrationTourAutoStartConsumed(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(REGISTRATION_TOUR_AUTO_START_KEY, "1");
  }
  catch {
    /* ignore */
  }
}

export function hasConsumedRegistrationTourAutoStart(): boolean {
  if (typeof window === "undefined") {
    return true;
  }

  try {
    return window.sessionStorage.getItem(REGISTRATION_TOUR_AUTO_START_KEY) === "1";
  }
  catch {
    return true;
  }
}

export { dispatchOnboardingTourStart };
