export const ADVISORY_SCANS_HOW_IT_WORKS_OPEN_PARAM = "advisoryScansHowItWorksOpen";

export function parseAdvisoryScansHowItWorksOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function advisoryScansHowItWorksDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(ADVISORY_SCANS_HOW_IT_WORKS_OPEN_PARAM);
  } else {
    params.set(ADVISORY_SCANS_HOW_IT_WORKS_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
