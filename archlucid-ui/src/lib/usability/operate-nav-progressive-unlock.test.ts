import { describe, expect, it } from "vitest";

import { listNavGroupsVisibleInOperatorShell } from "@/lib/nav-shell-visibility";
import { NAV_GROUPS } from "@/lib/nav-config";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import {
  filterNavLinksByOperateUnlockPhase,
  isOperateNavGroupId,
  markOperateNavAutoUnlockHintPending,
  readOperateNavUnlockPhase,
  shouldShowOperateNavAutoUnlockHint,
  dismissOperateNavAutoUnlockHint,
  clearOperateNavAutoUnlockHintPending,
  writeOperateNavUnlockPhase,
} from "@/lib/usability/operate-nav-progressive-unlock";

describe("operate-nav-progressive-unlock", () => {
  it("identifies Operate nav group ids", () => {
    expect(isOperateNavGroupId("operate-analysis")).toBe(true);
    expect(isOperateNavGroupId("operate-architect-advanced")).toBe(true);
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
    expect(ids).not.toContain("operate-architect-advanced");
    expect(ids).not.toContain("operate-governance");
    expect(ids).not.toContain("operate-reports");
    expect(ids).not.toContain("operate-integrations");
    expect(ids).toContain("operator-admin");
  });

  it("shows governance workflow and audit at phase 1 but keeps extended governance until phase 2", () => {
    const rows = listNavGroupsVisibleInOperatorShell(
      NAV_GROUPS,
      true,
      true,
      AUTHORITY_RANK.ExecuteAuthority,
      false,
      "all",
      true,
      1,
    );
    const ids = rows.map((row) => row.group.id);

    expect(ids).toContain("operate-analysis");
    expect(ids).toContain("operate-governance");

    const governance = rows.find((row) => row.group.id === "operate-governance");
    const hrefs = governance?.visibleLinks.map((link) => link.href) ?? [];

    expect(hrefs).toContain("/governance");
    expect(hrefs).toContain("/governance/audit");
    expect(hrefs).not.toContain("/governance/findings");
    expect(hrefs).not.toContain("/governance/policy-packs");
    expect(hrefs).not.toContain("/governance/risk-exceptions");
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

  it("shows auto-unlock hint once after commit until dismissed", () => {
    localStorage.clear();
    markOperateNavAutoUnlockHintPending();
    expect(shouldShowOperateNavAutoUnlockHint()).toBe(true);
    dismissOperateNavAutoUnlockHint();
    expect(shouldShowOperateNavAutoUnlockHint()).toBe(false);
    markOperateNavAutoUnlockHintPending();
    expect(shouldShowOperateNavAutoUnlockHint()).toBe(false);
  });

  it("clears pending auto-unlock hint on manual unlock", () => {
    localStorage.clear();
    markOperateNavAutoUnlockHintPending();
    clearOperateNavAutoUnlockHintPending();
    expect(shouldShowOperateNavAutoUnlockHint()).toBe(false);
  });
});
