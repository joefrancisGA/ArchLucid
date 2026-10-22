import { SIGNED_RECORDS_LIST_PATH } from "@/lib/signed-records-paths";
import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";

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
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {
    const trimmed = cursor.trim();

    if (trimmed.length === 0) {
      params.delete(SIGNED_RECORDS_LIST_CURSOR_PARAM);
    } else {
      params.set(SIGNED_RECORDS_LIST_CURSOR_PARAM, trimmed);
    }
    },
  });
}

export function signedRecordsListClearCursorHrefFromSearch(
  currentSearch: string,
  pathname: string = SIGNED_RECORDS_LIST_PATH,
): string {
  return signedRecordsListCursorHrefFromSearch(currentSearch, "", pathname);
}
