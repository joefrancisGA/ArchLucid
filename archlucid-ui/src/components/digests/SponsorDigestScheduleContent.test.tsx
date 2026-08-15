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
  getSponsorDigestPreferences: vi.fn(),
  saveSponsorDigestPreferences: vi.fn(),
}));

import { SponsorDigestScheduleContent } from "@/components/digests/SponsorDigestScheduleContent";
import { getSponsorDigestPreferences, saveSponsorDigestPreferences } from "@/lib/api";

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
  fireEvent.click(screen.getByTestId("sponsor-digest-add-recipient"));
}

describe("SponsorDigestScheduleContent", () => {
  beforeEach(() => {
    demoEnvMock.buyerPolished = false;
    demoEnvMock.fullShell = true;
    vi.mocked(getSponsorDigestPreferences).mockReset();
    vi.mocked(saveSponsorDigestPreferences).mockReset();
    vi.mocked(getSponsorDigestPreferences).mockResolvedValue({
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
    vi.mocked(saveSponsorDigestPreferences).mockResolvedValue({
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

  it("uses Schedule sponsor digest identity and relationship copy", async () => {
    render(<SponsorDigestScheduleContent />);

    expect(screen.queryByText("Architecture digests")).toBeNull();
    expect(await screen.findByTestId("sponsor-digest-schedule-heading")).toHaveTextContent("Schedule sponsor digest");
    expect(screen.getByText(/weekly rollup of architecture and review activity/i)).toBeInTheDocument();
    expect(screen.getByText(/Architecture digests generated from advisory scans/i)).toBeInTheDocument();
    expect(screen.queryByText(/Schema version/i)).toBeNull();
    expect(screen.queryByTestId("sponsor-digest-schedule-technical-details")).toBeNull();
    expect(screen.queryByLabelText("Send sponsor digest")).toBeNull();
    expect(screen.queryByTestId("sponsor-digest-enable-action")).toBeNull();
  });

  it("does not use paused language before the schedule is configured", async () => {
    render(<SponsorDigestScheduleContent />);

    await screen.findByTestId("sponsor-digest-status-summary");
    expect(screen.getByTestId("sponsor-digest-status-summary")).toHaveTextContent(/until delivery is enabled/i);
    expect(screen.getByTestId("sponsor-digest-status-summary")).not.toHaveTextContent(/paused/i);
  });

  it("renders only one overall delivery status tag", async () => {
    render(<SponsorDigestScheduleContent />);

    await screen.findByTestId("sponsor-digest-status-tag");
    expect(screen.getAllByTestId("sponsor-digest-status-tag")).toHaveLength(1);
    expect(screen.queryByTestId("sponsor-digest-readiness-overall")).toBeNull();
    expect(screen.queryByTestId("sponsor-digest-status-block")).toBeNull();
  });

  it("shows setup-incomplete status without a contradictory enable checkbox", async () => {
    render(<SponsorDigestScheduleContent />);

    expect(await screen.findByTestId("sponsor-digest-status-tag")).toHaveTextContent("Setup incomplete");
    expect(screen.getByTestId("sponsor-digest-enable-delivery")).toBeInTheDocument();
    expect(screen.getByTestId("sponsor-digest-save-schedule")).toBeInTheDocument();
    expect(screen.getByTestId("digest-preview-before-subscribe")).toBeInTheDocument();
  });

  it("places delivery readiness before save and enable actions when unpinned", async () => {
    render(<SponsorDigestScheduleContent />);

    const readiness = await screen.findByTestId("sponsor-digest-delivery-readiness");
    const save = screen.getByTestId("sponsor-digest-save-schedule");

    expect(readiness.compareDocumentPosition(save) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("stacks delivery readiness rail when schedule is sparse empty (TB-1574)", async () => {
    render(<SponsorDigestScheduleContent />);

    const layout = await screen.findByTestId("sponsor-digest-schedule-layout");
    expect(layout).toHaveAttribute("data-live-rail-pinned", "false");
    expect(layout.className).not.toMatch(/xl:grid-cols-/);
    expect(screen.getByTestId("sponsor-digest-delivery-readiness")).toBeInTheDocument();
    expect(screen.getByTestId("sponsor-digest-latest-generated")).toBeInTheDocument();
  });

  it("pins delivery readiness rail after a recipient is added (TB-1574)", async () => {
    render(<SponsorDigestScheduleContent />);

    await screen.findByTestId("sponsor-digest-schedule-layout");
    addRecipient("ops@example.com");

    const layout = screen.getByTestId("sponsor-digest-schedule-layout");
    expect(layout).toHaveAttribute("data-live-rail-pinned", "true");
    expect(layout.className).toMatch(/xl:grid-cols-/);
  });

  it("pins delivery readiness rail when a preview digest exists (TB-1574)", async () => {
    render(
      <SponsorDigestScheduleContent
        healthSnap={{
          ...baseHealth,
          latestArchitectureDigestId: "digest-1",
          latestArchitectureDigestGeneratedUtc: "2026-07-08T12:00:00Z",
        }}
      />,
    );

    const layout = await screen.findByTestId("sponsor-digest-schedule-layout");
    expect(layout).toHaveAttribute("data-live-rail-pinned", "true");
  });

  it("enables scheduled delivery, saves, and refreshes summary", async () => {
    const onRefresh = vi.fn();
    render(<SponsorDigestScheduleContent healthSnap={baseHealth} onRefresh={onRefresh} />);

    await screen.findByTestId("sponsor-digest-enable-delivery");
    addRecipient("ops@example.com");

    expect(screen.getByTestId("sponsor-digest-recipient-chips")).toHaveTextContent("ops@example.com");
    fireEvent.click(screen.getByTestId("sponsor-digest-enable-delivery"));

    await waitFor(() => {
      expect(saveSponsorDigestPreferences).toHaveBeenCalled();
    });

    expect(vi.mocked(saveSponsorDigestPreferences).mock.calls[0][0].emailEnabled).toBe(true);
    expect(await screen.findByTestId("sponsor-digest-save-success")).toHaveTextContent(/Scheduled delivery enabled/i);
    expect(onRefresh).toHaveBeenCalled();
    expect(screen.getByTestId("sponsor-digest-saved-summary")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Manage delivery destinations" })).toHaveAttribute(
      "href",
      "/architecture/digests?tab=subscriptions",
    );
  });

  it("keeps form values after save failure", async () => {
    vi.mocked(saveSponsorDigestPreferences).mockRejectedValue(new Error("boom"));
    render(<SponsorDigestScheduleContent />);

    await screen.findByTestId("sponsor-digest-enable-delivery");
    addRecipient("keep@example.com");
    fireEvent.change(screen.getByLabelText("Day of week"), { target: { value: "3" } });
    fireEvent.click(screen.getByTestId("sponsor-digest-save-schedule"));

    await waitFor(() => {
      expect(screen.getAllByRole("alert").length).toBeGreaterThanOrEqual(1);
    });

    expect(screen.getByTestId("sponsor-digest-recipient-chips")).toHaveTextContent("keep@example.com");
    expect(screen.getByLabelText("Day of week")).toHaveValue("3");
  });

  it("validates invalid and duplicate recipient emails", async () => {
    render(<SponsorDigestScheduleContent />);

    await screen.findByTestId("sponsor-digest-enable-delivery");
    addRecipient("not-an-email");
    expect(screen.getByTestId("sponsor-digest-recipient-draft-error")).toHaveTextContent(
      /Invalid email address/i,
    );
    expect(screen.queryByTestId("sponsor-digest-recipient-chips")).toBeNull();

    fireEvent.change(recipientDraftInput(), {
      target: { value: "ops@example.com; ops@example.com" },
    });
    fireEvent.click(screen.getByTestId("sponsor-digest-add-recipient"));
    expect(screen.getByTestId("sponsor-digest-recipient-draft-error")).toHaveTextContent(
      /Duplicate recipient/i,
    );
    expect(screen.queryByTestId("sponsor-digest-recipient-chips")).toBeNull();
    expect(screen.getByTestId("sponsor-digest-enable-delivery")).toBeDisabled();
  });

  it("distinguishes configured cadence while paused from next send", async () => {
    vi.mocked(getSponsorDigestPreferences).mockResolvedValue({
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

    render(<SponsorDigestScheduleContent />);

    expect(await screen.findByTestId("sponsor-digest-status-tag")).toHaveTextContent("Paused");
    expect(screen.getAllByText(/Delivery is currently paused/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Not scheduled while delivery is paused/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByTestId("sponsor-digest-enable-delivery")).toBeInTheDocument();
    expect(screen.queryByTestId("sponsor-digest-pause-delivery")).toBeNull();
  });

  it("pauses active delivery without requiring a second enable checkbox", async () => {
    vi.mocked(getSponsorDigestPreferences).mockResolvedValue({
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
    vi.mocked(saveSponsorDigestPreferences).mockResolvedValue({
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

    render(<SponsorDigestScheduleContent healthSnap={baseHealth} />);

    expect(await screen.findByTestId("sponsor-digest-status-tag")).toHaveTextContent("Ready");
    fireEvent.click(screen.getByTestId("sponsor-digest-pause-delivery"));

    await waitFor(() => {
      expect(saveSponsorDigestPreferences).toHaveBeenCalled();
    });

    expect(vi.mocked(saveSponsorDigestPreferences).mock.calls[0][0].emailEnabled).toBe(false);
    expect(await screen.findByTestId("sponsor-digest-save-success")).toHaveTextContent(/paused/i);
  });

  it("explains disabled preview and clarifies architecture digest test action", async () => {
    vi.mocked(getSponsorDigestPreferences).mockResolvedValue({
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
    render(<SponsorDigestScheduleContent healthSnap={baseHealth} />);

    const preview = await screen.findByTestId("sponsor-digest-preview-action");
    expect(preview).toBeDisabled();
    expect(preview).toHaveAttribute("aria-describedby", "sponsor-digest-preview-unavailable-hint");
    expect(screen.getByText(/No digest has been generated yet/i)).toBeInTheDocument();
    expect(screen.getByText(/after the first architecture digest/i)).toBeInTheDocument();

    expect(screen.getByRole("link", { name: "Generate architecture digest test" })).toHaveAttribute(
      "href",
      "/governance/advisory-scans?tab=schedules",
    );
    expect(screen.getByText(/may consume AI budget/i)).toBeInTheDocument();
    expect(screen.getByText(/does not email sponsor recipients/i)).toBeInTheDocument();
  });

  it("enables preview when a latest architecture digest exists", async () => {
    render(
      <SponsorDigestScheduleContent
        healthSnap={{
          ...baseHealth,
          latestArchitectureDigestId: "digest-1",
          latestArchitectureDigestGeneratedUtc: "2026-07-20T12:00:00Z",
        }}
      />,
    );

    expect(await screen.findByRole("link", { name: "Preview latest generated digest" })).toHaveAttribute(
      "href",
      "/architecture/digests?tab=get-started#digest-digest-1",
    );
  });

  it("blocks save, enable, and test email actions in sample mode", async () => {
    demoEnvMock.buyerPolished = true;
    demoEnvMock.fullShell = false;
    vi.mocked(getSponsorDigestPreferences).mockResolvedValue({
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

    render(<SponsorDigestScheduleContent />);

    expect(await screen.findByTestId("sponsor-digest-sample-blocked")).toBeInTheDocument();
    expect(screen.getByTestId("sponsor-digest-save-schedule")).toBeDisabled();
    expect(screen.getByTestId("sponsor-digest-enable-delivery")).toBeDisabled();
    expect(screen.queryByTestId("sponsor-digest-test-action")).toBeNull();
    expect(screen.getByTestId("sponsor-digest-test-sample-blocked")).toBeInTheDocument();
  });

  it("shows readiness overall state and refresh control", async () => {
    const onRefresh = vi.fn();
    render(
      <SponsorDigestScheduleContent
        healthSnap={{
          ...baseHealth,
          setupGaps: ["Outbound email channel is not ready for production delivery."],
        }}
        onRefresh={onRefresh}
        refreshing={false}
      />,
    );

    expect(await screen.findByTestId("sponsor-digest-status-tag")).toHaveTextContent("Delivery issue");
    expect(screen.getByTestId("sponsor-digest-readiness-next-action")).toBeInTheDocument();

    const refresh = screen.getByTestId("sponsor-digest-refresh-status");
    expect(refresh.tagName).toBe("BUTTON");
    fireEvent.click(refresh);
    expect(onRefresh).toHaveBeenCalled();
  });

  it("uses a responsive two-column layout only when the live rail is pinned (TB-1574)", async () => {
    render(<SponsorDigestScheduleContent />);

    const sparseLayout = await screen.findByTestId("sponsor-digest-schedule-layout");
    expect(sparseLayout).toHaveAttribute("data-live-rail-pinned", "false");
    expect(sparseLayout.className).not.toMatch(/xl:grid-cols-/);

    addRecipient("ops@example.com");

    const pinnedLayout = screen.getByTestId("sponsor-digest-schedule-layout");
    expect(pinnedLayout).toHaveAttribute("data-live-rail-pinned", "true");
    expect(pinnedLayout.className).toMatch(/xl:grid-cols-/);
    expect(screen.getByTestId("sponsor-digest-latest-generated")).toBeInTheDocument();
  });

  it("keeps schedule day/time keyboard operable", async () => {
    render(<SponsorDigestScheduleContent />);

    const day = await screen.findByLabelText("Day of week");
    day.focus();
    expect(day).toHaveFocus();
    fireEvent.change(day, { target: { value: "2" } });
    expect(day).toHaveValue("2");
  });
});
