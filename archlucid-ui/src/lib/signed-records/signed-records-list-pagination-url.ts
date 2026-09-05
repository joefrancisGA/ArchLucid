import { SIGNED_RECORDS_LIST_PATH } from "@/lib/signed-records-paths";

export const SIGNED_RECORDS_LIST_CURSOR_PARAM = "cursor";

export function parseSignedRecordsListCursorFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function signedRecordsListCursorHrefFromSearch(
  currentSearch: string,
  cursor: string,
  pathname: string = SIGNED_RECORDS_LIST_PATH,
): string {
  const params = new URLSearchParams(currentSearch);
  const trimmed = cursor.trim();

  if (trimmed.length === 0) {
    params.delete(SIGNED_RECORDS_LIST_CURSOR_PARAM);
  } else {
    params.set(SIGNED_RECORDS_LIST_CURSOR_PARAM, trimmed);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}

export function signedRecordsListClearCursorHrefFromSearch(
  currentSearch: string,
  pathname: string = SIGNED_RECORDS_LIST_PATH,
): string {
  return signedRecordsListCursorHrefFromSearch(currentSearch, "", pathname);
}
