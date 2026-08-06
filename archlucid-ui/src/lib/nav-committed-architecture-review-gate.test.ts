import { describe, expect, it } from "vitest";

import { EXECUTIVE_DASHBOARD_HREF } from "@/lib/executive-dashboard-route";
import { NAV_GROUPS } from "@/lib/nav-config";
import {
  pathnameEligibleBeforeFirstCommittedArchitectureReview,
  filterNavLinksByCommittedArchitectureReviewGate,
} from "@/lib/nav-committed-architecture-review-gate";

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
    expect(pathnameEligibleBeforeFirstCommittedArchitectureReview("/governance/findings")).toBe(false);
    expect(pathnameEligibleBeforeFirstCommittedArchitectureReview("/alerts")).toBe(false);
  });
});

describe("filterNavLinksByCommittedArchitectureReviewGate", () => {
  it("is a no-op when the tenant already committed a review", () => {
    const pilot = NAV_GROUPS.find((g) => g.id === "pilot");
    if (pilot === undefined) {
      throw new Error("nav smoke: missing pilot group");
    }

    const full = filterNavLinksByCommittedArchitectureReviewGate(pilot.links, true);
    expect(full).toEqual([...pilot.links]);
  });

  it("returns all pilot links when uncommitted (gate retired — authority-only visibility)", () => {
    const pilot = NAV_GROUPS.find((g) => g.id === "pilot");
    if (pilot === undefined) {
      throw new Error("nav smoke: missing pilot group");
    }

    const thin = filterNavLinksByCommittedArchitectureReviewGate(pilot.links, false);

    expect(thin).toEqual(pilot.links);
  });

  it("returns all operate-governance links when uncommitted (gate retired)", () => {
    const governance = NAV_GROUPS.find((g) => g.id === "operate-governance");
    if (governance === undefined) {
      throw new Error("nav smoke: missing operate-governance group");
    }

    const thin = filterNavLinksByCommittedArchitectureReviewGate(governance.links, false);

    expect(thin).toEqual(governance.links);
  });
});
