import { ARCHITECTURE_INTELLIGENCE_PATH } from "@/lib/architecture/architecture-intelligence-route";
import { ARCHITECTURES_LIST_PATH } from "@/lib/architecture/architecture-routes";
import { SPONSOR_DASHBOARD_HREF } from "@/lib/sponsor/sponsor-dashboard-route";
import { describe, expect, it, vi, afterEach } from "vitest";

import { OperatorAdminNavGroupBuilder } from "@/lib/operator/operator-admin-nav-group-builder";
import { OperateGovernanceNavGroupBuilder } from "@/lib/operate-governance-nav-group-builder";
import { PilotNavGroupBuilder } from "@/lib/pilot-nav-group-builder";

describe("PilotNavGroupBuilder", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses buyer-safe portfolio overview nav title without illustrative metrics leak", () => {
    const group = new PilotNavGroupBuilder().build();
    const dashboardLink = group.links.find((link) => link.label === "Sponsor dashboard");

    expect(dashboardLink).toBeDefined();
    expect(dashboardLink?.title).toContain("Track ROI");
    expect(dashboardLink?.title?.toLowerCase()).not.toContain("illustrative");
    expect(dashboardLink?.title?.toLowerCase()).not.toContain("until api lands");
  });

  it("points portfolio overview nav at sponsor dashboard outside demo packaging", () => {
    vi.stubEnv("NEXT_PUBLIC_DEMO_MODE", "");
    vi.stubEnv("NEXT_PUBLIC_DEMO_STATIC_OPERATOR", "");

    const group = new PilotNavGroupBuilder().build();
    const dashboardLink = group.links.find((link) => link.label === "Sponsor dashboard");

    expect(dashboardLink?.href).toBe(SPONSOR_DASHBOARD_HREF);
  });

  it("points portfolio overview nav at sponsor dashboard in CTO presenter safe mode", () => {
    vi.stubEnv("NEXT_PUBLIC_DEMO_MODE", "true");
    vi.stubEnv("NEXT_PUBLIC_DEMO_STATIC_OPERATOR", "");

    const group = new PilotNavGroupBuilder().build();
    const dashboardLink = group.links.find((link) => link.label === "Sponsor dashboard");

    expect(dashboardLink?.href).toBe(SPONSOR_DASHBOARD_HREF);
  });

  it("includes recurrence schedules in the governance nav group (TB-406)", () => {
    const group = new OperateGovernanceNavGroupBuilder().build();
    const recurrenceLink = group.links.find((link) => link.href === "/governance/recurrence-schedules");

    expect(recurrenceLink).toBeDefined();
    expect(recurrenceLink?.label).toBe("Recurrence schedules");
  });

  it("includes security and trust in the administration nav group", () => {
    const group = new OperatorAdminNavGroupBuilder().build();
    const securityTrustLink = group.links.find((link) => link.href === "/administration/security-trust");

    expect(securityTrustLink).toBeDefined();
    expect(securityTrustLink?.label).toBe("Security & Trust");
    expect(securityTrustLink?.requiredAuthority).toBe("ReadAuthority");
  });

  it("uses Architecture as the pilot nav group label", () => {
    const group = new PilotNavGroupBuilder().build();

    expect(group.label).toBe("Architecture");
  });

  it("lists Home first in Architecture nav (TB-516)", () => {
    const group = new PilotNavGroupBuilder().build();
    const homeLink = group.links[0];

    expect(homeLink?.href).toBe("/");
    expect(homeLink?.label).toBe("Home");
    expect(homeLink?.title).toBe("Workspace home");
  });

  it("keeps Architecture nav focused on first-review essentials (TB-518)", () => {
    const group = new PilotNavGroupBuilder().build();

    expect(group.links.map((link) => link.label)).toEqual([
      "Home",
      "Packages",
      "Sponsor dashboard",
      "Getting started",
      "Digests",
    ]);
    expect(group.links.some((link) => link.href === "/insights/evidence-graph")).toBe(false);
  });

  it("lists Packages as the unified reviews and drafts destination", () => {
    const group = new PilotNavGroupBuilder().build();
    const packagesLink = group.links.find((link) => link.label === "Packages");

    expect(packagesLink?.href).toBe("/architecture/reviews");
    expect(group.links.some((link) => link.href === ARCHITECTURES_LIST_PATH)).toBe(false);
    expect(group.links.some((link) => link.label === "Reviews")).toBe(false);
  });

  it("keeps Architecture intelligence out of nav so it stays a run-scoped deep-link target", () => {
    const group = new PilotNavGroupBuilder().build();

    expect(group.links.some((link) => link.href === ARCHITECTURE_INTELLIGENCE_PATH)).toBe(false);
  });
});
