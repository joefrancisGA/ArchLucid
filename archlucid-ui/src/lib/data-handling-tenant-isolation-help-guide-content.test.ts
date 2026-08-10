import { describe, expect, it } from "vitest";

import {
  DATA_HANDLING_TENANT_ISOLATION_HELP_OVERVIEW,
  DATA_HANDLING_TENANT_ISOLATION_HELP_PAGE_TITLE,
  DATA_HANDLING_TENANT_ISOLATION_HELP_PRIMARY_ACTIONS,
  DATA_HANDLING_TENANT_ISOLATION_HELP_RESIDENCY,
} from "@/lib/data-handling-tenant-isolation-help-guide-content";

describe("data-handling-tenant-isolation-help-guide-content", () => {
  it("keeps primary diligence CTAs on trust and security-trust", () => {
    expect(DATA_HANDLING_TENANT_ISOLATION_HELP_PAGE_TITLE).toContain("tenant isolation");
    expect(DATA_HANDLING_TENANT_ISOLATION_HELP_PRIMARY_ACTIONS.openTrustCenter.href).toBe("/trust");
    expect(DATA_HANDLING_TENANT_ISOLATION_HELP_PRIMARY_ACTIONS.securityTrust.href).toBe("/help/security-trust");
    expect(DATA_HANDLING_TENANT_ISOLATION_HELP_PRIMARY_ACTIONS.openAuditTrail.href).toBe("/governance/audit");
  });

  it("points overview diligence to cross-topic destinations instead of a Sources strip", () => {
    expect(DATA_HANDLING_TENANT_ISOLATION_HELP_OVERVIEW.toLowerCase()).not.toContain("sources links below");
    expect(DATA_HANDLING_TENANT_ISOLATION_HELP_OVERVIEW).toContain("Security and trust");
    expect(DATA_HANDLING_TENANT_ISOLATION_HELP_OVERVIEW).toContain("Related topics");
  });

  it("states residency honesty without implying a public single region", () => {
    expect(DATA_HANDLING_TENANT_ISOLATION_HELP_RESIDENCY.toLowerCase()).toContain("contracted");
    expect(DATA_HANDLING_TENANT_ISOLATION_HELP_RESIDENCY.toLowerCase()).toContain("azure");
    expect(DATA_HANDLING_TENANT_ISOLATION_HELP_RESIDENCY.toLowerCase()).not.toContain("cpa");
  });
});
