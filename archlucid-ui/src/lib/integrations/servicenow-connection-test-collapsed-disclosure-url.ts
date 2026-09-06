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
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(SERVICENOW_CONNECTION_TEST_COLLAPSED_OPEN_PARAM);
  } else {
    params.set(SERVICENOW_CONNECTION_TEST_COLLAPSED_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
