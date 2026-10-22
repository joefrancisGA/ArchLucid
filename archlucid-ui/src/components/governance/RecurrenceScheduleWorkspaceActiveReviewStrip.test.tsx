import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RecurrenceScheduleWorkspaceActiveReviewStrip } from "./RecurrenceScheduleWorkspaceActiveReviewStrip";

vi.mock("@/components/WorkspaceActiveRunContext", () => ({
  useWorkspaceActiveRun: () => ({ runId: "run-workspace-1", displayTitle: "Workspace review" }),
}));

describe("RecurrenceScheduleWorkspaceActiveReviewStrip", () => {
  it("renders schedule action for workspace active review", () => {
    render(<RecurrenceScheduleWorkspaceActiveReviewStrip onScheduleFromWorkspaceActive={() => undefined} />);

    expect(screen.getByTestId("recurrence-schedule-workspace-active-review-strip")).toBeInTheDocument();
    expect(screen.getByTestId("recurrence-schedule-workspace-active-schedule")).toBeInTheDocument();
  });
});
