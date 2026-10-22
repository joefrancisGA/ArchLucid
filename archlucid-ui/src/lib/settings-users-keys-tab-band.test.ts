import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { SETTINGS_USERS_KEYS_TAB_PATH } from "@/lib/settings-admin-route-paths";
import {
  SETTINGS_ROLES_KEYS_TAB_LABEL,
  SETTINGS_ROLES_KEYS_TAB_LEAD,
  SETTINGS_ROLES_KEYS_TAB_OPEN_CTA_LABEL,
} from "@/app/(operator)/administration/users/_sections/settings-roles-page-keys-tab-copy";

const UI_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

const SETTINGS_USERS_KEYS_TAB_BAND_TEST_FILES = [
  "src/app/(operator)/administration/users/_sections/SettingsRolesPageView.test.tsx",
  "src/app/(operator)/administration/users/_sections/settings-roles-page-keys-tab-copy.test.ts",
  "src/app/(operator)/administration/users/_sections/settings-roles-page-empty-copy.test.ts",
  "src/app/(operator)/administration/users/_sections/SettingsRolesPrincipalTable.test.tsx",
  "src/lib/ui-route-traffic-settings-users-keys-tab.test.ts",
] as const;

describe("settings users keys tab band regression (TB-1935)", () => {
  it("keeps sibling Vitest guards for TB-1931 through TB-1934 on disk", () => {
    for (const relativePath of SETTINGS_USERS_KEYS_TAB_BAND_TEST_FILES) {
      expect(existsSync(join(UI_ROOT, relativePath)), relativePath).toBe(true);
    }
  });

  it("keeps canonical ?tab=keys deep link on administration users path (SEU)", () => {
    expect(SETTINGS_USERS_KEYS_TAB_PATH).toBe("/administration/users?tab=keys");
  });

  it("frames keys tab as role assignment, not credential lifecycle (TB-1931)", () => {
    expect(SETTINGS_ROLES_KEYS_TAB_LABEL).toBe("API key roles");
    expect(SETTINGS_ROLES_KEYS_TAB_LEAD).toMatch(/assign built-in roles/i);
    expect(SETTINGS_ROLES_KEYS_TAB_LEAD).not.toMatch(/principal/i);
  });

  it("names the keys empty primary CTA Open CLI usage help (TB-1932 / TB-1213)", () => {
    expect(SETTINGS_ROLES_KEYS_TAB_OPEN_CTA_LABEL).toBe("Open CLI usage help");
  });
});
