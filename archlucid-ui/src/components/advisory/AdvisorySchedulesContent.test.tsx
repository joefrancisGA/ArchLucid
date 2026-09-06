import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AdvisorySchedulesContent } from "@/components/advisory/AdvisorySchedulesContent";
import {
  ADVISORY_SCANS_SCHEDULES_NEXT_SCHEDULED_SCANS_LABEL,
  ADVISORY_SCANS_SCHEDULES_RECURRENCE_PEER_LINK_LABEL,
  ADVISORY_SCANS_SCHEDULES_SCAN_NOW_LABEL,
} from "@/lib/advisory-copy";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { writeOperatorScopeToStorage } from "@/lib/operator/operator-scope-storage";

const apiMocks = vi.hoisted(() => ({
  listAdvisorySchedules: vi.fn(),
  createAdvisorySchedule: vi.fn(),
  listScheduleExecutions: vi.fn(),
  runAdvisoryScheduleNow: vi.fn(),
  previewRecurrenceScheduleRuns: vi.fn(),
}));

const authMock = vi.hoisted(() => ({
  rank: 3,
}));

const reviewAvailabilityMock = vi.hoisted(() => ({
  loading: false,
  hasFinalizedReviews: true,
  finalizedCount: 1,
}));

const demoEnvMock = vi.hoisted(() => ({
  buyerPolished: false,
  fullShell: true,
  evalChrome: false,
}));

vi.mock("@/hooks/useProductionDeskChrome", () => ({
  useProductionEvalChrome: () => demoEnvMock.evalChrome,
}));

vi.mock("@/lib/api", () => ({
  listAdvisorySchedules: apiMocks.listAdvisorySchedules,
  createAdvisorySchedule: apiMocks.createAdvisorySchedule,
  listScheduleExecutions: apiMocks.listScheduleExecutions,
  runAdvisoryScheduleNow: apiMocks.runAdvisoryScheduleNow,
}));

vi.mock("@/lib/api/governance-stickiness-api", () => ({
  previewRecurrenceScheduleRuns: apiMocks.previewRecurrenceScheduleRuns,
}));

vi.mock("@/components/operator/OperatorNavAuthorityProvider", () => ({
  useNavCallerAuthorityRank: () => authMock.rank,
}));

vi.mock("@/hooks/use-advisory-schedule-review-availability", () => ({
  useAdvisoryScheduleReviewAvailability: () => ({
    loading: reviewAvailabilityMock.loading,
    hasFinalizedReviews: reviewAvailabilityMock.hasFinalizedReviews,
    finalizedCount: reviewAvailabilityMock.finalizedCount,
  }),
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: () => demoEnvMock.buyerPolished,
    isOperatorExperienceFullShellEnv: () => demoEnvMock.fullShell,
  };
});

describe("AdvisorySchedulesContent", () => {
  async function revealCreateFormWhenPopulated(): Promise<void> {
    fireEvent.click(await screen.findByTestId("advisory-schedules-create-action"));
  }

  beforeEach(() => {
    authMock.rank = AUTHORITY_RANK.AdminAuthority;
    reviewAvailabilityMock.loading = false;
    reviewAvailabilityMock.hasFinalizedReviews = true;
    reviewAvailabilityMock.finalizedCount = 1;
    demoEnvMock.buyerPolished = false;
    demoEnvMock.fullShell = true;
    demoEnvMock.evalChrome = false;
    apiMocks.listAdvisorySchedules.mockReset();
    apiMocks.createAdvisorySchedule.mockReset();
    apiMocks.listScheduleExecutions.mockReset();
    apiMocks.runAdvisoryScheduleNow.mockReset();
    apiMocks.previewRecurrenceScheduleRuns.mockReset();
    apiMocks.listAdvisorySchedules.mockResolvedValue([]);
    apiMocks.previewRecurrenceScheduleRuns.mockResolvedValue({
      isValid: true,
      nextRunUtc: [
        "2026-07-21T11:00:00.000Z",
        "2026-07-22T11:00:00.000Z",
        "2026-07-23T11:00:00.000Z",
      ],
    });
    writeOperatorScopeToStorage({
      tenantId: "11111111-1111-1111-1111-111111111111",
      workspaceId: "22222222-2222-2222-2222-222222222222",
      projectId: "33333333-3333-3333-3333-333333333333",
      workspaceLabel: "Demo workspace",
      projectLabel: "claims-intake",
    });
  });

  it("shows Schedule advisory scans identity without a redundant eyebrow", async () => {
    render(<AdvisorySchedulesContent />);

    await waitFor(() => {
      expect(apiMocks.listAdvisorySchedules).toHaveBeenCalled();
    });

    expect(screen.queryByText("Advisory scans")).toBeNull();
    expect(screen.getByRole("heading", { name: "Schedule advisory scans" })).toBeInTheDocument();
    expect(screen.queryByTestId("advisory-schedules-how-it-works")).toBeNull();
    expect(screen.queryByTestId("advisory-schedules-layout")).toBeNull();
    expect(screen.queryByText(/Background worker polls/i)).toBeNull();
    expect(screen.queryByText(/project slug/i)).toBeNull();
    expect(screen.getByTestId("advisory-recurrence-schedule-vocabulary-peer-link")).toHaveTextContent(
      ADVISORY_SCANS_SCHEDULES_RECURRENCE_PEER_LINK_LABEL,
    );
    expect(screen.getByTestId("advisory-recurrence-schedule-vocabulary-peer-link")).toHaveAttribute(
      "href",
      "/governance/recurrence-schedules",
    );
  });

  it("names workspace-switcher project scope explicitly in the create form", async () => {
    render(<AdvisorySchedulesContent />);

    await waitFor(() => {
      expect(screen.getByTestId("advisory-schedule-project-scope-label")).toHaveTextContent("claims-intake");
    });

    expect(screen.getByText(/Schedule project scope:/i)).toBeInTheDocument();
    expect(screen.queryByText(/not stored silently in this browser/i)).toBeNull();
    expect(screen.queryByLabelText(/Workspace project slug/i)).toBeNull();
  });

  it("hides advanced cron by default and shows upcoming-run preview", async () => {
    render(<AdvisorySchedulesContent />);

    await waitFor(() => {
      expect(screen.getByTestId("advisory-schedule-upcoming-preview")).toBeInTheDocument();
    });

    expect(screen.queryByTestId("cron-expression-input")).toBeNull();
    expect(await screen.findByText(ADVISORY_SCANS_SCHEDULES_NEXT_SCHEDULED_SCANS_LABEL)).toBeInTheDocument();
    expect(await screen.findAllByRole("listitem")).toHaveLength(3);
    expect(screen.queryByTestId("document-layout")).toBeNull();
  });

  it("uses primary submit in empty state without a competing header primary (AD-P0-2)", async () => {
    render(<AdvisorySchedulesContent />);

    const submit = await screen.findByTestId("advisory-schedule-create-submit");
    expect(submit.className).toContain("al-primary-action-bg");
    expect(screen.queryByTestId("advisory-schedules-create-action")).toBeNull();
  });

  it("shows finalized-review prerequisite empty state when no committed reviews exist", async () => {
    reviewAvailabilityMock.hasFinalizedReviews = false;
    reviewAvailabilityMock.finalizedCount = 0;

    render(<AdvisorySchedulesContent />);

    expect(await screen.findByTestId("advisory-schedules-no-finalized-reviews-empty-state")).toBeInTheDocument();
    expect(screen.queryByTestId("advisory-schedule-create-form")).toBeNull();
    expect(screen.queryByTestId("advisory-schedule-create-submit")).toBeNull();
  });

  it("disables run now when finalized reviews are unavailable", async () => {
    reviewAvailabilityMock.hasFinalizedReviews = false;
    reviewAvailabilityMock.finalizedCount = 0;
    apiMocks.listAdvisorySchedules.mockResolvedValue([
      {
        scheduleId: "sched-blocked",
        tenantId: "t",
        workspaceId: "w",
        projectId: "p",
        runProjectSlug: "default",
        name: "Weekly architecture follow-up scan",
        cronExpression: "0 8 * * 1",
        isEnabled: true,
        createdUtc: "2026-07-01T00:00:00.000Z",
        nextRunUtc: "2026-07-27T08:00:00.000Z",
        lastRunUtc: null,
      },
    ]);

    render(<AdvisorySchedulesContent />);

    expect(await screen.findByTestId("advisory-schedules-prerequisite-blocked")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: ADVISORY_SCANS_SCHEDULES_SCAN_NOW_LABEL })).toBeDisabled();
  });

  it("shows one next-runs panel when Advanced is open on a preset frequency (AD-P0-3)", async () => {
    render(<AdvisorySchedulesContent />);

    await waitFor(() => {
      expect(screen.getByTestId("advisory-schedule-upcoming-preview")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("advisory-schedule-advanced-toggle"));

    expect(await screen.findByTestId("cron-expression-input")).toBeInTheDocument();
    expect(screen.getByTestId("advisory-schedule-upcoming-preview")).toBeInTheDocument();
    expect(screen.queryByTestId("cron-next-runs-preview")).toBeNull();
    expect(screen.queryByText(/Generated expression \(UTC\)/i)).toBeNull();
  });

  it("shows generated cron only after Advanced scheduling opens", async () => {
    render(<AdvisorySchedulesContent />);

    fireEvent.click(screen.getByTestId("advisory-schedule-advanced-toggle"));

    expect(await screen.findByText(/Generated expression \(UTC\)/i)).toBeInTheDocument();
  });

  it("creates a daily schedule with pending state and refreshes the list", async () => {
    apiMocks.createAdvisorySchedule.mockResolvedValue({
      scheduleId: "sched-1",
      tenantId: "t",
      workspaceId: "w",
      projectId: "p",
      runProjectSlug: "default",
      name: "Daily claims-intake advisory scan",
      cronExpression: "0 11 * * *",
      isEnabled: true,
      createdUtc: "2026-07-20T00:00:00.000Z",
      nextRunUtc: "2026-07-21T11:00:00.000Z",
      lastRunUtc: null,
    });
    apiMocks.listAdvisorySchedules
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          scheduleId: "sched-1",
          tenantId: "t",
          workspaceId: "w",
          projectId: "p",
          runProjectSlug: "default",
          name: "Daily claims-intake advisory scan",
          cronExpression: "0 11 * * *",
          isEnabled: true,
          createdUtc: "2026-07-20T00:00:00.000Z",
          nextRunUtc: "2026-07-21T11:00:00.000Z",
          lastRunUtc: null,
        },
      ]);

    render(<AdvisorySchedulesContent />);

    await waitFor(() => {
      expect(screen.getByTestId("advisory-schedule-create-submit")).toBeEnabled();
    });

    const submit = screen.getByTestId("advisory-schedule-create-submit");
    fireEvent.click(submit);

    expect(submit).toHaveTextContent(/Creating schedule/i);
    expect(submit).toBeDisabled();

    await waitFor(() => {
      expect(apiMocks.createAdvisorySchedule).toHaveBeenCalled();
    });

    expect(apiMocks.createAdvisorySchedule.mock.calls[0][0].runProjectSlug).toBe("default");
    expect(apiMocks.createAdvisorySchedule.mock.calls[0][0].cronExpression).toMatch(/^\d+ \d+ \* \* \*$/);

    expect((await screen.findAllByText("Daily claims-intake advisory scan")).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Schedule created/i).length).toBeGreaterThanOrEqual(1);
  });

  it("keeps form values after create failure", async () => {
    apiMocks.createAdvisorySchedule.mockRejectedValue(new Error("boom"));

    render(<AdvisorySchedulesContent />);

    await waitFor(() => {
      expect(screen.getByTestId("advisory-schedule-create-submit")).toBeEnabled();
    });

    fireEvent.change(screen.getByLabelText(/Schedule name/i), {
      target: { value: "Keep this name" },
    });
    fireEvent.click(screen.getByTestId("advisory-schedule-create-submit"));

    await waitFor(() => {
      expect(screen.getAllByRole("alert").length).toBeGreaterThanOrEqual(1);
    });

    expect(screen.getByDisplayValue("Keep this name")).toBeInTheDocument();
  });

  it("shows framed empty state and expanded create form when empty and can mutate", async () => {
    render(<AdvisorySchedulesContent />);

    expect(await screen.findByTestId("advisory-schedules-empty")).toBeInTheDocument();
    expect(screen.queryByTestId("advisory-schedule-example-preview")).toBeNull();
    expect(screen.getByTestId("advisory-schedule-create-submit")).toBeInTheDocument();
    expect(screen.queryByTestId("advisory-schedules-create-action")).toBeNull();
  });

  it("populated: header Create reveals form (TB-1542)", async () => {
    apiMocks.listAdvisorySchedules.mockResolvedValue([
      {
        scheduleId: "sched-2",
        tenantId: "t",
        workspaceId: "w",
        projectId: "p",
        runProjectSlug: "default",
        name: "Weekly architecture follow-up scan",
        cronExpression: "0 8 * * 1",
        isEnabled: true,
        createdUtc: "2026-07-01T00:00:00.000Z",
        nextRunUtc: "2026-07-27T08:00:00.000Z",
        lastRunUtc: "2026-07-20T08:00:00.000Z",
      },
    ]);

    render(<AdvisorySchedulesContent />);

    const createButton = await screen.findByTestId("advisory-schedules-create-action");
    expect(createButton.className).toContain("al-primary-action-bg");
    expect(screen.queryByTestId("advisory-schedule-create-submit")).toBeNull();

    fireEvent.click(createButton);

    expect(screen.queryByTestId("advisory-schedules-create-action")).toBeNull();
    expect(await screen.findByTestId("advisory-schedule-create-submit")).toBeInTheDocument();
  });

  it("renders existing schedules with status and actions", async () => {
    apiMocks.listAdvisorySchedules.mockResolvedValue([
      {
        scheduleId: "sched-2",
        tenantId: "t",
        workspaceId: "w",
        projectId: "p",
        runProjectSlug: "default",
        name: "Weekly architecture follow-up scan",
        cronExpression: "0 8 * * 1",
        isEnabled: true,
        createdUtc: "2026-07-01T00:00:00.000Z",
        nextRunUtc: "2026-07-27T08:00:00.000Z",
        lastRunUtc: "2026-07-20T08:00:00.000Z",
      },
    ]);

    render(<AdvisorySchedulesContent />);

    const table = await screen.findByRole("table", { name: "Advisory scan schedules" });
    expect(within(table).getByText("Weekly architecture follow-up scan")).toBeInTheDocument();
    expect(screen.getByTestId("advisory-schedules-continue-last-viewed-row")).toBeInTheDocument();
    expect(screen.getByTestId("advisory-schedules-continue-last-viewed-open")).toBeInTheDocument();
    expect(screen.getByText("Ready")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: ADVISORY_SCANS_SCHEDULES_SCAN_NOW_LABEL })).toHaveAttribute(
      "aria-describedby",
    );
    expect(screen.getByRole("button", { name: "View history" })).toHaveAttribute("aria-describedby");
    expect(screen.queryByRole("button", { name: "Delete" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Pause" })).toBeNull();
  });

  it("blocks create in sample mode", async () => {
    demoEnvMock.buyerPolished = true;
    demoEnvMock.fullShell = false;
    demoEnvMock.evalChrome = true;

    render(<AdvisorySchedulesContent />);

    expect(await screen.findByTestId("advisory-schedules-sample-blocked")).toBeInTheDocument();
    expect(screen.getByTestId("advisory-schedule-create-submit")).toBeDisabled();
  });

  it("shows read-only guidance for callers without management permission", async () => {
    authMock.rank = AUTHORITY_RANK.ReadAuthority;

    render(<AdvisorySchedulesContent />);

    expect(await screen.findByTestId("advisory-schedules-read-only")).toBeInTheDocument();
    expect(screen.getByTestId("advisory-schedule-create-submit")).toBeDisabled();
    expect(screen.queryByText(/AdminAuthority|Execute\+/i)).toBeNull();
  });

  it("supports weekly frequency selection and keyboard focus on frequency control", async () => {
    render(<AdvisorySchedulesContent />);

    const frequency = await screen.findByLabelText("How often");
    frequency.focus();
    expect(frequency).toHaveFocus();

    fireEvent.change(frequency, { target: { value: "weekly" } });
    expect(screen.getByLabelText("Day")).toBeInTheDocument();

    fireEvent.change(frequency, { target: { value: "monthly" } });
    expect(screen.getByLabelText("Day of month")).toBeInTheDocument();
  });

  it("renders create form at full section width without a pinned orientation rail", async () => {
    render(<AdvisorySchedulesContent />);

    await waitFor(() => {
      expect(apiMocks.listAdvisorySchedules).toHaveBeenCalled();
    });

    expect(screen.queryByTestId("advisory-schedules-side-column")).toBeNull();
    expect(screen.getByTestId("advisory-schedule-inline-scope")).toBeInTheDocument();
    expect(screen.getByTestId("advisory-schedule-project-scope-label")).toHaveTextContent("claims-intake");
    expect(screen.getByTestId("advisory-schedule-create-form")).toBeInTheDocument();
  });

  it("surfaces invalid advanced cron feedback", async () => {
    apiMocks.previewRecurrenceScheduleRuns.mockResolvedValue({
      isValid: false,
      validationError: "Unsupported or invalid cron expression.",
      nextRunUtc: [],
    });

    render(<AdvisorySchedulesContent />);

    fireEvent.click(screen.getByTestId("advisory-schedule-advanced-toggle"));
    const input = await screen.findByTestId("cron-expression-input");
    fireEvent.change(input, { target: { value: "not-a-real-cron" } });

    expect(await screen.findByRole("alert")).toHaveTextContent(/Unsupported or invalid/i);
  });

  it("keeps persistent list header with project, count, last loaded, and refresh when empty", async () => {
    render(<AdvisorySchedulesContent />);

    const header = await screen.findByTestId("advisory-schedules-list-header");
    expect(header.textContent).toMatch(/Project scope:/i);
    expect(header.textContent).toMatch(/claims-intake/);
    expect(within(header).getByTestId("advisory-schedules-count")).toHaveTextContent("0 schedules in scope");
    expect(within(header).getByTestId("advisory-schedules-last-loaded")).toHaveTextContent(/Last loaded/i);
    expect(within(header).getByTestId("advisory-schedules-refresh")).toBeInTheDocument();
    expect(screen.queryByTestId("advisory-schedules-status-message")).toBeNull();
  });

  it("places Refresh in the persistent schedules header when populated", async () => {
    apiMocks.listAdvisorySchedules.mockResolvedValue([
      {
        scheduleId: "sched-1",
        tenantId: "t",
        workspaceId: "w",
        projectId: "p",
        runProjectSlug: "default",
        name: "Weekly scan",
        cronExpression: "0 8 * * 1",
        isEnabled: true,
        createdUtc: "2026-07-01T00:00:00.000Z",
        nextRunUtc: "2026-07-27T08:00:00.000Z",
        lastRunUtc: null,
      },
    ]);

    render(<AdvisorySchedulesContent />);

    expect((await screen.findAllByText("Weekly scan")).length).toBeGreaterThan(0);
    const header = screen.getByTestId("advisory-schedules-list-header");
    expect(within(header).getByTestId("advisory-schedules-refresh")).toBeInTheDocument();
    expect(screen.getByRole("table", { name: "Advisory scan schedules" })).toBeInTheDocument();
  });

  it("uses EnterpriseTable inventory for populated schedules (TB-1647)", async () => {
    apiMocks.listAdvisorySchedules.mockResolvedValue([
      {
        scheduleId: "sched-1",
        tenantId: "t",
        workspaceId: "w",
        projectId: "p",
        runProjectSlug: "default",
        name: "Weekly scan",
        cronExpression: "0 8 * * 1",
        isEnabled: true,
        createdUtc: "2026-07-01T00:00:00.000Z",
        nextRunUtc: "2026-07-27T08:00:00.000Z",
        lastRunUtc: null,
      },
    ]);

    render(<AdvisorySchedulesContent />);

    await waitFor(() => {
      expect(screen.getByRole("table", { name: "Advisory scan schedules" })).toBeInTheDocument();
    });

    expect(screen.getByRole("columnheader", { name: "Cadence" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Status" })).toBeInTheDocument();
    expect(screen.queryByText("Last outcome")).toBeNull();
  });

  it("reloads schedules when operator project scope changes", async () => {
    render(<AdvisorySchedulesContent />);

    await waitFor(() => {
      expect(apiMocks.listAdvisorySchedules).toHaveBeenCalledTimes(1);
    });

    writeOperatorScopeToStorage({
      tenantId: "11111111-1111-1111-1111-111111111111",
      workspaceId: "22222222-2222-2222-2222-222222222222",
      projectId: "44444444-4444-4444-4444-444444444444",
      workspaceLabel: "Demo workspace",
      projectLabel: "payments-core",
    });

    await waitFor(() => {
      expect(apiMocks.listAdvisorySchedules).toHaveBeenCalledTimes(2);
    });

    const header = screen.getByTestId("advisory-schedules-list-header");
    expect(header.textContent).toMatch(/payments-core/);
  });

  it("reveals create form from populated list via header action", async () => {
    apiMocks.listAdvisorySchedules.mockResolvedValue([
      {
        scheduleId: "sched-1",
        tenantId: "t",
        workspaceId: "w",
        projectId: "p",
        runProjectSlug: "default",
        name: "Weekly scan",
        cronExpression: "0 8 * * 1",
        isEnabled: true,
        createdUtc: "2026-07-01T00:00:00.000Z",
        nextRunUtc: "2026-07-27T08:00:00.000Z",
        lastRunUtc: null,
      },
    ]);

    render(<AdvisorySchedulesContent />);

    await revealCreateFormWhenPopulated();
    expect(screen.getByTestId("advisory-schedule-create-submit")).toBeInTheDocument();
  });
});
