import { SIGNED_RECORDS_LIST_PATH } from "@/lib/signed-records-paths";

export const SIGNED_RECORDS_LIST_SORT_PARAM = "sort";
export const SIGNED_RECORDS_LIST_SORT_DIR_PARAM = "dir";

export type SignedRecordsListSortKey = "reviewTitle" | "committedUtc";

const SORT_KEY_IDS = new Set<string>(["reviewTitle", "committedUtc"]);
const SORT_DIR_IDS = new Set<string>(["asc", "desc"]);

export const DEFAULT_SIGNED_RECORDS_LIST_SORT_KEY: SignedRecordsListSortKey = "committedUtc";
export const DEFAULT_SIGNED_RECORDS_LIST_SORT_ASC = false;

export function parseSignedRecordsListSortKeyFromSearch(
  raw: string | null | undefined,
): SignedRecordsListSortKey {
  if (raw === null || raw === undefined) {
    return DEFAULT_SIGNED_RECORDS_LIST_SORT_KEY;
  }

  const trimmed = raw.trim();

  if (!SORT_KEY_IDS.has(trimmed)) {
    return DEFAULT_SIGNED_RECORDS_LIST_SORT_KEY;
  }

  return trimmed as SignedRecordsListSortKey;
}

export function parseSignedRecordsListSortAscFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return DEFAULT_SIGNED_RECORDS_LIST_SORT_ASC;
  }

  const trimmed = raw.trim().toLowerCase();

  if (!SORT_DIR_IDS.has(trimmed)) {
    return DEFAULT_SIGNED_RECORDS_LIST_SORT_ASC;
  }

  return trimmed === "asc";
}

export function signedRecordsListSortHrefFromSearch(
  currentSearch: string,
  sortKey: SignedRecordsListSortKey,
  sortAsc: boolean,
  pathname: string = SIGNED_RECORDS_LIST_PATH,
): string {
  const params = new URLSearchParams(currentSearch);

  if (sortKey === DEFAULT_SIGNED_RECORDS_LIST_SORT_KEY) {
    params.delete(SIGNED_RECORDS_LIST_SORT_PARAM);
  } else {
    params.set(SIGNED_RECORDS_LIST_SORT_PARAM, sortKey);
  }

  if (sortAsc === DEFAULT_SIGNED_RECORDS_LIST_SORT_ASC) {
    params.delete(SIGNED_RECORDS_LIST_SORT_DIR_PARAM);
  } else {
    params.set(SIGNED_RECORDS_LIST_SORT_DIR_PARAM, sortAsc ? "asc" : "desc");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
