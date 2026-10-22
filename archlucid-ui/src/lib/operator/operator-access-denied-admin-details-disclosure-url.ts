import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
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
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, OPERATOR_ACCESS_DENIED_ADMIN_DETAILS_OPEN_PARAM);
}
