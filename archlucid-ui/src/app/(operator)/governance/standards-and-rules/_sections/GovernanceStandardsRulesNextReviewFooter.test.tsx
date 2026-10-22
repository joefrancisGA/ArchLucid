import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  GovernanceStandardsRulesNextReviewFooter,
  standardsRulesNextReviewHref,
} from "./GovernanceStandardsRulesNextReviewFooter";

describe("GovernanceStandardsRulesNextReviewFooter", () => {
  it("builds the next review standards href from run id", () => {
    expect(standardsRulesNextReviewHref("run-2")).toBe("/governance/standards-and-rules?runId=run-2");
    expect(standardsRulesNextReviewHref("run 2")).toBe("/governance/standards-and-rules?runId=run%202");
  });

  it("renders next review standards link", () => {
    render(
      <GovernanceStandardsRulesNextReviewFooter
        target={{
          runId: "run-2",
          reviewTitle: "Q2 review",
          href: "/governance/standards-and-rules?runId=run-2",
        }}
      />,
    );

    expect(screen.getByTestId("standards-rules-next-review-footer")).toBeInTheDocument();
    expect(screen.getByTestId("standards-rules-next-review-action")).toHaveAttribute(
      "href",
      "/governance/standards-and-rules?runId=run-2",
    );
  });
});
