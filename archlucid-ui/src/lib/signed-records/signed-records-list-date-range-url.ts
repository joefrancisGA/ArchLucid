import { SIGNED_RECORDS_LIST_PATH } from "@/lib/signed-records-paths";

export const SIGNED_RECORDS_LIST_DATE_RANGE_PARAM = "range";

export type SignedRecordsListDateRangePreset = "7d" | "30d";

const SIGNED_RECORDS_LIST_DATE_RANGE_IDS = new Set<string>(["7d", "30d"]);

export function parseSignedRecordsListDateRangeFromSearch(
  raw: string | null | undefined,
): SignedRecordsListDateRangePreset | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  const trimmed = raw.trim();

  if (!SIGNED_RECORDS_LIST_DATE_RANGE_IDS.has(trimmed)) {
    return null;
  }

  return trimmed as SignedRecordsListDateRangePreset;
}

export function signedRecordsListDateRangeHrefFromSearch(
  currentSearch: string,
  preset: SignedRecordsListDateRangePreset | null,
  pathname: string = SIGNED_RECORDS_LIST_PATH,
): string {
  const params = new URLSearchParams(currentSearch);

  if (preset === null) {
    params.delete(SIGNED_RECORDS_LIST_DATE_RANGE_PARAM);
  } else {
    params.delete("from");
    params.delete("to");
    params.set(SIGNED_RECORDS_LIST_DATE_RANGE_PARAM, preset);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
