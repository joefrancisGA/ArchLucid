import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const ARCHITECTURE_SPONSOR_SHARING_OPEN_PARAM = "architectureSponsorSharingOpen";

export function parseArchitectureSponsorSharingOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function architectureSponsorSharingDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, ARCHITECTURE_SPONSOR_SHARING_OPEN_PARAM);
}
