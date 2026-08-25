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

describe("SettingsRolesInvitePanel (SSU P0)", () => {
  it("shows error toast when invite endpoint is missing", async () => {
    vi.mocked(sendAdminUserInvitation).mockResolvedValue({ ok: false, reason: "http_error" });

    render(<SettingsRolesInvitePanel />);

    fireEvent.change(screen.getByTestId("settings-roles-invite-email"), {
      target: { value: "reviewer@example.com" },
    });

    const hiddenSelect = screen.getByTestId("settings-roles-invite-role").parentElement?.querySelector("select");

    if (hiddenSelect === null) {
      throw new Error("expected hidden role select");
    }

    fireEvent.change(hiddenSelect, { target: { value: "Reader" } });
    fireEvent.click(screen.getByTestId("settings-roles-invite-submit"));

    await waitFor(() => {
      expect(showError).toHaveBeenCalled();
    });
    expect(showSuccess).not.toHaveBeenCalled();
  });

  it("shows back-to-review-package handoff after invite when reviewId is provided", async () => {
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
        acceptUrl: null,
      },
    });

    render(<SettingsRolesInvitePanel reviewId="run-123" />);

    fireEvent.change(screen.getByTestId("settings-roles-invite-email"), {
      target: { value: "reviewer@example.com" },
    });

    const hiddenSelect = screen.getByTestId("settings-roles-invite-role").parentElement?.querySelector("select");

    if (hiddenSelect === null) {
      throw new Error("expected hidden role select");
    }

    fireEvent.change(hiddenSelect, { target: { value: "Reader" } });
    fireEvent.click(screen.getByTestId("settings-roles-invite-submit"));

    expect(await screen.findByTestId("settings-roles-invite-back-to-review-package")).toHaveAttribute(
      "href",
      "/architecture/reviews/run-123",
    );
  });

  it("mentions accept-link copy when the API returns an accept URL", async () => {
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
        acceptUrl: "https://example.test/accept/token",
      },
    });

    const onInviteSent = vi.fn();

    render(<SettingsRolesInvitePanel onInviteSent={onInviteSent} />);

    fireEvent.change(screen.getByTestId("settings-roles-invite-email"), {
      target: { value: "reviewer@example.com" },
    });

    const hiddenSelect = screen.getByTestId("settings-roles-invite-role").parentElement?.querySelector("select");

    if (hiddenSelect === null) {
      throw new Error("expected hidden role select");
    }

    fireEvent.change(hiddenSelect, { target: { value: "Reader" } });
    fireEvent.click(screen.getByTestId("settings-roles-invite-submit"));

    await waitFor(() => {
      expect(showSuccess).toHaveBeenCalledWith(
        "Invitation sent to reviewer@example.com. Copy the accept link from Pending invitations if you need to share it manually.",
      );
    });
    expect(onInviteSent).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        acceptUrl: "https://example.test/accept/token",
      }),
    );
  });

  it("uses UTF-8 ellipses in invite form copy", () => {
    render(<SettingsRolesInvitePanel />);

    expect(screen.getByTestId("settings-roles-invite-message")).toHaveAttribute(
      "placeholder",
      "Add a note to include in the invitation email…",
    );
    expect(screen.getByTestId("settings-roles-invite-submit")).toHaveTextContent("Send invite");
    expect(screen.getByTestId("settings-roles-invite-form").textContent).not.toMatch(/â€/);
  });
});
