import { describe, expect, it } from "vitest";

import {
  executiveWorkspaceHealthKpiTitle,
  executiveWorkspaceHealthPageLead,
  executiveWorkspaceHealthPageTitle,
} from "@/lib/sponsor/sponsor-workspace-health-page-copy";

describe("sponsor-workspace-health-page-copy", () => {
  it("uses buyer-facing titles without numbered KPI prefixes", () => {
    expect(executiveWorkspaceHealthPageTitle(true)).toBe("Workspace overview");
    expect(executiveWorkspaceHealthPageLead(true)).toContain("Governance posture at a glance");
    expect(executiveWorkspaceHealthKpiTitle("preCommitOutcomes", true)).toBe("Approval gate outcomes (30 days)");
    expect(executiveWorkspaceHealthKpiTitle("highCriticalExposure", true)).toBe("High / Critical exposure (90 days)");
    expect(executiveWorkspaceHealthKpiTitle("complianceDrift", true)).not.toMatch(/^\d+\./);
  });

  it("keeps numbered KPI prefixes for the full operator shell", () => {
    expect(executiveWorkspaceHealthPageTitle(false)).toBe("Sponsor Workspace Health");
    expect(executiveWorkspaceHealthKpiTitle("preCommitOutcomes", false)).toBe("1. Pre-commit outcomes (30 days)");
    expect(executiveWorkspaceHealthKpiTitle("valueProxy", false)).toBe("5. Pre-commit blocks as value proxy");
  });
});
