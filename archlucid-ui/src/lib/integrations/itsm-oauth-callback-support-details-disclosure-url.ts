import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const ITSM_OAUTH_CALLBACK_SUPPORT_DETAILS_OPEN_PARAM = "itsmOAuthCallbackSupportDetailsOpen";

export function parseItsmOAuthCallbackSupportDetailsOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function itsmOAuthCallbackSupportDetailsDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, ITSM_OAUTH_CALLBACK_SUPPORT_DETAILS_OPEN_PARAM);
}
