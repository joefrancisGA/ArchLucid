import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  DATA_HANDLING_TENANT_ISOLATION_HELP_OVERVIEW_CROSS_CHECK_LINKS,
  DATA_HANDLING_TENANT_ISOLATION_HELP_PAGE_TITLE,
  DATA_HANDLING_TENANT_ISOLATION_HELP_PRIMARY_ACTIONS,
  DATA_HANDLING_TENANT_ISOLATION_HELP_RESIDENCY,
} from "@/lib/data-handling-tenant-isolation-help-guide-content";
import { getHelpCenterDisplay } from "@/lib/help-center-catalog";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("data-handling-tenant-isolation-help-guide-content", () => {
  it("keeps primary diligence CTAs on trust and security-trust", () => {
    expect(DATA_HANDLING_TENANT_ISOLATION_HELP_PAGE_TITLE).toBe("Data handling and tenant isolation");
    expect(DATA_HANDLING_TENANT_ISOLATION_HELP_PRIMARY_ACTIONS.openTrustCenter.href).toBe("/trust");
    expect(DATA_HANDLING_TENANT_ISOLATION_HELP_PRIMARY_ACTIONS.securityTrust.href).toBe("/help/security-trust");
    expect(DATA_HANDLING_TENANT_ISOLATION_HELP_PRIMARY_ACTIONS.openAuditTrail.href).toBe("/governance/audit");
  });

  it("aligns registry, help center, and markdown H1 titles", () => {
    const entry = getProductDocumentationEntry("data-handling");

    expect(entry?.title).toBe(DATA_HANDLING_TENANT_ISOLATION_HELP_PAGE_TITLE);
    expect(getHelpCenterDisplay(entry!).title).toBe(DATA_HANDLING_TENANT_ISOLATION_HELP_PAGE_TITLE);

    const sourcePath = entry?.sourcePaths[0];

    if (sourcePath === undefined) {
      throw new Error("Expected data-handling source path.");
    }

    const sourceMarkdown = readFileSync(join(process.cwd(), "..", sourcePath), "utf8");
    expect(sourceMarkdown.trimStart()).toMatch(/^# Data handling and tenant isolation/m);
  });

  it("links every overview cross-check destination", () => {
    expect(DATA_HANDLING_TENANT_ISOLATION_HELP_OVERVIEW_CROSS_CHECK_LINKS.length).toBeGreaterThanOrEqual(3);
    expect(
      DATA_HANDLING_TENANT_ISOLATION_HELP_OVERVIEW_CROSS_CHECK_LINKS.some((link) =>
        link.label.includes("Security and trust"),
      ),
    ).toBe(true);
    expect(
      DATA_HANDLING_TENANT_ISOLATION_HELP_OVERVIEW_CROSS_CHECK_LINKS.some((link) => link.label === "Related topics"),
    ).toBe(true);
    expect(
      DATA_HANDLING_TENANT_ISOLATION_HELP_OVERVIEW_CROSS_CHECK_LINKS.some((link) =>
        link.href.includes("related-topics"),
      ),
    ).toBe(true);
  });

  it("states residency honesty without implying a public single region", () => {
    expect(DATA_HANDLING_TENANT_ISOLATION_HELP_RESIDENCY.toLowerCase()).toContain("contracted");
    expect(DATA_HANDLING_TENANT_ISOLATION_HELP_RESIDENCY.toLowerCase()).toContain("azure");
    expect(DATA_HANDLING_TENANT_ISOLATION_HELP_RESIDENCY.toLowerCase()).not.toContain("cpa");
  });
});
