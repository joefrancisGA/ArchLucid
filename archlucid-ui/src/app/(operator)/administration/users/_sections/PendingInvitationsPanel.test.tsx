import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

vi.mock("@/lib/admin-user-invitations", () => ({
  fetchAdminUserInvitations: vi.fn(),
  revokeAdminUserInvitation: vi.fn(),
}));

import { fetchAdminUserInvitations } from "@/lib/admin-user-invitations";

import { PendingInvitationsPanel } from "./PendingInvitationsPanel";

describe("PendingInvitationsPanel (SSU P0)", () => {
  it("reports null count when invitation load fails", async () => {
    const onCountChange = vi.fn();

    vi.mocked(fetchAdminUserInvitations).mockResolvedValue(null);

    render(<PendingInvitationsPanel refreshKey={0} onCountChange={onCountChange} />);

    expect(await screen.findByTestId("settings-roles-pending-invitations-unavailable")).toBeInTheDocument();
    expect(onCountChange).toHaveBeenCalledWith(null);
    expect(screen.queryByText(/Pending invitations \(/)).not.toBeInTheDocument();
    expect(screen.getByTestId("settings-roles-pending-invitations-audit-footnote")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "audit trail" })).toHaveAttribute("href", "/governance/audit");
  });

  it("shows only pending rows by default and exposes accept-link copy", async () => {
    const onCountChange = vi.fn();

    vi.mocked(fetchAdminUserInvitations).mockResolvedValue([
      {
        id: "11111111-1111-1111-1111-111111111111",
        email: "pending@example.com",
        appRole: "Reader",
        status: "Pending",
        tenantName: "Acme",
        workspaceId: "22222222-2222-2222-2222-222222222222",
        invitedByActorId: "admin-actor",
        message: null,
        createdUtc: "2026-07-15T00:00:00Z",
        expiresUtc: "2026-07-29T00:00:00Z",
        acceptUrl: "https://example.test/accept/token",
      },
      {
        id: "33333333-3333-3333-3333-333333333333",
        email: "done@example.com",
        appRole: "Reader",
        status: "Accepted",
        tenantName: "Acme",
        workspaceId: "22222222-2222-2222-2222-222222222222",
        invitedByActorId: "admin-actor",
        message: null,
        createdUtc: "2026-07-10T00:00:00Z",
        expiresUtc: "2026-07-24T00:00:00Z",
      },
    ]);

    render(<PendingInvitationsPanel refreshKey={0} onCountChange={onCountChange} />);

    await waitFor(() => {
      expect(onCountChange).toHaveBeenCalledWith(1);
    });

    expect(screen.getByText("pending@example.com")).toBeInTheDocument();
    expect(screen.queryByText("done@example.com")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Copy accept link/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View in audit trail" })).toHaveAttribute("href", "/governance/audit");
  });

  it("preserves seeded accept links when the list API omits secrets", async () => {
    vi.mocked(fetchAdminUserInvitations).mockResolvedValue([
      {
        id: "11111111-1111-1111-1111-111111111111",
        email: "pending@example.com",
        appRole: "Reader",
        status: "Pending",
        tenantName: "Acme",
        workspaceId: "22222222-2222-2222-2222-222222222222",
        invitedByActorId: "admin-actor",
        message: null,
        createdUtc: "2026-07-15T00:00:00Z",
        expiresUtc: "2026-07-29T00:00:00Z",
      },
    ]);

    render(
      <PendingInvitationsPanel
        refreshKey={0}
        seededInvitations={[
          {
            id: "11111111-1111-1111-1111-111111111111",
            email: "pending@example.com",
            appRole: "Reader",
            status: "Pending",
            tenantName: "Acme",
            workspaceId: "22222222-2222-2222-2222-222222222222",
            invitedByActorId: "admin-actor",
            message: null,
            createdUtc: "2026-07-15T00:00:00Z",
            expiresUtc: "2026-07-29T00:00:00Z",
            acceptUrl: "https://example.test/accept/token",
          },
        ]}
      />,
    );

    expect(await screen.findByRole("button", { name: /Copy accept link/i })).toBeInTheDocument();
  });

  it("reveals resolved invitations behind an explicit control", async () => {
    vi.mocked(fetchAdminUserInvitations).mockResolvedValue([
      {
        id: "11111111-1111-1111-1111-111111111111",
        email: "pending@example.com",
        appRole: "Reader",
        status: "Pending",
        tenantName: "Acme",
        workspaceId: "22222222-2222-2222-2222-222222222222",
        invitedByActorId: "admin-actor",
        message: null,
        createdUtc: "2026-07-15T00:00:00Z",
        expiresUtc: "2026-07-29T00:00:00Z",
      },
      {
        id: "33333333-3333-3333-3333-333333333333",
        email: "done@example.com",
        appRole: "Reader",
        status: "Revoked",
        tenantName: "Acme",
        workspaceId: "22222222-2222-2222-2222-222222222222",
        invitedByActorId: "admin-actor",
        message: null,
        createdUtc: "2026-07-10T00:00:00Z",
        expiresUtc: "2026-07-24T00:00:00Z",
      },
    ]);

    render(<PendingInvitationsPanel refreshKey={0} />);

    await screen.findByText("pending@example.com");
    fireEvent.click(screen.getByTestId("settings-roles-toggle-resolved-invitations"));

    expect(await screen.findByText("done@example.com")).toBeInTheDocument();
  });

  it("renders audit trail footnote when empty presentation is suppressed", async () => {
    vi.mocked(fetchAdminUserInvitations).mockResolvedValue([]);

    render(<PendingInvitationsPanel refreshKey={0} suppressEmptyPresentation />);

    expect(await screen.findByTestId("settings-roles-pending-invitations-audit-footnote")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "audit trail" })).toHaveAttribute("href", "/governance/audit");
    expect(screen.queryByTestId("settings-roles-pending-invitations-empty")).not.toBeInTheDocument();
  });
});
