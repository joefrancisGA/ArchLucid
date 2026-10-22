import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const HELP_AUDIT_TRAIL_TECH_REF_OPEN_PARAM = "helpAuditTrailTechRef";

export function parseHelpAuditTrailTechRefOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function helpAuditTrailTechnicalReferenceHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, HELP_AUDIT_TRAIL_TECH_REF_OPEN_PARAM);
}
