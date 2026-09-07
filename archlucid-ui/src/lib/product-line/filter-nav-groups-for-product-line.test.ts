import { afterEach, describe, expect, it, vi } from "vitest";

import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { NAV_GROUPS } from "@/lib/nav-config";
import { GOVERNANCE_INFRASTRUCTURE_PATH } from "@/lib/governance/governance-infrastructure-route-paths";
import { OPERATOR_NAV_GROUP_LABELS, OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import { listNavGroupsVisibleInOperatorShell } from "@/lib/nav-shell-visibility";
import {
  SECURENOW_COMPLIANCE_NAV_GROUP_ID,
  SECURENOW_SECURITY_NAV_GROUP_ID,
} from "@/lib/product-line/securenow-nav-reshape";

describe("filterNavGroupsForProductLine (Security shell)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("puts Compliance first, then Infrastructure and Security, and uses Home instead of Infrastructure overview", () => {
    const rows = listNavGroupsVisibleInOperatorShell(
      NAV_GROUPS,
      AUTHORITY_RANK.AdminAuthority,
      "all",
      true,
      false,
      { productLine: "security", showVendorInternalNav: true },
    );

    expect(rows[0]?.group.id).toBe(SECURENOW_COMPLIANCE_NAV_GROUP_ID);
    expect(rows[0]?.group.label).toBe(OPERATOR_NAV_GROUP_LABELS.compliance);
    expect(rows[1]?.group.id).toBe("operate-infrastructure");
    expect(rows[2]?.group.id).toBe(SECURENOW_SECURITY_NAV_GROUP_ID);
    expect(rows[2]?.group.label).toBe(OPERATOR_NAV_GROUP_LABELS.security);

    const groupIds = rows.map((row) => row.group.id);

    expect(groupIds).not.toContain("pilot");
    expect(groupIds).not.toContain("operate-policy");
    expect(groupIds).not.toContain("operate-governance");
    expect(groupIds).not.toContain("operate-integrations");

    const complianceLinks = rows.find((row) => row.group.id === SECURENOW_COMPLIANCE_NAV_GROUP_ID)?.visibleLinks ?? [];
    const infrastructureLinks = rows.find((row) => row.group.id === "operate-infrastructure")?.visibleLinks ?? [];
    const securityLinks = rows.find((row) => row.group.id === SECURENOW_SECURITY_NAV_GROUP_ID)?.visibleLinks ?? [];

    expect(complianceLinks.map((link) => link.href)).toEqual([
      "/governance/policy-packs",
      "/governance/standards-and-rules",
      "/governance/findings",
      "/governance/audit-evidence",
    ]);
    expect(infrastructureLinks[0]?.href).toBe("/");
    expect(infrastructureLinks[0]?.label).toBe(OPERATOR_NAV_LINK_LABELS.home);
    expect(infrastructureLinks.some((link) => link.href === GOVERNANCE_INFRASTRUCTURE_PATH)).toBe(false);
    expect(infrastructureLinks.some((link) => link.label === OPERATOR_NAV_LINK_LABELS.infrastructureAsk)).toBe(true);
    expect(securityLinks.map((link) => link.href)).toEqual([
      "/governance/findings/assigned-to-me",
      "/governance/remediation-factory",
      "/governance/remediation-patterns",
      "/integrations/cloud-connections",
      "/integrations/jira",
      "/integrations/servicenow",
      "/integrations/teams",
    ]);
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
    expect(adminHrefs).not.toContain("/internal/product-line");
    expect(adminHrefs).not.toContain("/internal/deployment-status");
    expect(adminHrefs).not.toContain("/internal/trial-funnel");
  });
});
