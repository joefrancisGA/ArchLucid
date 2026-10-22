import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AlertRoutingNextReviewFooter, alertRoutingNextReviewHref } from "./AlertRoutingNextReviewFooter";

describe("AlertRoutingNextReviewFooter", () => {
  it("builds the next review alert routing href from run id", () => {
    expect(alertRoutingNextReviewHref("run-2")).toBe(
      "/governance/alert-rules?tab=notifications&runId=run-2",
    );
  });

  it("renders next review alert routing link", () => {
    render(
      <AlertRoutingNextReviewFooter
        target={{
          runId: "run-2",
          reviewTitle: "Q2 review",
          href: "/governance/alert-rules?tab=notifications&runId=run-2",
        }}
      />,
    );

    expect(screen.getByTestId("alert-routing-next-review-footer")).toBeInTheDocument();
    expect(screen.getByTestId("alert-routing-next-review-action")).toHaveAttribute(
      "href",
      "/governance/alert-rules?tab=notifications&runId=run-2",
    );
  });
});
