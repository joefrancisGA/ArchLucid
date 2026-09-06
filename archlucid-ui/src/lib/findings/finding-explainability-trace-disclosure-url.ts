export const FINDING_EXPLAINABILITY_OPEN_PARAM = "findingExplainabilityOpen";

export function parseFindingExplainabilityOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function findingExplainabilityTraceDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(FINDING_EXPLAINABILITY_OPEN_PARAM);
  } else {
    params.set(FINDING_EXPLAINABILITY_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
