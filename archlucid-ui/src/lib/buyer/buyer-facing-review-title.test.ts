import { describe, expect, it } from "vitest";

import {
  buyerFacingReviewLinkLabelFromRunId,
  buyerFacingReviewTitleFromSummary,
} from "@/lib/buyer/buyer-facing-review-title";
import {
  SHOWCASE_BUYER_REVIEW_PACKAGE_TITLE,
  SHOWCASE_BUYER_REVIEW_TITLE,
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

describe("buyerFacingReviewTitleFromSummary", () => {
  it("uses stable Claims Intake title for the showcase review id", () => {
    const title = buyerFacingReviewTitleFromSummary(
      summary({ runId: SHOWCASE_STATIC_DEMO_RUN_ID, description: "Legacy description" }),
    );

    expect(title).toBe(SHOWCASE_BUYER_REVIEW_PACKAGE_TITLE);
  });

  it("uses stable title for legacy demo run id aliases", () => {
    expect(
      buyerFacingReviewTitleFromSummary(
        summary({ runId: "customer-intake-modernization-run", description: "Claims Intake Modernization — sample case…" }),
      ),
    ).toBe(SHOWCASE_BUYER_REVIEW_PACKAGE_TITLE);
  });

  it("legacy alias ignores procurement-style package displayName from APIs", () => {
    expect(
      buyerFacingReviewTitleFromSummary(
        summary({
          runId: "customer-intake-modernization-run",
          displayName: SHOWCASE_BUYER_REVIEW_PACKAGE_TITLE,
          description: "Fallback description",
        }),
      ),
    ).toBe(SHOWCASE_BUYER_REVIEW_PACKAGE_TITLE);
  });

  it("does not fall back to description when display name was stored empty", () => {
    expect(
      buyerFacingReviewTitleFromSummary(
        summary({ runId: "other", displayName: "   ", description: "Human title from description" }),
      ),
    ).toBe("Review display name was stored empty.");
  });

  it("labels omitted description separately from omitted title", () => {
    expect(
      buyerFacingReviewTitleFromSummary(summary({ runId: "other", displayName: null, description: null })),
    ).toBe("Review title was not stored.");

    expect(buyerFacingReviewTitleFromSummary(summary({ runId: "other", description: "" }))).toBe(
      "Review description was not stored.",
    );
  });

  it("labels omitted title when display name and description are null", () => {
    expect(
      buyerFacingReviewTitleFromSummary(
        summary({ runId: "other", displayName: null, description: null }),
      ),
    ).toBe("Review title was not stored.");
  });

  it("falls back to description then untitled", () => {
    expect(buyerFacingReviewTitleFromSummary(summary({ runId: "other", description: "  My review  " }))).toBe("My review");

    expect(buyerFacingReviewTitleFromSummary(summary({ runId: "other", description: "" }))).toBe(
      "Review description was not stored.",
    );
  });

  it("does not use a description that only repeats the run id", () => {
    expect(buyerFacingReviewTitleFromSummary(summary({ runId: "my-run-slug", description: "my-run-slug" }))).toBe(
      "Review title was not stored.",
    );

    expect(buyerFacingReviewTitleFromSummary(summary({ runId: "My-Run", description: "my-run" }))).toBe(
      "Review title was not stored.",
    );
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

  it("uses known compare-demo slug labels before description heuristics", () => {
    expect(
      buyerFacingReviewTitleFromSummary(
        summary({ runId: "claims-intake-run-v1", description: "Claims Intake v1" }),
      ),
    ).toBe("Baseline Claims Intake Review");
  });

  it("strips retired Contoso demo branding from stale seed titles", () => {
    expect(
      buyerFacingReviewTitleFromSummary(
        summary({
          runId: "6e8c4a102b1f4c9a9d3e10b2a4f0c501",
          description: "Demo — Contoso retail baseline manifest (trusted baseline seed).",
        }),
      ),
    ).toBe("Demo — Retail baseline manifest (trusted baseline seed).");
  });
});

describe("buyerFacingReviewLinkLabelFromRunId", () => {
  it("uses omission copy when run id is blank", () => {
    expect(buyerFacingReviewLinkLabelFromRunId("   ")).toBe("Review id was not stored.");
  });

  it("does not use the raw run id as the review title on the ask strip", () => {
    expect(buyerFacingReviewLinkLabelFromRunId("run-248324")).toBe(
      "Review title is not on this strip. Review id: run-248324.",
    );
  });
});
