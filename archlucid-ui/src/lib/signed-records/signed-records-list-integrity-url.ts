import { SIGNED_RECORDS_LIST_PATH } from "@/lib/signed-records-paths";
import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";

export type SignedRecordsListIntegrityFilter = "all" | "sealed" | "needs-attention" | "unavailable";

export const SIGNED_RECORDS_LIST_INTEGRITY_PARAM = "integrity";

const INTEGRITY_FILTER_IDS = new Set<string>(["all", "sealed", "needs-attention", "unavailable"]);

export function parseSignedRecordsListIntegrityFilter(
  raw: string | null | undefined,
): SignedRecordsListIntegrityFilter {
  if (raw === null || raw === undefined) {
    return "all";
  }

  const trimmed = raw.trim();

  if (!INTEGRITY_FILTER_IDS.has(trimmed)) {
    return "all";
  }

  return trimmed as SignedRecordsListIntegrityFilter;
}

export function signedRecordsListIntegrityHrefFromSearch(
  currentSearch: string,
  integrity: SignedRecordsListIntegrityFilter,
  pathname: string = SIGNED_RECORDS_LIST_PATH,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {

    if (integrity === "all") {
      params.delete(SIGNED_RECORDS_LIST_INTEGRITY_PARAM);
    } else {
      params.set(SIGNED_RECORDS_LIST_INTEGRITY_PARAM, integrity);
    }
    },
  });
}
