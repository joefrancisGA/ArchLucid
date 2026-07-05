import { describe, expect, it } from "vitest";

import { NAV_GROUPS } from "@/lib/nav-config";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { filterNavLinksForOperatorShell, listNavGroupsVisibleInOperatorShell } from "@/lib/nav-shell-visibility";

describe("committed architecture review nav promotion", () => {
  const pilot = NAV_GROUPS.find((g) => g.id === "pilot");
  const analysis = NAV_GROUPS.find((g) => g.id === "operate-analysis");
  // /value-report/pilot lives in operate-reports (moved out of operator-system-admin, nav placement audit 2026-07-05).
  const reports = NAV_GROUPS.find((g) => g.id === "operate-reports");

  it("TB-524: keeps Getting started essential before first commit and demotes after", () => {
    expect(pilot).toBeDefined();

    const beforeCommit = filterNavLinksForOperatorShell(
      pilot!.links,
      false,
      false,
      AUTHORITY_RANK.ReadAuthority,
      true,
      false,
    );

    expect(beforeCommit.some((l) => l.href === "/onboarding")).toBe(true);

    const afterCommitCollapsed = filterNavLinksForOperatorShell(
      pilot!.links,
      false,
      false,
      AUTHORITY_RANK.ReadAuthority,
      true,
      true,
    );

    expect(afterCommitCollapsed.some((l) => l.href === "/onboarding")).toBe(false);

    const afterCommitExtended = filterNavLinksForOperatorShell(
      pilot!.links,
      true,
      false,
      AUTHORITY_RANK.ReadAuthority,
      false,
      true,
    );

    const onboarding = afterCommitExtended.find((l) => l.href === "/onboarding");

    expect(onboarding?.tier).toBe("extended");
    expect(onboarding?.defaultVisibleInCollapsedSidebar).toBeUndefined();
  });

  it("TB-524: hides Getting started from default shell after first commit until extended disclosure", () => {
    const rows = listNavGroupsVisibleInOperatorShell(
      NAV_GROUPS,
      false,
      false,
      AUTHORITY_RANK.AdminAuthority,
      false,
      "all",
      true,
    );

    const pilotRow = rows.find((row) => row.group.id === "pilot");

    expect(pilotRow?.visibleLinks.some((l) => l.href === "/onboarding")).toBe(false);

    const rowsExtended = listNavGroupsVisibleInOperatorShell(
      NAV_GROUPS,
      true,
      false,
      AUTHORITY_RANK.AdminAuthority,
      false,
      "all",
      true,
    );

    expect(
      rowsExtended.find((row) => row.group.id === "pilot")?.visibleLinks.some((l) => l.href === "/onboarding"),
    ).toBe(true);
  });

  it("promotes Compare to essential tier but keeps it out of the collapsed sidebar clusters", () => {
    expect(analysis).toBeDefined();
    expect(reports).toBeDefined();

    const collapsedAnalysis = filterNavLinksForOperatorShell(
      analysis!.links,
      false,
      false,
      AUTHORITY_RANK.ReadAuthority,
      true,
      true,
    );

    expect(collapsedAnalysis.some((l) => l.href === "/compare")).toBe(false);

    const collapsedReports = filterNavLinksForOperatorShell(
      reports!.links,
      false,
      false,
      AUTHORITY_RANK.ReadAuthority,
      true,
      true,
    );

    expect(collapsedReports.some((l) => l.href === "/value-report/pilot")).toBe(false);

    const expandedAnalysis = filterNavLinksForOperatorShell(
      analysis!.links,
      false,
      false,
      AUTHORITY_RANK.ReadAuthority,
      false,
      true,
    );

    expect(expandedAnalysis.some((l) => l.href === "/compare")).toBe(true);

    const expandedReports = filterNavLinksForOperatorShell(
      reports!.links,
      false,
      false,
      AUTHORITY_RANK.ReadAuthority,
      false,
      true,
    );

    expect(expandedReports.some((l) => l.href === "/value-report/pilot")).toBe(true);
  });

  it("keeps Compare hidden in collapsed sidebar before the first committed review", () => {
    expect(analysis).toBeDefined();

    const visible = filterNavLinksForOperatorShell(
      analysis!.links,
      false,
      false,
      AUTHORITY_RANK.ReadAuthority,
      true,
      false,
    );

    expect(visible.some((l) => l.href === "/compare")).toBe(false);
  });
});
