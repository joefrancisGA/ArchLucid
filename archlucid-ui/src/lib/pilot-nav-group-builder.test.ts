import { describe, expect, it } from "vitest";

import { PilotNavGroupBuilder } from "@/lib/pilot-nav-group-builder";

describe("PilotNavGroupBuilder", () => {
  it("uses buyer-safe executive summary nav title without illustrative metrics leak", () => {
    const group = new PilotNavGroupBuilder().build();
    const dashboardLink = group.links.find((link) => link.href === "/dashboard");

    expect(dashboardLink).toBeDefined();
    expect(dashboardLink?.title).toContain("Executive summary");
    expect(dashboardLink?.title?.toLowerCase()).not.toContain("illustrative");
    expect(dashboardLink?.title?.toLowerCase()).not.toContain("until api lands");
  });
});
