import { SIGNED_RECORDS_LIST_PATH } from "@/lib/signed-records-paths";

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
  const params = new URLSearchParams(currentSearch);
  const trimmed = query.trim();

  if (trimmed.length === 0) {
    params.delete(SIGNED_RECORDS_LIST_SEARCH_PARAM);
  } else {
    params.set(SIGNED_RECORDS_LIST_SEARCH_PARAM, trimmed);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
