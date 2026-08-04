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
    expect(isOperateNavGroupId("operate-architect-advanced")).toBe(false);
    expect(isOperateNavGroupId("operate-governance")).toBe(true);
    expect(isOperateNavGroupId("operate-reports")).toBe(true);
    expect(isOperateNavGroupId("operate-integrations")).toBe(true);
    expect(isOperateNavGroupId("pilot")).toBe(false);
    expect(isOperateNavGroupId("operator-admin")).toBe(false);
  });

  it("does not hide Operate links by unlock phase (visibility is authority-only)", () => {
    const links = [{ href: "/insights/compare-two-reviews" }, { href: "/audit" }];

    expect(filterNavLinksByOperateUnlockPhase(links, false, 0)).toEqual(links);
    expect(filterNavLinksByOperateUnlockPhase(links, true, 2)).toEqual(links);
  });

  it("keeps Operate groups in the operator shell at phase 0 when authority allows", () => {
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
    expect(ids).toContain("operate-analysis");
    expect(ids).toContain("operate-governance");
    expect(ids).toContain("operate-reports");
    expect(ids).toContain("operate-integrations");
    expect(ids).toContain("operator-admin");
  });

  it("shows extended governance hrefs regardless of unlock phase when authority allows", () => {
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
    const governance = rows.find((row) => row.group.id === "operate-governance");
    const hrefs = governance?.visibleLinks.map((link) => link.href) ?? [];

    expect(hrefs).toContain("/governance/approval-queue");
    expect(hrefs).toContain("/governance/audit");
    expect(hrefs).toContain("/governance/findings");
    expect(hrefs).toContain("/governance/policy-packs");
    expect(hrefs).toContain("/governance/risk-exceptions");
  });

  it("shows advanced-tier approval queue without showAdvanced when authority allows", () => {
    const rows = listNavGroupsVisibleInOperatorShell(
      NAV_GROUPS,
      true,
      false,
      AUTHORITY_RANK.ExecuteAuthority,
      false,
      "all",
      true,
      2,
    );
    const governance = rows.find((row) => row.group.id === "operate-governance");
    const hrefs = governance?.visibleLinks.map((link) => link.href) ?? [];

    expect(hrefs).toContain("/governance/findings");
    expect(hrefs).toContain("/governance/approval-queue");
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

  it("clearOperateNavAutoUnlockHintPending allows a later hint", () => {
    localStorage.clear();
    markOperateNavAutoUnlockHintPending();
    dismissOperateNavAutoUnlockHint();
    clearOperateNavAutoUnlockHintPending();
    localStorage.removeItem("archlucid.operateNavAutoUnlockHintDismissed.v1");
    markOperateNavAutoUnlockHintPending();
    expect(shouldShowOperateNavAutoUnlockHint()).toBe(true);
  });
});
