import { describe, expect, it } from "vitest";

import { DEFERRED_CHUNK_MANIFEST } from "@/lib/operator/deferred-chunk-manifest";
import { OPERATOR_HOME_CHUNK_MANIFEST } from "@/lib/operator/operator-home-chunk-manifest";
import { REVIEWS_HUB_CHUNK_MANIFEST } from "@/lib/operator/reviews-hub-chunk-manifest";
import { RUN_DETAIL_CHUNK_MANIFEST } from "@/lib/operator/run-detail-chunk-manifest";

describe("route deferred chunk manifests (TB-2371)", () => {
  it("merges route manifests into the global deferred chunk catalog", () => {
    for (const entry of OPERATOR_HOME_CHUNK_MANIFEST) {
      expect(DEFERRED_CHUNK_MANIFEST.some((row) => row.id === entry.id)).toBe(true);
    }

    for (const entry of REVIEWS_HUB_CHUNK_MANIFEST) {
      expect(DEFERRED_CHUNK_MANIFEST.some((row) => row.id === entry.id)).toBe(true);
    }

    for (const entry of RUN_DETAIL_CHUNK_MANIFEST) {
      expect(DEFERRED_CHUNK_MANIFEST.some((row) => row.id === entry.id)).toBe(true);
    }
  });

  it("keeps unique chunk ids across merged manifests", () => {
    const merged = [...OPERATOR_HOME_CHUNK_MANIFEST, ...REVIEWS_HUB_CHUNK_MANIFEST, ...RUN_DETAIL_CHUNK_MANIFEST];
    const ids = merged.map((entry) => entry.id);

    expect(new Set(ids).size).toBe(ids.length);
  });
});
