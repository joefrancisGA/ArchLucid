import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { FindingsQueuePickReviewBeforeTriageStrip } from "./FindingsQueuePickReviewBeforeTriageStrip";

vi.mock("@/components/WorkspaceActiveRunContext", () => ({
  useWorkspaceActiveRun: () => ({ activeRunId: "run-findings-1", runId: "run-findings-1" }),
}));

vi.mock("@/components/AskRunIdPicker", () => ({
  AskRunIdPicker: (props: { value: string }) => <div data-testid="ask-run-id-picker">{props.value}</div>,
}));

describe("FindingsQueuePickReviewBeforeTriageStrip", () => {
  it("renders pick review strip", () => {
    render(
      <FindingsQueuePickReviewBeforeTriageStrip selectedReviewId="" onSelectReview={vi.fn()} />,
    );

    expect(screen.getByTestId("findings-queue-pick-review-before-triage-strip")).toBeInTheDocument();
    expect(screen.getByText("Pick a review before triage")).toBeInTheDocument();
  });
});
