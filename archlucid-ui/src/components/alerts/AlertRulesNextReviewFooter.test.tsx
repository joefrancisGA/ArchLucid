import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AlertRulesNextReviewFooter, alertRulesNextReviewHref } from "./AlertRulesNextReviewFooter";

describe("AlertRulesNextReviewFooter", () => {
  it("builds the next review alert rules href from run id", () => {
    expect(alertRulesNextReviewHref("run-2")).toBe("/governance/alert-rules?runId=run-2");
  });

  it("renders next review alert rules link", () => {
    render(
      <AlertRulesNextReviewFooter
        target={{
          runId: "run-2",
          reviewTitle: "Q2 review",
          href: "/governance/alert-rules?runId=run-2",
        }}
      />,
    );

    expect(screen.getByTestId("alert-rules-next-review-footer")).toBeInTheDocument();
    expect(screen.getByTestId("alert-rules-next-review-action")).toHaveAttribute(
      "href",
      "/governance/alert-rules?runId=run-2",
    );
  });
});
