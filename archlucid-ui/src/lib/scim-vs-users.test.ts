import { describe, expect, it } from "vitest";

import {
  SCIM_VS_USERS_COMPACT_LINE,
  SCIM_VS_USERS_HEADING,
  SCIM_VS_USERS_SCIM_LINK,
  SCIM_VS_USERS_USERS_LINK,
  SCIM_VS_USERS_WHY_TWO,
  buildScimVsUsersReconciler,
  resolveScimVsUsersPeerLink,
} from "@/lib/scim-vs-users";
import { SCIM_PROVISIONING_CANONICAL_PATH } from "@/lib/scim-provisioning-evidence-copy";
import { SETTINGS_USERS_PATH } from "@/lib/settings-admin-route-paths";

describe("scim-vs-users (TB-2259)", () => {
  it("explains why SCIM provisioning and users stay separate and deep-links both", () => {
    const model = buildScimVsUsersReconciler();

    expect(model.heading).toBe(SCIM_VS_USERS_HEADING);
    expect(model.whyTwo).toBe(SCIM_VS_USERS_WHY_TWO);
    expect(model.whyTwo.toLowerCase()).toContain("scim");
    expect(model.whyTwo.toLowerCase()).toContain("user");
    expect(model.compactLine).toBe(SCIM_VS_USERS_COMPACT_LINE);

    expect(model.scimLink).toEqual(SCIM_VS_USERS_SCIM_LINK);
    expect(model.scimLink.href).toBe(SCIM_PROVISIONING_CANONICAL_PATH);
    expect(model.scimLink.href).toBe("/administration/scim-provisioning");

    expect(model.usersLink).toEqual(SCIM_VS_USERS_USERS_LINK);
    expect(model.usersLink.href).toBe(SETTINGS_USERS_PATH);
    expect(model.usersLink.href).toBe("/administration/users");
  });

  it("resolves the peer deep link from each surface", () => {
    expect(resolveScimVsUsersPeerLink("scim")).toEqual(SCIM_VS_USERS_USERS_LINK);
    expect(resolveScimVsUsersPeerLink("users")).toEqual(SCIM_VS_USERS_SCIM_LINK);
  });
});
