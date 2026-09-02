import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FirstReviewGuideSupportPanel } from "@/app/(operator)/architecture/first-review-guide/_sections/FirstReviewGuideSupportPanel";
import { FIRST_REVIEW_GUIDE_OUTCOMES_COMPLETED_TITLE } from "@/lib/buyer/buyer-polish-copy";
import { FIRST_ARCHITECTURE_REVIEW_PAGE_TITLE } from "@/lib/first-architecture-review-help-copy";

describe("FirstReviewGuideSupportPanel", () => {
  it("TB-2323: omits pairwise vocabulary strip — walkthrough help lives in Get more", () => {
    render(<FirstReviewGuideSupportPanel sealedRunId={null} />);

    expect(
      screen.queryByTestId("first-review-guide-first-architecture-review-vocabulary"),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("first-review-guide-template-card")).not.toBeInTheDocument();
    expect(screen.queryByTestId("first-review-guide-help")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Need help?" })).not.toBeInTheDocument();

    const getMore = screen.getByTestId("first-review-guide-get-more");
    expect(within(getMore).getByRole("link", { name: FIRST_ARCHITECTURE_REVIEW_PAGE_TITLE })).toHaveAttribute(
      "href",
      "/help/first-architecture-review",
    );
  });

  it("links completed outcomes to the sealed review record tabs", () => {
    render(<FirstReviewGuideSupportPanel sealedRunId="run-sealed-1" />);

    expect(screen.getByRole("heading", { name: FIRST_REVIEW_GUIDE_OUTCOMES_COMPLETED_TITLE })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Evidence-backed findings" })).toHaveAttribute(
      "href",
      "/architecture/reviews/run-sealed-1?reviewTab=findings",
    );
    expect(screen.getByTestId("first-review-guide-sample-rail-card")).toBeInTheDocument();
    expect(screen.queryByTestId("first-review-guide-template-card")).not.toBeInTheDocument();
  });
});
