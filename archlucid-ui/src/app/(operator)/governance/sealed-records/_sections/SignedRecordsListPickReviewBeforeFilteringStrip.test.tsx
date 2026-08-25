import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SignedRecordsListPickReviewBeforeFilteringStrip } from "./SignedRecordsListPickReviewBeforeFilteringStrip";

vi.mock("@/components/WorkspaceActiveRunContext", () => ({
  useWorkspaceActiveRun: () => ({ activeRunId: "run-sealed-1", runId: "run-sealed-1" }),
}));

vi.mock("@/components/AskRunIdPicker", () => ({
  AskRunIdPicker: (props: { value: string }) => <div data-testid="ask-run-id-picker">{props.value}</div>,
}));

describe("SignedRecordsListPickReviewBeforeFilteringStrip", () => {
  it("renders pick review strip", () => {
    render(
      <SignedRecordsListPickReviewBeforeFilteringStrip selectedReviewId="" onSelectReview={vi.fn()} />,
    );

    expect(screen.getByTestId("signed-records-list-pick-review-before-filtering-strip")).toBeInTheDocument();
    expect(screen.getByText("Pick a review before filtering")).toBeInTheDocument();
  });
});
