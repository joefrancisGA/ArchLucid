import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const TECHNOLOGY_BASELINE_ENTRY_PARAM = "techEntryId";

export function parseTechnologyBaselineEntryIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function technologyBaselineRationaleHrefFromSearch(
  currentSearch: string,
  entryId: string | null,
  pathname: string,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {
    const trimmed = (entryId ?? "").trim();

    if (trimmed.length === 0) {
      params.delete(TECHNOLOGY_BASELINE_ENTRY_PARAM);
    } else {
      params.set(TECHNOLOGY_BASELINE_ENTRY_PARAM, trimmed);
    }
    },
  });
}
