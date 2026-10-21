import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const IDENTITY_PROVIDERS_OVERVIEW_STATUS_FAILURE_DETAILS_OPEN_PARAM =
  "identityProvidersOverviewStatusFailureDetailsOpen";

export function parseIdentityProvidersOverviewStatusFailureDetailsOpenFromSearch(
  raw: string | null | undefined,
): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function identityProvidersOverviewStatusFailureDetailsDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, IDENTITY_PROVIDERS_OVERVIEW_STATUS_FAILURE_DETAILS_OPEN_PARAM);
}
