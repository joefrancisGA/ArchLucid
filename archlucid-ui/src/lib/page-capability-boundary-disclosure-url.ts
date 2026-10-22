import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
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
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, PAGE_CAPABILITY_BOUNDARY_OPEN_PARAM);
}
