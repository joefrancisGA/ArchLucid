import { describe, expect, it } from "vitest";

import { provenanceReviewContextFromSummary } from "@/lib/provenance-review-context";
import type { RunSummary } from "@/types/authority";

function sampleSummary(overrides: Partial<RunSummary> = {}): RunSummary {
  return {
    runId: "customer-intake-modernization",
    projectId: "default",
    createdUtc: "2026-01-01T00:00:00.000Z",
    displayName: "Claims intake modernization",
    description: "",
    hasGoldenManifest: true,
    hasFindingsSnapshot: true,
    hasGraphSnapshot: true,
    hasContextSnapshot: true,
    ...overrides,
  } as RunSummary;
}

describe("provenanceReviewContextFromSummary", () => {
  it("maps review title and pipeline outcome for the provenance header", () => {
    const context = provenanceReviewContextFromSummary(sampleSummary());

    expect(context.reviewTitle).toBe("Enterprise Customer Intake Modernization Review");
    expect(context.statusLabel).toBe("Ready");
    expect(context.statusTagKind).toBe("approved");
  });
});
