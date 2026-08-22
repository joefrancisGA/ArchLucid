import { describe, expect, it } from "vitest";

import { canArchiveReview } from "@/lib/review-archive-eligibility";

describe("review-archive-eligibility", () => {
  it("allows archive for in-flight reviews", () => {
    expect(
      canArchiveReview({
        runId: "run-1",
        hasGoldenManifest: false,
        isArchived: false,
      }),
    ).toBe(true);
  });

  it("blocks archive for sealed reviews", () => {
    expect(
      canArchiveReview({
        runId: "run-1",
        hasGoldenManifest: true,
        isArchived: false,
      }),
    ).toBe(false);
  });

  it("blocks archive when already archived", () => {
    expect(
      canArchiveReview({
        runId: "run-1",
        hasGoldenManifest: false,
        isArchived: true,
      }),
    ).toBe(false);
  });
});
