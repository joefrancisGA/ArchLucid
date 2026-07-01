import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RecurrenceSchedulePostCommitCard } from "@/components/governance/RecurrenceSchedulePostCommitCard";
import * as governanceApi from "@/lib/api/governance-stickiness-api";

vi.mock("@/lib/api/governance-stickiness-api", () => ({
  createArchitectureReviewRecurrenceSchedule: vi.fn(),
  listArchitectureReviewRecurrenceSchedules: vi.fn(),
}));

describe("RecurrenceSchedulePostCommitCard", () => {
  const runId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

  beforeEach(() => {
    vi.mocked(governanceApi.listArchitectureReviewRecurrenceSchedules).mockResolvedValue([]);
    vi.mocked(governanceApi.createArchitectureReviewRecurrenceSchedule).mockResolvedValue({
      scheduleId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      sourceRunId: runId,
      name: "Weekly architecture review",
      cronExpression: "0 8 * * 1",
      isEnabled: true,
      nextRunUtc: "2026-06-09T08:00:00Z",
    });
  });

  it("submits schedule with cron and name", async () => {
    render(<RecurrenceSchedulePostCommitCard runId={runId} hasStickinessPrompt />);

    fireEvent.change(screen.getByTestId("recurrence-schedule-name"), {
      target: { value: "Monday review" },
    });
    fireEvent.change(screen.getByTestId("cron-expression-input"), {
      target: { value: "0 9 * * 2" },
    });
    fireEvent.click(screen.getByTestId("recurrence-schedule-submit"));

    await waitFor(() => {
      expect(governanceApi.createArchitectureReviewRecurrenceSchedule).toHaveBeenCalledWith({
        sourceRunId: runId,
        name: "Monday review",
        cronExpression: "0 9 * * 2",
        isEnabled: true,
      });
    });

    expect(await screen.findByText("Recurrence scheduled.")).toBeInTheDocument();
  });

  it("shows error when create fails", async () => {
    vi.mocked(governanceApi.createArchitectureReviewRecurrenceSchedule).mockRejectedValue(new Error("API down"));

    render(<RecurrenceSchedulePostCommitCard runId={runId} hasStickinessPrompt />);
    fireEvent.click(screen.getByTestId("recurrence-schedule-submit"));

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
