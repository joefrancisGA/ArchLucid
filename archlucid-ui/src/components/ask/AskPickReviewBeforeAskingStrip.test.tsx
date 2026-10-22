import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AskPickReviewBeforeAskingStrip } from "./AskPickReviewBeforeAskingStrip";

vi.mock("@/components/WorkspaceActiveRunContext", () => ({
  useWorkspaceActiveRun: () => ({ activeRunId: "run-ask-1", runId: "run-ask-1" }),
}));

vi.mock("@/components/AskRunIdPicker", () => ({
  AskRunIdPicker: (props: { value: string }) => <div data-testid="ask-run-id-picker">{props.value}</div>,
}));

describe("AskPickReviewBeforeAskingStrip", () => {
  it("renders pick review strip", () => {
    render(<AskPickReviewBeforeAskingStrip selectedReviewId="" onSelectReview={vi.fn()} />);

    expect(screen.getByTestId("ask-pick-review-before-asking-strip")).toBeInTheDocument();
    expect(screen.getByText("Pick a review before asking")).toBeInTheDocument();
  });
});
