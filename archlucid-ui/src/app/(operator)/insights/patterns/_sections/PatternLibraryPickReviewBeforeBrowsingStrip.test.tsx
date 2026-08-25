import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PatternLibraryPickReviewBeforeBrowsingStrip } from "./PatternLibraryPickReviewBeforeBrowsingStrip";

vi.mock("@/components/WorkspaceActiveRunContext", () => ({
  useWorkspaceActiveRun: () => ({ activeRunId: "run-pattern-1", runId: "run-pattern-1" }),
}));

vi.mock("@/components/AskRunIdPicker", () => ({
  AskRunIdPicker: (props: { value: string }) => <div data-testid="ask-run-id-picker">{props.value}</div>,
}));

describe("PatternLibraryPickReviewBeforeBrowsingStrip", () => {
  it("renders pick review strip", () => {
    render(<PatternLibraryPickReviewBeforeBrowsingStrip selectedReviewId="" onSelectReview={vi.fn()} />);

    expect(screen.getByTestId("pattern-library-pick-review-before-browsing-strip")).toBeInTheDocument();
    expect(screen.getByText("Pick a review before browsing")).toBeInTheDocument();
  });
});
