import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const SERVICENOW_CONNECTION_TEST_COLLAPSED_OPEN_PARAM = "serviceNowConnectionTestCollapsedOpen";

export function parseServiceNowConnectionTestCollapsedOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function serviceNowConnectionTestCollapsedDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, SERVICENOW_CONNECTION_TEST_COLLAPSED_OPEN_PARAM);
}
