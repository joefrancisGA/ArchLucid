import { describe, expect, it } from "vitest";

import { EXECUTIVE_DASHBOARD_HREF } from "@/lib/executive/executive-dashboard-route";
import { NAV_GROUPS } from "@/lib/nav-config";
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
    expect(pathnameEligibleBeforeFirstCommittedArchitectureReview(EXECUTIVE_DASHBOARD_HREF)).toBe(true);
    expect(pathnameEligibleBeforeFirstCommittedArchitectureReview("/help")).toBe(true);
    expect(pathnameEligibleBeforeFirstCommittedArchitectureReview("/architecture/first-review-guide")).toBe(true);
    expect(pathnameEligibleBeforeFirstCommittedArchitectureReview("/administration/baseline")).toBe(true);
    expect(pathnameEligibleBeforeFirstCommittedArchitectureReview("/administration/tenant")).toBe(true);
    expect(pathnameEligibleBeforeFirstCommittedArchitectureReview("/administration")).toBe(false);
    expect(pathnameEligibleBeforeFirstCommittedArchitectureReview("/administration/users")).toBe(false);
    expect(pathnameEligibleBeforeFirstCommittedArchitectureReview("/governance/findings")).toBe(false);
    expect(pathnameEligibleBeforeFirstCommittedArchitectureReview("/governance/alerts")).toBe(false);
    expect(pathnameEligibleBeforeFirstCommittedArchitectureReview("/insights/compare-two-reviews")).toBe(false);
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

    const analysisVisible = filterNavLinksForOperatorShell(
      analysis!.links,
      true,
      true,
      AUTHORITY_RANK.AdminAuthority,
      false,
      false,
    );

    expect(analysisVisible.some((l) => l.href === "/insights/compare-two-reviews")).toBe(false);
    expect(analysisVisible.some((l) => l.href === "/insights/evidence-graph")).toBe(true);

    const governanceVisible = filterNavLinksForOperatorShell(
      enterprise!.links,
      true,
      true,
      AUTHORITY_RANK.AdminAuthority,
      false,
      false,
    );

    expect(governanceVisible).toHaveLength(0);
  });
});
