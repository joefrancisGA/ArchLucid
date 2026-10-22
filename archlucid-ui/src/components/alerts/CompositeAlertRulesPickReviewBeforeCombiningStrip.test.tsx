import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CompositeAlertRulesPickReviewBeforeCombiningStrip } from "./CompositeAlertRulesPickReviewBeforeCombiningStrip";

vi.mock("@/components/WorkspaceActiveRunContext", () => ({
  useWorkspaceActiveRun: () => ({ activeRunId: "run-composite-1" }),
}));

vi.mock("@/components/AskRunIdPicker", () => ({
  AskRunIdPicker: (props: { value: string }) => <div data-testid="ask-run-id-picker">{props.value}</div>,
}));

describe("CompositeAlertRulesPickReviewBeforeCombiningStrip", () => {
  it("renders review picker guidance", () => {
    render(
      <CompositeAlertRulesPickReviewBeforeCombiningStrip selectedReviewId="" onSelectReview={() => undefined} />,
    );

    expect(screen.getByTestId("composite-alert-rules-pick-review-before-combining-strip")).toBeInTheDocument();
    expect(screen.getByText(/Pick a review before combining rules/)).toBeInTheDocument();
    expect(screen.getByTestId("ask-run-id-picker")).toHaveTextContent("run-composite-1");
  });
});
