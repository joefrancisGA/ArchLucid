import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/hooks/use-operate-capability", () => ({
  useOperateCapability: () => true,
}));

vi.mock("@/lib/features", () => ({
  isShowSystemAdministrationNavEnabled: () => false,
}));

vi.mock("@/lib/api", () => ({
  getExecDigestPreferences: vi.fn(),
  saveExecDigestPreferences: vi.fn(),
}));

import { ExecDigestScheduleContent } from "@/components/digests/ExecDigestScheduleContent";
import { getExecDigestPreferences, saveExecDigestPreferences } from "@/lib/api";

describe("ExecDigestScheduleContent", () => {
  beforeEach(() => {
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

  it("renders digest status block and schedule form first", async () => {
    render(<ExecDigestScheduleContent />);

    expect(await screen.findByTestId("exec-digest-status-block")).toBeInTheDocument();
    expect(screen.getByTestId("exec-digest-status-tag")).toHaveTextContent("Off");
    expect(screen.getByText("No scheduled emails will be sent.")).toBeInTheDocument();
    expect(screen.getByTestId("exec-digest-enable-action")).toBeInTheDocument();
    expect(screen.getByLabelText("Send executive digest")).toBeInTheDocument();
    expect(screen.queryByTestId("exec-digest-schedule-technical-details")).not.toBeInTheDocument();
  });

  it("enables digest, saves schedule, and shows saved summary", async () => {
    render(
      <ExecDigestScheduleContent
        healthSnap={{
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
          setupGaps: [],
        }}
      />,
    );

    fireEvent.click(await screen.findByTestId("exec-digest-enable-action"));
    fireEvent.change(screen.getByLabelText("Recipients"), { target: { value: "ops@example.com" } });
    fireEvent.blur(screen.getByLabelText("Recipients"));

    expect(screen.getByTestId("exec-digest-unsaved-status")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("exec-digest-save-schedule"));

    await waitFor(() => {
      expect(saveExecDigestPreferences).toHaveBeenCalled();
    });

    expect(await screen.findByTestId("exec-digest-save-success")).toHaveTextContent("Schedule saved");
    expect(screen.getByTestId("exec-digest-saved-summary")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Manage subscriptions" })).toHaveAttribute(
      "href",
      "/digests?tab=subscriptions",
    );
  });

  it("validates invalid and duplicate recipient emails", async () => {
    render(<ExecDigestScheduleContent />);

    fireEvent.click(await screen.findByTestId("exec-digest-enable-action"));

    const recipients = screen.getByLabelText("Recipients");
    fireEvent.change(recipients, { target: { value: "not-an-email" } });
    fireEvent.blur(recipients);
    expect(screen.getByRole("alert")).toHaveTextContent(/Invalid email address/i);

    fireEvent.change(recipients, { target: { value: "ops@example.com; ops@example.com" } });
    fireEvent.blur(recipients);
    expect(screen.getByRole("alert")).toHaveTextContent(/Duplicate recipient/i);
    expect(screen.getByTestId("exec-digest-save-schedule")).toBeDisabled();
  });

  it("shows preview and test actions with clarified labels", async () => {
    render(
      <ExecDigestScheduleContent
        healthSnap={{
          enabledAdvisoryScheduleCount: 1,
          digestSubscriptionCount: 1,
          enabledDigestSubscriptionCount: 1,
          digestSubscriptionsByEmailChannel: 1,
          digestSubscriptionsBySlackChannel: 0,
          digestSubscriptionsByTeamsChannel: 0,
          executiveEmailDigestIsConfigured: false,
          executiveEmailDigestEnabled: false,
          executiveDigestRecipientCount: 0,
          executiveDigestIanaTimeZoneId: "UTC",
          executiveDigestDayOfWeek: 1,
          executiveDigestHourOfDay: 8,
          setupGaps: [],
          latestArchitectureDigestId: "digest-1",
        }}
      />,
    );

    await screen.findByTestId("exec-digest-preview-action");
    expect(screen.getByRole("link", { name: "Preview latest generated digest" })).toHaveAttribute(
      "href",
      "/digests?tab=browse#digest-digest-1",
    );
    expect(screen.getByRole("link", { name: "Generate and send test digest" })).toHaveAttribute(
      "href",
      "/advisory?tab=schedules",
    );
    expect(
      screen.getByText("Preview opens the latest generated digest and does not reflect unsaved schedule changes."),
    ).toBeInTheDocument();
  });
});
