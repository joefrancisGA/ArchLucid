import { describe, expect, it } from "vitest";

import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { NAV_GROUPS } from "@/lib/nav-config";
import { GOVERNANCE_INFRASTRUCTURE_PATH } from "@/lib/governance/governance-infrastructure-route-paths";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import { listNavGroupsVisibleInOperatorShell } from "@/lib/nav-shell-visibility";

describe("filterNavGroupsForProductLine (Security shell)", () => {
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
});
