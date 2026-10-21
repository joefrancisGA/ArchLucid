import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
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
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, RUN_DETAIL_RECORD_METADATA_OPEN_PARAM);
}
