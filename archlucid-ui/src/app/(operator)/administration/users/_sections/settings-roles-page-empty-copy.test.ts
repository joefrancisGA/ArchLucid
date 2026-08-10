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
  it("uses member-oriented language on the Users tab", () => {
    expect(settingsRolesEmptyStateTitle("empty_response", "users")).toBe("No members yet");
    expect(settingsRolesEmptyStateDescription("empty_response", "users")).toContain("Pending invitations");
    expect(settingsRolesEmptyStateDescription("empty_response", "users")).not.toMatch(/api keys/i);
    expect(settingsRolesEmptyStateTitle("empty_response", "users")).not.toMatch(/principal/i);
  });

  it("uses API-key language on the API keys tab", () => {
    expect(settingsRolesEmptyStateTitle("empty_response", "api_keys")).toBe("No API keys yet");
    expect(settingsRolesEmptyStateDescription("empty_response", "api_keys")).toMatch(/api keys/i);
    expect(settingsRolesEmptyStateDescription("empty_response", "api_keys")).not.toMatch(/invitation/i);
    expect(settingsRolesEmptyStateTitle("empty_response", "api_keys")).not.toMatch(/principal/i);
  });

  it("keeps directory-unavailable copy tab-specific", () => {
    expect(settingsRolesEmptyStateTitle("api_unavailable", "users")).toBe("Member directory unavailable");
    expect(settingsRolesEmptyStateTitle("api_unavailable", "api_keys")).toBe("API key directory unavailable");
    expect(settingsRolesEmptyStateDescription("api_unavailable", "users")).toContain("invitation");
    expect(settingsRolesEmptyStateDescription("api_unavailable", "api_keys")).toContain("credentials");
  });
});
