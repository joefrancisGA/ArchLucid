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
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(HELP_AUDIT_TRAIL_TECH_REF_OPEN_PARAM);
  } else {
    params.set(HELP_AUDIT_TRAIL_TECH_REF_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
