import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PlanningNextReviewFooter, planningNextReviewHref } from "./PlanningNextReviewFooter";

describe("PlanningNextReviewFooter", () => {
  it("builds the next review planning href from run id", () => {
    expect(planningNextReviewHref("run-2")).toBe("/insights/improvement-planning?runId=run-2");
    expect(planningNextReviewHref("run 2")).toBe("/insights/improvement-planning?runId=run%202");
  });

  it("renders next review planning link", () => {
    render(
      <PlanningNextReviewFooter
        target={{
          runId: "run-2",
          reviewTitle: "Q2 review",
          href: "/insights/improvement-planning?runId=run-2",
        }}
      />,
    );

    expect(screen.getByTestId("planning-next-review-footer")).toBeInTheDocument();
    expect(screen.getByText("Next review improvement planning")).toBeInTheDocument();
    expect(screen.getByTestId("planning-next-review-action")).toHaveAttribute(
      "href",
      "/insights/improvement-planning?runId=run-2",
    );
  });
});
