export const HELP_REPEAT_REVIEW_LOOP_SOURCES_OPEN_PARAM = "helpRepeatReviewLoopSourcesOpen";

export function parseHelpRepeatReviewLoopSourcesOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function helpRepeatReviewLoopSourcesDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(HELP_REPEAT_REVIEW_LOOP_SOURCES_OPEN_PARAM);
  } else {
    params.set(HELP_REPEAT_REVIEW_LOOP_SOURCES_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
