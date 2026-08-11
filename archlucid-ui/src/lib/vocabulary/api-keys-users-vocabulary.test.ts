import { describe, expect, it } from "vitest";

import {
  API_KEYS_USERS_API_KEYS_LINK,
  API_KEYS_USERS_COMPACT_LINE,
  API_KEYS_USERS_HEADING,
  API_KEYS_USERS_USERS_LINK,
  API_KEYS_USERS_WHY_TWO,
  buildApiKeysUsersVocabulary,
  resolveApiKeysUsersPeerLink,
} from "@/lib/vocabulary/api-keys-users-vocabulary";
import { API_KEYS_SETTINGS_CANONICAL_PATH } from "@/lib/api-keys-settings-evidence-copy";
import { SETTINGS_USERS_PATH } from "@/lib/settings-admin-route-paths";

describe("api-keys-users-vocabulary (TB-2327)", () => {
  it("explains API key credentials vs users and roles", () => {
    const model = buildApiKeysUsersVocabulary();

    expect(model.heading).toBe(API_KEYS_USERS_HEADING);
    expect(model.heading.toLowerCase()).toContain("api keys");
    expect(model.heading.toLowerCase()).toContain("users");
    expect(model.whyTwo).toBe(API_KEYS_USERS_WHY_TWO);
    expect(model.whyTwo.toLowerCase()).toContain("api key");
    expect(model.whyTwo.toLowerCase()).toContain("user");
    expect(model.compactLine).toBe(API_KEYS_USERS_COMPACT_LINE);

    expect(model.apiKeysLink).toEqual(API_KEYS_USERS_API_KEYS_LINK);
    expect(model.apiKeysLink.href).toBe(API_KEYS_SETTINGS_CANONICAL_PATH);

    expect(model.usersLink).toEqual(API_KEYS_USERS_USERS_LINK);
    expect(model.usersLink.href).toBe(SETTINGS_USERS_PATH);
  });

  it("resolves the peer surface from api-keys and users", () => {
    expect(resolveApiKeysUsersPeerLink("api-keys")).toEqual(API_KEYS_USERS_USERS_LINK);
    expect(resolveApiKeysUsersPeerLink("users")).toEqual(API_KEYS_USERS_API_KEYS_LINK);
  });
});
