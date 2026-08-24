import { describe, expect, it } from "vitest";

import { NAV_GROUPS } from "@/lib/nav-config";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import {
  DEFAULT_NAV_GROUP_IDS_BY_ROLE_NAV_DENSITY_PERSONA,
  countNavGroupsHiddenByFirstSessionPilotMode,
  countNavGroupsHiddenByRoleDensity,
  filterNavGroupsByRoleDensity,
  filterNavGroupsForFirstSessionPilotMode,
  resolveRoleNavDensityPersona,
} from "@/lib/role-shaped-nav-density";
import { listNavGroupsVisibleInOperatorShell } from "@/lib/nav-shell-visibility";

function adminShellRows() {
  return listNavGroupsVisibleInOperatorShell(NAV_GROUPS, AUTHORITY_RANK.AdminAuthority, "all", true);
}

describe("role-shaped-nav-density", () => {
  it("resolves admin, governance, and architect personas from role claims", () => {
    expect(resolveRoleNavDensityPersona(["Admin"])).toBe("admin");
    expect(resolveRoleNavDensityPersona(["Auditor"])).toBe("governance");
    expect(resolveRoleNavDensityPersona(["Operator"])).toBe("architect");
    expect(resolveRoleNavDensityPersona(["Reader"])).toBe("architect");
  });

  it("prefers admin over auditor when both claims are present", () => {
    expect(resolveRoleNavDensityPersona(["Auditor", "Admin"])).toBe("admin");
  });

  it("exposes distinct default nav group sets per persona", () => {
    expect(DEFAULT_NAV_GROUP_IDS_BY_ROLE_NAV_DENSITY_PERSONA.architect).toContain("operate-analysis");
    expect(DEFAULT_NAV_GROUP_IDS_BY_ROLE_NAV_DENSITY_PERSONA.architect).not.toContain("operate-governance");

    expect(DEFAULT_NAV_GROUP_IDS_BY_ROLE_NAV_DENSITY_PERSONA.governance).toContain("operate-governance");
    expect(DEFAULT_NAV_GROUP_IDS_BY_ROLE_NAV_DENSITY_PERSONA.governance).toContain("operate-policy");
    expect(DEFAULT_NAV_GROUP_IDS_BY_ROLE_NAV_DENSITY_PERSONA.governance).not.toContain("operate-analysis");

    expect(DEFAULT_NAV_GROUP_IDS_BY_ROLE_NAV_DENSITY_PERSONA.admin).toContain("operator-admin");
    expect(DEFAULT_NAV_GROUP_IDS_BY_ROLE_NAV_DENSITY_PERSONA.admin).not.toContain("operate-governance");
  });

  it("filters admin shell rows to operator-admin by default and restores full nav on expand", () => {
    const rows = adminShellRows();
    const persona = resolveRoleNavDensityPersona(["Admin"]);
    const collapsed = filterNavGroupsByRoleDensity(rows, persona, false);
    const expanded = filterNavGroupsByRoleDensity(rows, persona, true);

    expect(collapsed.map((row) => row.group.id)).toEqual(
      expect.arrayContaining(["pilot", "operator-admin"]),
    );
    expect(collapsed.some((row) => row.group.id === "operate-governance")).toBe(false);
    expect(expanded.length).toBeGreaterThan(collapsed.length);
    expect(countNavGroupsHiddenByRoleDensity(rows, persona, false)).toBeGreaterThan(0);
    expect(countNavGroupsHiddenByRoleDensity(rows, persona, true)).toBe(0);
  });

  it("hides non-primary groups for governance persona at execute rank", () => {
    const rows = listNavGroupsVisibleInOperatorShell(NAV_GROUPS, AUTHORITY_RANK.ExecuteAuthority, "all", true);
    const collapsed = filterNavGroupsByRoleDensity(rows, "governance", false);

    expect(collapsed.some((row) => row.group.id === "operate-governance")).toBe(true);
    expect(collapsed.some((row) => row.group.id === "operate-policy")).toBe(true);
    expect(collapsed.some((row) => row.group.id === "operate-analysis")).toBe(false);
  });

  it("restricts first-session nav to pilot group until a committed package exists", () => {
    const rows = adminShellRows();
    const firstSession = filterNavGroupsForFirstSessionPilotMode(rows, false, false);
    const afterCommit = filterNavGroupsForFirstSessionPilotMode(rows, true, false);

    expect(firstSession.every((row) => row.group.id === "pilot")).toBe(true);
    expect(firstSession.length).toBeGreaterThan(0);
    expect(afterCommit.length).toBeGreaterThan(firstSession.length);
    expect(countNavGroupsHiddenByFirstSessionPilotMode(rows, false, false)).toBeGreaterThan(0);
    expect(countNavGroupsHiddenByFirstSessionPilotMode(rows, true, false)).toBe(0);
  });
});
