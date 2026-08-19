import { describe, expect, it } from "vitest";

import {
  DEV_SCOPE_PROJECT_ID,
  DEV_SCOPE_WORKSPACE_ID,
} from "@/lib/scope";
import {
  TENANT_COST_SETTINGS_AUDIT_EVENT_TYPE,
  TENANT_COST_SETTINGS_AUDIT_HREF,
  TENANT_COST_SETTINGS_EA_DISCOUNT_HELPER,
  tenantSettingsActiveScopeSummary,
  tenantSettingsCallerAuthorityLine,
  tenantSettingsEffectiveScopeSummary,
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

  it("builds effective scope summary from proxy headers when storage is empty", () => {
    expect(
      tenantSettingsEffectiveScopeSummary(
        {
          "x-tenant-id": "tenant-1",
          "x-workspace-id": DEV_SCOPE_WORKSPACE_ID,
          "x-project-id": DEV_SCOPE_PROJECT_ID,
        },
        null,
      ),
    ).toContain("Claims Intake");
  });

  it("prefers storage labels when headers match the stored record", () => {
    expect(
      tenantSettingsEffectiveScopeSummary(
        {
          "x-tenant-id": "tenant-1",
          "x-workspace-id": "workspace-1",
          "x-project-id": "project-1",
        },
        {
          tenantId: "tenant-1",
          workspaceId: "workspace-1",
          projectId: "project-1",
          workspaceLabel: "Pilot",
          projectLabel: "Northwind",
        },
      ),
    ).toBe("Active scope: Workspace: Pilot — Northwind");
  });

  it("links cost settings audit trail with the tenant cost event type", () => {
    expect(TENANT_COST_SETTINGS_AUDIT_HREF).toBe(
      `/governance/audit?eventType=${encodeURIComponent(TENANT_COST_SETTINGS_AUDIT_EVENT_TYPE)}`,
    );
  });

  it("formats caller authority metadata for the page header", () => {
    expect(tenantSettingsCallerAuthorityLine(3, "Claims Intake Demo")).toBe(
      "Admin authority in Claims Intake Demo",
    );
    expect(tenantSettingsCallerAuthorityLine(2, "Production")).toBe("Execute authority in Production");
    expect(tenantSettingsCallerAuthorityLine(1, "Production")).toBe("Read authority in Production");
  });

  it("uses buyer-safe EA discount helper copy without vendor field names", () => {
    expect(TENANT_COST_SETTINGS_EA_DISCOUNT_HELPER).not.toMatch(/EffectivePrice|RetailPrice|Cost-category/i);
  });
});
