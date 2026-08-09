import { describe, expect, it } from "vitest";

import { adminUserInvitationStatusKind } from "./admin-user-invitation-status";
import {
  settingsRolesEmptyStateDescription,
  settingsRolesEmptyStateTitle,
} from "./settings-roles-page-empty-copy";

describe("adminUserInvitationStatusKind", () => {
  it("maps pending invitations to in-progress", () => {
    expect(adminUserInvitationStatusKind("Pending")).toBe("in-progress");
  });

  it("maps revoked invitations to blocked", () => {
    expect(adminUserInvitationStatusKind("Revoked")).toBe("blocked");
  });
});

describe("settingsRolesEmptyState copy", () => {
  it("uses member-oriented language for empty directories", () => {
    expect(settingsRolesEmptyStateTitle("empty_response")).toBe("No members yet");
    expect(settingsRolesEmptyStateDescription("empty_response")).toContain("Pending invitations");
  });
});
