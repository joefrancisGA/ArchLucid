import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const ADVISORY_SCANS_MANUAL_ID_ADMIN_OPEN_PARAM = "advisoryScansManualIdAdminOpen";

export function parseAdvisoryScansManualIdAdminOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function advisoryScansManualIdAdminDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, ADVISORY_SCANS_MANUAL_ID_ADMIN_OPEN_PARAM);
}
