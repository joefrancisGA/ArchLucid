import { describe, expect, it } from "vitest";

import {
  resolveContinueLastSettingsPrincipal,
  SETTINGS_PRINCIPAL_LAST_VIEWED_STORAGE_KEY,
  type SettingsPrincipalContinueLastInput,
} from "@/lib/resolve-continue-last-settings-principal";

function principal(
  overrides: Partial<SettingsPrincipalContinueLastInput> = {},
): SettingsPrincipalContinueLastInput {
  return {
    id: "u1",
    kind: "user",
    name: "Ada",
    detail: "ada@example.com",
    ...overrides,
  };
}

describe("resolveContinueLastSettingsPrincipal", () => {
  it("returns the stored principal when it still exists", () => {
    window.localStorage.setItem(SETTINGS_PRINCIPAL_LAST_VIEWED_STORAGE_KEY, "user:u2");

    const match = resolveContinueLastSettingsPrincipal([
      principal({ id: "u1", name: "Ada" }),
      principal({ id: "u2", name: "Grace" }),
    ]);

    expect(match?.principalId).toBe("u2");
    expect(match?.name).toBe("Grace");
  });

  it("falls back to the first row when no stored principal exists", () => {
    window.localStorage.removeItem(SETTINGS_PRINCIPAL_LAST_VIEWED_STORAGE_KEY);

    const match = resolveContinueLastSettingsPrincipal([
      principal({ id: "u1", name: "Ada" }),
      principal({ id: "u2", name: "Grace" }),
    ]);

    expect(match?.principalId).toBe("u1");
    expect(match?.name).toBe("Ada");
  });
});
