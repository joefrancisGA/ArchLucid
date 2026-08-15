import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  settingsRolesEmptyStateDescription,
  settingsRolesEmptyStateTitle,
} from "@/app/(operator)/administration/users/_sections/settings-roles-page-empty-copy";
import { SETTINGS_USERS_USERS_TAB_PATH } from "@/lib/settings-admin-route-paths";

const UI_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

const SETTINGS_USERS_TAB_BAND_TEST_FILES = [
  "src/app/(operator)/administration/users/_sections/SettingsRolesPageView.test.tsx",
  "src/app/(operator)/administration/users/_sections/settings-roles-page-empty-copy.test.ts",
  "src/lib/settings-admin-route-paths.test.ts",
] as const;

describe("settings users tab band regression (TB-1940)", () => {
  it("keeps sibling Vitest guards for TB-1936 through TB-1939 on disk", () => {
    for (const relativePath of SETTINGS_USERS_TAB_BAND_TEST_FILES) {
      expect(existsSync(join(UI_ROOT, relativePath)), relativePath).toBe(true);
    }
  });

  it("keeps canonical ?tab=users deep link on administration users path (SSU)", () => {
    expect(SETTINGS_USERS_USERS_TAB_PATH).toBe("/administration/users?tab=users");
  });

  it("uses member-oriented Users-tab empty copy without principals jargon (TB-1938)", () => {
    expect(settingsRolesEmptyStateTitle("empty_response", "users")).toBe("No members yet");
    expect(settingsRolesEmptyStateTitle("empty_response", "users")).not.toMatch(/principal/i);
    expect(settingsRolesEmptyStateDescription("empty_response", "users")).not.toMatch(/principal/i);
  });

  it("keeps invite-first empty composition covered by SettingsRolesPageView Vitest (TB-1937, TB-1939)", () => {
    expect(
      existsSync(
        join(UI_ROOT, "src/app/(operator)/administration/users/_sections/SettingsRolesPageView.test.tsx"),
      ),
    ).toBe(true);
  });
});
