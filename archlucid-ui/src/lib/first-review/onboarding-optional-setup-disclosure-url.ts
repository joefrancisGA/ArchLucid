export const ONBOARDING_OPTIONAL_SETUP_OPEN_PARAM = "onboardingOptionalSetupOpen";

export function parseOnboardingOptionalSetupOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function onboardingOptionalSetupDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(ONBOARDING_OPTIONAL_SETUP_OPEN_PARAM);
  } else {
    params.set(ONBOARDING_OPTIONAL_SETUP_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
