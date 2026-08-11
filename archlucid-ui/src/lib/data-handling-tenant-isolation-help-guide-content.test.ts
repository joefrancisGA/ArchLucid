import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  DATA_HANDLING_TENANT_ISOLATION_HELP_LEAVES_STAYS_CARDS,
  DATA_HANDLING_TENANT_ISOLATION_HELP_OVERVIEW_CROSS_CHECK_LINKS,
  DATA_HANDLING_TENANT_ISOLATION_HELP_OVERVIEW_CROSS_CHECK_PREFIX,
  DATA_HANDLING_TENANT_ISOLATION_HELP_OVERVIEW_CONTRACTED_PACK_FOLLOW_UP,
  DATA_HANDLING_TENANT_ISOLATION_HELP_PAGE_TITLE,
  DATA_HANDLING_TENANT_ISOLATION_HELP_PRIMARY_ACTIONS,
  DATA_HANDLING_TENANT_ISOLATION_HELP_RELATED,
} from "@/lib/data-handling-tenant-isolation-help-guide-content";
import { getHelpCenterDisplay } from "@/lib/help-center-catalog";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("data-handling-tenant-isolation-help-guide-content", () => {
  it("keeps primary diligence CTA on public Trust Center", () => {
    expect(DATA_HANDLING_TENANT_ISOLATION_HELP_PAGE_TITLE).toBe("Data handling and tenant isolation");
    expect(DATA_HANDLING_TENANT_ISOLATION_HELP_PRIMARY_ACTIONS.openTrustCenter.href).toBe("/trust");
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

  it("links Related topics without implying a tenant pack on /trust", () => {
    expect(DATA_HANDLING_TENANT_ISOLATION_HELP_OVERVIEW_CROSS_CHECK_LINKS).toHaveLength(1);
    expect(DATA_HANDLING_TENANT_ISOLATION_HELP_OVERVIEW_CROSS_CHECK_LINKS[0]?.label).toBe("Related topics");
    expect(DATA_HANDLING_TENANT_ISOLATION_HELP_OVERVIEW_CROSS_CHECK_LINKS[0]?.href).toContain("related-topics");
    expect(DATA_HANDLING_TENANT_ISOLATION_HELP_OVERVIEW_CROSS_CHECK_PREFIX.toLowerCase()).toContain(
      "security and trust",
    );
    expect(DATA_HANDLING_TENANT_ISOLATION_HELP_OVERVIEW_CROSS_CHECK_PREFIX.toLowerCase()).toContain("trust center");
    expect(DATA_HANDLING_TENANT_ISOLATION_HELP_OVERVIEW_CONTRACTED_PACK_FOLLOW_UP.toLowerCase()).toContain(
      "contracted",
    );
  });

  it("keeps leaves/stays cards and diligence Related budget (TB-1654 / TB-1655)", () => {
    expect(DATA_HANDLING_TENANT_ISOLATION_HELP_LEAVES_STAYS_CARDS).toHaveLength(2);
    expect(DATA_HANDLING_TENANT_ISOLATION_HELP_LEAVES_STAYS_CARDS.map((card) => card.title)).toEqual([
      "What leaves your tenant",
      "What stays in your tenant",
    ]);
    expect(DATA_HANDLING_TENANT_ISOLATION_HELP_RELATED.map((link) => link.label)).toEqual([
      "Security and trust",
      "Trust Center",
      "Audit trail",
      "Subprocessors",
      "DPA template",
      "Procurement FAQ",
    ]);
    expect(DATA_HANDLING_TENANT_ISOLATION_HELP_RELATED.some((link) => link.href === "/trust")).toBe(true);
  });

  it("documents data residency in customer-facing markdown", () => {
    const entry = getProductDocumentationEntry("data-handling");
    const sourcePath = entry?.sourcePaths[0];

    if (sourcePath === undefined) {
      throw new Error("Expected data-handling source path.");
    }

    const sourceMarkdown = readFileSync(join(process.cwd(), "..", sourcePath), "utf8").toLowerCase();

    expect(sourceMarkdown).toContain("## data residency");
    expect(sourceMarkdown).toContain("contracted");
    expect(sourceMarkdown).toContain("azure");
    expect(sourceMarkdown).not.toContain("cpa");
  });
});
