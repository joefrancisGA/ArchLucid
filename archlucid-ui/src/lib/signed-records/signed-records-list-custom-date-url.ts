import { SIGNED_RECORDS_LIST_PATH } from "@/lib/signed-records-paths";
import { SIGNED_RECORDS_LIST_DATE_RANGE_PARAM } from "@/lib/signed-records/signed-records-list-date-range-url";

export const SIGNED_RECORDS_LIST_FROM_PARAM = "from";
export const SIGNED_RECORDS_LIST_TO_PARAM = "to";

const DATE_INPUT_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function parseSignedRecordsListCustomDateFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  const trimmed = raw.trim();

  if (!DATE_INPUT_PATTERN.test(trimmed)) {
    return "";
  }

  return trimmed;
}

export function signedRecordsListCustomDateHrefFromSearch(
  currentSearch: string,
  fromUtc: string,
  toUtc: string,
  pathname: string = SIGNED_RECORDS_LIST_PATH,
): string {
  const params = new URLSearchParams(currentSearch);
  const from = parseSignedRecordsListCustomDateFromSearch(fromUtc);
  const to = parseSignedRecordsListCustomDateFromSearch(toUtc);

  if (from.length === 0 && to.length === 0) {
    params.delete(SIGNED_RECORDS_LIST_FROM_PARAM);
    params.delete(SIGNED_RECORDS_LIST_TO_PARAM);
  } else {
    params.delete(SIGNED_RECORDS_LIST_DATE_RANGE_PARAM);

    if (from.length === 0) {
      params.delete(SIGNED_RECORDS_LIST_FROM_PARAM);
    } else {
      params.set(SIGNED_RECORDS_LIST_FROM_PARAM, from);
    }

    if (to.length === 0) {
      params.delete(SIGNED_RECORDS_LIST_TO_PARAM);
    } else {
      params.set(SIGNED_RECORDS_LIST_TO_PARAM, to);
    }
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
