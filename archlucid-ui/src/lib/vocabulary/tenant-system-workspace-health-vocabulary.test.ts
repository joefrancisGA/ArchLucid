import { describe, expect, it } from "vitest";

import {
  TENANT_SYSTEM_WORKSPACE_HEALTH_COMPACT_LINE,
  TENANT_SYSTEM_WORKSPACE_HEALTH_HEADING,
  TENANT_SYSTEM_WORKSPACE_HEALTH_SYSTEM_LINK,
  TENANT_SYSTEM_WORKSPACE_HEALTH_TENANT_LINK,
  TENANT_SYSTEM_WORKSPACE_HEALTH_WHY_THREE,
  TENANT_SYSTEM_WORKSPACE_HEALTH_WORKSPACE_LINK,
  buildTenantSystemWorkspaceHealthVocabulary,
  resolveTenantSystemWorkspaceHealthLink,
  resolveTenantSystemWorkspaceHealthPeerLinks,
} from "@/lib/vocabulary/tenant-system-workspace-health-vocabulary";
import { ADMINISTRATION_SYSTEM_HEALTH_PATH } from "@/lib/administration-route-paths";
import { EXECUTIVE_DASHBOARD_WORKSPACE_HEALTH_HREF } from "@/lib/executive-dashboard-route";
import { INTERNAL_TENANT_HEALTH_PATH } from "@/lib/internal-ops-route-paths";

describe("tenant-system-workspace-health-vocabulary (TB-2252)", () => {
  it("explains the tenant / system / workspace health triad and deep-links all three", () => {
    const model = buildTenantSystemWorkspaceHealthVocabulary();

    expect(model.heading).toBe(TENANT_SYSTEM_WORKSPACE_HEALTH_HEADING);
    expect(model.whyThree).toBe(TENANT_SYSTEM_WORKSPACE_HEALTH_WHY_THREE);
    expect(model.whyThree.toLowerCase()).toContain("tenant");
    expect(model.whyThree.toLowerCase()).toContain("system");
    expect(model.whyThree.toLowerCase()).toContain("workspace");
    expect(model.compactLine).toBe(TENANT_SYSTEM_WORKSPACE_HEALTH_COMPACT_LINE);

    expect(model.tenantLink).toEqual(TENANT_SYSTEM_WORKSPACE_HEALTH_TENANT_LINK);
    expect(model.tenantLink.href).toBe(INTERNAL_TENANT_HEALTH_PATH);

    expect(model.systemLink).toEqual(TENANT_SYSTEM_WORKSPACE_HEALTH_SYSTEM_LINK);
    expect(model.systemLink.href).toBe(ADMINISTRATION_SYSTEM_HEALTH_PATH);

    expect(model.workspaceLink).toEqual(TENANT_SYSTEM_WORKSPACE_HEALTH_WORKSPACE_LINK);
    expect(model.workspaceLink.href).toBe(EXECUTIVE_DASHBOARD_WORKSPACE_HEALTH_HREF);
  });

  it("resolves current and peer links for each surface", () => {
    expect(resolveTenantSystemWorkspaceHealthLink("tenant-health")).toEqual(
      TENANT_SYSTEM_WORKSPACE_HEALTH_TENANT_LINK,
    );
    expect(resolveTenantSystemWorkspaceHealthLink("system-health")).toEqual(
      TENANT_SYSTEM_WORKSPACE_HEALTH_SYSTEM_LINK,
    );
    expect(resolveTenantSystemWorkspaceHealthLink("workspace-health")).toEqual(
      TENANT_SYSTEM_WORKSPACE_HEALTH_WORKSPACE_LINK,
    );

    expect(resolveTenantSystemWorkspaceHealthPeerLinks("tenant-health")).toEqual([
      TENANT_SYSTEM_WORKSPACE_HEALTH_SYSTEM_LINK,
      TENANT_SYSTEM_WORKSPACE_HEALTH_WORKSPACE_LINK,
    ]);
    expect(resolveTenantSystemWorkspaceHealthPeerLinks("system-health")).toEqual([
      TENANT_SYSTEM_WORKSPACE_HEALTH_TENANT_LINK,
      TENANT_SYSTEM_WORKSPACE_HEALTH_WORKSPACE_LINK,
    ]);
    expect(resolveTenantSystemWorkspaceHealthPeerLinks("workspace-health")).toEqual([
      TENANT_SYSTEM_WORKSPACE_HEALTH_TENANT_LINK,
      TENANT_SYSTEM_WORKSPACE_HEALTH_SYSTEM_LINK,
    ]);
  });
});
