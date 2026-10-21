import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const HOME_WORKSPACE_DETAILS_OPEN_PARAM = "homeWorkspaceDetailsOpen";

export function parseHomeWorkspaceDetailsOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function homeWorkspaceDetailsHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, HOME_WORKSPACE_DETAILS_OPEN_PARAM);
}
