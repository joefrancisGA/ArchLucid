import { describe, expect, it } from "vitest";

import {
  SCIM_USERS_COMPACT_LINE,
  SCIM_USERS_HEADING,
  SCIM_USERS_SCIM_LINK,
  SCIM_USERS_USERS_LINK,
  SCIM_USERS_WHY_TWO,
  buildScimUsersVocabulary,
  resolveScimUsersPeerLink,
} from "@/lib/vocabulary/scim-users-vocabulary";
import { SCIM_PROVISIONING_CANONICAL_PATH } from "@/lib/scim-provisioning-evidence-copy";
import { SETTINGS_USERS_PATH } from "@/lib/settings-admin-route-paths";

describe("scim-users-vocabulary (TB-2321)", () => {
  it("explains SCIM directory sync vs Users invite", () => {
    const model = buildScimUsersVocabulary();

    expect(model.heading).toBe(SCIM_USERS_HEADING);
    expect(model.heading.toLowerCase()).toContain("scim");
    expect(model.heading.toLowerCase()).toContain("users");
    expect(model.whyTwo).toBe(SCIM_USERS_WHY_TWO);
    expect(model.whyTwo.toLowerCase()).toContain("sync");
    expect(model.whyTwo.toLowerCase()).toContain("invit");
    expect(model.compactLine).toBe(SCIM_USERS_COMPACT_LINE);

    expect(model.scimLink).toEqual(SCIM_USERS_SCIM_LINK);
    expect(model.scimLink.href).toBe(SCIM_PROVISIONING_CANONICAL_PATH);

    expect(model.usersLink).toEqual(SCIM_USERS_USERS_LINK);
    expect(model.usersLink.href).toBe(SETTINGS_USERS_PATH);
  });

  it("resolves the peer surface from scim and users", () => {
    expect(resolveScimUsersPeerLink("scim")).toEqual(SCIM_USERS_USERS_LINK);
    expect(resolveScimUsersPeerLink("users")).toEqual(SCIM_USERS_SCIM_LINK);
  });
});
