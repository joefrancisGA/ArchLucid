import { describe, expect, it } from "vitest";

import { filterLivePackageSearchHits } from "@/lib/review-package-search-results";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import type { RetrievalHit } from "@/app/(operator)/insights/search-review-evidence/_sections/retrieval-hit";

function hit(sourceId: string): RetrievalHit {
  return {
    chunkId: `chunk-${sourceId}`,
    documentId: "doc-1",
    sourceType: "finding",
    sourceId,
    title: "Sample",
    text: "Body",
    score: 0.9,
  };
}

describe("filterLivePackageSearchHits (WA-19)", () => {
  it("filters showcase run ids on live tenants", () => {
    const filtered = filterLivePackageSearchHits(
      [hit("live-run"), hit(SHOWCASE_STATIC_DEMO_RUN_ID)],
      "live-run",
    );

    expect(filtered.map((row) => row.sourceId)).toEqual(["live-run"]);
  });

  it("keeps showcase hits when the open package is showcase", () => {
    const filtered = filterLivePackageSearchHits(
      [hit(SHOWCASE_STATIC_DEMO_RUN_ID)],
      SHOWCASE_STATIC_DEMO_RUN_ID,
    );

    expect(filtered).toHaveLength(1);
  });
});
