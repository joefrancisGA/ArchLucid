import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const SESSION_EXPIRED_SIGN_OUT_DETAILS_OPEN_PARAM = "sessionExpiredSignOutDetailsOpen";

export function parseSessionExpiredSignOutDetailsOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function sessionExpiredSignOutDetailsDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, SESSION_EXPIRED_SIGN_OUT_DETAILS_OPEN_PARAM);
}
