import { describe, expect, it, vi } from "vitest";

import { isApiKeysSettingsSurfaceEnabled } from "./api-keys-settings-access";

vi.mock("@/lib/demo-ui-env", () => ({
  isBuyerPolishedOperatorShellEnv: () => false,
  isNextPublicDemoMode: () => false,
  isOperatorExperienceFullShellEnv: () => true,
}));

describe("isApiKeysSettingsSurfaceEnabled", () => {
  it("returns true for full operator non-demo shell", () => {
    expect(isApiKeysSettingsSurfaceEnabled()).toBe(true);
  });
});
