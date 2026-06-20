import { describe, expect, it, vi, afterEach } from "vitest";

import { PilotNavGroupBuilder } from "@/lib/pilot-nav-group-builder";
import { getShowcaseExecutiveHref } from "@/lib/buyer-safe-review-navigation";

describe("PilotNavGroupBuilder", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses buyer-safe portfolio overview nav title without illustrative metrics leak", () => {
    const group = new PilotNavGroupBuilder().build();
    const dashboardLink = group.links.find((link) => link.label === "Portfolio overview");

    expect(dashboardLink).toBeDefined();
    expect(dashboardLink?.title).toContain("Portfolio overview");
    expect(dashboardLink?.title?.toLowerCase()).not.toContain("illustrative");
    expect(dashboardLink?.title?.toLowerCase()).not.toContain("until api lands");
  });

  it("points portfolio overview nav at /dashboard outside demo packaging", () => {
    vi.stubEnv("NEXT_PUBLIC_DEMO_MODE", "");
    vi.stubEnv("NEXT_PUBLIC_DEMO_STATIC_OPERATOR", "");

    const group = new PilotNavGroupBuilder().build();
    const dashboardLink = group.links.find((link) => link.label === "Portfolio overview");

    expect(dashboardLink?.href).toBe("/dashboard");
  });

  it("points portfolio overview nav at showcase executive href in CTO presenter safe mode", () => {
    vi.stubEnv("NEXT_PUBLIC_DEMO_MODE", "true");
    vi.stubEnv("NEXT_PUBLIC_DEMO_STATIC_OPERATOR", "");

    const group = new PilotNavGroupBuilder().build();
    const dashboardLink = group.links.find((link) => link.label === "Portfolio overview");

    expect(dashboardLink?.href).toBe(getShowcaseExecutiveHref());
  });

  it("includes recurrence schedules in the pilot nav group for post-commit operating rhythm", () => {
    const group = new PilotNavGroupBuilder().build();
    const recurrenceLink = group.links.find((link) => link.href === "/governance/recurrence-schedules");

    expect(recurrenceLink).toBeDefined();
    expect(recurrenceLink?.label).toBe("Recurrence schedules");
  });
});
