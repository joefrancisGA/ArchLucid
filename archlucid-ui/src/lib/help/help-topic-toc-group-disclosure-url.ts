import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
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
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {
    const trimmed = (groupKey ?? "").trim();

    if (trimmed.length === 0) {
      params.delete(HELP_TOPIC_TOC_GROUP_KEY_PARAM);
    } else {
      params.set(HELP_TOPIC_TOC_GROUP_KEY_PARAM, trimmed);
    }
    },
  });
}
