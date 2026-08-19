import { afterEach, describe, expect, it } from "vitest";

import {
  formatActiveTenantContextTooltip,
  resolveActiveTenantContext,
} from "@/lib/active-tenant-context-display";
import { DEV_SCOPE_TENANT_ID } from "@/lib/scope";
import {
  SHOWCASE_DEMO_TENANT_CATALOG_ID,
  SHOWCASE_DEMO_TENANT_NAME,
} from "@/lib/showcase-static-demo";

describe("resolveActiveTenantContext", () => {
  afterEach(() => {
    localStorage.clear();
  });

  it("uses showcase tenant copy in buyer-polished mode", () => {
    const context = resolveActiveTenantContext(null, true);

    expect(context.displayName).toBe(SHOWCASE_DEMO_TENANT_NAME);
    expect(context.tenantId).toBe(SHOWCASE_DEMO_TENANT_CATALOG_ID);
  });

  it("uses scoped tenant id in live mode", () => {
    const context = resolveActiveTenantContext(
      {
        tenantId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        workspaceId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
        projectId: "cccccccc-cccc-cccc-cccc-cccccccccccc",
        workspaceLabel: "Pilot workspace",
        projectLabel: "Primary",
      },
      false,
    );

    expect(context.displayName).toBe("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    expect(context.workspaceLabel).toBe("Pilot workspace");
  });

  it("falls back to dev scope headers when storage is empty", () => {
    const context = resolveActiveTenantContext(null, false);

    expect(context.displayName).toBe(DEV_SCOPE_TENANT_ID);
  });
});

describe("formatActiveTenantContextTooltip", () => {
  it("includes tenant and workspace isolation copy", () => {
    const tooltip = formatActiveTenantContextTooltip({
      displayName: "Acme",
      tenantId: "tenant-1",
      workspaceId: "ws-1",
      workspaceLabel: "Production",
    });

    expect(tooltip).toContain("Active tenant: Acme");
    expect(tooltip).toContain("ID: tenant-1");
    expect(tooltip).toContain("Workspace: Production");
    expect(tooltip).toContain("Database-per-tenant isolation");
  });
});
