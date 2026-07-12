import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RecurrenceSchedulePostCommitCard } from "@/components/governance/RecurrenceSchedulePostCommitCard";
import * as governanceApi from "@/lib/api/governance-stickiness-api";
import { RECURRENCE_AI_BUDGET_DISCLOSURE } from "@/lib/recurrence-schedule-activation-copy";

vi.mock("@/lib/api/governance-stickiness-api", () => ({
  createArchitectureReviewRecurrenceSchedule: vi.fn(),
  listArchitectureReviewRecurrenceSchedules: vi.fn(),
  previewRecurrenceScheduleRuns: vi.fn(),
}));

describe("RecurrenceSchedulePostCommitCard", () => {
  const runId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

  beforeEach(() => {
    vi.mocked(governanceApi.listArchitectureReviewRecurrenceSchedules).mockResolvedValue([]);
    vi.mocked(governanceApi.previewRecurrenceScheduleRuns).mockResolvedValue({
      isValid: true,
      nextRunUtc: ["2026-06-09T08:00:00Z"],
    });
    vi.mocked(governanceApi.createArchitectureReviewRecurrenceSchedule).mockResolvedValue({
      scheduleId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      sourceRunId: runId,
      name: "Weekly architecture review",
      cronExpression: "0 8 * * 1",
      isEnabled: true,
      nextRunUtc: "2026-06-09T08:00:00Z",
    });
  });

  it("creates an inactive schedule when saving paused", async () => {
    render(<RecurrenceSchedulePostCommitCard runId={runId} hasStickinessPrompt />);

    fireEvent.change(screen.getByTestId("recurrence-schedule-name"), {
      target: { value: "Monday review" },
    });
    fireEvent.click(screen.getByTestId("recurrence-save-paused"));

    await waitFor(() => {
      expect(governanceApi.createArchitectureReviewRecurrenceSchedule).toHaveBeenCalledWith({
        sourceRunId: runId,
        name: "Monday review",
        cronExpression: "0 8 * * 1",
        isEnabled: false,
      });
    });

    expect(await screen.findByText("Recurrence schedule saved (paused).")).toBeInTheDocument();
  });

  it("creates an active schedule when enabling recurring assessments", async () => {
    render(<RecurrenceSchedulePostCommitCard runId={runId} hasStickinessPrompt />);

    fireEvent.change(screen.getByTestId("cron-expression-input"), {
      target: { value: "0 9 * * 2" },
    });
    fireEvent.click(screen.getByTestId("recurrence-enable-recurring"));

    await waitFor(() => {
      expect(governanceApi.createArchitectureReviewRecurrenceSchedule).toHaveBeenCalledWith({
        sourceRunId: runId,
        name: "Weekly architecture review",
        cronExpression: "0 9 * * 2",
        isEnabled: true,
      });
    });

    expect(await screen.findByText("Recurring assessments enabled.")).toBeInTheDocument();
  });

  it("shows AI-budget disclosure before the enable action", async () => {
    render(<RecurrenceSchedulePostCommitCard runId={runId} hasStickinessPrompt />);

    expect(await screen.findByTestId("recurrence-ai-budget-disclosure")).toHaveTextContent(
      RECURRENCE_AI_BUDGET_DISCLOSURE,
    );
    expect(screen.getByTestId("recurrence-enable-recurring")).toBeInTheDocument();
    expect(screen.queryByTestId("recurrence-schedule-enabled")).not.toBeInTheDocument();
  });

  it("shows error when create fails", async () => {
    vi.mocked(governanceApi.createArchitectureReviewRecurrenceSchedule).mockRejectedValue(new Error("API down"));

    render(<RecurrenceSchedulePostCommitCard runId={runId} hasStickinessPrompt />);
    fireEvent.click(screen.getByTestId("recurrence-enable-recurring"));

    expect(await screen.findByText("API down")).toBeInTheDocument();
  });

  it("links to the management page when a schedule already exists", async () => {
    vi.mocked(governanceApi.listArchitectureReviewRecurrenceSchedules).mockResolvedValue([
      {
        scheduleId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
        sourceRunId: runId,
        name: "Weekly architecture review",
        cronExpression: "0 8 * * 1",
        isEnabled: true,
        nextRunUtc: "2026-06-09T08:00:00Z",
      },
    ]);

    render(<RecurrenceSchedulePostCommitCard runId={runId} hasStickinessPrompt />);

    expect(await screen.findByTestId("recurrence-schedule-manage-link")).toHaveAttribute(
      "href",
      "/governance/recurrence-schedules",
    );
  });
});
