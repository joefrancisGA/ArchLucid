import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  GovernanceFindingsQueueNextReviewFooter,
  governanceFindingsQueueNextReviewHref,
} from "./GovernanceFindingsQueueNextReviewFooter";

describe("GovernanceFindingsQueueNextReviewFooter", () => {
  it("builds the next review findings queue href from run id", () => {
    expect(governanceFindingsQueueNextReviewHref("run-2")).toBe("/governance/findings?runId=run-2");
  });

  it("renders next review findings queue link", () => {
    render(
      <GovernanceFindingsQueueNextReviewFooter
        target={{
          runId: "run-2",
          reviewTitle: "Q2 review",
          href: "/governance/findings?runId=run-2",
        }}
      />,
    );

    expect(screen.getByTestId("governance-findings-queue-next-review-footer")).toBeInTheDocument();
    expect(screen.getByTestId("governance-findings-queue-next-review-action")).toHaveAttribute(
      "href",
      "/governance/findings?runId=run-2",
    );
  });
});
