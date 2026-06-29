import { describe, expect, it } from "vitest";

import { INVITE_REVIEWER_PATH, SETTINGS_ROLES_USERS_TAB_PATH } from "./invite-reviewer-flow";

describe("invite-reviewer-flow", () => {
  it("exposes canonical invite-reviewer and roles users tab paths", () => {
    expect(INVITE_REVIEWER_PATH).toBe("/settings/roles/invite-reviewer");
    expect(SETTINGS_ROLES_USERS_TAB_PATH).toBe("/settings/roles?tab=users");
  });
});
