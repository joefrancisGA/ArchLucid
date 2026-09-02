import { describe, expect, it } from "vitest";

import {
  homeGovernanceWarningsClearHrefFromSearch,
  homeGovernanceWarningsHrefFromSearch,
  homeGovernanceWarningsQueryEnabled,
  parseRunsDashboardShowArchivedFromSearch,
  parseRunsDashboardTabFromSearch,
  resolveRunsDashboardOpenAllReviewsHref,
  runsDashboardHomeHrefFromSearch,
  runsDashboardTabHrefFromSearch,
} from "@/components/operator-home/runs-dashboard-panel-presentation";

describe("home governance warnings URL helpers", () => {
  it("detects warnings query param", () => {
    expect(homeGovernanceWarningsQueryEnabled(new URLSearchParams("warnings=1"))).toBe(true);
    expect(homeGovernanceWarningsQueryEnabled(new URLSearchParams("warnings=true"))).toBe(true);
    expect(homeGovernanceWarningsQueryEnabled(new URLSearchParams())).toBe(false);
  });

  it("writes and clears warnings query param", () => {
    expect(homeGovernanceWarningsHrefFromSearch("")).toBe("/?warnings=1");
    expect(homeGovernanceWarningsHrefFromSearch("tab=attention")).toBe("/?tab=attention&warnings=1");
    expect(homeGovernanceWarningsClearHrefFromSearch("warnings=1&tab=attention")).toBe("/?tab=attention");
  });

  it("parses and writes home dashboard tab and archived params", () => {
    expect(parseRunsDashboardTabFromSearch("attention")).toBe("attention");
    expect(parseRunsDashboardTabFromSearch("invalid")).toBe("all");
    expect(parseRunsDashboardShowArchivedFromSearch("1")).toBe(true);
    expect(runsDashboardHomeHrefFromSearch("", { tab: "approved", showArchived: true })).toBe(
      "/?tab=approved&archived=1",
    );
    expect(runsDashboardHomeHrefFromSearch("tab=approved&archived=1", { showArchived: false })).toBe(
      "/?tab=approved",
    );
    expect(
      runsDashboardHomeHrefFromSearch("warnings=1&archived=1", { governanceWarningsOnly: false }),
    ).toBe("/?archived=1");
    expect(runsDashboardTabHrefFromSearch("warnings=1", "attention")).toBe("/?warnings=1&tab=attention");
    expect(
      resolveRunsDashboardOpenAllReviewsHref({
        projectId: "default",
        tab: "attention",
        showArchived: false,
        governanceWarningsOnly: false,
      }),
    ).toBe("/architecture/reviews?projectId=default&filter=needs-attention");
    expect(
      resolveRunsDashboardOpenAllReviewsHref({
        projectId: "default",
        tab: "all",
        showArchived: true,
        governanceWarningsOnly: false,
      }),
    ).toBe("/architecture/reviews?projectId=default&filter=Archived");
  });
});
