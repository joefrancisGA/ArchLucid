import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const REVIEW_WORKSPACE_MORE_TABS_OPEN_PARAM = "reviewMoreTabsOpen";

export function parseReviewWorkspaceMoreTabsOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function reviewWorkspaceMoreTabsHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, REVIEW_WORKSPACE_MORE_TABS_OPEN_PARAM);
}
