import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SponsorReportNextReviewFooter, sponsorReportNextReviewHref } from "./SponsorReportNextReviewFooter";

describe("SponsorReportNextReviewFooter", () => {
  it("builds the next review sponsor report href from run id", () => {
    expect(sponsorReportNextReviewHref("run-2")).toBe("/insights/sponsor-report?runId=run-2");
    expect(sponsorReportNextReviewHref("run 2")).toBe("/insights/sponsor-report?runId=run%202");
  });

  it("renders next review sponsor report link", () => {
    render(
      <SponsorReportNextReviewFooter
        target={{
          runId: "run-2",
          reviewTitle: "Q2 review",
          href: "/insights/sponsor-report?runId=run-2",
        }}
      />,
    );

    expect(screen.getByTestId("sponsor-report-next-review-footer")).toBeInTheDocument();
    expect(screen.getByText("Next review sponsor report")).toBeInTheDocument();
    expect(screen.getByTestId("sponsor-report-next-review-action")).toHaveAttribute(
      "href",
      "/insights/sponsor-report?runId=run-2",
    );
  });
});
