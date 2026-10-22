import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RecurrenceSchedulesPickReviewBeforeSchedulingStrip } from "./RecurrenceSchedulesPickReviewBeforeSchedulingStrip";

vi.mock("@/components/WorkspaceActiveRunContext", () => ({
  useWorkspaceActiveRun: () => ({ activeRunId: "run-rec-1", runId: "run-rec-1" }),
}));

vi.mock("@/components/AskRunIdPicker", () => ({
  AskRunIdPicker: (props: { value: string }) => <div data-testid="ask-run-id-picker">{props.value}</div>,
}));

describe("RecurrenceSchedulesPickReviewBeforeSchedulingStrip", () => {
  it("renders review picker guidance", () => {
    render(
      <RecurrenceSchedulesPickReviewBeforeSchedulingStrip selectedReviewId="" onSelectReview={() => undefined} />,
    );

    expect(screen.getByTestId("recurrence-schedules-pick-review-before-scheduling-strip")).toBeInTheDocument();
    expect(screen.getByText(/Pick a review before scheduling/)).toBeInTheDocument();
    expect(screen.getByTestId("ask-run-id-picker")).toHaveTextContent("run-rec-1");
  });
});
