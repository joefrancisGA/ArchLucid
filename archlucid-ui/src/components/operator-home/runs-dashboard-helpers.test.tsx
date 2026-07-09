import { describe, expect, it } from "vitest";

import { isRunApprovedPackage, isRunNeedingAttention, runsDashboardTabLabel } from "@/components/operator-home/runs-dashboard-helpers";
import type { RunSummary } from "@/types/authority";

describe("runsDashboardTabLabel (TB-667)", () => {
  it("uses operator vocabulary in full-operator shell", () => {
    expect(runsDashboardTabLabel("all", false)).toBe("Recent");
    expect(runsDashboardTabLabel("attention", false)).toBe("Needs attention");
    expect(runsDashboardTabLabel("outcomes", false)).toBe("Outcomes");
  });

  it("uses buyer-polished vocabulary in buyer shell", () => {
    expect(runsDashboardTabLabel("all", true)).toBe("All");
    expect(runsDashboardTabLabel("approved", true)).toBe("Approved");
    expect(runsDashboardTabLabel("attention", true)).toBe("Action needed");
    expect(runsDashboardTabLabel("outcomes", true)).toBe("Approved with monitoring");
  });
});

describe("runs dashboard status filters", () => {
  it("maps approved and attention filters from run summary flags", () => {
    const approvedRun: RunSummary = {
      runId: "approved-run",
      projectId: "default",
      hasGoldenManifest: true,
      hasGovernanceWarnings: false,
    };

    const monitoredRun: RunSummary = {
      runId: "monitored-run",
      projectId: "default",
      hasGoldenManifest: true,
      hasGovernanceWarnings: true,
    };

    const attentionRun: RunSummary = {
      runId: "attention-run",
      projectId: "default",
      hasFindingsSnapshot: true,
      hasGoldenManifest: false,
    };

    expect(isRunApprovedPackage(approvedRun)).toBe(true);
    expect(isRunApprovedPackage(monitoredRun)).toBe(false);
    expect(isRunNeedingAttention(attentionRun)).toBe(true);
  });
});
