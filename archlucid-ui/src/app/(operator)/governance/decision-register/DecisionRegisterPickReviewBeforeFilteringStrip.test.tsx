import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DecisionRegisterPickReviewBeforeFilteringStrip } from "./DecisionRegisterPickReviewBeforeFilteringStrip";

vi.mock("@/components/WorkspaceActiveRunContext", () => ({
  useWorkspaceActiveRun: () => ({ activeRunId: "run-decision-1", runId: "run-decision-1" }),
}));

vi.mock("@/components/AskRunIdPicker", () => ({
  AskRunIdPicker: (props: { value: string }) => <div data-testid="ask-run-id-picker">{props.value}</div>,
}));

describe("DecisionRegisterPickReviewBeforeFilteringStrip", () => {
  it("renders pick review strip", () => {
    render(
      <DecisionRegisterPickReviewBeforeFilteringStrip selectedReviewId="" onSelectReview={vi.fn()} />,
    );

    expect(screen.getByTestId("decision-register-pick-review-before-filtering-strip")).toBeInTheDocument();
    expect(screen.getByText("Pick a review before filtering")).toBeInTheDocument();
  });
});
