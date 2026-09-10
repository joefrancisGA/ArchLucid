export const PAGE_CAPABILITY_BOUNDARY_OPEN_PARAM = "pageCapabilityBoundaryOpen";

export function parsePageCapabilityBoundaryOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function pageCapabilityBoundaryDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(PAGE_CAPABILITY_BOUNDARY_OPEN_PARAM);
  } else {
    params.set(PAGE_CAPABILITY_BOUNDARY_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
