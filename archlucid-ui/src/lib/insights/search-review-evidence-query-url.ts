import { SEARCH_REVIEW_EVIDENCE_PATH } from "@/lib/search-review-evidence-route";

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
  const params = new URLSearchParams(currentSearch);
  const trimmed = query.trim();

  if (trimmed.length === 0) {
    params.delete(SEARCH_REVIEW_EVIDENCE_QUERY_PARAM);
  } else {
    params.set(SEARCH_REVIEW_EVIDENCE_QUERY_PARAM, trimmed);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}

export function searchReviewEvidenceClearQueryHrefFromSearch(
  currentSearch: string,
  pathname: string = SEARCH_REVIEW_EVIDENCE_PATH,
): string {
  return searchReviewEvidenceQueryHrefFromSearch(currentSearch, "", pathname);
}
