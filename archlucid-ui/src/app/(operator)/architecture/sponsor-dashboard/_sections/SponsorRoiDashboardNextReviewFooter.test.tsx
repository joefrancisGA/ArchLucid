import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  SponsorRoiDashboardNextReviewFooter,
  sponsorRoiDashboardNextReviewHref,
} from "./SponsorRoiDashboardNextReviewFooter";

describe("SponsorRoiDashboardNextReviewFooter", () => {
  it("builds the sponsor dashboard href", () => {
    expect(sponsorRoiDashboardNextReviewHref("run-2")).toBe("/architecture/sponsor-dashboard");
  });

  it("renders next review sponsor dashboard link", () => {
    render(
      <SponsorRoiDashboardNextReviewFooter
        target={{
          runId: "run-2",
          reviewTitle: "Q2 review",
          href: "/architecture/sponsor-dashboard",
        }}
      />,
    );

    expect(screen.getByTestId("sponsor-roi-dashboard-next-review-footer")).toBeInTheDocument();
    expect(screen.getByText("Next review sponsor dashboard")).toBeInTheDocument();
    expect(screen.getByTestId("sponsor-roi-dashboard-next-review-action")).toHaveAttribute(
      "href",
      "/architecture/sponsor-dashboard",
    );
  });
});
