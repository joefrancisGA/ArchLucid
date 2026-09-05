export const RUN_DETAIL_RECORD_METADATA_OPEN_PARAM = "runRecordMetaOpen";

export function parseRunDetailRecordMetadataOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function runDetailRecordMetadataHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(RUN_DETAIL_RECORD_METADATA_OPEN_PARAM);
  } else {
    params.set(RUN_DETAIL_RECORD_METADATA_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
