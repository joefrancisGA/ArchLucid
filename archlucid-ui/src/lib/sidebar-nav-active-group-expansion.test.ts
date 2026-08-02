import { afterEach, describe, expect, it, vi } from "vitest";

import { NAV_GROUPS } from "@/lib/nav-config";
import { findSidebarNavGroupIdsForActivePath } from "@/lib/sidebar-nav-active-group-expansion";
import { listNavGroupsVisibleInOperatorShell } from "@/lib/nav-shell-visibility";

describe("findSidebarNavGroupIdsForActivePath", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns the system-admin group when an internal route is active", () => {
    vi.stubEnv("NEXT_PUBLIC_FEATURES_SHOW_SYSTEM_ADMINISTRATION_NAV", "true");
    const rows = listNavGroupsVisibleInOperatorShell(NAV_GROUPS, true, true, 3, false, "all", true, 2);

    expect(findSidebarNavGroupIdsForActivePath(rows, "/admin/rag-health")).toEqual(["operator-system-admin"]);
  });

  it("returns governance when a governance child route is active", () => {
    const rows = listNavGroupsVisibleInOperatorShell(NAV_GROUPS, true, true, 3, false, "all", true, 2);

    expect(findSidebarNavGroupIdsForActivePath(rows, "/governance/policy-packs")).toEqual(["operate-governance"]);
    expect(findSidebarNavGroupIdsForActivePath(rows, "/governance/standards-and-rules")).toEqual(["operate-governance"]);
  });

  it("returns administration when security and trust is active", () => {
    const rows = listNavGroupsVisibleInOperatorShell(NAV_GROUPS, true, true, 3, false, "all", true, 2);

    expect(findSidebarNavGroupIdsForActivePath(rows, "/administration/settings/security-trust")).toEqual(["operator-admin"]);
  });

  it("returns analysis when evidence graph is active", () => {
    const rows = listNavGroupsVisibleInOperatorShell(NAV_GROUPS, true, true, 3, false, "all", true, 2);

    expect(findSidebarNavGroupIdsForActivePath(rows, "/insights/evidence-graph")).toEqual(["operate-analysis"]);
  });

  it("returns analysis when architecture advisory is active", () => {
    const rows = listNavGroupsVisibleInOperatorShell(NAV_GROUPS, true, true, 3, false, "all", true, 2);

    expect(findSidebarNavGroupIdsForActivePath(rows, "/governance/advisory-scans")).toEqual(["operate-governance"]);
  });
});
