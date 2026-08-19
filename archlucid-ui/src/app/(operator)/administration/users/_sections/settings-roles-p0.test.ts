import { describe, expect, it } from "vitest";

import {
  countPendingAdminUserInvitations,
  isPendingAdminUserInvitation,
  mergeAdminUserInvitationAcceptSecrets,
  partitionAdminUserInvitations,
  resolveAdminUserInvitationAcceptLink,
} from "./settings-roles-pending-invitations";
import { settingsRolesRoleChangeRequiresConfirmation } from "./settings-roles-privileged-role-change";
import { isSettingsRolesPrincipalSelfRow } from "./settings-roles-principal-self-match";

describe("settings-roles-pending-invitations", () => {
  const invitation = {
    id: "11111111-1111-1111-1111-111111111111",
    email: "reviewer@example.com",
    appRole: "Reader",
    status: "Pending",
    tenantName: "Acme",
    workspaceId: "22222222-2222-2222-2222-222222222222",
    invitedByActorId: "admin-actor",
    message: null,
    createdUtc: "2026-07-15T00:00:00Z",
    expiresUtc: "2026-07-29T00:00:00Z",
    acceptUrl: "https://example.test/accept/token",
    acceptPath: "/accept/token",
  };

  it("counts only pending invitations", () => {
    expect(isPendingAdminUserInvitation(invitation)).toBe(true);
    expect(
      countPendingAdminUserInvitations([
        invitation,
        { ...invitation, id: "33333333-3333-3333-3333-333333333333", status: "Accepted" },
      ]),
    ).toBe(1);
  });

  it("partitions pending and resolved invitations", () => {
    const resolved = { ...invitation, id: "44444444-4444-4444-4444-444444444444", status: "Revoked" };
    const partitioned = partitionAdminUserInvitations([invitation, resolved]);

    expect(partitioned.pending).toHaveLength(1);
    expect(partitioned.resolved).toHaveLength(1);
  });

  it("prefers acceptUrl over acceptPath and absolutizes relative paths", () => {
    expect(resolveAdminUserInvitationAcceptLink(invitation)).toBe("https://example.test/accept/token");
    expect(
      resolveAdminUserInvitationAcceptLink({
        ...invitation,
        acceptUrl: null,
      }),
    ).toBe(`${window.location.origin}/accept/token`);
  });

  it("merges create-response accept secrets onto listed rows", () => {
    const listed = [{ ...invitation, acceptUrl: null, acceptPath: null }];
    const seeded = [invitation];
    const merged = mergeAdminUserInvitationAcceptSecrets(listed, seeded);

    expect(merged).toHaveLength(1);
    expect(merged[0]?.acceptUrl).toBe("https://example.test/accept/token");
  });
});

describe("settingsRolesRoleChangeRequiresConfirmation", () => {
  it("requires confirmation for Admin and Operator assignments", () => {
    expect(settingsRolesRoleChangeRequiresConfirmation("Admin")).toBe(true);
    expect(settingsRolesRoleChangeRequiresConfirmation("Operator")).toBe(true);
    expect(settingsRolesRoleChangeRequiresConfirmation("Reader")).toBe(false);
    expect(settingsRolesRoleChangeRequiresConfirmation("Auditor")).toBe(false);
  });
});

describe("isSettingsRolesPrincipalSelfRow", () => {
  const principalBase = {
    provenance: "auth-me" as const,
    roleClaimValues: ["Admin"],
    primaryAppRole: "Admin" as const,
    maxAuthority: "AdminAuthority" as const,
    authorityRank: 3,
    hasEnterpriseOperatorSurfaces: true,
    hasCommittedArchitectureReview: true,
    hasRecognizedArchLucidRole: true,
    permissionClaimValues: [] as string[],
  };

  it("matches the signed-in principal by display name", () => {
    expect(
      isSettingsRolesPrincipalSelfRow(
        { id: "u1", kind: "user", name: "Admin User", detail: "admin@example.com", role: "Admin" },
        { ...principalBase, name: "Admin User" },
      ),
    ).toBe(true);
  });

  it("matches the signed-in principal by email detail", () => {
    expect(
      isSettingsRolesPrincipalSelfRow(
        { id: "u1", kind: "user", name: "Admin User", detail: "admin@example.com", role: "Admin" },
        { ...principalBase, name: "admin@example.com" },
      ),
    ).toBe(true);
  });

  it("treats every user row as self when identity name is missing", () => {
    expect(
      isSettingsRolesPrincipalSelfRow(
        { id: "u1", kind: "user", name: "Other Admin", detail: "other@example.com", role: "Admin" },
        { ...principalBase, name: null },
      ),
    ).toBe(true);
  });
});
