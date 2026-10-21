import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
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
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {
    const trimmed = (runId ?? "").trim();

    if (trimmed.length === 0) {
      params.delete(SIGNED_RECORDS_LIST_SEAL_DETAILS_RUN_ID_PARAM);
    } else {
      params.set(SIGNED_RECORDS_LIST_SEAL_DETAILS_RUN_ID_PARAM, trimmed);
    }
    },
  });
}
