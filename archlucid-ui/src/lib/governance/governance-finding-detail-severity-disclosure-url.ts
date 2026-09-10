export const GOVERNANCE_FINDING_DETAIL_SEVERITY_OPEN_PARAM = "governanceFindingDetailSeverityOpen";

export function parseGovernanceFindingDetailSeverityOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function governanceFindingDetailSeverityDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(GOVERNANCE_FINDING_DETAIL_SEVERITY_OPEN_PARAM);
  } else {
    params.set(GOVERNANCE_FINDING_DETAIL_SEVERITY_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
