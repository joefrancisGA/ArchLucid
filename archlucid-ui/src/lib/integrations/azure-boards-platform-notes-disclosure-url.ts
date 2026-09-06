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
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(AZURE_BOARDS_PLATFORM_NOTES_OPEN_PARAM);
  } else {
    params.set(AZURE_BOARDS_PLATFORM_NOTES_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
