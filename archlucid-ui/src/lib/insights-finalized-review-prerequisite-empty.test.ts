import { describe, expect, it } from "vitest";

import {
  buildCompareInsufficientFinalizedEmpty,
  buildInsightsFinalizedReviewPrerequisiteEmpty,
  INSIGHTS_FINALIZED_REVIEW_PREREQUISITE_TITLE_ZERO,
} from "@/lib/insights-finalized-review-prerequisite-empty";

describe("insights-finalized-review-prerequisite-empty (TB-2389)", () => {
  it("shares a title stem and Open reviews primary CTA across Insights jobs", () => {
    const jobs = ["compare", "ask", "scorecard", "impact-preview", "evidence-graph"] as const;

    for (const jobId of jobs) {
      const props = buildInsightsFinalizedReviewPrerequisiteEmpty({ jobId, finalizedCount: 0 });

      if (jobId === "impact-preview" || jobId === "scorecard") {
        expect(props.title.length).toBeGreaterThan(0);
      } else {
        expect(props.title).toBe(INSIGHTS_FINALIZED_REVIEW_PREREQUISITE_TITLE_ZERO);
      }

      expect(props.actions?.[0]?.label).toBe("Open reviews");
      expect(props.actions?.[0]?.href).toBe("/architecture/reviews");
      expect(props.actions?.some((action) => action.href === "/architecture/architectures/new")).toBe(
        false,
      );
    }
  });

  it("keeps sample CTAs as optional outline actions", () => {
    const askProps = buildInsightsFinalizedReviewPrerequisiteEmpty({ jobId: "ask", finalizedCount: 0 });
    const sampleAction = askProps.actions?.find((action) => action.label === "Load sample workspace");

    expect(sampleAction?.variant).toBe("outline");

    const workingAskProps = buildInsightsFinalizedReviewPrerequisiteEmpty({
      jobId: "ask",
      finalizedCount: 0,
      workingMode: true,
    });

    expect(workingAskProps.actions?.some((action) => action.label === "Load sample workspace")).toBe(false);
    expect(workingAskProps.actions?.[1]?.label).toBe("New review");
    expect(workingAskProps.actions?.[1]?.href).toBe("/architecture/architectures/new");

    const scorecardProps = buildInsightsFinalizedReviewPrerequisiteEmpty({
      jobId: "scorecard",
      finalizedCount: 0,
      includeSampleAction: true,
    });
    const sampleScorecard = scorecardProps.actions?.find((action) => action.label === "View sample scorecard");

    expect(sampleScorecard?.variant).toBe("outline");
    expect(scorecardProps.actions?.[0]?.variant).toBe("primary");
  });

  it("describes compare insufficient state separately from zero finalized", () => {
    const insufficient = buildCompareInsufficientFinalizedEmpty();

    expect(insufficient.title).toBe("One finalized review available");
    expect(insufficient.actions?.[0]?.href).toBe("/architecture/reviews");
  });
});
