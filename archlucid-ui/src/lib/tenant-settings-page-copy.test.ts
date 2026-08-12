import { describe, expect, it } from "vitest";

import {
  TENANT_COST_SETTINGS_AUDIT_EVENT_TYPE,
  TENANT_COST_SETTINGS_AUDIT_HREF,
  tenantSettingsActiveScopeSummary,
  tenantSettingsSignedInAsLine,
} from "@/lib/tenant-settings-page-copy";

describe("tenant-settings-page-copy", () => {
  it("builds active scope summary from workspace and project labels", () => {
    expect(
      tenantSettingsActiveScopeSummary({
        tenantId: "tenant-1",
        workspaceId: "workspace-1",
        projectId: "project-1",
        workspaceLabel: "Pilot",
        projectLabel: "Northwind",
      }),
    ).toBe("Active scope: Workspace: Pilot — Northwind");
  });

  it("falls back when scope storage is empty", () => {
    expect(tenantSettingsActiveScopeSummary(null)).toContain("select a workspace and project");
  });

  it("links cost settings audit trail with the tenant cost event type", () => {
    expect(TENANT_COST_SETTINGS_AUDIT_HREF).toBe(
      `/governance/audit?eventType=${encodeURIComponent(TENANT_COST_SETTINGS_AUDIT_EVENT_TYPE)}`,
    );
  });

  it("formats signed-in metadata only when a principal name exists", () => {
    expect(tenantSettingsSignedInAsLine("Test User")).toBe("Signed in as Test User");
    expect(tenantSettingsSignedInAsLine(null)).toBeNull();
    expect(tenantSettingsSignedInAsLine("   ")).toBeNull();
  });
});
