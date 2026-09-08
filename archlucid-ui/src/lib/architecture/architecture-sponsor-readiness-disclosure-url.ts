export const ARCHITECTURE_SPONSOR_READINESS_OPEN_PARAM = "architectureSponsorReadinessOpen";

export function parseArchitectureSponsorReadinessOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function architectureSponsorReadinessDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(ARCHITECTURE_SPONSOR_READINESS_OPEN_PARAM);
  } else {
    params.set(ARCHITECTURE_SPONSOR_READINESS_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
