import type { RetrievalHitRelevanceTier } from "@/app/(operator)/insights/search-review-evidence/_sections/retrieval-hit-display";
import { SEARCH_REVIEW_EVIDENCE_PATH } from "@/lib/search-review-evidence-route";

export const SEARCH_REVIEW_EVIDENCE_CONFIDENCE_PARAM = "confidence";

export const SEARCH_REVIEW_EVIDENCE_CONFIDENCE_OPTIONS: readonly RetrievalHitRelevanceTier[] = [
  "high",
  "medium",
  "low",
];

const SEARCH_REVIEW_EVIDENCE_CONFIDENCE_IDS = new Set<string>(SEARCH_REVIEW_EVIDENCE_CONFIDENCE_OPTIONS);

export function parseSearchReviewEvidenceConfidenceFromSearch(
  raw: string | null | undefined,
): RetrievalHitRelevanceTier | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  const trimmed = raw.trim().toLowerCase();

  if (!SEARCH_REVIEW_EVIDENCE_CONFIDENCE_IDS.has(trimmed)) {
    return null;
  }

  return trimmed as RetrievalHitRelevanceTier;
}

export function searchReviewEvidenceConfidenceHrefFromSearch(
  currentSearch: string,
  confidence: RetrievalHitRelevanceTier | null,
  pathname: string = SEARCH_REVIEW_EVIDENCE_PATH,
): string {
  const params = new URLSearchParams(currentSearch);
  params.delete("cursor");

  if (confidence === null) {
    params.delete(SEARCH_REVIEW_EVIDENCE_CONFIDENCE_PARAM);
  } else {
    params.set(SEARCH_REVIEW_EVIDENCE_CONFIDENCE_PARAM, confidence);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
