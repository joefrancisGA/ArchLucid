import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  CompositeAlertRulesNextReviewFooter,
  compositeAlertRulesNextReviewHref,
} from "./CompositeAlertRulesNextReviewFooter";

describe("CompositeAlertRulesNextReviewFooter", () => {
  it("builds the next review composite rules href from run id", () => {
    expect(compositeAlertRulesNextReviewHref("run-2")).toBe(
      "/governance/alert-rules?tab=advanced-rules&runId=run-2",
    );
  });

  it("renders next review composite rules link", () => {
    render(
      <CompositeAlertRulesNextReviewFooter
        target={{
          runId: "run-2",
          reviewTitle: "Q2 review",
          href: "/governance/alert-rules?tab=advanced-rules&runId=run-2",
        }}
      />,
    );

    expect(screen.getByTestId("composite-alert-rules-next-review-footer")).toBeInTheDocument();
    expect(screen.getByTestId("composite-alert-rules-next-review-action")).toHaveAttribute(
      "href",
      "/governance/alert-rules?tab=advanced-rules&runId=run-2",
    );
  });
});
