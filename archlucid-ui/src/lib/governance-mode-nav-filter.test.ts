import { describe, expect, it } from "vitest";

import { filterNavGroupsForGovernanceMode, filterNavLinksForGovernanceMode } from "@/lib/governance-mode-nav-filter";
import { NAV_GROUPS } from "@/lib/nav-config";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { listNavGroupsVisibleInOperatorShell } from "@/lib/nav-shell-visibility";

describe("governance-mode-nav-filter", () => {
  it("hides operate-governance destinations when governance view is off", () => {
    const rows = listNavGroupsVisibleInOperatorShell(
      NAV_GROUPS,
      true,
      true,
      AUTHORITY_RANK.AdminAuthority,
      false,
      "all",
      true,
      2,
    );

    const filtered = filterNavGroupsForGovernanceMode(rows, false);
    const hrefs = filtered.flatMap((row) => row.visibleLinks.map((link) => link.href));

    expect(hrefs).not.toContain("/audit");
    expect(hrefs).not.toContain("/policy-packs");
    expect(hrefs).not.toContain("/governance");
    expect(filtered.some((row) => row.group.id === "operate-governance")).toBe(false);
  });

  it("preserves governance destinations when governance view is on", () => {
    const links = NAV_GROUPS.flatMap((group) => group.links);
    const filtered = filterNavLinksForGovernanceMode(links, true);

    expect(filtered.some((link) => link.href === "/audit")).toBe(true);
    expect(filtered.some((link) => link.href === "/policy-packs")).toBe(true);
  });
});
