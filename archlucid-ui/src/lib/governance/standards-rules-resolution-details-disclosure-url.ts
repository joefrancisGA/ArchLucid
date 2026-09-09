export const STANDARDS_RULES_RESOLUTION_DETAILS_OPEN_PARAM = "standardsRulesResolutionDetailsOpen";

export function parseStandardsRulesResolutionDetailsOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function standardsRulesResolutionDetailsDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(STANDARDS_RULES_RESOLUTION_DETAILS_OPEN_PARAM);
  } else {
    params.set(STANDARDS_RULES_RESOLUTION_DETAILS_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
