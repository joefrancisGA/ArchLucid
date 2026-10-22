import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AlertSimulationNextReviewFooter, alertSimulationNextReviewHref } from "./AlertSimulationNextReviewFooter";

describe("AlertSimulationNextReviewFooter", () => {
  it("builds the next review alert simulation href from run id", () => {
    expect(alertSimulationNextReviewHref("run-2")).toBe("/governance/alert-rules?tab=test-alerts&runId=run-2");
    expect(alertSimulationNextReviewHref("run 2")).toBe(
      "/governance/alert-rules?tab=test-alerts&runId=run+2",
    );
  });

  it("renders next review alert simulation link", () => {
    render(
      <AlertSimulationNextReviewFooter
        target={{
          runId: "run-2",
          reviewTitle: "Q2 review",
          href: "/governance/alert-rules?tab=test-alerts&runId=run-2",
        }}
      />,
    );

    expect(screen.getByTestId("alert-simulation-next-review-footer")).toBeInTheDocument();
    expect(screen.getByText("Next review alert simulation")).toBeInTheDocument();
    expect(screen.getByTestId("alert-simulation-next-review-action")).toHaveAttribute(
      "href",
      "/governance/alert-rules?tab=test-alerts&runId=run-2",
    );
  });
});
