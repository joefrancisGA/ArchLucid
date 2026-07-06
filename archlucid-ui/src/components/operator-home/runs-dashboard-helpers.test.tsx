import { describe, expect, it } from "vitest";

import { runsDashboardTabLabel } from "@/components/operator-home/runs-dashboard-helpers";

describe("runsDashboardTabLabel (TB-667)", () => {
  it("uses operator vocabulary in full-operator shell", () => {
    expect(runsDashboardTabLabel("recent", false)).toBe("Recent");
    expect(runsDashboardTabLabel("attention", false)).toBe("Needs attention");
    expect(runsDashboardTabLabel("outcomes", false)).toBe("Outcomes");
  });

  it("uses buyer-polished vocabulary in buyer shell", () => {
    expect(runsDashboardTabLabel("recent", true)).toBe("Approved");
    expect(runsDashboardTabLabel("attention", true)).toBe("Action needed");
    expect(runsDashboardTabLabel("outcomes", true)).toBe("Approved with monitoring");
  });
});
