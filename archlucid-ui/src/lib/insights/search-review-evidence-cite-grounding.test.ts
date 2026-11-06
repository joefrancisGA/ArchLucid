import { describe, expect, it } from "vitest";

import type { RetrievalHit } from "@/app/(operator)/insights/search-review-evidence/_sections/retrieval-hit";
import { resolveSearchReviewEvidencePrimaryFindingId } from "@/lib/insights/search-review-evidence-cite-grounding";

describe("resolveSearchReviewEvidencePrimaryFindingId", () => {
  it("prefers explicit findingId on hits", () => {
    const hits: RetrievalHit[] = [
      {
        chunkId: "c1",
        documentId: "d1",
        sourceType: "ManifestFinding",
        sourceId: "source-1",
        title: "Hit",
        text: "text",
        score: 0.9,
        findingId: "finding-9",
      },
    ];

    expect(resolveSearchReviewEvidencePrimaryFindingId(hits)).toBe("finding-9");
  });

  it("falls back to ManifestFinding sourceId", () => {
    const hits: RetrievalHit[] = [
      {
        chunkId: "c1",
        documentId: "d1",
        sourceType: "ManifestFinding",
        sourceId: "finding-from-source",
        title: "Hit",
        text: "text",
        score: 0.5,
      },
    ];

    expect(resolveSearchReviewEvidencePrimaryFindingId(hits)).toBe("finding-from-source");
  });
});
