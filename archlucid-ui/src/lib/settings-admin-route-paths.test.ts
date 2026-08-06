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
  DIGESTS_SCHEDULE_TAB_PATH,
  pathMatchesSettingsSecurityTrust,
  pathMatchesSettingsSupport,
  pathMatchesSettingsUsers,
} from "@/lib/settings-admin-route-paths";

describe("settings-admin-route-paths (TB-406 / TB-751)", () => {
  it("exposes canonical tenant-admin paths under /administration/*", () => {
    expect(SETTINGS_USERS_PATH).toBe("/administration/users");
    expect(SETTINGS_USERS_ROLES_TAB_PATH).toBe("/administration/users?tab=roles");
    expect(SETTINGS_USERS_USERS_TAB_PATH).toBe("/administration/users?tab=users");
    expect(SETTINGS_SECURITY_TRUST_PATH).toBe("/administration/security-trust");
    expect(SETTINGS_SUPPORT_PATH).toBe("/administration/support");
  });

  it("matches canonical and legacy users, security-trust, and support paths", () => {
    expect(pathMatchesSettingsUsers("/administration/users")).toBe(true);
    expect(pathMatchesSettingsUsers("/admin/users")).toBe(true);
    expect(pathMatchesSettingsUsers("/administration/settings/users")).toBe(true);
    expect(pathMatchesSettingsUsers("/settings/roles")).toBe(true);
    expect(pathMatchesSettingsSecurityTrust("/administration/security-trust")).toBe(true);
    expect(pathMatchesSettingsSecurityTrust("/workspace/security-trust")).toBe(true);
    expect(pathMatchesSettingsSupport("/administration/support")).toBe(true);
    expect(pathMatchesSettingsSupport("/admin/support")).toBe(true);
  });

  it("documents legacy redirect sources and canonical Digests Schedule path", () => {
    expect(LEGACY_ADMIN_USERS_PATH).toBe("/admin/users");
    expect(DIGESTS_SCHEDULE_TAB_PATH).toBe("/architecture/digests?tab=schedule");
    expect(LEGACY_SETTINGS_ROLES_PATH).toBe("/settings/roles");
    expect(LEGACY_WORKSPACE_SECURITY_TRUST_PATH).toBe("/workspace/security-trust");
    expect(LEGACY_ADMIN_SUPPORT_PATH).toBe("/admin/support");
  });
});
