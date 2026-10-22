import { describe, expect, it } from "vitest";

import {
  SETTINGS_ROLES_KEYS_TAB_CARD_TITLE,
  SETTINGS_ROLES_KEYS_TAB_LABEL,
  SETTINGS_ROLES_KEYS_TAB_LEAD,
  SETTINGS_ROLES_KEYS_TAB_LIFECYCLE_HREF,
  SETTINGS_ROLES_KEYS_TAB_OPEN_CTA_LABEL,
} from "./settings-roles-page-keys-tab-copy";

describe("settings-roles-page-keys-tab-copy", () => {
  it("frames the keys tab as role assignment, not credential lifecycle (TB-1931)", () => {
    expect(SETTINGS_ROLES_KEYS_TAB_LABEL).toBe("API key roles");
    expect(SETTINGS_ROLES_KEYS_TAB_CARD_TITLE).toBe("API key roles");
    expect(SETTINGS_ROLES_KEYS_TAB_LEAD).toMatch(/assign built-in roles/i);
    expect(SETTINGS_ROLES_KEYS_TAB_LEAD).not.toMatch(/principal/i);
    expect(SETTINGS_ROLES_KEYS_TAB_LIFECYCLE_HREF).toBe("/help/cli-usage");
  });

  it("names the keys empty primary CTA Open CLI usage help (TB-1213)", () => {
    expect(SETTINGS_ROLES_KEYS_TAB_OPEN_CTA_LABEL).toBe("Open CLI usage help");
  });
});
