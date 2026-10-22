import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
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
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, AZURE_BOARDS_CONNECTION_TEST_COLLAPSED_OPEN_PARAM);
}
