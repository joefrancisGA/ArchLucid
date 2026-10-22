import { describe, expect, it } from "vitest";

import { PATTERN_LIBRARY_SAMPLE_CATALOG } from "@/lib/pattern-library-catalog";
import { resolvePatternLibraryPeerCompare } from "@/lib/pattern-library-peer-compare";
import type { PatternLibraryRecord } from "@/lib/pattern-library-types";

describe("resolvePatternLibraryPeerCompare (TB-1812)", () => {
  it("never self-links api-gateway-bff", () => {
    const peer = resolvePatternLibraryPeerCompare("api-gateway-bff");

    expect(peer).not.toBeNull();
    expect(peer?.patternKey).not.toBe("api-gateway-bff");
    expect(peer?.href).toBe("/insights/patterns/three-tier-app-modernization");
  });

  it("prefers same pattern type with shared domain over unrelated keys", () => {
    const peer = resolvePatternLibraryPeerCompare("api-gateway-bff");

    expect(peer?.patternKey).toBe("three-tier-app-modernization");
    expect(peer?.label).toContain("Three-tier app modernization");
  });

  it("picks a domain-overlap peer when pattern type has no catalog sibling", () => {
    const peer = resolvePatternLibraryPeerCompare("private-endpoints-paas");

    expect(peer?.patternKey).toBe("event-driven-claims-intake");
  });

  it("returns null for unknown pattern keys", () => {
    expect(resolvePatternLibraryPeerCompare("not-a-pattern")).toBeNull();
  });

  it("returns null when catalog has only the current pattern", () => {
    const soloCatalog: PatternLibraryRecord[] = [PATTERN_LIBRARY_SAMPLE_CATALOG[0]!];

    expect(resolvePatternLibraryPeerCompare("private-endpoints-paas", soloCatalog)).toBeNull();
  });
});
