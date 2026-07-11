import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api/governance-stickiness-api", () => ({
  createArchitectureReviewRecurrenceSchedule: vi.fn(),
  listArchitectureReviewRecurrenceSchedules: vi.fn(),
  updateArchitectureReviewRecurrenceSchedule: vi.fn(),
  previewRecurrenceScheduleRuns: vi.fn(),
}));

import * as governanceApi from "@/lib/api/governance-stickiness-api";
import RecurrenceSchedulesClient from "@/components/governance/RecurrenceSchedulesClient";
import {
  RECURRENCE_SCHEDULES_HELPER_BODY,
  RECURRENCE_SCHEDULES_HELPER_NEXT_STEP,
  RECURRENCE_SCHEDULES_HELPER_TITLE,
  RECURRENCE_SCHEDULES_PAGE_SUBTITLE,
  RECURRENCE_SCHEDULES_PENDING_APPROVALS_HREF,
  RECURRENCE_SCHEDULES_REVIEW_PACKAGES_HREF,
  RECURRENCE_SCHEDULES_RISK_REGISTER_HREF,
} from "@/lib/recurrence-schedules-copy";

const sampleSchedule = {
  scheduleId: "11111111-1111-1111-1111-111111111111",
  sourceRunId: "22222222-2222-2222-2222-222222222222",
  name: "Weekly architecture review",
  cronExpression: "0 8 * * 1",
  nextRunUtc: "2026-06-23T08:00:00.000Z",
  lastTriggeredUtc: "2026-06-16T08:00:00.000Z",
  isEnabled: true,
  lastRunStatus: "succeeded",
  consecutiveFailureCount: 0,
  lastErrorMessage: null,
};

describe("RecurrenceSchedulesClient", () => {
  beforeEach(() => {
    vi.mocked(governanceApi.listArchitectureReviewRecurrenceSchedules).mockResolvedValue([]);
    vi.mocked(governanceApi.updateArchitectureReviewRecurrenceSchedule).mockResolvedValue(sampleSchedule);
    vi.mocked(governanceApi.previewRecurrenceScheduleRuns).mockResolvedValue({
      isValid: true,
      nextRunUtc: ["2026-06-23T08:00:00.000Z"],
    });
  });

  it("renders page subtitle and recurrence-specific layer guidance", async () => {
    render(<RecurrenceSchedulesClient />);

    expect(await screen.findByText(RECURRENCE_SCHEDULES_PAGE_SUBTITLE)).toBeInTheDocument();
    expect(
      screen.getByText(/Define repeatable review cadences for committed architecture records/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Submit finalized architecture outputs for governance review and promotion."),
    ).not.toBeInTheDocument();
  });

  it("renders helpful empty state copy and create action", async () => {
    render(<RecurrenceSchedulesClient />);

    expect(await screen.findByTestId("recurrence-schedules-empty-state")).toBeInTheDocument();
    expect(screen.getByText("No recurrence schedules yet")).toBeInTheDocument();
    expect(
      screen.getByText(/quarterly control validation, annual policy review, post-remediation follow-up/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/accepted risks, policy exceptions, and governed architecture decisions/i),
    ).toBeInTheDocument();
    expect(screen.getByTestId("recurrence-schedules-create-action")).toBeInTheDocument();
    expect(screen.getByTestId("recurrence-schedules-empty-create")).toBeInTheDocument();
    expect(screen.getByTestId("recurrence-schedule-examples")).toBeInTheDocument();
  });

  it("renders helper card with updated governance workflow guidance", async () => {
    render(<RecurrenceSchedulesClient />);

    expect(await screen.findByTestId("recurrence-schedules-helper-card")).toBeInTheDocument();
    expect(screen.getByText(RECURRENCE_SCHEDULES_HELPER_TITLE)).toBeInTheDocument();
    expect(screen.getByText(RECURRENCE_SCHEDULES_HELPER_BODY)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(RECURRENCE_SCHEDULES_HELPER_NEXT_STEP))).toBeInTheDocument();
  });

  it("links secondary actions to existing governance routes", async () => {
    render(<RecurrenceSchedulesClient />);

    await screen.findByTestId("recurrence-schedules-empty-state");

    const reviewPackageLinks = screen.getAllByRole("link", { name: "View governed review packages" });
    expect(reviewPackageLinks.some((link) => link.getAttribute("href") === RECURRENCE_SCHEDULES_REVIEW_PACKAGES_HREF)).toBe(true);

    const pendingApprovalLinks = screen.getAllByRole("link", { name: "View pending approvals" });
    expect(pendingApprovalLinks.some((link) => link.getAttribute("href") === RECURRENCE_SCHEDULES_PENDING_APPROVALS_HREF)).toBe(true);

    expect(screen.getByRole("link", { name: "Open risk register" })).toHaveAttribute(
      "href",
      RECURRENCE_SCHEDULES_RISK_REGISTER_HREF,
    );
  });

  it("renders schedule rows when data exists", async () => {
    vi.mocked(governanceApi.listArchitectureReviewRecurrenceSchedules).mockResolvedValue([sampleSchedule]);

    render(<RecurrenceSchedulesClient />);

    await waitFor(() => {
      expect(screen.getByText("Weekly architecture review")).toBeInTheDocument();
    });

    expect(screen.getByText("0 8 * * 1")).toBeInTheDocument();
    expect(screen.getByText("Last run OK")).toBeInTheDocument();
    expect(screen.getByTestId("recurrence-enabled-11111111-1111-1111-1111-111111111111")).toBeInTheDocument();
    expect(screen.queryByTestId("recurrence-schedules-empty-state")).not.toBeInTheDocument();
  });

  it("shows disabled status when schedule is not enabled", async () => {
    vi.mocked(governanceApi.listArchitectureReviewRecurrenceSchedules).mockResolvedValue([
      { ...sampleSchedule, isEnabled: false, lastRunStatus: "never" },
    ]);

    render(<RecurrenceSchedulesClient />);

    expect(await screen.findByText("Disabled")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Enable" })).toBeInTheDocument();
  });

  it("opens create panel from header action", async () => {
    render(<RecurrenceSchedulesClient />);

    await screen.findByTestId("recurrence-schedules-empty-state");
    fireEvent.click(screen.getByTestId("recurrence-schedules-create-action"));

    expect(screen.getByTestId("recurrence-schedule-create-panel")).toBeInTheDocument();
  });

  it("keeps an active schedule enabled when saving metadata changes", async () => {
    vi.mocked(governanceApi.listArchitectureReviewRecurrenceSchedules).mockResolvedValue([sampleSchedule]);

    render(<RecurrenceSchedulesClient />);

    await waitFor(() => {
      expect(screen.getByText("Weekly architecture review")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    fireEvent.change(screen.getByTestId("recurrence-schedule-name"), {
      target: { value: "Updated weekly review" },
    });
    fireEvent.click(screen.getByTestId("recurrence-save-changes"));

    await waitFor(() => {
      expect(governanceApi.updateArchitectureReviewRecurrenceSchedule).toHaveBeenCalledWith(
        sampleSchedule.scheduleId,
        {
          name: "Updated weekly review",
          cronExpression: sampleSchedule.cronExpression,
          isEnabled: true,
        },
      );
    });
  });
});
