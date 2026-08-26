import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AlertRulesPickReviewBeforeCreatingStrip } from "./AlertRulesPickReviewBeforeCreatingStrip";

vi.mock("@/components/WorkspaceActiveRunContext", () => ({
  useWorkspaceActiveRun: () => ({ activeRunId: "run-rules-1" }),
}));

vi.mock("@/components/AskRunIdPicker", () => ({
  AskRunIdPicker: (props: { value: string }) => <div data-testid="ask-run-id-picker">{props.value}</div>,
}));

describe("AlertRulesPickReviewBeforeCreatingStrip", () => {
  it("renders review picker guidance", () => {
    render(<AlertRulesPickReviewBeforeCreatingStrip selectedReviewId="" onSelectReview={() => undefined} />);

    expect(screen.getByTestId("alert-rules-pick-review-before-creating-strip")).toBeInTheDocument();
    expect(screen.getByText(/Pick a review before creating rules/)).toBeInTheDocument();
    expect(screen.getByTestId("ask-run-id-picker")).toHaveTextContent("run-rules-1");
  });
});
