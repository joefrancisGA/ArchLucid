import { describe, expect, it } from "vitest";

import {
  homeGovernanceWarningsQueryEnabled,
  resolveRunsDashboardStatusTabIds,
} from "@/components/operator-home/runs-dashboard-panel-presentation";
import { deriveRunsDashboardTabCounts } from "@/components/operator-home/runs-dashboard-helpers";

describe("use-runs-dashboard-tabs helpers", () => {
  it("homeGovernanceWarningsQueryEnabled reads governanceWarnings query flag", () => {
    expect(homeGovernanceWarningsQueryEnabled(new URLSearchParams("warnings=1"))).toBe(true);
    expect(homeGovernanceWarningsQueryEnabled(new URLSearchParams())).toBe(false);
  });

  it("resolveRunsDashboardStatusTabIds hides empty tabs in buyer-polished shell", () => {
    const counts = deriveRunsDashboardTabCounts([]);

    expect(resolveRunsDashboardStatusTabIds(true, counts)).toEqual(["all"]);
    expect(resolveRunsDashboardStatusTabIds(false, counts)).toEqual(["all", "attention", "outcomes"]);
  });
});
