export const HELP_TOPIC_TOC_MOBILE_OPEN_PARAM = "helpTopicTocMobileOpen";

export function parseHelpTopicTocMobileOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function helpTopicTocMobileDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(HELP_TOPIC_TOC_MOBILE_OPEN_PARAM);
  } else {
    params.set(HELP_TOPIC_TOC_MOBILE_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
