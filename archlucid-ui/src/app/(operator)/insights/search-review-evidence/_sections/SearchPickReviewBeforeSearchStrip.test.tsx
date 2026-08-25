import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SearchPickReviewBeforeSearchStrip } from "./SearchPickReviewBeforeSearchStrip";

vi.mock("@/components/WorkspaceActiveRunContext", () => ({
  useWorkspaceActiveRun: () => ({ runId: "run-search-1", displayTitle: "Claims review" }),
}));

vi.mock("@/components/AskRunIdPicker", () => ({
  AskRunIdPicker: (props: { value: string }) => <div data-testid="ask-run-id-picker">{props.value}</div>,
}));

describe("SearchPickReviewBeforeSearchStrip", () => {
  it("renders review picker guidance", () => {
    render(<SearchPickReviewBeforeSearchStrip selectedReviewId="" onSelectReview={() => undefined} />);

    expect(screen.getByTestId("search-pick-review-before-search-strip")).toBeInTheDocument();
    expect(screen.getByText(/Pick a review before searching evidence/)).toBeInTheDocument();
  });
});
