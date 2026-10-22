import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { GovernanceApprovalQueuePickReviewBeforeSubmittingStrip } from "./GovernanceApprovalQueuePickReviewBeforeSubmittingStrip";

vi.mock("@/components/WorkspaceActiveRunContext", () => ({
  useWorkspaceActiveRun: () => ({ activeRunId: "run-gov-1" }),
}));

vi.mock("@/components/AskRunIdPicker", () => ({
  AskRunIdPicker: (props: { value: string }) => <div data-testid="ask-run-id-picker">{props.value}</div>,
}));

describe("GovernanceApprovalQueuePickReviewBeforeSubmittingStrip", () => {
  it("renders review picker guidance", () => {
    render(
      <GovernanceApprovalQueuePickReviewBeforeSubmittingStrip
        selectedReviewId=""
        onSelectReview={() => undefined}
      />,
    );

    expect(screen.getByTestId("governance-approval-queue-pick-review-before-submitting-strip")).toBeInTheDocument();
    expect(screen.getByText(/Pick a review before submitting/)).toBeInTheDocument();
    expect(screen.getByTestId("ask-run-id-picker")).toHaveTextContent("run-gov-1");
  });
});
