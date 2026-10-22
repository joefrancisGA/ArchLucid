import { describe, expect, it } from "vitest";

import {
  DEFERRED_CHUNK_MANIFEST,
  deferredChunkManifestEntry,
} from "@/lib/operator/deferred-chunk-manifest";

describe("deferred-chunk-manifest (TB-2371)", () => {
  it("lists unique deferred chunk ids with module paths", () => {
    const ids = DEFERRED_CHUNK_MANIFEST.map((entry) => entry.id);

    expect(ids.length).toBeGreaterThan(0);
    expect(new Set(ids).size).toBe(ids.length);
    expect(DEFERRED_CHUNK_MANIFEST.every((entry) => entry.modulePath.startsWith("@/"))).toBe(true);
  });

  it("resolves manifest entries by id", () => {
    const entry = deferredChunkManifestEntry("operator-home-hero");

    expect(entry?.exportName).toBe("BuyerPolishedHomeHeroSection");
    expect(entry?.label).toContain("overview hero");
  });
});
