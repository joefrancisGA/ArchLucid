import { describe, expect, it } from "vitest";

import { SPONSOR_DASHBOARD_HREF, SPONSOR_DASHBOARD_WORKSPACE_HEALTH_HREF } from "@/lib/sponsor/sponsor-dashboard-route";
import { NAV_GROUPS } from "@/lib/nav-config";
import type { NavLinkItem } from "@/lib/nav-config";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import {
  filterNavLinksByCommittedArchitectureReviewGate,
  pathnameEligibleBeforeFirstCommittedArchitectureReview,
} from "@/lib/nav-committed-architecture-review-gate";
import { filterNavLinksForOperatorShell } from "@/lib/nav-shell-visibility";

describe("pathnameEligibleBeforeFirstCommittedArchitectureReview", () => {
  it("allows the pilot path and help/onboarding before first commit, not operate hubs", () => {
    expect(pathnameEligibleBeforeFirstCommittedArchitectureReview("/")).toBe(true);
    expect(pathnameEligibleBeforeFirstCommittedArchitectureReview("/architecture/reviews")).toBe(true);
    expect(pathnameEligibleBeforeFirstCommittedArchitectureReview("/architecture/architectures")).toBe(true);
    expect(pathnameEligibleBeforeFirstCommittedArchitectureReview("/architecture/architectures/new")).toBe(true);
    expect(pathnameEligibleBeforeFirstCommittedArchitectureReview("/architecture/architectures/draft-1")).toBe(true);
    expect(pathnameEligibleBeforeFirstCommittedArchitectureReview("/architecture/reviews/new")).toBe(true);
    expect(pathnameEligibleBeforeFirstCommittedArchitectureReview("/architecture/reviews/abc/def")).toBe(true);
    expect(pathnameEligibleBeforeFirstCommittedArchitectureReview("/insights/evidence-graph")).toBe(true);
    expect(pathnameEligibleBeforeFirstCommittedArchitectureReview(SPONSOR_DASHBOARD_HREF)).toBe(true);
    expect(pathnameEligibleBeforeFirstCommittedArchitectureReview(SPONSOR_DASHBOARD_WORKSPACE_HEALTH_HREF)).toBe(true);
    expect(pathnameEligibleBeforeFirstCommittedArchitectureReview("/help")).toBe(true);
    expect(pathnameEligibleBeforeFirstCommittedArchitectureReview("/architecture/first-review-guide")).toBe(true);
    expect(pathnameEligibleBeforeFirstCommittedArchitectureReview("/administration/baseline")).toBe(true);
    expect(pathnameEligibleBeforeFirstCommittedArchitectureReview("/administration/workspace-settings")).toBe(true);
    expect(pathnameEligibleBeforeFirstCommittedArchitectureReview("/administration")).toBe(false);
    expect(pathnameEligibleBeforeFirstCommittedArchitectureReview("/administration/users")).toBe(false);
    expect(pathnameEligibleBeforeFirstCommittedArchitectureReview("/governance/findings")).toBe(false);
    expect(pathnameEligibleBeforeFirstCommittedArchitectureReview("/governance/alerts")).toBe(false);
    expect(pathnameEligibleBeforeFirstCommittedArchitectureReview("/insights/compare-two-reviews")).toBe(false);
  });
});

describe("filterNavLinksByCommittedArchitectureReviewGate — fragment hrefs", () => {
  it("keeps governance workspace-health out of pre-commit sidebar while route remains eligible", () => {
    const workspaceHealth: NavLinkItem = {
      href: SPONSOR_DASHBOARD_WORKSPACE_HEALTH_HREF,
      label: "Workspace health",
      title: "Workspace health",
      tier: "extended",
    };

    expect(filterNavLinksByCommittedArchitectureReviewGate([workspaceHealth], false)).toHaveLength(0);
    expect(pathnameEligibleBeforeFirstCommittedArchitectureReview(SPONSOR_DASHBOARD_WORKSPACE_HEALTH_HREF)).toBe(true);
  });

  it("sorts sponsor-dashboard fragment anchors with the plain dashboard link before first commit", () => {
    const help: NavLinkItem = {
      href: "/help",
      label: "Help",
      title: "Help",
      tier: "extended",
    };
    const dashboard: NavLinkItem = {
      href: SPONSOR_DASHBOARD_HREF,
      label: "Portfolio overview",
      title: "Portfolio overview",
      tier: "essential",
    };
    const dashboardFragment: NavLinkItem = {
      href: `${SPONSOR_DASHBOARD_HREF}#roi`,
      label: "Portfolio ROI",
      title: "Portfolio ROI",
      tier: "extended",
    };

    const filtered = filterNavLinksByCommittedArchitectureReviewGate([help, dashboardFragment, dashboard], false);

    expect(filtered.map((link) => link.href)).toEqual([dashboard.href, dashboardFragment.href, help.href]);
  });
});

describe("filterNavLinksByCommittedArchitectureReviewGate", () => {
  it("omits Operate and diagnostics links before first commit and restores them after", () => {
    const enterprise = NAV_GROUPS.find((g) => g.id === "operate-governance");
    const analysis = NAV_GROUPS.find((g) => g.id === "operate-analysis");

    expect(enterprise).toBeDefined();
    expect(analysis).toBeDefined();

    const preCommitGovernance = filterNavLinksByCommittedArchitectureReviewGate(enterprise!.links, false);

    expect(preCommitGovernance).toHaveLength(0);

    const postCommitGovernance = filterNavLinksByCommittedArchitectureReviewGate(enterprise!.links, true);

    expect(postCommitGovernance.length).toBe(enterprise!.links.length);

    const preCommitAnalysis = filterNavLinksByCommittedArchitectureReviewGate(analysis!.links, false);

    expect(preCommitAnalysis.map((l) => l.href)).toEqual(["/insights/evidence-graph"]);
  });
});

describe("filterNavLinksForOperatorShell — pre-commit gate", () => {
  it("excludes Compare and governance destinations before first finalize", () => {
    const analysis = NAV_GROUPS.find((g) => g.id === "operate-analysis");
    const enterprise = NAV_GROUPS.find((g) => g.id === "operate-governance");

    expect(analysis).toBeDefined();
    expect(enterprise).toBeDefined();

    const analysisVisible = filterNavLinksForOperatorShell(analysis!.links, AUTHORITY_RANK.AdminAuthority, false);

    expect(analysisVisible.some((l) => l.href === "/insights/compare-two-reviews")).toBe(false);
    expect(analysisVisible.some((l) => l.href === "/insights/evidence-graph")).toBe(true);

    const governanceVisible = filterNavLinksForOperatorShell(enterprise!.links, AUTHORITY_RANK.AdminAuthority, false);

    expect(governanceVisible).toHaveLength(0);
  });
});
