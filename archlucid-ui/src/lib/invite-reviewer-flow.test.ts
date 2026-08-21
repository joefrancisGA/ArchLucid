import { describe, expect, it } from "vitest";

import {
  INVITE_REVIEWER_FOOTER_LEAD,
  INVITE_REVIEWER_PAGE_LEAD,
  INVITE_REVIEWER_PATH,
  INVITE_REVIEWER_READER_CAPABILITIES,
  INVITE_REVIEWER_READER_CAPABILITIES_HEADING,
  SETTINGS_ROLES_USERS_TAB_PATH,
} from "./invite-reviewer-flow";

describe("invite-reviewer-flow", () => {
  it("exposes canonical invite-reviewer and roles users tab paths", () => {
    expect(INVITE_REVIEWER_PATH).toBe("/administration/users/invite-reviewer");
    expect(SETTINGS_ROLES_USERS_TAB_PATH).toBe("/administration/users?tab=users");
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

  it("exposes Reader role capability summary lines for invite page (TB-511)", () => {
    expect(INVITE_REVIEWER_READER_CAPABILITIES_HEADING).toBe("Reader role capabilities:");

    const labels = INVITE_REVIEWER_READER_CAPABILITIES.map((item) => item.label);

    expect(labels).toEqual([
      "View reviews, findings, and approval decisions",
      "Export finalized review records and audit CSVs",
      "Cannot approve governance requests",
      "Cannot finalize reviews",
      "Cannot modify evidence or review settings",
    ]);

    expect(INVITE_REVIEWER_READER_CAPABILITIES.filter((item) => item.allowed)).toHaveLength(2);
    expect(INVITE_REVIEWER_READER_CAPABILITIES.filter((item) => !item.allowed)).toHaveLength(3);
  });
});
