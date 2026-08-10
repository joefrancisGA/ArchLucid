import { describe, expect, it } from "vitest";

import { LEGACY_ARCHITECTURE_GRAPH_ROUTE_METADATA } from "@/lib/legacy-architecture-graph-route-metadata";

describe("LEGACY_ARCHITECTURE_GRAPH_ROUTE_METADATA (TB-1807)", () => {
  it("marks the legacy operate architecture-graph shim as non-indexable redirect-only metadata", () => {
    expect(LEGACY_ARCHITECTURE_GRAPH_ROUTE_METADATA.title).toBe("Redirecting to architecture graph");
    expect(LEGACY_ARCHITECTURE_GRAPH_ROUTE_METADATA.title?.toLowerCase()).not.toBe("architecture graph");
    expect(LEGACY_ARCHITECTURE_GRAPH_ROUTE_METADATA.description?.toLowerCase()).toContain("redirect");
    expect(LEGACY_ARCHITECTURE_GRAPH_ROUTE_METADATA.description?.toLowerCase()).toContain("evidence-graph");
    expect(LEGACY_ARCHITECTURE_GRAPH_ROUTE_METADATA.robots).toEqual({ index: false, follow: false });
  });
});
