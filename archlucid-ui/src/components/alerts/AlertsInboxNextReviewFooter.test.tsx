import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AlertsInboxNextReviewFooter, alertsInboxNextReviewHref } from "./AlertsInboxNextReviewFooter";

describe("AlertsInboxNextReviewFooter", () => {
  it("builds the next review alerts inbox href from run id", () => {
    expect(alertsInboxNextReviewHref("run-2")).toBe("/governance/alerts?runId=run-2");
  });

  it("renders next review alerts inbox link", () => {
    render(
      <AlertsInboxNextReviewFooter
        target={{
          runId: "run-2",
          reviewTitle: "Q2 review",
          href: "/governance/alerts?runId=run-2",
        }}
      />,
    );

    expect(screen.getByTestId("alerts-inbox-next-review-footer")).toBeInTheDocument();
    expect(screen.getByTestId("alerts-inbox-next-review-action")).toHaveAttribute(
      "href",
      "/governance/alerts?runId=run-2",
    );
  });
});
