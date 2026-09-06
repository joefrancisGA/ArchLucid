export const AZURE_BOARDS_CONNECTION_TEST_COLLAPSED_OPEN_PARAM = "azureBoardsConnectionTestCollapsedOpen";

export function parseAzureBoardsConnectionTestCollapsedOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function azureBoardsConnectionTestCollapsedDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(AZURE_BOARDS_CONNECTION_TEST_COLLAPSED_OPEN_PARAM);
  } else {
    params.set(AZURE_BOARDS_CONNECTION_TEST_COLLAPSED_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
