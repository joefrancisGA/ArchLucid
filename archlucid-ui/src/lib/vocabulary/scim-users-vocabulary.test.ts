import { describe, expect, it } from "vitest";

import {
  SCIM_USERS_COMPACT_LINE,
  SCIM_USERS_HEADING,
  SCIM_USERS_SCIM_LINK,
  SCIM_USERS_USERS_LINK,
  SCIM_USERS_WHY_TWO,
  USERS_DIRECTORY_SOURCE_MANUAL_LABEL,
  USERS_DIRECTORY_SOURCE_SCIM_LABEL,
  buildScimUsersVocabulary,
  resolveScimUsersPeerLink,
  resolveUsersMembersDirectorySource,
  scimProvisioningActiveFromTokensPayload,
  usersDirectorySourceStatusTag,
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

  it("detects active SCIM provisioning from token payloads", () => {
    expect(
      scimProvisioningActiveFromTokensPayload({
        tokens: [{ id: "token-1", revokedUtc: null }],
      }),
    ).toBe(true);
    expect(
      scimProvisioningActiveFromTokensPayload({
        tokens: [{ id: "token-1", revokedUtc: "2026-07-15T00:00:00Z" }],
      }),
    ).toBe(false);
    expect(scimProvisioningActiveFromTokensPayload({ tokens: [] })).toBe(false);
  });

  it("maps members directory source to StatusTag labels", () => {
    expect(resolveUsersMembersDirectorySource(true)).toBe("scim_synced");
    expect(resolveUsersMembersDirectorySource(false)).toBe("manual");
    expect(usersDirectorySourceStatusTag("scim_synced")).toEqual({
      kind: "ready",
      label: USERS_DIRECTORY_SOURCE_SCIM_LABEL,
    });
    expect(usersDirectorySourceStatusTag("manual")).toEqual({
      kind: "draft",
      label: USERS_DIRECTORY_SOURCE_MANUAL_LABEL,
    });
  });
});
