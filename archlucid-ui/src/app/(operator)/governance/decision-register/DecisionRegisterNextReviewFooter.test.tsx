import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  DecisionRegisterNextReviewFooter,
  decisionRegisterNextReviewHref,
} from "./DecisionRegisterNextReviewFooter";

describe("DecisionRegisterNextReviewFooter", () => {
  it("builds the next review decision register href from run id", () => {
    expect(decisionRegisterNextReviewHref("run-2")).toBe("/governance/decision-register?runId=run-2");
    expect(decisionRegisterNextReviewHref("run 2")).toBe("/governance/decision-register?runId=run+2");
  });

  it("renders next review decision register link", () => {
    render(
      <DecisionRegisterNextReviewFooter
        target={{
          runId: "run-2",
          reviewTitle: "Q2 review",
          href: "/governance/decision-register?runId=run-2",
        }}
      />,
    );

    expect(screen.getByTestId("decision-register-next-review-footer")).toBeInTheDocument();
    expect(screen.getByTestId("decision-register-next-review-action")).toHaveAttribute(
      "href",
      "/governance/decision-register?runId=run-2",
    );
  });
});
