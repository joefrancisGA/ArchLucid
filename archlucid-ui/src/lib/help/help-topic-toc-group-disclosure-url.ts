export const HELP_TOPIC_TOC_GROUP_KEY_PARAM = "helpTopicTocGroupKey";

export function parseHelpTopicTocGroupKeyFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function helpTopicTocGroupDisclosureHrefFromSearch(
  currentSearch: string,
  groupKey: string | null,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);
  const trimmed = (groupKey ?? "").trim();

  if (trimmed.length === 0) {
    params.delete(HELP_TOPIC_TOC_GROUP_KEY_PARAM);
  } else {
    params.set(HELP_TOPIC_TOC_GROUP_KEY_PARAM, trimmed);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
