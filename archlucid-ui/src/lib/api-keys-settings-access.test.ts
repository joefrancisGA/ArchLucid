import { describe, expect, it } from "vitest";

import { isApiKeysSettingsSurfaceEnabled } from "./api-keys-settings-access";

describe("isApiKeysSettingsSurfaceEnabled", () => {
  it("stays off until API key UI is intentionally re-enabled", () => {
    expect(isApiKeysSettingsSurfaceEnabled()).toBe(false);
  });
});
