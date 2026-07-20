import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

vi.mock("@/lib/admin-user-invitations", () => ({
  sendAdminUserInvitation: vi.fn(),
}));

import { sendAdminUserInvitation } from "@/lib/admin-user-invitations";
import { showError, showSuccess } from "@/lib/toast";

import { SettingsRolesInvitePanel } from "./SettingsRolesInvitePanel";

describe("SettingsRolesInvitePanel (TB-794)", () => {
  it("keeps the invite form when the user directory is unavailable", () => {
    render(<SettingsRolesInvitePanel directoryUnavailable onRetry={() => undefined} />);

    expect(screen.getByTestId("settings-roles-invite-form")).toBeInTheDocument();
    expect(screen.getByTestId("settings-roles-invite-directory-unavailable")).toBeInTheDocument();
    expect(screen.getByTestId("settings-roles-invite-email")).toBeInTheDocument();
  });

  it("shows error toast when invite endpoint is missing", async () => {
    vi.mocked(sendAdminUserInvitation).mockResolvedValue({ ok: false, reason: "http_error" });

    render(<SettingsRolesInvitePanel directoryUnavailable={false} onRetry={() => undefined} />);

    fireEvent.change(screen.getByTestId("settings-roles-invite-email"), {
      target: { value: "reviewer@example.com" },
    });

    const hiddenSelect = screen.getByTestId("settings-roles-invite-role").parentElement?.querySelector("select");

    if (hiddenSelect === null || hiddenSelect === undefined) {
      throw new Error("expected hidden role select");
    }

    fireEvent.change(hiddenSelect, { target: { value: "Reader" } });
    fireEvent.click(screen.getByTestId("settings-roles-invite-submit"));

    await waitFor(() => {
      expect(showError).toHaveBeenCalled();
    });
    expect(showSuccess).not.toHaveBeenCalled();
  });

  it("shows reference id on successful invite", async () => {
    vi.mocked(sendAdminUserInvitation).mockResolvedValue({
      ok: true,
      invitation: {
        id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        email: "reviewer@example.com",
        appRole: "Reader",
        status: "Pending",
        tenantName: "Acme",
        workspaceId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
        invitedByActorId: "admin",
        message: null,
        createdUtc: "2026-07-15T00:00:00Z",
        expiresUtc: "2026-07-29T00:00:00Z",
      },
    });

    const onInviteSent = vi.fn();

    render(
      <SettingsRolesInvitePanel
        directoryUnavailable={false}
        onRetry={() => undefined}
        onInviteSent={onInviteSent}
      />,
    );

    fireEvent.change(screen.getByTestId("settings-roles-invite-email"), {
      target: { value: "reviewer@example.com" },
    });

    const hiddenSelect = screen.getByTestId("settings-roles-invite-role").parentElement?.querySelector("select");

    if (hiddenSelect === null || hiddenSelect === undefined) {
      throw new Error("expected hidden role select");
    }

    fireEvent.change(hiddenSelect, { target: { value: "Reader" } });
    fireEvent.click(screen.getByTestId("settings-roles-invite-submit"));

    await waitFor(() => {
      expect(showSuccess).toHaveBeenCalledWith(
        "Invite sent to reviewer@example.com (reference aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa).",
      );
    });
    expect(onInviteSent).toHaveBeenCalled();
  });
});
