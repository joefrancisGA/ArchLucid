import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CronExpressionBuilder } from "./CronExpressionBuilder";
import * as governanceApi from "@/lib/api/governance-stickiness-api";

vi.mock("@/lib/api/governance-stickiness-api", () => ({
  previewRecurrenceScheduleRuns: vi.fn(),
}));

describe("CronExpressionBuilder", () => {
  beforeEach(() => {
    vi.mocked(governanceApi.previewRecurrenceScheduleRuns).mockResolvedValue({
      isValid: true,
      nextRunUtc: [
        "2026-03-27T07:00:00.000Z",
        "2026-03-28T07:00:00.000Z",
        "2026-03-29T07:00:00.000Z",
        "2026-03-30T07:00:00.000Z",
        "2026-03-31T07:00:00.000Z",
      ],
    });
  });

  it("shows server-backed next five scheduled runs for the current expression", async () => {
    render(<CronExpressionBuilder value="0 7 * * *" onChange={vi.fn()} />);

    expect(screen.getByTestId("cron-next-runs-preview")).toBeInTheDocument();
    expect(screen.getByText(/Next 5 scheduled runs \(UTC\)/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(governanceApi.previewRecurrenceScheduleRuns).toHaveBeenCalledWith({
        cronExpression: "0 7 * * *",
        count: 5,
      });
    });

    expect(await screen.findAllByRole("listitem")).toHaveLength(5);
  });

  it("surfaces validation errors for unsupported cron expressions", async () => {
    vi.mocked(governanceApi.previewRecurrenceScheduleRuns).mockResolvedValue({
      isValid: false,
      validationError: "Unsupported or invalid cron expression.",
      nextRunUtc: [],
    });

    render(<CronExpressionBuilder value="not-a-real-cron" onChange={vi.fn()} />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Unsupported or invalid cron expression.");
  });

  it("calls onChange when the expression input changes", () => {
    const onChange = vi.fn();

    render(<CronExpressionBuilder value="@daily" onChange={onChange} />);

    fireEvent.change(screen.getByTestId("cron-expression-input"), {
      target: { value: "@hourly" },
    });

    expect(onChange).toHaveBeenCalledWith("@hourly");
  });

  it("skips preview fetch and panel when hidePreview is true (AD-P0-3)", async () => {
    render(<CronExpressionBuilder value="0 7 * * *" onChange={vi.fn()} hidePreview />);

    expect(screen.queryByTestId("cron-next-runs-preview")).toBeNull();

    await waitFor(() => {
      expect(governanceApi.previewRecurrenceScheduleRuns).not.toHaveBeenCalled();
    });
  });
});
