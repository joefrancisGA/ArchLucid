import { describe, expect, it } from "vitest";

import { SETTINGS_TENANT_PATH } from "@/lib/settings-admin-route-paths";
import {
  WORKSPACE_SCOPE_SWITCHER_HREF,
  WORKSPACE_SCOPE_TENANT_SETTINGS_COMPACT_LINE,
  WORKSPACE_SCOPE_TENANT_SETTINGS_HEADING,
  WORKSPACE_SCOPE_TENANT_SETTINGS_SCOPE_LINK,
  WORKSPACE_SCOPE_TENANT_SETTINGS_TENANT_LINK,
  WORKSPACE_SCOPE_TENANT_SETTINGS_WHY_TWO,
  buildWorkspaceScopeTenantSettingsVocabulary,
  resolveWorkspaceScopeTenantSettingsPeerLink,
} from "@/lib/vocabulary/workspace-scope-tenant-settings-vocabulary";

describe("workspace-scope-tenant-settings-vocabulary (TB-2317)", () => {
  it("explains workspace scope vs tenant settings", () => {
    const model = buildWorkspaceScopeTenantSettingsVocabulary();

    expect(model.heading).toBe(WORKSPACE_SCOPE_TENANT_SETTINGS_HEADING);
    expect(model.whyTwo).toBe(WORKSPACE_SCOPE_TENANT_SETTINGS_WHY_TWO);
    expect(model.whyTwo.toLowerCase()).toContain("scope");
    expect(model.whyTwo.toLowerCase()).toContain("tenant");
    expect(model.compactLine).toBe(WORKSPACE_SCOPE_TENANT_SETTINGS_COMPACT_LINE);

    expect(model.workspaceScopeLink).toEqual(WORKSPACE_SCOPE_TENANT_SETTINGS_SCOPE_LINK);
    expect(model.workspaceScopeLink.href).toBe(WORKSPACE_SCOPE_SWITCHER_HREF);
    expect(model.tenantSettingsLink).toEqual(WORKSPACE_SCOPE_TENANT_SETTINGS_TENANT_LINK);
    expect(model.tenantSettingsLink.href).toBe(SETTINGS_TENANT_PATH);
  });

  it("resolves the peer surface from workspace scope and tenant settings", () => {
    expect(resolveWorkspaceScopeTenantSettingsPeerLink("workspace-scope")).toEqual(
      WORKSPACE_SCOPE_TENANT_SETTINGS_TENANT_LINK,
    );

    expect(resolveWorkspaceScopeTenantSettingsPeerLink("tenant-settings")).toEqual(
      WORKSPACE_SCOPE_TENANT_SETTINGS_SCOPE_LINK,
    );
  });
});
