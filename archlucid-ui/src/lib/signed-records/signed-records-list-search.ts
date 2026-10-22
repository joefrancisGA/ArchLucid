import { SIGNED_RECORDS_LIST_PATH } from "@/lib/signed-records-paths";
import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";

export const SIGNED_RECORDS_LIST_SEARCH_PARAM = "q";

export function parseSignedRecordsListSearchQuery(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw;
}

export function signedRecordsListSearchHrefFromSearch(
  currentSearch: string,
  query: string,
  pathname: string = SIGNED_RECORDS_LIST_PATH,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {
    const trimmed = query.trim();

    if (trimmed.length === 0) {
      params.delete(SIGNED_RECORDS_LIST_SEARCH_PARAM);
    } else {
      params.set(SIGNED_RECORDS_LIST_SEARCH_PARAM, trimmed);
    }
    },
  });
}
