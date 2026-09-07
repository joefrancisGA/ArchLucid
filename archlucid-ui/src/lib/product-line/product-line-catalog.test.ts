import { afterEach, describe, expect, it, vi } from "vitest";

import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { flattenNavLinks, NAV_GROUPS } from "@/lib/nav-config";
import { listNavGroupsVisibleInOperatorShell } from "@/lib/nav-shell-visibility";
import { buildOperatorSystemAdminNavLinks } from "@/lib/operator/operator-system-admin-nav-group-builder";
import { productLineAssignmentIncludes } from "@/lib/product-line/product-line-assignment";
import { PRODUCT_LINE_NAV_ASSIGNMENTS } from "@/lib/product-line/product-line-catalog";
import {
  isPathAllowedForProductLine,
  resolveProductLineAssignmentForPath,
} from "@/lib/product-line/product-line-path-access";

describe("product-line catalog", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("keeps Architecture reviews, findings, and policy packs at Admin rank", () => {
    const architecture = listNavGroupsVisibleInOperatorShell(
      NAV_GROUPS,
      AUTHORITY_RANK.AdminAuthority,
      "all",
      true,
      false,
      { productLine: "architecture", showVendorInternalNav: true },
    );
    const hrefs = architecture.flatMap((row) => row.visibleLinks.map((link) => link.href));

    expect(hrefs).toContain("/architecture/reviews");
    expect(hrefs).toContain("/governance/findings");
    expect(hrefs).toContain("/governance/policy-packs");
    expect(hrefs).toContain("/governance/infrastructure");
    expect(hrefs).toContain("/administration/workspace-settings/recycle-bin");
    expect(hrefs).toContain("/integrations/azure-boards");
    expect(hrefs).toContain("/integrations/slack");
    expect(hrefs).toContain("/integrations/webhooks");
  });

  it("shows infrastructure workbenches and hides architecture reviews in the Security shell", () => {
    const rows = listNavGroupsVisibleInOperatorShell(
      NAV_GROUPS,
      AUTHORITY_RANK.AdminAuthority,
      "all",
      true,
      false,
      { productLine: "security", showVendorInternalNav: true },
    );
    const hrefs = rows.flatMap((row) => row.visibleLinks.map((link) => link.href));

    expect(hrefs).toContain("/governance/infrastructure");
    expect(hrefs).toContain("/governance/infrastructure/drift");
    expect(hrefs).toContain("/integrations/cloud-connections");
    expect(hrefs).toContain("/integrations/jira");
    expect(hrefs).toContain("/integrations/servicenow");
    expect(hrefs).toContain("/integrations/teams");
    expect(hrefs).toContain("/governance/remediation-factory");
    expect(hrefs).toContain("/administration/users");
    expect(hrefs).not.toContain("/integrations/azure-boards");
    expect(hrefs).not.toContain("/integrations/slack");
    expect(hrefs).not.toContain("/integrations/webhooks");
    expect(hrefs).not.toContain("/architecture/reviews");
    expect(hrefs).not.toContain("/architecture/architectures");
    expect(hrefs).not.toContain("/insights/evidence-graph");
    expect(hrefs).not.toContain("/governance/approval-queue");
    expect(hrefs).not.toContain("/governance/policy-packs");
    expect(hrefs).not.toContain("/administration/ai-usage");
    expect(hrefs).not.toContain("/administration/workspace-settings/recycle-bin");
  });

  it("keeps shared Internal diagnostics in Security when vendor Internal nav is on", () => {
    vi.stubEnv("NEXT_PUBLIC_ARCHLUCID_INTERNAL_OPERATOR", "true");

    const rows = listNavGroupsVisibleInOperatorShell(
      NAV_GROUPS,
      AUTHORITY_RANK.PlatformInternalOperationsAuthority,
      "all",
      true,
      false,
      { productLine: "security", showVendorInternalNav: true },
    );
    const hrefs = rows.flatMap((row) => row.visibleLinks.map((link) => link.href));

    expect(hrefs).toContain("/internal/health");
    expect(hrefs).toContain("/internal/configuration");
    expect(hrefs).toContain("/internal/tenants");
    expect(hrefs).toContain("/internal/product-line");
    expect(hrefs).not.toContain("/internal/trial-funnel");
    expect(hrefs).not.toContain("/internal/pricing-quote-aging");
    expect(hrefs).not.toContain("/internal/validate-route");
  });

  it("keeps infrastructure visible in Security before a committed architecture review", () => {
    const rows = listNavGroupsVisibleInOperatorShell(
      NAV_GROUPS,
      AUTHORITY_RANK.AdminAuthority,
      "all",
      false,
      false,
      { productLine: "security", showVendorInternalNav: true },
    );
    const hrefs = rows.flatMap((row) => row.visibleLinks.map((link) => link.href));

    expect(hrefs).toContain("/governance/infrastructure");
    expect(hrefs).toContain("/integrations/cloud-connections");
    expect(hrefs).not.toContain("/integrations/azure-boards");
    expect(hrefs).not.toContain("/integrations/slack");
    expect(hrefs).not.toContain("/integrations/webhooks");
    expect(hrefs).not.toContain("/architecture/reviews");
  });

  it("allows nested infrastructure resource hubs in the Security product", () => {
    expect(
      isPathAllowedForProductLine("/governance/infrastructure/resources/res-1", "security"),
    ).toBe(true);
    expect(isPathAllowedForProductLine("/architecture/reviews/new", "security")).toBe(false);
    expect(isPathAllowedForProductLine("/help/cloud-connections", "security")).toBe(true);
    expect(
      isPathAllowedForProductLine("/administration/workspace-settings/recycle-bin", "security"),
    ).toBe(false);
    expect(isPathAllowedForProductLine("/administration/auth-domains", "security")).toBe(true);
    expect(isPathAllowedForProductLine("/administration/identity/sso-wizard", "security")).toBe(true);
    expect(isPathAllowedForProductLine("/administration/extract-upload", "security")).toBe(true);
    expect(isPathAllowedForProductLine("/integrations/azure-boards", "security")).toBe(false);
    expect(isPathAllowedForProductLine("/integrations/slack", "security")).toBe(false);
    expect(isPathAllowedForProductLine("/integrations/webhooks", "security")).toBe(false);
    expect(isPathAllowedForProductLine("/integrations/azure-boards", "architecture")).toBe(true);
  });

  it("lets an override move a destination into Security without editing the catalog file", () => {
    expect(resolveProductLineAssignmentForPath("/architecture/reviews")).toBe("architecture");
    expect(
      productLineAssignmentIncludes(
        resolveProductLineAssignmentForPath("/architecture/reviews", {
          "/architecture/reviews": "security",
        }),
        "security",
      ),
    ).toBe(true);
  });

  it("keeps recycle bin architecture-only even though workspace-settings is both", () => {
    expect(resolveProductLineAssignmentForPath("/administration/workspace-settings")).toBe("both");
    expect(resolveProductLineAssignmentForPath("/administration/workspace-settings/recycle-bin")).toBe("architecture");
    expect(
      isPathAllowedForProductLine("/administration/workspace-settings/recycle-bin", "security"),
    ).toBe(false);
    expect(isPathAllowedForProductLine("/administration/workspace-settings", "security")).toBe(true);
  });

  it("assigns every catalog key that is a live nav href", () => {
    const navHrefs = new Set([
      ...flattenNavLinks().map((link) => link.href),
      ...buildOperatorSystemAdminNavLinks().map((link) => link.href),
    ]);

    for (const href of Object.keys(PRODUCT_LINE_NAV_ASSIGNMENTS)) {
      if (href === "/") {
        continue;
      }

      expect(navHrefs.has(href), href).toBe(true);
    }
  });
});
