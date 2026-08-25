import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RiskExceptionsPickReviewBeforeRenewStrip } from "./RiskExceptionsPickReviewBeforeRenewStrip";

vi.mock("@/components/WorkspaceActiveRunContext", () => ({
  useWorkspaceActiveRun: () => ({ activeRunId: "run-risk-1", runId: "run-risk-1" }),
}));

vi.mock("@/components/AskRunIdPicker", () => ({
  AskRunIdPicker: (props: { value: string }) => <div data-testid="ask-run-id-picker">{props.value}</div>,
}));

describe("RiskExceptionsPickReviewBeforeRenewStrip", () => {
  it("renders pick review strip", () => {
    render(
      <RiskExceptionsPickReviewBeforeRenewStrip selectedReviewId="" onSelectReview={vi.fn()} />,
    );

    expect(screen.getByTestId("risk-exceptions-pick-review-before-renew-strip")).toBeInTheDocument();
    expect(screen.getByText("Pick a review before renew or revoke")).toBeInTheDocument();
  });
});
