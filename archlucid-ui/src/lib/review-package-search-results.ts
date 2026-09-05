import { isShowcaseDemoRunId } from "@/lib/graph-page-state";

import type { RetrievalHit } from "@/app/(operator)/insights/search-review-evidence/_sections/retrieval-hit";

/** Live tenants must not surface showcase run ids in package-scoped search (WA-19 / LD-02). */
export function filterLivePackageSearchHits(
  hits: readonly RetrievalHit[],
  packageRunId: string,
): readonly RetrievalHit[] {
  if (isShowcaseDemoRunId(packageRunId)) {
    return hits;
  }

  return hits.filter((hit) => !isShowcaseDemoRunId(hit.sourceId));
}
