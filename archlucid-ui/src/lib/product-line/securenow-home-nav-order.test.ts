import { describe, expect, it } from "vitest";

import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { NAV_GROUPS } from "@/lib/nav-config";
import { SECURENOW_INFRASTRUCTURE_TERRAFORM_PATH } from "@/lib/governance/governance-infrastructure-route-paths";
import { listNavGroupsVisibleInOperatorShell } from "@/lib/nav-shell-visibility";
import { SECURENOW_COMPLIANCE_HOME_ROWS } from "@/lib/product-line/securenow-compliance-home-copy";
import { SECURENOW_INFRASTRUCTURE_HOME_ROWS } from "@/lib/product-line/securenow-infrastructure-home-copy";
import { SECURENOW_SECURITY_HOME_ROWS } from "@/lib/product-line/securenow-security-home-copy";

function listSecureNowSidebarHrefs(): string[] {
  const rows = listNavGroupsVisibleInOperatorShell(NAV_GROUPS, AUTHORITY_RANK.AdminAuthority, "all", true, false, {
    productLine: "security",
    showVendorInternalNav: true,
  });

  return rows.flatMap((row) => row.visibleLinks.map((link) => link.href));
}

describe("SecureNow home destination order", () => {
  it("keeps Terraform mapping last in the infrastructure home section", () => {
    expect(SECURENOW_INFRASTRUCTURE_HOME_ROWS.at(-1)?.href).toBe(SECURENOW_INFRASTRUCTURE_TERRAFORM_PATH);
  });

  it("lists home destinations in the same order as matching navbar links", () => {
    const homeHrefs = [
      ...SECURENOW_SECURITY_HOME_ROWS,
      ...SECURENOW_COMPLIANCE_HOME_ROWS,
      ...SECURENOW_INFRASTRUCTURE_HOME_ROWS,
    ].map((row) => row.href);
    const homeHrefSet = new Set(homeHrefs);
    const navbarHrefsOnHome = listSecureNowSidebarHrefs().filter((href) => homeHrefSet.has(href));

    expect(homeHrefs).toEqual(navbarHrefsOnHome);
  });
});
