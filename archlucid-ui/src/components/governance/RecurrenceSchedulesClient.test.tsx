import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/recurrence-local-time", async () => {
  const actual = await vi.importActual<typeof import("@/lib/recurrence-local-time")>(
    "@/lib/recurrence-local-time",
  );

  return {
    ...actual,
    resolveRecurrenceDisplayTimeZoneId: () => "America/New_York",
  };
});

vi.mock("@/lib/api/governance-stickiness-api", () => ({
  createArchitectureReviewRecurrenceSchedule: vi.fn(),
  listArchitectureReviewRecurrenceSchedules: vi.fn(),
  updateArchitectureReviewRecurrenceSchedule: vi.fn(),
  previewRecurrenceScheduleRuns: vi.fn(),
}));

import * as governanceApi from "@/lib/api/governance-stickiness-api";
import RecurrenceSchedulesClient from "@/components/governance/RecurrenceSchedulesClient";
import { GOVERNANCE_OVERVIEW_PAGE_LEAD } from "@/lib/governance-overview-copy";
import {
  RECURRENCE_SCHEDULE_EXAMPLES,
  RECURRENCE_SCHEDULES_EMPTY_DESCRIPTION,
  RECURRENCE_SCHEDULES_EMPTY_SUPPORTING,
  RECURRENCE_SCHEDULES_HELPER_BODY,
  RECURRENCE_SCHEDULES_HELPER_NEXT_STEP,
  RECURRENCE_SCHEDULES_HELPER_TITLE,
  RECURRENCE_SCHEDULES_HOW_IT_WORKS_BODY,
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

  it("orients with OperatorPageHeader subtitle — not governance overview LayerHeader (TB-1129)", async () => {
    render(<RecurrenceSchedulesClient />);

    expect(await screen.findByTestId("recurrence-schedules-page")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Recurrence schedules" })).toBeInTheDocument();
    expect(screen.getByText(RECURRENCE_SCHEDULES_PAGE_SUBTITLE)).toBeInTheDocument();
    expect(screen.queryByText(GOVERNANCE_OVERVIEW_PAGE_LEAD)).not.toBeInTheDocument();
    expect(screen.queryByText(/Workspace governance status, pending approvals/i)).not.toBeInTheDocument();
  });

  it("keeps one short lead and folds longer prose into How-it-works (TB-1130)", async () => {
    render(<RecurrenceSchedulesClient />);

    expect(await screen.findByTestId("recurrence-schedules-page")).toBeInTheDocument();
    expect(screen.getByText(RECURRENCE_SCHEDULES_PAGE_SUBTITLE)).toBeInTheDocument();
    expect(screen.getByTestId("recurrence-schedules-create-action")).toBeInTheDocument();

    const howItWorks = screen.getByTestId("recurrence-schedules-how-it-works");

    expect(howItWorks).toBeInTheDocument();
    expect(howItWorks).not.toHaveAttribute("open");
    expect(screen.getByText(RECURRENCE_SCHEDULES_HOW_IT_WORKS_BODY)).toBeInTheDocument();

    const emptyState = await screen.findByTestId("recurrence-schedules-empty-state");

    expect(emptyState).toHaveTextContent(RECURRENCE_SCHEDULES_EMPTY_DESCRIPTION);
    // Supporting sentence is folded into How-it-works — not repeated in the empty card.
    expect(emptyState).not.toHaveTextContent(RECURRENCE_SCHEDULES_EMPTY_SUPPORTING);
  });

  it("renders helpful empty state copy and create action", async () => {
    render(<RecurrenceSchedulesClient />);

    const emptyState = await screen.findByTestId("recurrence-schedules-empty-state");

    expect(emptyState).toBeInTheDocument();
    expect(screen.getByText("No recurrence schedules yet")).toBeInTheDocument();
    expect(emptyState).toHaveTextContent(RECURRENCE_SCHEDULES_EMPTY_DESCRIPTION);
    expect(emptyState).not.toHaveTextContent(RECURRENCE_SCHEDULES_EMPTY_SUPPORTING);
    expect(screen.getByTestId("recurrence-schedules-create-action")).toBeInTheDocument();
    expect(screen.getByTestId("recurrence-schedule-examples")).toBeInTheDocument();
  });

  it("keeps one primary Create and one secondary link when empty (TB-1131 / TB-1133)", async () => {
    render(<RecurrenceSchedulesClient />);

    await screen.findByTestId("recurrence-schedules-empty-state");

    const createButtons = screen.getAllByRole("button", { name: "Create recurrence schedule" });

    expect(createButtons).toHaveLength(1);
    expect(createButtons[0]?.className).toContain("al-primary-action-bg");
    expect(screen.getByTestId("recurrence-schedules-create-action")).toBe(createButtons[0]);

    expect(screen.getAllByRole("link", { name: "View governed reviews" })).toHaveLength(1);
    expect(screen.queryByRole("link", { name: "View pending approvals" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Open risk register" })).not.toBeInTheDocument();

    const secondaryNav = screen.getByTestId("recurrence-schedules-secondary-links");

    expect(secondaryNav).toContainElement(screen.getByRole("link", { name: "View governed reviews" }));
    expect(secondaryNav.querySelector("button")).toBeNull();
  });

  it("hides the workflow helper rail when empty (TB-1133)", async () => {
    render(<RecurrenceSchedulesClient />);

    await screen.findByTestId("recurrence-schedules-empty-state");
    expect(screen.queryByTestId("recurrence-schedules-helper-card")).not.toBeInTheDocument();
    expect(screen.getByTestId("recurrence-schedules-page")).toHaveAttribute("data-empty-composition", "true");
  });

  it("shows the workflow helper rail when schedules exist (TB-1133)", async () => {
    vi.mocked(governanceApi.listArchitectureReviewRecurrenceSchedules).mockResolvedValue([sampleSchedule]);

    render(<RecurrenceSchedulesClient />);

    await waitFor(() => {
      expect(screen.getByText("Weekly architecture review")).toBeInTheDocument();
    });

    expect(screen.getByTestId("recurrence-schedules-helper-card")).toBeInTheDocument();
    expect(screen.getByText(RECURRENCE_SCHEDULES_HELPER_TITLE)).toBeInTheDocument();
    expect(screen.getByText(RECURRENCE_SCHEDULES_HELPER_BODY)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(RECURRENCE_SCHEDULES_HELPER_NEXT_STEP))).toBeInTheDocument();
    expect(screen.getByTestId("recurrence-schedules-page")).toHaveAttribute("data-empty-composition", "false");
  });

  it("uses a compact examples chooser under Create when empty (TB-1133)", async () => {
    render(<RecurrenceSchedulesClient />);

    await screen.findByTestId("recurrence-schedules-empty-state");

    const examples = screen.getByTestId("recurrence-schedule-examples");

    expect(examples).toHaveAttribute("data-variant", "compact");
    expect(screen.getByText("Start from a common cadence")).toBeInTheDocument();
    expect(screen.queryByText(RECURRENCE_SCHEDULE_EXAMPLES[0]!.whenToUse)).not.toBeInTheDocument();
  });

  it("links the empty secondary action to governed reviews", async () => {
    render(<RecurrenceSchedulesClient />);

    await screen.findByTestId("recurrence-schedules-empty-state");

    expect(screen.getByRole("link", { name: "View governed reviews" })).toHaveAttribute(
      "href",
      RECURRENCE_SCHEDULES_REVIEW_PACKAGES_HREF,
    );
  });

  it("restores full secondary links when schedules exist", async () => {
    vi.mocked(governanceApi.listArchitectureReviewRecurrenceSchedules).mockResolvedValue([sampleSchedule]);

    render(<RecurrenceSchedulesClient />);

    await waitFor(() => {
      expect(screen.getByText("Weekly architecture review")).toBeInTheDocument();
    });

    expect(screen.getByRole("link", { name: "View governed reviews" })).toHaveAttribute(
      "href",
      RECURRENCE_SCHEDULES_REVIEW_PACKAGES_HREF,
    );
    expect(screen.getByRole("link", { name: "View pending approvals" })).toHaveAttribute(
      "href",
      RECURRENCE_SCHEDULES_PENDING_APPROVALS_HREF,
    );
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

  it("opens create panel from the sole primary Create action", async () => {
    render(<RecurrenceSchedulesClient />);

    await screen.findByTestId("recurrence-schedules-empty-state");
    fireEvent.click(screen.getByTestId("recurrence-schedules-create-action"));

    expect(screen.getByTestId("recurrence-schedule-create-panel")).toBeInTheDocument();
    expect(screen.queryByTestId("recurrence-schedules-create-action")).not.toBeInTheDocument();
  });

  it("applies example human cadence click into create panel cron (TB-1132)", async () => {
    const example = RECURRENCE_SCHEDULE_EXAMPLES[0]!;

    render(<RecurrenceSchedulesClient />);

    await screen.findByTestId("recurrence-schedules-empty-state");
    fireEvent.click(screen.getByTestId(`recurrence-schedule-example-${example.cronExpression}`));

    expect(screen.getByTestId("recurrence-schedule-create-panel")).toBeInTheDocument();
    expect(screen.getByTestId("recurrence-schedule-name")).toHaveValue(example.title);
    expect(screen.getByTestId("cron-expression-input")).toHaveValue(example.cronExpression);

    const humanCadenceLines = screen.getAllByTestId("recurrence-schedule-example-human-cadence");
    const matchingLine = humanCadenceLines.find((line) => line.textContent?.includes(example.humanCadence));

    expect(matchingLine).toBeDefined();
    expect(matchingLine!.textContent).toMatch(/America\/New_York/);
  });

  it("moves Create to the header when schedules exist (TB-1131)", async () => {
    vi.mocked(governanceApi.listArchitectureReviewRecurrenceSchedules).mockResolvedValue([sampleSchedule]);

    render(<RecurrenceSchedulesClient />);

    await waitFor(() => {
      expect(screen.getByText("Weekly architecture review")).toBeInTheDocument();
    });

    expect(screen.queryByTestId("recurrence-schedules-empty-state")).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Create recurrence schedule" })).toHaveLength(1);
    expect(screen.getByTestId("recurrence-schedules-create-action").className).toContain("al-primary-action-bg");
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
