import { describe, expect, it } from "vitest";

import {
  loadDeferredChunkFromManifest,
  OPERATOR_HOME_DEFERRED_CHUNK_LOADER_IDS,
  REVIEWS_HUB_DEFERRED_CHUNK_LOADER_IDS,
  RUN_DETAIL_DEFERRED_CHUNK_LOADER_IDS,
} from "@/lib/operator/load-deferred-chunk-from-manifest";
import { OPERATOR_HOME_CHUNK_MANIFEST } from "@/lib/operator/operator-home-chunk-manifest";
import { REVIEWS_HUB_CHUNK_MANIFEST } from "@/lib/operator/reviews-hub-chunk-manifest";
import { RUN_DETAIL_CHUNK_MANIFEST } from "@/lib/operator/run-detail-chunk-manifest";

describe("loadDeferredChunkFromManifest (TB-2371)", () => {
  it("registers import loaders for every operator-home manifest entry", () => {
    for (const entry of OPERATOR_HOME_CHUNK_MANIFEST) {
      expect(OPERATOR_HOME_DEFERRED_CHUNK_LOADER_IDS).toContain(entry.id);
      expect(() => loadDeferredChunkFromManifest(entry.id)).not.toThrow();
    }
  });

  it("registers import loaders for reviews-hub manifest entries wired in the loader switch", () => {
    for (const entry of REVIEWS_HUB_CHUNK_MANIFEST) {
      if (!REVIEWS_HUB_DEFERRED_CHUNK_LOADER_IDS.includes(entry.id)) {
        continue;
      }

      expect(() => loadDeferredChunkFromManifest(entry.id)).not.toThrow();
    }
  });

  it("registers import loaders for every run-detail manifest entry", () => {
    for (const entry of RUN_DETAIL_CHUNK_MANIFEST) {
      expect(RUN_DETAIL_DEFERRED_CHUNK_LOADER_IDS).toContain(entry.id);
      expect(() => loadDeferredChunkFromManifest(entry.id)).not.toThrow();
    }
  });

  it("rejects unknown manifest entry ids", () => {
    expect(() => loadDeferredChunkFromManifest("missing-chunk-id")).toThrow(
      /Unknown deferred chunk manifest entry/,
    );
  });
});
