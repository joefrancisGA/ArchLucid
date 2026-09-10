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
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(SESSION_EXPIRED_SIGN_OUT_DETAILS_OPEN_PARAM);
  } else {
    params.set(SESSION_EXPIRED_SIGN_OUT_DETAILS_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
