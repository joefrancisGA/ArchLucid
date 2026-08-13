import { describe, expect, it } from "vitest";

import { NAV_GROUPS } from "@/lib/nav-config";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { applyCommittedArchitectureReviewNavPromotions } from "@/lib/nav-committed-architecture-review-promotion";
import { filterNavLinksForOperatorShell, listNavGroupsVisibleInOperatorShell } from "@/lib/nav-shell-visibility";

describe("committed architecture review nav promotion", () => {
  const pilot = NAV_GROUPS.find((g) => g.id === "pilot");
  const analysis = NAV_GROUPS.find((g) => g.id === "operate-analysis");
  // The merged sponsor report lives in Insights (formerly operate-reports).

  it("TB-524: keeps First review guide essential before first commit and demotes after", () => {
    expect(pilot).toBeDefined();

    const beforeCommit = applyCommittedArchitectureReviewNavPromotions(pilot!.links, false);
    const before = beforeCommit.find((l) => l.href === "/architecture/first-review-guide");

    expect(before?.tier).toBe("essential");

    const afterCommit = applyCommittedArchitectureReviewNavPromotions(pilot!.links, true);
    const after = afterCommit.find((l) => l.href === "/architecture/first-review-guide");

    expect(after?.tier).toBe("extended");
  });

  it("moves First review guide last in its group after first commit, keeping other links in order", () => {
    expect(pilot).toBeDefined();

    const beforeCommit = applyCommittedArchitectureReviewNavPromotions(pilot!.links, false);

    expect(beforeCommit.map((l) => l.href)).toEqual(pilot!.links.map((l) => l.href));

    const afterCommit = applyCommittedArchitectureReviewNavPromotions(pilot!.links, true);
    const hrefs = afterCommit.map((l) => l.href);

    expect(hrefs.at(-1)).toBe("/architecture/first-review-guide");
    expect(hrefs).toHaveLength(pilot!.links.length);
    expect(hrefs.slice(0, -1)).toEqual(
      pilot!.links.map((l) => l.href).filter((href) => href !== "/architecture/first-review-guide"),
    );
  });

  it("TB-524: keeps First review guide visible under authority-only shell shaping after first commit", () => {
    // Tier disclosure filtering is retired (owner 2026-08-03); demotion remains metadata for progressive copy.
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

    expect(pilotRow?.visibleLinks.some((l) => l.href === "/architecture/first-review-guide")).toBe(true);
  });

  it("promotes Compare and the sponsor report to essential tier after first commit", () => {
    expect(analysis).toBeDefined();

    const promotedAnalysis = applyCommittedArchitectureReviewNavPromotions(analysis!.links, true);
    const compare = promotedAnalysis.find((l) => l.href === "/insights/compare-two-reviews");

    expect(compare?.tier).toBe("essential");

    const outcomes = promotedAnalysis.find((l) => l.href === "/insights/executive-summary");

    expect(outcomes?.tier).toBe("essential");

    const shellAnalysis = filterNavLinksForOperatorShell(
      analysis!.links,
      false,
      false,
      AUTHORITY_RANK.ReadAuthority,
      false,
      true,
    );

    expect(shellAnalysis.some((l) => l.href === "/insights/compare-two-reviews")).toBe(true);
  });

  it("hides Compare in the authority-shaped shell before the first committed review", () => {
    expect(analysis).toBeDefined();

    const visible = filterNavLinksForOperatorShell(
      analysis!.links,
      false,
      false,
      AUTHORITY_RANK.ReadAuthority,
      true,
      false,
    );

    expect(visible.some((l) => l.href === "/insights/compare-two-reviews")).toBe(false);
    expect(visible.some((l) => l.href === "/insights/evidence-graph")).toBe(true);
  });
});
