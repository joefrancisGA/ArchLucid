import { SEARCH_REVIEW_EVIDENCE_PATH } from "@/lib/search-review-evidence-route";
import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";

export const SEARCH_REVIEW_EVIDENCE_QUERY_PARAM = "q";

export function parseSearchReviewEvidenceQueryFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw;
}

export function searchReviewEvidenceQueryHrefFromSearch(
  currentSearch: string,
  query: string,
  pathname: string = SEARCH_REVIEW_EVIDENCE_PATH,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {
    const trimmed = query.trim();

    if (trimmed.length === 0) {
      params.delete(SEARCH_REVIEW_EVIDENCE_QUERY_PARAM);
    } else {
      params.set(SEARCH_REVIEW_EVIDENCE_QUERY_PARAM, trimmed);
    }
    },
  });
}

export function searchReviewEvidenceClearQueryHrefFromSearch(
  currentSearch: string,
  pathname: string = SEARCH_REVIEW_EVIDENCE_PATH,
): string {
  return searchReviewEvidenceQueryHrefFromSearch(currentSearch, "", pathname);
}
