import { describe, expect, it } from "vitest";

import {
  API_KEYS_VS_USERS_API_KEYS_LINK,
  API_KEYS_VS_USERS_COMPACT_LINE,
  API_KEYS_VS_USERS_HEADING,
  API_KEYS_VS_USERS_USERS_LINK,
  API_KEYS_VS_USERS_WHY_TWO,
  buildApiKeysVsUsersReconciler,
  resolveApiKeysVsUsersPeerLink,
} from "@/lib/api-keys-vs-users";
import { API_KEYS_SETTINGS_CANONICAL_PATH } from "@/lib/api-keys-settings-evidence-copy";
import { CLI_USAGE_HELP_PATH } from "@/lib/cli-usage-help-route";
import { SETTINGS_USERS_PATH } from "@/lib/settings-admin-route-paths";

describe("api-keys-vs-users (TB-2237)", () => {
  it("explains why API keys and users stay separate and deep-links both", () => {
    const model = buildApiKeysVsUsersReconciler();

    expect(model.heading).toBe(API_KEYS_VS_USERS_HEADING);
    expect(model.whyTwo).toBe(API_KEYS_VS_USERS_WHY_TWO);
    expect(model.whyTwo.toLowerCase()).toContain("api key");
    expect(model.whyTwo.toLowerCase()).toContain("user");
    expect(model.compactLine).toBe(API_KEYS_VS_USERS_COMPACT_LINE);

    expect(model.apiKeysLink).toEqual(API_KEYS_VS_USERS_API_KEYS_LINK);
    expect(model.apiKeysLink.href).toBe(API_KEYS_SETTINGS_CANONICAL_PATH);
    expect(model.apiKeysLink.href).toBe(CLI_USAGE_HELP_PATH);

    expect(model.usersLink).toEqual(API_KEYS_VS_USERS_USERS_LINK);
    expect(model.usersLink.href).toBe(SETTINGS_USERS_PATH);
    expect(model.usersLink.href).toBe("/administration/users");
  });

  it("resolves the peer deep link from each surface", () => {
    expect(resolveApiKeysVsUsersPeerLink("api-keys")).toEqual(API_KEYS_VS_USERS_USERS_LINK);
    expect(resolveApiKeysVsUsersPeerLink("users")).toEqual(API_KEYS_VS_USERS_API_KEYS_LINK);
  });
});
