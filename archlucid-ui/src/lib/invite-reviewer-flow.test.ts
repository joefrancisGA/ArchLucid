import { describe, expect, it } from "vitest";

import {
  INVITE_REVIEWER_FOOTER_LEAD,
  INVITE_REVIEWER_PAGE_LEAD,
  INVITE_REVIEWER_PATH,
  SETTINGS_ROLES_USERS_TAB_PATH,
} from "./invite-reviewer-flow";

describe("invite-reviewer-flow", () => {
  it("exposes canonical invite-reviewer and roles users tab paths", () => {
    expect(INVITE_REVIEWER_PATH).toBe("/settings/roles/invite-reviewer");
    expect(SETTINGS_ROLES_USERS_TAB_PATH).toBe("/settings/roles?tab=users");
  });

  it("uses buyer-safe invite-reviewer footer lead copy", () => {
    expect(INVITE_REVIEWER_FOOTER_LEAD).toBe("Need to manage users or permissions?");
    expect(INVITE_REVIEWER_FOOTER_LEAD).not.toMatch(/API keys/i);
  });

  it("states definitive Reader role permissions on invite page lead", () => {
    expect(INVITE_REVIEWER_PAGE_LEAD).toMatch(/Reader role/i);
    expect(INVITE_REVIEWER_PAGE_LEAD).toMatch(/cannot approve, finalize, or modify evidence/i);
    expect(INVITE_REVIEWER_PAGE_LEAD).not.toMatch(/typically/i);
  });
});
