import { describe, expect, it } from "vitest";

import {
  ArchitecturePackageOriginBadge,
  ArchitecturePackageOriginMetadataLine,
  deriveRunsDashboardTabCounts,
  formatRunsDashboardTabLabelWithCount,
  isRunApprovedPackage,
  isRunApprovedWithMonitoringPackage,
  isRunNeedingAttention,
  resolveRunHomeStatusTag,
  resolveShowcaseDemoRunForItems,
  runsDashboardTabLabel,
} from "@/components/operator-home/runs-dashboard-helpers";
import { render, screen } from "@testing-library/react";
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

  it("appends counts when provided", () => {
    expect(runsDashboardTabLabel("all", true, 7)).toBe("All (7)");
    expect(runsDashboardTabLabel("approved", true, 0)).toBe("Approved (0)");
    expect(formatRunsDashboardTabLabelWithCount("Monitoring", 2)).toBe("Monitoring (2)");
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
    expect(isRunApprovedWithMonitoringPackage(monitoredRun)).toBe(true);
    expect(isRunApprovedWithMonitoringPackage(approvedRun)).toBe(false);
    expect(isRunNeedingAttention(attentionRun)).toBe(true);
  });

  it("derives tab counts from run summary flags", () => {
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

    expect(deriveRunsDashboardTabCounts([approvedRun, monitoredRun, attentionRun])).toEqual({
      all: 3,
      approved: 1,
      attention: 1,
      outcomes: 1,
    });
  });

  it("maps review rows to canonical status tags", () => {
    expect(
      resolveRunHomeStatusTag({
        runId: "attention",
        projectId: "default",
        hasFindingsSnapshot: true,
        hasGoldenManifest: false,
      }).kind,
    ).toBe("needs-attention");

    expect(
      resolveRunHomeStatusTag({
        runId: "approved",
        projectId: "default",
        hasGoldenManifest: true,
        hasGovernanceWarnings: false,
      }).kind,
    ).toBe("approved");
  });

  it("resolves showcase demo only when that run is in the active filter set", () => {
    const showcase: RunSummary = {
      runId: "customer-intake-modernization",
      projectId: "default",
      hasGoldenManifest: true,
      hasGovernanceWarnings: true,
    };
    const other: RunSummary = {
      runId: "other-run",
      projectId: "default",
      hasGoldenManifest: true,
    };

    expect(resolveShowcaseDemoRunForItems([showcase, other], showcase)?.runId).toBe(showcase.runId);
    expect(resolveShowcaseDemoRunForItems([other], showcase)).toBeUndefined();
    expect(resolveShowcaseDemoRunForItems([showcase], undefined)).toBeUndefined();
  });
});

describe("ArchitecturePackageOriginBadge (TB-740)", () => {
  it("renders Created badge in buyer-polished shell only", () => {
    const run: RunSummary = {
      runId: "created-run",
      projectId: "default",
      packageOrigin: "Created",
    };

    const { rerender } = render(<ArchitecturePackageOriginBadge run={run} buyerPolishedShell />);

    expect(screen.getByTestId("architecture-package-origin-created")).toHaveTextContent("Created");

    rerender(<ArchitecturePackageOriginBadge run={run} buyerPolishedShell={false} />);

    expect(screen.queryByTestId("architecture-package-origin-created")).toBeNull();
  });
});

describe("ArchitecturePackageOriginMetadataLine", () => {
  it("names the origin axis so Reviewed cannot read as a governance verdict", () => {
    const run: RunSummary = {
      runId: "reviewed-run",
      projectId: "default",
      packageOrigin: "Reviewed",
    };

    render(<ArchitecturePackageOriginMetadataLine run={run} buyerPolishedShell />);

    expect(screen.getByTestId("architecture-package-origin-reviewed").textContent).toMatch(
      /Package origin:\s*Reviewed/,
    );
  });

  it("stays hidden outside the buyer-polished shell", () => {
    const run: RunSummary = {
      runId: "reviewed-run",
      projectId: "default",
      packageOrigin: "Reviewed",
    };

    render(<ArchitecturePackageOriginMetadataLine run={run} buyerPolishedShell={false} />);

    expect(screen.queryByTestId("architecture-package-origin-reviewed")).toBeNull();
  });
});
