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
    const rows = listNavGroupsVisibleInOperatorShell(NAV_GROUPS, 3, "all", true);

    expect(findSidebarNavGroupIdsForActivePath(rows, "/internal/rag-health")).toEqual(["operator-system-admin"]);
  });

  it("returns governance when a governance child route is active", () => {
    const rows = listNavGroupsVisibleInOperatorShell(NAV_GROUPS, 3, "all", true);

    expect(findSidebarNavGroupIdsForActivePath(rows, "/governance/policy-packs")).toEqual(["operate-policy"]);
    expect(findSidebarNavGroupIdsForActivePath(rows, "/governance/standards-and-rules")).toEqual(["operate-policy"]);
  });

  it("returns administration when security and trust is active", () => {
    const rows = listNavGroupsVisibleInOperatorShell(NAV_GROUPS, 3, "all", true);

    expect(findSidebarNavGroupIdsForActivePath(rows, "/administration/security-trust")).toEqual(["operator-admin"]);
  });

  it("returns analysis when evidence graph is active", () => {
    const rows = listNavGroupsVisibleInOperatorShell(NAV_GROUPS, 3, "all", true);

    expect(findSidebarNavGroupIdsForActivePath(rows, "/insights/evidence-graph")).toEqual(["operate-analysis"]);
  });

  it("returns analysis when architecture advisory is active", () => {
    const rows = listNavGroupsVisibleInOperatorShell(NAV_GROUPS, 3, "all", true);

    expect(findSidebarNavGroupIdsForActivePath(rows, "/governance/advisory-scans")).toEqual(["operate-governance"]);
  });

  it("returns governance when approval lineage detail is active", () => {
    const rows = listNavGroupsVisibleInOperatorShell(NAV_GROUPS, 3, "all", true);

    expect(
      findSidebarNavGroupIdsForActivePath(
        rows,
        "/governance/approval-requests/claims-intake-approval-001/lineage",
      ),
    ).toEqual(["operate-governance"]);
  });
});
