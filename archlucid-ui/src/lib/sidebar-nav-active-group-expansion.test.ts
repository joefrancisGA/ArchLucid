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

    expect(findSidebarNavGroupIdsForActivePath(rows, "/policy-packs")).toEqual(["operate-governance"]);
    expect(findSidebarNavGroupIdsForActivePath(rows, "/governance-resolution")).toEqual(["operate-governance"]);
  });
});
