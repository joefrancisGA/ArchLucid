import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const AZURE_BOARDS_PLATFORM_NOTES_OPEN_PARAM = "azureBoardsPlatformNotesOpen";

export function parseAzureBoardsPlatformNotesOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function azureBoardsPlatformNotesDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, AZURE_BOARDS_PLATFORM_NOTES_OPEN_PARAM);
}
