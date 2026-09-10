import { describe, expect, it } from "vitest";

import { resolveWorkingRunReviewLocator } from "@/lib/architecture/resolve-working-run-review-locator";
import { architectureNestedReviewPath, reviewDetailPath } from "@/lib/architecture/architecture-routes";

describe("resolveWorkingRunReviewLocator (AO-08)", () => {
  it("nests the review when architectureId is explicit", () => {
    expect(
      resolveWorkingRunReviewLocator({
        runId: "run-001",
        architectureId: "architecture-identity-001",
      }),
    ).toEqual({
      architectureId: "architecture-identity-001",
      href: architectureNestedReviewPath("architecture-identity-001", "run-001"),
    });
  });

  it("resolves architectureId from draft registry parentage", () => {
    expect(
      resolveWorkingRunReviewLocator({
        runId: "run-001",
        draftRegistryEntries: [
          {
            draftId: "draft-1",
            displayName: "Payments",
            customerStatus: "in-review",
            ownerLabel: "You",
            lastUpdatedUtc: "2026-01-01T00:00:00Z",
            linkedReviewId: "run-001",
            serverUpdatedUtc: "2026-01-01T00:00:00Z",
            parentArchitectureId: "architecture-identity-001",
          },
        ],
      }),
    ).toEqual({
      architectureId: "architecture-identity-001",
      href: architectureNestedReviewPath("architecture-identity-001", "run-001"),
    });
  });

  it("falls back to peer review URL when architecture is unknown", () => {
    expect(
      resolveWorkingRunReviewLocator({
        runId: "run-unlinked",
      }),
    ).toEqual({
      architectureId: null,
      href: reviewDetailPath("run-unlinked"),
    });
  });
});
