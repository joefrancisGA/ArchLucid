import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  GovernanceApprovalQueueNextReviewFooter,
  governanceApprovalQueueNextReviewHref,
} from "./GovernanceApprovalQueueNextReviewFooter";

describe("GovernanceApprovalQueueNextReviewFooter", () => {
  it("builds the next review approval queue href from run id", () => {
    expect(governanceApprovalQueueNextReviewHref("run-2")).toBe("/governance/approval-queue?runId=run-2");
    expect(governanceApprovalQueueNextReviewHref("run 2")).toBe("/governance/approval-queue?runId=run%202");
  });

  it("renders next review approval queue link", () => {
    render(
      <GovernanceApprovalQueueNextReviewFooter
        target={{
          runId: "run-2",
          reviewTitle: "Q2 review",
          href: "/governance/approval-queue?runId=run-2",
        }}
      />,
    );

    expect(screen.getByTestId("governance-approval-queue-next-review-footer")).toBeInTheDocument();
    expect(screen.getByTestId("governance-approval-queue-next-review-action")).toHaveAttribute(
      "href",
      "/governance/approval-queue?runId=run-2",
    );
  });
});
