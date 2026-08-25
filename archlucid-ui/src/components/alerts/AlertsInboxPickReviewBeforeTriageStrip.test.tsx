import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AlertsInboxPickReviewBeforeTriageStrip } from "./AlertsInboxPickReviewBeforeTriageStrip";

vi.mock("@/components/WorkspaceActiveRunContext", () => ({
  useWorkspaceActiveRun: () => ({ activeRunId: "run-alert-1", runId: "run-alert-1" }),
}));

vi.mock("@/components/AskRunIdPicker", () => ({
  AskRunIdPicker: (props: { value: string }) => <div data-testid="ask-run-id-picker">{props.value}</div>,
}));

describe("AlertsInboxPickReviewBeforeTriageStrip", () => {
  it("renders pick review strip", () => {
    render(
      <AlertsInboxPickReviewBeforeTriageStrip selectedReviewId="" onSelectReview={vi.fn()} />,
    );

    expect(screen.getByTestId("alerts-inbox-pick-review-before-triage-strip")).toBeInTheDocument();
    expect(screen.getByText("Pick a review before triage")).toBeInTheDocument();
  });
});
