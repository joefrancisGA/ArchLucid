import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
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
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, SLACK_PLATFORM_NOTES_OPEN_PARAM);
}
