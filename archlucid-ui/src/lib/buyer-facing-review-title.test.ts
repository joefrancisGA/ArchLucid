import { describe, expect, it } from "vitest";

import { buyerFacingReviewTitleFromSummary } from "@/lib/buyer-facing-review-title";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import type { RunSummary } from "@/types/authority";

function summary(overrides: Partial<RunSummary>): RunSummary {
  return {
    runId: "rid",
    projectId: "default",
    description: "Test",
    createdUtc: "2026-01-01T00:00:00.000Z",
    hasFindingsSnapshot: false,
    hasGoldenManifest: false,
    ...overrides,
  };
}

describe("buyerFacingReviewTitleFromSummary", () => {
  it("uses stable Claims Intake title for the showcase review id", () => {
    const title = buyerFacingReviewTitleFromSummary(
      summary({ runId: SHOWCASE_STATIC_DEMO_RUN_ID, description: "Legacy description" }),
    );

    expect(title).toBe("Claims Intake Modernization Review");
  });

  it("uses stable title for legacy demo run id aliases", () => {
    expect(
      buyerFacingReviewTitleFromSummary(
        summary({ runId: "claims-intake-modernization-run", description: "Claims Intake Modernization — sample case…" }),
      ),
    ).toBe("Claims Intake Modernization Review");
  });

  it("falls back to description then untitled", () => {
    expect(buyerFacingReviewTitleFromSummary(summary({ runId: "other", description: "  My review  " }))).toBe("My review");

    expect(buyerFacingReviewTitleFromSummary(summary({ runId: "other", description: "" }))).toBe("Untitled review");
  });

  it("does not use a description that only repeats the run id", () => {
    expect(buyerFacingReviewTitleFromSummary(summary({ runId: "my-run-slug", description: "my-run-slug" }))).toBe(
      "Untitled review",
    );

    expect(buyerFacingReviewTitleFromSummary(summary({ runId: "My-Run", description: "my-run" }))).toBe("Untitled review");
  });

  it("prefers API displayName when it is not redundant with the run id", () => {
    expect(
      buyerFacingReviewTitleFromSummary(
        summary({
          runId: "other-run",
          displayName: "  Sponsor-facing title  ",
          description: "Secondary description",
        }),
      ),
    ).toBe("Sponsor-facing title");
  });

  it("falls through to description when displayName only echoes the slug", () => {
    expect(
      buyerFacingReviewTitleFromSummary(
        summary({ runId: "my-run", displayName: "my-run", description: "Actual human title" }),
      ),
    ).toBe("Actual human title");
  });
});
