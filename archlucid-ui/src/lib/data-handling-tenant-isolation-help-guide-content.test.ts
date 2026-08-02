import { describe, expect, it } from "vitest";

import {
  DATA_HANDLING_TENANT_ISOLATION_HELP_PAGE_TITLE,
  DATA_HANDLING_TENANT_ISOLATION_HELP_PRIMARY_ACTIONS,
  DATA_HANDLING_TENANT_ISOLATION_HELP_RESIDENCY,
  DATA_HANDLING_TENANT_ISOLATION_HELP_SOURCES,
} from "@/lib/data-handling-tenant-isolation-help-guide-content";
import { DATA_HANDLING_TENANT_ISOLATION_HELP_PATH } from "@/lib/data-handling-tenant-isolation-help-route";

describe("data-handling-tenant-isolation-help-guide-content", () => {
  it("keeps primary diligence CTAs on trust, security-trust, and audit", () => {
    expect(DATA_HANDLING_TENANT_ISOLATION_HELP_PAGE_TITLE).toContain("tenant isolation");
    expect(DATA_HANDLING_TENANT_ISOLATION_HELP_PRIMARY_ACTIONS.openTrustCenter.href).toBe("/trust");
    expect(DATA_HANDLING_TENANT_ISOLATION_HELP_PRIMARY_ACTIONS.securityTrust.href).toBe("/help/security-trust");
    expect(DATA_HANDLING_TENANT_ISOLATION_HELP_PRIMARY_ACTIONS.openAuditTrail.href).toBe("/governance/audit");
  });

  it("lists Sources without a self-link to this topic", () => {
    expect(DATA_HANDLING_TENANT_ISOLATION_HELP_SOURCES.some((link) => link.href === DATA_HANDLING_TENANT_ISOLATION_HELP_PATH)).toBe(
      false,
    );
    expect(DATA_HANDLING_TENANT_ISOLATION_HELP_SOURCES.some((link) => link.href === "/trust")).toBe(true);
    expect(DATA_HANDLING_TENANT_ISOLATION_HELP_SOURCES.some((link) => link.href.includes("subprocessors"))).toBe(true);
    expect(DATA_HANDLING_TENANT_ISOLATION_HELP_SOURCES.some((link) => link.href.includes("dpa-template"))).toBe(true);
  });

  it("states residency honesty without implying a public single region", () => {
    expect(DATA_HANDLING_TENANT_ISOLATION_HELP_RESIDENCY.toLowerCase()).toContain("contracted");
    expect(DATA_HANDLING_TENANT_ISOLATION_HELP_RESIDENCY.toLowerCase()).toContain("azure");
    expect(DATA_HANDLING_TENANT_ISOLATION_HELP_RESIDENCY.toLowerCase()).not.toContain("cpa");
  });
});
