import { describe, expect, it } from "vitest";

import { resolveArchitectureCompareSiblingDefaults } from "@/lib/architecture/resolve-architecture-compare-defaults";

describe("resolveArchitectureCompareSiblingDefaults (AO-29)", () => {
  const reviews = [
    { runId: "review-newer", description: "Second review", createdUtc: "2026-01-02T00:00:00Z" },
    { runId: "review-older", description: "First review", createdUtc: "2026-01-01T00:00:00Z" },
    { runId: "review-oldest", description: "Initial review", createdUtc: "2025-12-31T00:00:00Z" },
  ];

  it("AO-29: defaults to the two newest sibling reviews", () => {
    expect(
      resolveArchitectureCompareSiblingDefaults({
        architectureId: "architecture-identity-001",
        reviews,
      }),
    ).toEqual({
      architectureId: "architecture-identity-001",
      priorRunId: "review-older",
      laterRunId: "review-newer",
    });
  });

  it("AO-29: pairs a base review with its nearest sibling", () => {
    expect(
      resolveArchitectureCompareSiblingDefaults({
        architectureId: "architecture-identity-001",
        reviews,
        baseRunId: "review-older",
      }),
    ).toEqual({
      architectureId: "architecture-identity-001",
      priorRunId: "review-older",
      laterRunId: "review-newer",
    });
  });

  it("returns null when fewer than two sibling reviews exist", () => {
    expect(
      resolveArchitectureCompareSiblingDefaults({
        architectureId: "architecture-identity-001",
        reviews: [reviews[0]!],
      }),
    ).toBeNull();
  });
});
