import { describe, expect, it } from "vitest";

import { listNavGroupsVisibleInOperatorShell } from "@/lib/nav-shell-visibility";
import { NAV_GROUPS } from "@/lib/nav-config";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import {
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
    expect(isOperateNavGroupId("operate-integrations")).toBe(true);
    expect(isOperateNavGroupId("pilot")).toBe(false);
    expect(isOperateNavGroupId("operator-admin")).toBe(false);
  });

  it("hides Operate groups before first commit and restores them after", () => {
    const preCommit = listNavGroupsVisibleInOperatorShell(NAV_GROUPS, AUTHORITY_RANK.ReadAuthority, "all", false);
    const preCommitIds = preCommit.map((row) => row.group.id);

    expect(preCommitIds).toContain("pilot");
    expect(preCommitIds).not.toContain("operate-governance");
    expect(preCommitIds).not.toContain("operate-integrations");

    const postCommit = listNavGroupsVisibleInOperatorShell(NAV_GROUPS, AUTHORITY_RANK.ReadAuthority, "all", true);
    const postCommitIds = postCommit.map((row) => row.group.id);

    expect(postCommitIds).toContain("operate-analysis");
    expect(postCommitIds).toContain("operate-governance");
    expect(postCommitIds).toContain("operate-integrations");
    expect(postCommitIds).toContain("operator-admin");
  });

  it("shows extended governance hrefs regardless of unlock phase when authority allows", () => {
    const rows = listNavGroupsVisibleInOperatorShell(NAV_GROUPS, AUTHORITY_RANK.ExecuteAuthority, "all", true);
    const governance = rows.find((row) => row.group.id === "operate-governance");
    const hrefs = governance?.visibleLinks.map((link) => link.href) ?? [];

    expect(hrefs).toContain("/governance/approval-queue");
    expect(hrefs).toContain("/governance/audit");
    expect(hrefs).toContain("/governance/findings");
    expect(hrefs).toContain("/governance/policy-packs");
    expect(hrefs).toContain("/governance/exceptions");
  });

  it("shows advanced-tier approval queue without showAdvanced when authority allows", () => {
    const rows = listNavGroupsVisibleInOperatorShell(NAV_GROUPS, AUTHORITY_RANK.ExecuteAuthority, "all", true);
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
