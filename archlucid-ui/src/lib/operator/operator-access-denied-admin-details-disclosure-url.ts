export const OPERATOR_ACCESS_DENIED_ADMIN_DETAILS_OPEN_PARAM = "operatorAccessDeniedAdminDetailsOpen";

export function parseOperatorAccessDeniedAdminDetailsOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function operatorAccessDeniedAdminDetailsDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(OPERATOR_ACCESS_DENIED_ADMIN_DETAILS_OPEN_PARAM);
  } else {
    params.set(OPERATOR_ACCESS_DENIED_ADMIN_DETAILS_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
