import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AlertTuningNextReviewFooter, alertTuningNextReviewHref } from "./AlertTuningNextReviewFooter";

describe("AlertTuningNextReviewFooter", () => {
  it("builds the next review alert tuning href from run id", () => {
    expect(alertTuningNextReviewHref("run-2")).toBe("/governance/alert-rules?tab=test-alerts&runId=run-2");
  });

  it("renders next review alert tuning link", () => {
    render(
      <AlertTuningNextReviewFooter
        target={{
          runId: "run-2",
          reviewTitle: "Q2 review",
          href: "/governance/alert-rules?tab=test-alerts&runId=run-2",
        }}
      />,
    );

    expect(screen.getByTestId("alert-tuning-next-review-footer")).toBeInTheDocument();
    expect(screen.getByText("Next review alert tuning")).toBeInTheDocument();
  });
});
