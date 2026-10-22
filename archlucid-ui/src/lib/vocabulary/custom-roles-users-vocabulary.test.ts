import { describe, expect, it } from "vitest";

import {
  CUSTOM_ROLES_USERS_COMPACT_LINE,
  CUSTOM_ROLES_USERS_CUSTOM_ROLES_LINK,
  CUSTOM_ROLES_USERS_HEADING,
  CUSTOM_ROLES_USERS_USERS_LINK,
  CUSTOM_ROLES_USERS_WHY_TWO,
  buildCustomRolesUsersVocabulary,
  resolveCustomRolesUsersPeerLink,
} from "@/lib/vocabulary/custom-roles-users-vocabulary";
import {
  SETTINGS_USERS_ROLES_TAB_PATH,
  SETTINGS_USERS_USERS_TAB_PATH,
} from "@/lib/settings-admin-route-paths";

describe("custom-roles-users-vocabulary (TB-2262)", () => {
  it("explains custom roles vs users people and deep-links both tabs", () => {
    const model = buildCustomRolesUsersVocabulary();

    expect(model.heading).toBe(CUSTOM_ROLES_USERS_HEADING);
    expect(model.whyTwo).toBe(CUSTOM_ROLES_USERS_WHY_TWO);
    expect(model.whyTwo.toLowerCase()).toContain("role");
    expect(model.whyTwo.toLowerCase()).toContain("people");
    expect(model.compactLine).toBe(CUSTOM_ROLES_USERS_COMPACT_LINE);

    expect(model.customRolesLink).toEqual(CUSTOM_ROLES_USERS_CUSTOM_ROLES_LINK);
    expect(model.customRolesLink.href).toBe(SETTINGS_USERS_ROLES_TAB_PATH);
    expect(model.customRolesLink.href).toBe("/administration/users?tab=roles");

    expect(model.usersLink).toEqual(CUSTOM_ROLES_USERS_USERS_LINK);
    expect(model.usersLink.href).toBe(SETTINGS_USERS_USERS_TAB_PATH);
    expect(model.usersLink.href).toBe("/administration/users?tab=users");
  });

  it("resolves the peer tab from each surface", () => {
    expect(resolveCustomRolesUsersPeerLink("custom-roles")).toEqual(
      CUSTOM_ROLES_USERS_USERS_LINK,
    );
    expect(resolveCustomRolesUsersPeerLink("users")).toEqual(
      CUSTOM_ROLES_USERS_CUSTOM_ROLES_LINK,
    );
  });
});
