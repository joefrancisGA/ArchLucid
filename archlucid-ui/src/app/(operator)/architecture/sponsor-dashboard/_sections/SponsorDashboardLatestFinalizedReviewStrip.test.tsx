import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SponsorDashboardLatestFinalizedReviewStrip } from "./SponsorDashboardLatestFinalizedReviewStrip";

describe("SponsorDashboardLatestFinalizedReviewStrip", () => {
  it("renders open review link", () => {
    render(<SponsorDashboardLatestFinalizedReviewStrip runId="run-finalized-1" reviewTitle="Q1 platform review" />);

    expect(screen.getByTestId("sponsor-dashboard-latest-finalized-review-strip")).toBeInTheDocument();
    expect(screen.getByTestId("sponsor-dashboard-latest-finalized-review-open")).toHaveAttribute(
      "href",
      "/architecture/reviews/run-finalized-1",
    );
  });
});
