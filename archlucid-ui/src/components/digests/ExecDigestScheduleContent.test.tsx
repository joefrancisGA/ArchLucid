import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/hooks/use-operate-capability", () => ({
  useOperateCapability: () => true,
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

  it("renders customer-safe schedule copy without internal transport language", async () => {
    render(<ExecDigestScheduleContent />);

    expect(await screen.findByRole("heading", { level: 2, name: "Weekly executive digest" })).toBeInTheDocument();
    expect(
      screen.getByText(
        "Send a weekly summary of review activity, governance signals, findings, and dashboard links to executive recipients.",
      ),
    ).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(
      /trial lifecycle|Not yet saved to the database|IANA timezone|Hour \(0–23/i,
    );
    expect(screen.getByText(/workspace's configured outbound email channel/i)).toBeInTheDocument();
    expect(screen.getByTestId("exec-digest-schedule-preview")).toHaveTextContent(
      "No scheduled send until weekly digest email is enabled.",
    );
  });

  it("shows unsaved changes and saves schedule with primary button", async () => {
    render(<ExecDigestScheduleContent />);

    await screen.findByLabelText("Enable weekly executive digest");
    fireEvent.click(screen.getByLabelText("Enable weekly executive digest"));
    fireEvent.change(screen.getByLabelText("Recipients"), { target: { value: "ops@example.com" } });
    fireEvent.blur(screen.getByLabelText("Recipients"));

    expect(screen.getByTestId("exec-digest-unsaved-status")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("exec-digest-save-schedule"));

    await waitFor(() => {
      expect(saveExecDigestPreferences).toHaveBeenCalled();
    });
    expect(await screen.findByTestId("exec-digest-save-success")).toHaveTextContent("Schedule saved");
  });

  it("validates invalid recipient emails", async () => {
    render(<ExecDigestScheduleContent />);

    const recipients = await screen.findByLabelText("Recipients");
    fireEvent.change(recipients, { target: { value: "not-an-email" } });
    fireEvent.blur(recipients);

    expect(screen.getByRole("alert")).toHaveTextContent(/Invalid email address/i);
    expect(screen.getByTestId("exec-digest-save-schedule")).toBeDisabled();
  });
});
