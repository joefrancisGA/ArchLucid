import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RecurrenceScheduleActivationActions } from "@/components/governance/RecurrenceScheduleActivationActions";
import * as governanceApi from "@/lib/api/governance-stickiness-api";
import {
  RECURRENCE_AI_BUDGET_DISCLOSURE,
  RECURRENCE_ENABLE_RECURRING_LABEL,
  RECURRENCE_SAVE_PAUSED_LABEL,
} from "@/lib/recurrence-schedule-activation-copy";

vi.mock("@/lib/api/governance-stickiness-api", () => ({
  previewRecurrenceScheduleRuns: vi.fn(),
}));

describe("RecurrenceScheduleActivationActions", () => {
  beforeEach(() => {
    vi.mocked(governanceApi.previewRecurrenceScheduleRuns).mockResolvedValue({
      isValid: true,
      nextRunUtc: ["2026-06-09T08:00:00Z"],
    });
  });

  it("renders explicit activation actions instead of a checkbox", () => {
    const onSavePaused = vi.fn();
    const onEnableRecurring = vi.fn();

    render(
      <RecurrenceScheduleActivationActions
        mode="create"
        cronExpression="0 8 * * 1"
        pendingIsEnabled={false}
        onSavePaused={onSavePaused}
        onEnableRecurring={onEnableRecurring}
      />,
    );

    expect(screen.getByRole("button", { name: RECURRENCE_SAVE_PAUSED_LABEL })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: RECURRENCE_ENABLE_RECURRING_LABEL })).toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });

  it("shows AI-budget disclosure immediately before enable recurring assessments", () => {
    render(
      <RecurrenceScheduleActivationActions
        mode="create"
        cronExpression="0 8 * * 1"
        pendingIsEnabled={false}
        onSavePaused={vi.fn()}
        onEnableRecurring={vi.fn()}
      />,
    );

    const disclosure = screen.getByTestId("recurrence-ai-budget-disclosure");
    const enableButton = screen.getByTestId("recurrence-enable-recurring");

    expect(disclosure).toHaveTextContent(RECURRENCE_AI_BUDGET_DISCLOSURE);
    expect(disclosure.compareDocumentPosition(enableButton) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("invokes explicit activation handlers", async () => {
    const onSavePaused = vi.fn();
    const onEnableRecurring = vi.fn();

    render(
      <RecurrenceScheduleActivationActions
        mode="create"
        cronExpression="0 8 * * 1"
        pendingIsEnabled={false}
        onSavePaused={onSavePaused}
        onEnableRecurring={onEnableRecurring}
      />,
    );

    fireEvent.click(screen.getByTestId("recurrence-save-paused"));
    fireEvent.click(screen.getByTestId("recurrence-enable-recurring"));

    await waitFor(() => {
      expect(onSavePaused).toHaveBeenCalledTimes(1);
      expect(onEnableRecurring).toHaveBeenCalledTimes(1);
    });
  });
});
