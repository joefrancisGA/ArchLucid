import { describe, expect, it } from "vitest";

import {
  dependencyNeighborhoodRequiresAppliedSeed,
  resolveDependencyNeighborhoodSeedBlockedReason,
} from "@/lib/infra-evidence/infra-evidence-diagrams-dependency-seed";

describe("infra-evidence-diagrams-dependency-seed", () => {
  it("requires an applied seed before dependency neighborhood render", () => {
    expect(dependencyNeighborhoodRequiresAppliedSeed("dependencyNeighborhood", "")).toBe(true);
    expect(dependencyNeighborhoodRequiresAppliedSeed("dependencyNeighborhood", "node-1")).toBe(false);
    expect(dependencyNeighborhoodRequiresAppliedSeed("executive", "")).toBe(false);
  });

  it("returns null when no seed has been applied yet", () => {
    expect(
      resolveDependencyNeighborhoodSeedBlockedReason({
        appliedSeedNodeId: "",
        loadError: "seedNodeId is required",
        renderResult: null,
      }),
    ).toBeNull();
  });

  it("surfaces API errors after a seed was applied", () => {
    expect(
      resolveDependencyNeighborhoodSeedBlockedReason({
        appliedSeedNodeId: "bad-seed",
        loadError: "Request validation failed (HTTP 400): seedNodeId is required for dependencyNeighborhood mode.",
        renderResult: null,
      }),
    ).toEqual({
      title: "Dependency neighborhood could not render",
      message: "Request validation failed (HTTP 400): seedNodeId is required for dependencyNeighborhood mode.",
    });
  });

  it("flags succeeded renders with no diagram content", () => {
    expect(
      resolveDependencyNeighborhoodSeedBlockedReason({
        appliedSeedNodeId: "22222222-2222-2222-2222-222222222222",
        loadError: null,
        renderResult: {
          snapshotId: "11111111-1111-1111-1111-111111111111",
          mode: "dependencyNeighborhood",
          fallbackKey: null,
          status: "Succeeded",
          mermaid: "",
          metrics: {
            nodeCount: 0,
            edgeCount: 0,
            subgraphCount: 0,
            maxDegree: 0,
            crossSubgraphEdgeCount: 0,
            textSizeBytes: 0,
            layoutEstimate: 0,
          },
          fallbackArtifacts: [],
        },
      })?.title,
    ).toBe("Starting resource did not match this snapshot");
  });
});
