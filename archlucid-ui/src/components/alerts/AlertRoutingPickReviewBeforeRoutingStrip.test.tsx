import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AlertRoutingPickReviewBeforeRoutingStrip } from "./AlertRoutingPickReviewBeforeRoutingStrip";

vi.mock("@/components/WorkspaceActiveRunContext", () => ({
  useWorkspaceActiveRun: () => ({ activeRunId: "run-routing-1" }),
}));

vi.mock("@/components/AskRunIdPicker", () => ({
  AskRunIdPicker: (props: { value: string }) => <div data-testid="ask-run-id-picker">{props.value}</div>,
}));

describe("AlertRoutingPickReviewBeforeRoutingStrip", () => {
  it("renders review picker guidance", () => {
    render(<AlertRoutingPickReviewBeforeRoutingStrip selectedReviewId="" onSelectReview={() => undefined} />);

    expect(screen.getByTestId("alert-routing-pick-review-before-routing-strip")).toBeInTheDocument();
    expect(screen.getByText(/Pick a review before routing alerts/)).toBeInTheDocument();
    expect(screen.getByTestId("ask-run-id-picker")).toHaveTextContent("run-routing-1");
  });
});
