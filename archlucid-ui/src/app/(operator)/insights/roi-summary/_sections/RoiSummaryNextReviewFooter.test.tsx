import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RoiSummaryNextReviewFooter, roiSummaryNextReviewHref } from "./RoiSummaryNextReviewFooter";

describe("RoiSummaryNextReviewFooter", () => {
  it("builds the next review ROI summary href from run id", () => {
    expect(roiSummaryNextReviewHref("run-2")).toBe("/insights/roi-summary?runId=run-2");
    expect(roiSummaryNextReviewHref("run 2")).toBe("/insights/roi-summary?runId=run%202");
  });

  it("renders next review ROI summary link", () => {
    render(
      <RoiSummaryNextReviewFooter
        target={{
          runId: "run-2",
          reviewTitle: "Q2 review",
          href: "/insights/roi-summary?runId=run-2",
        }}
      />,
    );

    expect(screen.getByTestId("roi-summary-next-review-footer")).toBeInTheDocument();
    expect(screen.getByText("Next review ROI summary")).toBeInTheDocument();
    expect(screen.getByTestId("roi-summary-next-review-action")).toHaveAttribute(
      "href",
      "/insights/roi-summary?runId=run-2",
    );
  });
});
