export const SLACK_PLATFORM_NOTES_OPEN_PARAM = "slackPlatformNotesOpen";

export function parseSlackPlatformNotesOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function slackPlatformNotesDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(SLACK_PLATFORM_NOTES_OPEN_PARAM);
  } else {
    params.set(SLACK_PLATFORM_NOTES_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
