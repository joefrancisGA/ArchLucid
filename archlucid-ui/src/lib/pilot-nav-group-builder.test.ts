import { describe, expect, it, vi, afterEach } from "vitest";

import { OperatorAdminNavGroupBuilder } from "@/lib/operator-admin-nav-group-builder";
import { OperateGovernanceNavGroupBuilder } from "@/lib/operate-governance-nav-group-builder";
import { PilotNavGroupBuilder } from "@/lib/pilot-nav-group-builder";
import { getShowcaseExecutiveHref } from "@/lib/buyer-safe-review-navigation";

describe("PilotNavGroupBuilder", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses buyer-safe portfolio overview nav title without illustrative metrics leak", () => {
    const group = new PilotNavGroupBuilder().build();
    const dashboardLink = group.links.find((link) => link.label === "Executive dashboard");

    expect(dashboardLink).toBeDefined();
    expect(dashboardLink?.title).toContain("Track ROI");
    expect(dashboardLink?.title?.toLowerCase()).not.toContain("illustrative");
    expect(dashboardLink?.title?.toLowerCase()).not.toContain("until api lands");
  });

  it("points portfolio overview nav at /dashboard outside demo packaging", () => {
    vi.stubEnv("NEXT_PUBLIC_DEMO_MODE", "");
    vi.stubEnv("NEXT_PUBLIC_DEMO_STATIC_OPERATOR", "");

    const group = new PilotNavGroupBuilder().build();
    const dashboardLink = group.links.find((link) => link.label === "Executive dashboard");

    expect(dashboardLink?.href).toBe("/dashboard");
  });

  it("points portfolio overview nav at showcase executive href in CTO presenter safe mode", () => {
    vi.stubEnv("NEXT_PUBLIC_DEMO_MODE", "true");
    vi.stubEnv("NEXT_PUBLIC_DEMO_STATIC_OPERATOR", "");

    const group = new PilotNavGroupBuilder().build();
    const dashboardLink = group.links.find((link) => link.label === "Executive dashboard");

    expect(dashboardLink?.href).toBe(getShowcaseExecutiveHref());
  });

  it("includes recurrence schedules in the governance nav group (TB-406)", () => {
    const group = new OperateGovernanceNavGroupBuilder().build();
    const recurrenceLink = group.links.find((link) => link.href === "/governance/recurrence-schedules");

    expect(recurrenceLink).toBeDefined();
    expect(recurrenceLink?.label).toBe("Recurrence schedules");
  });

  it("includes security and trust in the administration nav group", () => {
    const group = new OperatorAdminNavGroupBuilder().build();
    const securityTrustLink = group.links.find((link) => link.href === "/settings/security-trust");

    expect(securityTrustLink).toBeDefined();
    expect(securityTrustLink?.label).toBe("Security & trust");
    expect(securityTrustLink?.requiredAuthority).toBe("ReadAuthority");
  });

  it("lists Overview first in Review work nav (TB-516)", () => {
    const group = new PilotNavGroupBuilder().build();
    const overviewLink = group.links[0];

    expect(overviewLink?.href).toBe("/");
    expect(overviewLink?.label).toBe("Overview");
    expect(overviewLink?.title).toBe("Workspace overview");
  });

  it("keeps Review work focused on first-review essentials only (TB-518)", () => {
    const group = new PilotNavGroupBuilder().build();

    expect(group.links.map((link) => link.label)).toEqual([
      "Overview",
      "New review",
      "Reviews",
      "Executive dashboard",
      "Getting started",
    ]);
    expect(group.links.some((link) => link.href === "/graph")).toBe(false);
  });

  it("TB-606: uses Reviews as the reviews-list nav source label", () => {
    const group = new PilotNavGroupBuilder().build();
    const reviewsListLink = group.links.find((link) => link.href === "/reviews?projectId=default");

    expect(reviewsListLink?.label).toBe("Reviews");
  });
});
