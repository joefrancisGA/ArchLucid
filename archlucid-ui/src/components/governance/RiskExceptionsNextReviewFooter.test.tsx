import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  RiskExceptionsNextReviewFooter,
  riskExceptionsNextReviewHref,
} from "./RiskExceptionsNextReviewFooter";

describe("RiskExceptionsNextReviewFooter", () => {
  it("builds the next review risk exceptions href from run id", () => {
    expect(riskExceptionsNextReviewHref("run-2")).toBe("/governance/exceptions?runId=run-2");
  });

  it("renders next review risk exceptions link", () => {
    render(
      <RiskExceptionsNextReviewFooter
        target={{
          runId: "run-2",
          reviewTitle: "Q2 review",
          href: "/governance/exceptions?runId=run-2",
        }}
      />,
    );

    expect(screen.getByTestId("risk-exceptions-next-review-footer")).toBeInTheDocument();
    expect(screen.getByTestId("risk-exceptions-next-review-action")).toHaveAttribute(
      "href",
      "/governance/exceptions?runId=run-2",
    );
  });
});
