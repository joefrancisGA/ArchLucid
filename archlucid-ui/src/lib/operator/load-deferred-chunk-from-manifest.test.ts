import { describe, expect, it } from "vitest";

import {
  loadDeferredChunkFromManifest,
  OPERATOR_HOME_DEFERRED_CHUNK_LOADER_IDS,
} from "@/lib/operator/load-deferred-chunk-from-manifest";
import { OPERATOR_HOME_CHUNK_MANIFEST } from "@/lib/operator/operator-home-chunk-manifest";

describe("loadDeferredChunkFromManifest (TB-2371)", () => {
  it("registers import loaders for every operator-home manifest entry", () => {
    for (const entry of OPERATOR_HOME_CHUNK_MANIFEST) {
      expect(OPERATOR_HOME_DEFERRED_CHUNK_LOADER_IDS).toContain(entry.id);
      expect(() => loadDeferredChunkFromManifest(entry.id)).not.toThrow();
    }
  });

  it("rejects unknown manifest entry ids", () => {
    expect(() => loadDeferredChunkFromManifest("missing-chunk-id")).toThrow(
      /Unknown deferred chunk manifest entry/,
    );
  });
});
