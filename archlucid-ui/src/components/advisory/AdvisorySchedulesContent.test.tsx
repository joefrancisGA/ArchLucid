import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AdvisorySchedulesContent } from "@/components/advisory/AdvisorySchedulesContent";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { writeOperatorScopeToStorage } from "@/lib/operator-scope-storage";

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

const demoEnvMock = vi.hoisted(() => ({
  buyerPolished: false,
  fullShell: true,
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

vi.mock("@/components/OperatorNavAuthorityProvider", () => ({
  useNavCallerAuthorityRank: () => authMock.rank,
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
  beforeEach(() => {
    authMock.rank = AUTHORITY_RANK.AdminAuthority;
    demoEnvMock.buyerPolished = false;
    demoEnvMock.fullShell = true;
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
        "2026-07-24T11:00:00.000Z",
        "2026-07-25T11:00:00.000Z",
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

  it("shows Advisory scans / Schedule advisory scans identity and customer-friendly description", async () => {
    render(<AdvisorySchedulesContent />);

    await waitFor(() => {
      expect(apiMocks.listAdvisorySchedules).toHaveBeenCalled();
    });

    expect(screen.getByText("Advisory scans")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Schedule advisory scans" })).toBeInTheDocument();
    expect(
      screen.getByText(/Run advisory scans automatically after reviews are finalized/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Background worker polls/i)).toBeNull();
    expect(screen.queryByText(/project slug/i)).toBeNull();
    expect(screen.getByText(/Manage all recurrence schedules/i)).toBeInTheDocument();
  });

  it("uses current project context instead of a slug field", async () => {
    render(<AdvisorySchedulesContent />);

    await waitFor(() => {
      expect(screen.getByText(/Current project: claims-intake/i)).toBeInTheDocument();
    });

    expect(screen.queryByLabelText(/Workspace project slug/i)).toBeNull();
  });

  it("hides advanced cron by default and shows upcoming-run preview", async () => {
    render(<AdvisorySchedulesContent />);

    await waitFor(() => {
      expect(screen.getByTestId("advisory-schedule-upcoming-preview")).toBeInTheDocument();
    });

    expect(screen.queryByTestId("cron-expression-input")).toBeNull();
    expect(await screen.findByText(/Next scheduled runs/i)).toBeInTheDocument();
    expect(await screen.findAllByRole("listitem")).toHaveLength(5);
  });

  it("reveals advanced cron behind Advanced scheduling", async () => {
    render(<AdvisorySchedulesContent />);

    fireEvent.click(screen.getByTestId("advisory-schedule-advanced-toggle"));

    expect(await screen.findByTestId("cron-expression-input")).toBeInTheDocument();
    expect(screen.getByText(/For administrators who need a custom UTC schedule/i)).toBeInTheDocument();
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

    expect(await screen.findByText("Daily claims-intake advisory scan")).toBeInTheDocument();
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

  it("shows empty state copy when no schedules exist", async () => {
    render(<AdvisorySchedulesContent />);

    expect(await screen.findByTestId("advisory-schedules-empty")).toBeInTheDocument();
    expect(screen.getByText("No advisory-scan schedules yet")).toBeInTheDocument();
    expect(
      screen.getByText(/Create a schedule to generate follow-up recommendations automatically/i),
    ).toBeInTheDocument();
    expect(screen.getByTestId("advisory-schedules-layout").contains(screen.getByTestId("advisory-schedules-empty"))).toBe(
      true,
    );
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

    expect(await screen.findByText("Weekly architecture follow-up scan")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Run now" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "View history" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Pause" })).toBeNull();
  });

  it("blocks create in sample mode", async () => {
    demoEnvMock.buyerPolished = true;
    demoEnvMock.fullShell = false;

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

  it("uses a single-column layout with inline scope (TB-1573)", async () => {
    render(<AdvisorySchedulesContent />);

    await waitFor(() => {
      expect(apiMocks.listAdvisorySchedules).toHaveBeenCalled();
    });

    const layout = screen.getByTestId("advisory-schedules-layout");
    expect(layout.className).not.toMatch(/xl:grid-cols-/);
    expect(screen.queryByTestId("advisory-schedules-side-column")).not.toBeInTheDocument();
    expect(screen.getByTestId("advisory-schedule-inline-scope")).toBeInTheDocument();
    expect(screen.getByText(/Current project: claims-intake/i)).toBeInTheDocument();
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

  it("places Refresh in the existing schedules header", async () => {
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

    expect(await screen.findByText("Weekly scan")).toBeInTheDocument();
    const section = screen.getByTestId("advisory-schedules-existing");
    expect(within(section).getByTestId("advisory-schedules-refresh")).toBeInTheDocument();
  });
});
