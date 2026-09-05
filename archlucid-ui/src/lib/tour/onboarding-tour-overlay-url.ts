export const ONBOARDING_TOUR_OPEN_PARAM = "onboardingTourOpen";
export const ONBOARDING_TOUR_STEP_PARAM = "onboardingTourStep";

export type OnboardingTourOverlayUrlState = {
  readonly open: boolean;
  readonly stepIndex: number;
};

export function parseOnboardingTourOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function parseOnboardingTourStepFromSearch(raw: string | null | undefined): number | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  const trimmed = raw.trim();

  if (trimmed.length === 0) {
    return null;
  }

  const parsed = Number.parseInt(trimmed, 10);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}

export function onboardingTourOverlayHrefFromSearch(
  currentSearch: string,
  state: OnboardingTourOverlayUrlState,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!state.open) {
    params.delete(ONBOARDING_TOUR_OPEN_PARAM);
    params.delete(ONBOARDING_TOUR_STEP_PARAM);
  } else {
    params.set(ONBOARDING_TOUR_OPEN_PARAM, "1");

    if (state.stepIndex <= 0) {
      params.delete(ONBOARDING_TOUR_STEP_PARAM);
    } else {
      params.set(ONBOARDING_TOUR_STEP_PARAM, String(state.stepIndex));
    }
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
