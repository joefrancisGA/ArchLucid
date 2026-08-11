import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const demoEnvMock = vi.hoisted(() => ({
  buyerPolished: false,
  fullShell: true,
}));

vi.mock("@/hooks/use-operate-capability", () => ({
  useOperateCapability: () => true,
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: () => demoEnvMock.buyerPolished,
    isOperatorExperienceFullShellEnv: () => demoEnvMock.fullShell,
  };
});

vi.mock("@/lib/api", () => ({
  getExecDigestPreferences: vi.fn(),
  saveExecDigestPreferences: vi.fn(),
}));

import { ExecDigestScheduleContent } from "@/components/digests/ExecDigestScheduleContent";
import { getExecDigestPreferences, saveExecDigestPreferences } from "@/lib/api";

const baseHealth = {
  enabledAdvisoryScheduleCount: 1,
  digestSubscriptionCount: 1,
  enabledDigestSubscriptionCount: 2,
  digestSubscriptionsByEmailChannel: 2,
  digestSubscriptionsBySlackChannel: 0,
  digestSubscriptionsByTeamsChannel: 0,
  executiveEmailDigestIsConfigured: false,
  executiveEmailDigestEnabled: false,
  executiveDigestRecipientCount: 0,
  executiveDigestIanaTimeZoneId: "UTC",
  executiveDigestDayOfWeek: 1,
  executiveDigestHourOfDay: 8,
  setupGaps: [] as string[],
};

function recipientDraftInput(): HTMLElement {
  return screen.getByPlaceholderText("name@company.com");
}

function addRecipient(email: string): void {
  fireEvent.change(recipientDraftInput(), { target: { value: email } });
  fireEvent.click(screen.getByTestId("exec-digest-add-recipient"));
}

describe("ExecDigestScheduleContent", () => {
  beforeEach(() => {
    demoEnvMock.buyerPolished = false;
    demoEnvMock.fullShell = true;
    vi.mocked(getExecDigestPreferences).mockReset();
    vi.mocked(saveExecDigestPreferences).mockReset();
    vi.mocked(getExecDigestPreferences).mockResolvedValue({
      schemaVersion: 1,
      tenantId: "t",
      isConfigured: false,
      emailEnabled: false,
      recipientEmails: [],
      ianaTimeZoneId: "UTC",
      dayOfWeek: 1,
      hourOfDay: 8,
      updatedUtc: "2026-07-08T12:00:00Z",
    });
    vi.mocked(saveExecDigestPreferences).mockResolvedValue({
      schemaVersion: 1,
      tenantId: "t",
      isConfigured: true,
      emailEnabled: true,
      recipientEmails: ["ops@example.com"],
      ianaTimeZoneId: "UTC",
      dayOfWeek: 1,
      hourOfDay: 8,
      updatedUtc: "2026-07-08T13:00:00Z",
    });
  });

  it("uses Architecture digests / Schedule executive digest identity and relationship copy", async () => {
    render(<ExecDigestScheduleContent />);

    expect(await screen.findByText("Architecture digests")).toBeInTheDocument();
    expect(screen.getByTestId("exec-digest-schedule-heading")).toHaveTextContent("Schedule executive digest");
    expect(screen.getByText(/weekly rollup of architecture and review activity/i)).toBeInTheDocument();
    expect(screen.getByText(/Architecture digests generated from advisory scans/i)).toBeInTheDocument();
    expect(screen.queryByText(/Schema version/i)).toBeNull();
    expect(screen.queryByTestId("exec-digest-schedule-technical-details")).toBeNull();
    expect(screen.queryByLabelText("Send executive digest")).toBeNull();
    expect(screen.queryByTestId("exec-digest-enable-action")).toBeNull();
  });

  it("shows setup-incomplete status without a contradictory enable checkbox", async () => {
    render(<ExecDigestScheduleContent />);

    expect(await screen.findByTestId("exec-digest-status-tag")).toHaveTextContent("Setup incomplete");
    expect(screen.getByTestId("exec-digest-enable-delivery")).toBeInTheDocument();
    expect(screen.getByTestId("exec-digest-save-schedule")).toBeInTheDocument();
    expect(screen.getByTestId("digest-preview-before-subscribe")).toBeInTheDocument();
  });

  it("stacks delivery readiness rail when schedule is sparse empty (TB-1574)", async () => {
    render(<ExecDigestScheduleContent />);

    const layout = await screen.findByTestId("exec-digest-schedule-layout");
    expect(layout).toHaveAttribute("data-live-rail-pinned", "false");
    expect(layout.className).not.toMatch(/xl:grid-cols-/);
    expect(screen.getByTestId("exec-digest-delivery-readiness")).toBeInTheDocument();
    expect(screen.queryByTestId("exec-digest-latest-generated")).not.toBeInTheDocument();
  });

  it("pins delivery readiness rail after a recipient is added (TB-1574)", async () => {
    render(<ExecDigestScheduleContent />);

    await screen.findByTestId("exec-digest-schedule-layout");
    addRecipient("ops@example.com");

    const layout = screen.getByTestId("exec-digest-schedule-layout");
    expect(layout).toHaveAttribute("data-live-rail-pinned", "true");
    expect(layout.className).toMatch(/xl:grid-cols-/);
  });

  it("pins delivery readiness rail when a preview digest exists (TB-1574)", async () => {
    render(
      <ExecDigestScheduleContent
        healthSnap={{
          ...baseHealth,
          latestArchitectureDigestId: "digest-1",
          latestArchitectureDigestGeneratedUtc: "2026-07-08T12:00:00Z",
        }}
      />,
    );

    const layout = await screen.findByTestId("exec-digest-schedule-layout");
    expect(layout).toHaveAttribute("data-live-rail-pinned", "true");
  });

  it("enables scheduled delivery, saves, and refreshes summary", async () => {
    const onRefresh = vi.fn();
    render(<ExecDigestScheduleContent healthSnap={baseHealth} onRefresh={onRefresh} />);

    await screen.findByTestId("exec-digest-enable-delivery");
    addRecipient("ops@example.com");

    expect(screen.getByTestId("exec-digest-recipient-chips")).toHaveTextContent("ops@example.com");
    fireEvent.click(screen.getByTestId("exec-digest-enable-delivery"));

    await waitFor(() => {
      expect(saveExecDigestPreferences).toHaveBeenCalled();
    });

    expect(vi.mocked(saveExecDigestPreferences).mock.calls[0][0].emailEnabled).toBe(true);
    expect(await screen.findByTestId("exec-digest-save-success")).toHaveTextContent(/Scheduled delivery enabled/i);
    expect(onRefresh).toHaveBeenCalled();
    expect(screen.getByTestId("exec-digest-saved-summary")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Manage delivery destinations" })).toHaveAttribute(
      "href",
      "/architecture/digests?tab=subscriptions",
    );
  });

  it("keeps form values after save failure", async () => {
    vi.mocked(saveExecDigestPreferences).mockRejectedValue(new Error("boom"));
    render(<ExecDigestScheduleContent />);

    await screen.findByTestId("exec-digest-enable-delivery");
    addRecipient("keep@example.com");
    fireEvent.change(screen.getByLabelText("Day of week"), { target: { value: "3" } });
    fireEvent.click(screen.getByTestId("exec-digest-save-schedule"));

    await waitFor(() => {
      expect(screen.getAllByRole("alert").length).toBeGreaterThanOrEqual(1);
    });

    expect(screen.getByTestId("exec-digest-recipient-chips")).toHaveTextContent("keep@example.com");
    expect(screen.getByLabelText("Day of week")).toHaveValue("3");
  });

  it("validates invalid and duplicate recipient emails", async () => {
    render(<ExecDigestScheduleContent />);

    await screen.findByTestId("exec-digest-enable-delivery");
    addRecipient("not-an-email");
    expect(screen.getByTestId("exec-digest-recipient-draft-error")).toHaveTextContent(
      /Invalid email address/i,
    );
    expect(screen.queryByTestId("exec-digest-recipient-chips")).toBeNull();

    fireEvent.change(recipientDraftInput(), {
      target: { value: "ops@example.com; ops@example.com" },
    });
    fireEvent.click(screen.getByTestId("exec-digest-add-recipient"));
    expect(screen.getByTestId("exec-digest-recipient-draft-error")).toHaveTextContent(
      /Duplicate recipient/i,
    );
    expect(screen.queryByTestId("exec-digest-recipient-chips")).toBeNull();
    expect(screen.getByTestId("exec-digest-enable-delivery")).toBeDisabled();
  });

  it("distinguishes configured cadence while paused from next send", async () => {
    vi.mocked(getExecDigestPreferences).mockResolvedValue({
      schemaVersion: 1,
      tenantId: "t",
      isConfigured: true,
      emailEnabled: false,
      recipientEmails: ["ops@example.com"],
      ianaTimeZoneId: "America/New_York",
      dayOfWeek: 1,
      hourOfDay: 8,
      updatedUtc: "2026-07-08T12:00:00Z",
    });

    render(<ExecDigestScheduleContent />);

    expect(await screen.findByTestId("exec-digest-status-tag")).toHaveTextContent("Paused");
    expect(screen.getAllByText(/Delivery is currently paused/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Not scheduled while delivery is paused/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByTestId("exec-digest-enable-delivery")).toBeInTheDocument();
    expect(screen.queryByTestId("exec-digest-pause-delivery")).toBeNull();
  });

  it("pauses active delivery without requiring a second enable checkbox", async () => {
    vi.mocked(getExecDigestPreferences).mockResolvedValue({
      schemaVersion: 1,
      tenantId: "t",
      isConfigured: true,
      emailEnabled: true,
      recipientEmails: ["ops@example.com"],
      ianaTimeZoneId: "UTC",
      dayOfWeek: 1,
      hourOfDay: 8,
      updatedUtc: "2026-07-08T12:00:00Z",
    });
    vi.mocked(saveExecDigestPreferences).mockResolvedValue({
      schemaVersion: 1,
      tenantId: "t",
      isConfigured: true,
      emailEnabled: false,
      recipientEmails: ["ops@example.com"],
      ianaTimeZoneId: "UTC",
      dayOfWeek: 1,
      hourOfDay: 8,
      updatedUtc: "2026-07-08T13:00:00Z",
    });

    render(<ExecDigestScheduleContent />);

    expect(await screen.findByTestId("exec-digest-status-tag")).toHaveTextContent("Active");
    fireEvent.click(screen.getByTestId("exec-digest-pause-delivery"));

    await waitFor(() => {
      expect(saveExecDigestPreferences).toHaveBeenCalled();
    });

    expect(vi.mocked(saveExecDigestPreferences).mock.calls[0][0].emailEnabled).toBe(false);
    expect(await screen.findByTestId("exec-digest-save-success")).toHaveTextContent(/paused/i);
  });

  it("explains disabled preview and clarifies architecture digest test action", async () => {
    vi.mocked(getExecDigestPreferences).mockResolvedValue({
      schemaVersion: 1,
      tenantId: "t",
      isConfigured: false,
      emailEnabled: false,
      recipientEmails: ["ops@example.com"],
      ianaTimeZoneId: "UTC",
      dayOfWeek: 1,
      hourOfDay: 8,
      updatedUtc: "2026-07-08T12:00:00Z",
    });
    render(<ExecDigestScheduleContent healthSnap={baseHealth} />);

    const preview = await screen.findByTestId("exec-digest-preview-action");
    expect(preview).toBeDisabled();
    expect(preview).toHaveAttribute("title", expect.stringMatching(/after the first architecture digest/i));
    expect(screen.getByText(/No digest has been generated yet/i)).toBeInTheDocument();

    expect(screen.getByRole("link", { name: "Generate architecture digest test" })).toHaveAttribute(
      "href",
      "/governance/advisory-scans?tab=schedules",
    );
    expect(screen.getByText(/may consume AI budget/i)).toBeInTheDocument();
    expect(screen.getByText(/does not email executive recipients/i)).toBeInTheDocument();
  });

  it("enables preview when a latest architecture digest exists", async () => {
    render(
      <ExecDigestScheduleContent
        healthSnap={{
          ...baseHealth,
          latestArchitectureDigestId: "digest-1",
          latestArchitectureDigestGeneratedUtc: "2026-07-20T12:00:00Z",
        }}
      />,
    );

    expect(await screen.findByRole("link", { name: "Preview latest generated digest" })).toHaveAttribute(
      "href",
      "/architecture/digests?tab=browse#digest-digest-1",
    );
  });

  it("blocks save, enable, and test email actions in sample mode", async () => {
    demoEnvMock.buyerPolished = true;
    demoEnvMock.fullShell = false;
    vi.mocked(getExecDigestPreferences).mockResolvedValue({
      schemaVersion: 1,
      tenantId: "t",
      isConfigured: false,
      emailEnabled: false,
      recipientEmails: ["ops@example.com"],
      ianaTimeZoneId: "UTC",
      dayOfWeek: 1,
      hourOfDay: 8,
      updatedUtc: "2026-07-08T12:00:00Z",
    });

    render(<ExecDigestScheduleContent />);

    expect(await screen.findByTestId("exec-digest-sample-blocked")).toBeInTheDocument();
    expect(screen.getByTestId("exec-digest-save-schedule")).toBeDisabled();
    expect(screen.getByTestId("exec-digest-enable-delivery")).toBeDisabled();
    expect(screen.queryByTestId("exec-digest-test-action")).toBeNull();
    expect(screen.getByTestId("exec-digest-test-sample-blocked")).toBeInTheDocument();
  });

  it("shows readiness overall state and refresh control", async () => {
    const onRefresh = vi.fn();
    render(
      <ExecDigestScheduleContent
        healthSnap={{
          ...baseHealth,
          setupGaps: ["Outbound email channel is not ready for production delivery."],
        }}
        onRefresh={onRefresh}
        refreshing={false}
      />,
    );

    expect(await screen.findByTestId("exec-digest-readiness-overall")).toBeInTheDocument();
    expect(screen.getByTestId("exec-digest-readiness-next-action")).toBeInTheDocument();

    const refresh = screen.getByTestId("exec-digest-refresh-status");
    expect(refresh.tagName).toBe("BUTTON");
    fireEvent.click(refresh);
    expect(onRefresh).toHaveBeenCalled();
  });

  it("uses a responsive two-column layout only when the live rail is pinned (TB-1574)", async () => {
    render(<ExecDigestScheduleContent />);

    const sparseLayout = await screen.findByTestId("exec-digest-schedule-layout");
    expect(sparseLayout).toHaveAttribute("data-live-rail-pinned", "false");
    expect(sparseLayout.className).not.toMatch(/xl:grid-cols-/);

    addRecipient("ops@example.com");

    const pinnedLayout = screen.getByTestId("exec-digest-schedule-layout");
    expect(pinnedLayout).toHaveAttribute("data-live-rail-pinned", "true");
    expect(pinnedLayout.className).toMatch(/xl:grid-cols-/);
    expect(screen.getByTestId("exec-digest-latest-generated")).toBeInTheDocument();
  });

  it("keeps schedule day/time keyboard operable", async () => {
    render(<ExecDigestScheduleContent />);

    const day = await screen.findByLabelText("Day of week");
    day.focus();
    expect(day).toHaveFocus();
    fireEvent.change(day, { target: { value: "2" } });
    expect(day).toHaveValue("2");
  });
});
