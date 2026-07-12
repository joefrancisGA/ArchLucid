import { describe, expect, it } from "vitest";

import {
  LEGACY_ADMIN_SUPPORT_PATH,
  LEGACY_ADMIN_USERS_PATH,
  LEGACY_SETTINGS_ROLES_PATH,
  LEGACY_WORKSPACE_SECURITY_TRUST_PATH,
  SETTINGS_SECURITY_TRUST_PATH,
  SETTINGS_SUPPORT_PATH,
  SETTINGS_USERS_PATH,
  SETTINGS_USERS_ROLES_TAB_PATH,
  SETTINGS_USERS_USERS_TAB_PATH,
  pathMatchesSettingsSecurityTrust,
  pathMatchesSettingsSupport,
  pathMatchesSettingsUsers,
} from "@/lib/settings-admin-route-paths";

describe("settings-admin-route-paths (TB-406 / TB-751)", () => {
  it("exposes canonical tenant-admin paths under /settings/*", () => {
    expect(SETTINGS_USERS_PATH).toBe("/settings/users");
    expect(SETTINGS_USERS_ROLES_TAB_PATH).toBe("/settings/users?tab=roles");
    expect(SETTINGS_USERS_USERS_TAB_PATH).toBe("/settings/users?tab=users");
    expect(SETTINGS_SECURITY_TRUST_PATH).toBe("/settings/security-trust");
    expect(SETTINGS_SUPPORT_PATH).toBe("/settings/support");
  });

  it("matches canonical and legacy users, security-trust, and support paths", () => {
    expect(pathMatchesSettingsUsers("/settings/users")).toBe(true);
    expect(pathMatchesSettingsUsers("/admin/users")).toBe(true);
    expect(pathMatchesSettingsUsers("/settings/roles")).toBe(true);
    expect(pathMatchesSettingsSecurityTrust("/settings/security-trust")).toBe(true);
    expect(pathMatchesSettingsSecurityTrust("/workspace/security-trust")).toBe(true);
    expect(pathMatchesSettingsSupport("/settings/support")).toBe(true);
    expect(pathMatchesSettingsSupport("/admin/support")).toBe(true);
  });

  it("documents legacy redirect sources", () => {
    expect(LEGACY_ADMIN_USERS_PATH).toBe("/admin/users");
    expect(LEGACY_SETTINGS_ROLES_PATH).toBe("/settings/roles");
    expect(LEGACY_WORKSPACE_SECURITY_TRUST_PATH).toBe("/workspace/security-trust");
    expect(LEGACY_ADMIN_SUPPORT_PATH).toBe("/admin/support");
  });
});
