export const SIGNED_RECORDS_LIST_SEAL_DETAILS_RUN_ID_PARAM = "signedRecordsListSealDetailsRunId";

export function parseSignedRecordsListSealDetailsRunIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function signedRecordsListSealDetailsDisclosureHrefFromSearch(
  currentSearch: string,
  runId: string | null,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);
  const trimmed = (runId ?? "").trim();

  if (trimmed.length === 0) {
    params.delete(SIGNED_RECORDS_LIST_SEAL_DETAILS_RUN_ID_PARAM);
  } else {
    params.set(SIGNED_RECORDS_LIST_SEAL_DETAILS_RUN_ID_PARAM, trimmed);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
