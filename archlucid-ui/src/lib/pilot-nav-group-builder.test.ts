import { ARCHITECTURE_INTELLIGENCE_PATH } from "@/lib/architecture/architecture-intelligence-route";
import { ARCHITECTURES_LIST_PATH } from "@/lib/architecture/architecture-routes";
import { EXECUTIVE_DASHBOARD_HREF } from "@/lib/executive/executive-dashboard-route";
import { ARCHITECTURE_DRAFTS_LIST_LABEL } from "@/lib/architecture/architecture-workflow-labels";
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
    const dashboardLink = group.links.find((link) => link.label === "Executive dashboard");

    expect(dashboardLink).toBeDefined();
    expect(dashboardLink?.title).toContain("Track ROI");
    expect(dashboardLink?.title?.toLowerCase()).not.toContain("illustrative");
    expect(dashboardLink?.title?.toLowerCase()).not.toContain("until api lands");
  });

  it("points portfolio overview nav at executive dashboard outside demo packaging", () => {
    vi.stubEnv("NEXT_PUBLIC_DEMO_MODE", "");
    vi.stubEnv("NEXT_PUBLIC_DEMO_STATIC_OPERATOR", "");

    const group = new PilotNavGroupBuilder().build();
    const dashboardLink = group.links.find((link) => link.label === "Executive dashboard");

    expect(dashboardLink?.href).toBe(EXECUTIVE_DASHBOARD_HREF);
  });

  it("points portfolio overview nav at executive dashboard in CTO presenter safe mode", () => {
    vi.stubEnv("NEXT_PUBLIC_DEMO_MODE", "true");
    vi.stubEnv("NEXT_PUBLIC_DEMO_STATIC_OPERATOR", "");

    const group = new PilotNavGroupBuilder().build();
    const dashboardLink = group.links.find((link) => link.label === "Executive dashboard");

    expect(dashboardLink?.href).toBe(EXECUTIVE_DASHBOARD_HREF);
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

  it("keeps Architecture nav focused on first-review essentials and architecture intelligence (TB-518)", () => {
    const group = new PilotNavGroupBuilder().build();

    expect(group.links.map((link) => link.label)).toEqual([
      "Home",
      ARCHITECTURE_DRAFTS_LIST_LABEL,
      "Reviews",
      "Executive dashboard",
      "First review guide",
      "Digests",
      "Architecture intelligence",
    ]);
    expect(group.links.some((link) => link.href === "/insights/evidence-graph")).toBe(false);
    expect(group.links.some((link) => link.href === ARCHITECTURE_INTELLIGENCE_PATH)).toBe(true);
  });

  it("lists Architectures and Reviews as peer object nav destinations", () => {
    const group = new PilotNavGroupBuilder().build();
    const architecturesLink = group.links.find((link) => link.href === ARCHITECTURES_LIST_PATH);
    const reviewsListLink = group.links.find((link) => link.href === "/architecture/reviews");

    expect(architecturesLink?.label).toBe(ARCHITECTURE_DRAFTS_LIST_LABEL);
    expect(reviewsListLink?.label).toBe("Reviews");
    expect(group.links.some((link) => link.href === `${ARCHITECTURES_LIST_PATH}/new`)).toBe(false);
    expect(group.links.some((link) => link.href === "/architecture/reviews/new")).toBe(false);
  });

  it("lists Architecture intelligence under Architecture", () => {
    const group = new PilotNavGroupBuilder().build();
    const intelligenceLink = group.links.find((link) => link.href === ARCHITECTURE_INTELLIGENCE_PATH);

    expect(intelligenceLink).toBeDefined();
    expect(intelligenceLink?.requiredAuthority).toBe("ExecuteAuthority");
  });
});
