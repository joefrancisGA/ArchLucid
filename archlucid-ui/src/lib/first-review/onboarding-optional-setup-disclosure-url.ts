import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
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
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, ONBOARDING_OPTIONAL_SETUP_OPEN_PARAM);
}
