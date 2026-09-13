import { describe, expect, it } from "vitest";

import { resolveReviewsHubContinueReviewCandidate } from "@/lib/reviews-hub-continue-review";
import type { RunSummary } from "@/types/authority";

function run(overrides: Partial<RunSummary> = {}): RunSummary {
  return {
    runId: "run-a",
    createdUtc: "2026-08-24T10:00:00.000Z",
    hasFindingsSnapshot: false,
    hasGoldenManifest: false,
    ...overrides,
  } as RunSummary;
}

describe("resolveReviewsHubContinueReviewCandidate", () => {
  it("returns the highest-priority in-flight review", () => {
    const candidate = resolveReviewsHubContinueReviewCandidate([
      run({ runId: "finalized", hasGoldenManifest: true }),
      run({ runId: "in-flight", hasFindingsSnapshot: false, hasGoldenManifest: false }),
    ]);

    expect(candidate?.runId).toBe("in-flight");
    expect(candidate?.kind).toBe("review-in-progress");
    expect(candidate?.href).toContain("in-flight");
  });

  it("prefers awaiting-disposition over in-progress reviews", () => {
    const candidate = resolveReviewsHubContinueReviewCandidate([
      run({ runId: "in-flight", hasFindingsSnapshot: false, hasGoldenManifest: false }),
      run({ runId: "awaiting", hasFindingsSnapshot: true, hasGoldenManifest: false }),
    ]);

    expect(candidate?.runId).toBe("awaiting");
    expect(candidate?.kind).toBe("awaiting-disposition");
  });

  it("IP-002: lands on inhabited findings when parent architecture id is known", () => {
    const candidate = resolveReviewsHubContinueReviewCandidate(
      [run({ runId: "run-001", requestId: "architecture-identity-001" })],
      {
        draftRegistryEntries: [
          {
            draftId: "draft-001",
            displayName: "Payments",
            customerStatus: "in-review",
            ownerLabel: "You",
            lastUpdatedUtc: "2026-01-15T12:00:00.000Z",
            linkedReviewId: "run-001",
            serverUpdatedUtc: "2026-01-15T12:00:00.000Z",
            parentArchitectureId: "architecture-identity-001",
          },
        ],
      },
    );

    expect(candidate?.href).toBe(
      "/architecture/architectures/architecture-identity-001/findings?runId=run-001",
    );
  });
});
