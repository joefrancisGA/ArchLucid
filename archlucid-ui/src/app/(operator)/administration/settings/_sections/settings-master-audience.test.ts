import { describe, expect, it } from "vitest";

import { settingsMasterAudienceForScope } from "./settings-master-audience";
import type { SettingsMasterScopeKind } from "./settings-master-types";

describe("settingsMasterAudienceForScope", () => {
  it("treats scopes that write only the caller's own record as self", () => {
    expect(settingsMasterAudienceForScope("user")).toBe("self");
    expect(settingsMasterAudienceForScope("browser")).toBe("self");
  });

  it("treats scopes that write shared state as workspace-admin", () => {
    expect(settingsMasterAudienceForScope("tenant")).toBe("workspace-admin");
    expect(settingsMasterAudienceForScope("workspace")).toBe("workspace-admin");
    expect(settingsMasterAudienceForScope("project")).toBe("workspace-admin");
  });

  it("classifies every scope kind so a new kind cannot default into the admin hub", () => {
    const allScopes: readonly SettingsMasterScopeKind[] = ["tenant", "workspace", "project", "user", "browser"];

    for (const scope of allScopes) {
      expect(["self", "workspace-admin"]).toContain(settingsMasterAudienceForScope(scope));
    }
  });
});
