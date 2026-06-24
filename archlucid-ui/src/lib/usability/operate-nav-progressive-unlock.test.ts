import { describe, expect, it } from "vitest";

import { listNavGroupsVisibleInOperatorShell } from "@/lib/nav-shell-visibility";
import { NAV_GROUPS } from "@/lib/nav-config";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import {
  filterNavLinksByOperateUnlockPhase,
  isOperateNavGroupId,
  readOperateNavUnlockPhase,
  writeOperateNavUnlockPhase,
} from "@/lib/usability/operate-nav-progressive-unlock";

describe("operate-nav-progressive-unlock", () => {
  it("identifies Operate nav group ids", () => {
    expect(isOperateNavGroupId("operate-analysis")).toBe(true);
    expect(isOperateNavGroupId("operate-governance")).toBe(true);
    expect(isOperateNavGroupId("operate-reports")).toBe(true);
    expect(isOperateNavGroupId("operate-integrations")).toBe(true);
    expect(isOperateNavGroupId("pilot")).toBe(false);
    expect(isOperateNavGroupId("operator-admin")).toBe(false);
  });

  it("hides all Operate links at phase 0", () => {
    const links = [{ href: "/compare" }, { href: "/audit" }];
    expect(filterNavLinksByOperateUnlockPhase(links, false, 0)).toEqual([]);
  });

  it("omits Operate groups from the operator shell at phase 0", () => {
    const rows = listNavGroupsVisibleInOperatorShell(
      NAV_GROUPS,
      true,
      true,
      AUTHORITY_RANK.ReadAuthority,
      false,
      "all",
      false,
      0,
    );
    const ids = rows.map((row) => row.group.id);

    expect(ids).toContain("pilot");
    expect(ids).not.toContain("operate-analysis");
    expect(ids).not.toContain("operate-governance");
    expect(ids).not.toContain("operate-reports");
    expect(ids).not.toContain("operate-integrations");
    expect(ids).toContain("operator-admin");
  });

  it("defaults stored phase to 0 for new users", () => {
    localStorage.clear();
    expect(readOperateNavUnlockPhase()).toBe(0);
  });

  it("persists explicit unlock phases", () => {
    localStorage.clear();
    writeOperateNavUnlockPhase(1);
    expect(readOperateNavUnlockPhase()).toBe(1);
    writeOperateNavUnlockPhase(2);
    expect(readOperateNavUnlockPhase()).toBe(2);
  });
});
