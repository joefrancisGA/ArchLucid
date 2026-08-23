import { describe, expect, it } from "vitest";

import { finalizedReviewRecordDisplayLabel } from "@/lib/buyer/finalized-review-record-display-label";
import {
  SHOWCASE_BUYER_REVIEW_PACKAGE_TITLE,
  SHOWCASE_BUYER_REVIEW_TITLE,
  SHOWCASE_STATIC_DEMO_MANIFEST_ID,
  SHOWCASE_STATIC_DEMO_RUN_ID,
} from "@/lib/showcase-static-demo";
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

describe("finalizedReviewRecordDisplayLabel", () => {
  it("uses the showcase package title when the card headline is the showcase review title", () => {
    const run = summary({ runId: SHOWCASE_STATIC_DEMO_RUN_ID });

    expect(
      finalizedReviewRecordDisplayLabel(run, SHOWCASE_STATIC_DEMO_MANIFEST_ID, {
        cardTitle: SHOWCASE_BUYER_REVIEW_TITLE,
      }),
    ).toBe(SHOWCASE_BUYER_REVIEW_PACKAGE_TITLE);
  });

  it("uses the showcase review title when an explicit card headline differs", () => {
    const run = summary({ runId: SHOWCASE_STATIC_DEMO_RUN_ID });

    expect(
      finalizedReviewRecordDisplayLabel(run, SHOWCASE_STATIC_DEMO_MANIFEST_ID, {
        cardTitle: "Custom showcase headline",
      }),
    ).toBe(SHOWCASE_BUYER_REVIEW_TITLE);
  });

  it("reuses buyerFacingReviewTitleFromSummary for non-showcase reviews", () => {
    const run = summary({ runId: "other-run", description: "Payments platform review" });

    expect(finalizedReviewRecordDisplayLabel(run, "9026d565-0000-0000-0000-0000000099e8")).toBe(
      "Payments platform review",
    );
  });

  it("falls back to a truncated manifest id when no buyer title exists", () => {
    const run = summary({ runId: "other-run", description: "" });

    expect(finalizedReviewRecordDisplayLabel(run, "9026d565-0000-0000-0000-0000000099e8")).toBe(
      "9026d565…99e8",
    );
  });

  it("returns an em dash when neither title nor manifest id is available", () => {
    expect(finalizedReviewRecordDisplayLabel(summary({ runId: "other-run", description: "" }), null)).toBe(" — ");
  });
});
