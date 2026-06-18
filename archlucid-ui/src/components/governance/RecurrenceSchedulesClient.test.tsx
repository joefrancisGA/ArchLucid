import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api/governance-stickiness-api", () => ({
  listArchitectureReviewRecurrenceSchedules: vi.fn(),
  updateArchitectureReviewRecurrenceSchedule: vi.fn(),
}));

import * as governanceApi from "@/lib/api/governance-stickiness-api";
import RecurrenceSchedulesClient from "@/components/governance/RecurrenceSchedulesClient";

describe("RecurrenceSchedulesClient", () => {
  it("renders schedules from the management API", async () => {
    vi.mocked(governanceApi.listArchitectureReviewRecurrenceSchedules).mockResolvedValue([
      {
        scheduleId: "11111111-1111-1111-1111-111111111111",
        sourceRunId: "22222222-2222-2222-2222-222222222222",
        name: "Weekly architecture review",
        cronExpression: "0 8 * * 1",
        nextRunUtc: "2026-06-23T08:00:00.000Z",
        isEnabled: true,
        lastRunStatus: "never",
        consecutiveFailureCount: 0,
        lastErrorMessage: null,
      },
    ]);

    render(<RecurrenceSchedulesClient />);

    await waitFor(() => {
      expect(screen.getByText("Weekly architecture review")).toBeInTheDocument();
    });

    expect(screen.getByText("0 8 * * 1")).toBeInTheDocument();
  });
});
