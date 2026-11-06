import type { RetrievalHit } from "@/app/(operator)/insights/search-review-evidence/_sections/retrieval-hit";

/** First finding id from search hits — grounds Open review on the cite strip when results are finding-scoped. */
export function resolveSearchReviewEvidencePrimaryFindingId(
  hits: readonly RetrievalHit[],
): string | null {
  for (const hit of hits) {
    const findingId = hit.findingId?.trim() ?? "";

    if (findingId.length > 0) {
      return findingId;
    }

    if (hit.sourceType === "ManifestFinding") {
      const sourceId = hit.sourceId?.trim() ?? "";

      if (sourceId.length > 0) {
        return sourceId;
      }
    }
  }

  return null;
}
