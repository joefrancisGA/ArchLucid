import { afterEach, describe, expect, it, vi } from "vitest";

import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { NAV_GROUPS } from "@/lib/nav-config";
import { GOVERNANCE_INFRASTRUCTURE_PATH } from "@/lib/governance/governance-infrastructure-route-paths";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import { listNavGroupsVisibleInOperatorShell } from "@/lib/nav-shell-visibility";

describe("filterNavGroupsForProductLine (Security shell)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("puts Infrastructure first, hides Architecture, and uses Home instead of Infrastructure overview", () => {
    const rows = listNavGroupsVisibleInOperatorShell(
      NAV_GROUPS,
      AUTHORITY_RANK.AdminAuthority,
      "all",
      true,
      false,
      { productLine: "security", showVendorInternalNav: true },
    );

    expect(rows[0]?.group.id).toBe("operate-infrastructure");

    const groupIds = rows.map((row) => row.group.id);

    expect(groupIds).not.toContain("pilot");

    const infrastructureLinks = rows.find((row) => row.group.id === "operate-infrastructure")?.visibleLinks ?? [];

    expect(infrastructureLinks[0]?.href).toBe("/");
    expect(infrastructureLinks[0]?.label).toBe(OPERATOR_NAV_LINK_LABELS.home);
    expect(infrastructureLinks.some((link) => link.href === GOVERNANCE_INFRASTRUCTURE_PATH)).toBe(false);
    expect(infrastructureLinks.some((link) => link.label === OPERATOR_NAV_LINK_LABELS.infrastructureAsk)).toBe(true);
  });

  it("merges Internal destinations under Administration instead of a separate Internal group", () => {
    vi.stubEnv("NEXT_PUBLIC_ARCHLUCID_INTERNAL_OPERATOR", "true");

    const rows = listNavGroupsVisibleInOperatorShell(
      NAV_GROUPS,
      AUTHORITY_RANK.PlatformInternalOperationsAuthority,
      "all",
      true,
      false,
      { productLine: "security", showVendorInternalNav: true },
    );
    const groupIds = rows.map((row) => row.group.id);

    expect(groupIds).not.toContain("operator-system-admin");
    expect(groupIds).toContain("operator-admin");

    const adminLinks = rows.find((row) => row.group.id === "operator-admin")?.visibleLinks ?? [];
    const adminHrefs = adminLinks.map((link) => link.href);

    expect(adminHrefs).toContain("/administration/users");
    expect(adminHrefs).toContain("/internal/health");
    expect(adminHrefs).toContain("/internal/configuration");
    expect(adminHrefs).toContain("/internal/tenants");
    expect(adminHrefs).toContain("/internal/product-line");
    expect(adminHrefs).not.toContain("/internal/deployment-status");
    expect(adminHrefs).not.toContain("/internal/trial-funnel");
  });
});
