import { describe, expect, it, vi } from "vitest";

import {
  fetchAdminUserInvitations,
  parseAdminUserInvitationsList,
  revokeAdminUserInvitation,
  sendAdminUserInvitation,
} from "@/lib/admin-user-invitations";

describe("admin-user-invitations (TB-794)", () => {
  it("parses invitation list payloads", () => {
    const rows = parseAdminUserInvitationsList({
      invitations: [
        {
          id: "11111111-1111-1111-1111-111111111111",
          email: "reviewer@example.com",
          appRole: "Reader",
          status: "Pending",
          expiresUtc: "2026-08-01T00:00:00Z",
          createdUtc: "2026-07-15T00:00:00Z",
        },
      ],
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]?.email).toBe("reviewer@example.com");
  });

  it("treats missing invite endpoint as failure, not preview success", async () => {
    const fetchFn = vi.fn(async () => new Response(null, { status: 404 }));

    const result = await sendAdminUserInvitation("a@example.com", "Reader", "", fetchFn);

    expect(result.ok).toBe(false);

    if (result.ok) {
      throw new Error("expected failure");
    }

    expect(result.reason).toBe("http_error");
  });

  it("returns invitation id on successful invite", async () => {
    const fetchFn = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            id: "22222222-2222-2222-2222-222222222222",
            email: "a@example.com",
            appRole: "Auditor",
            status: "Pending",
            tenantName: "Acme",
            workspaceId: "33333333-3333-3333-3333-333333333333",
            invitedByActorId: "admin",
            createdUtc: "2026-07-15T00:00:00Z",
            expiresUtc: "2026-07-29T00:00:00Z",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
    );

    const result = await sendAdminUserInvitation("a@example.com", "Auditor", "hi", fetchFn);

    expect(result.ok).toBe(true);

    if (!result.ok) {
      throw new Error("expected success");
    }

    expect(result.invitation.id).toBe("22222222-2222-2222-2222-222222222222");
  });

  it("loads and revokes pending invitations", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            invitations: [
              {
                id: "44444444-4444-4444-4444-444444444444",
                email: "pending@example.com",
                appRole: "Operator",
                status: "Pending",
                createdUtc: "2026-07-15T00:00:00Z",
                expiresUtc: "2026-07-29T00:00:00Z",
              },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }));

    const rows = await fetchAdminUserInvitations(fetchFn);

    expect(rows).toHaveLength(1);

    const revoked = await revokeAdminUserInvitation("44444444-4444-4444-4444-444444444444", fetchFn);

    expect(revoked).toBe(true);
  });
});
