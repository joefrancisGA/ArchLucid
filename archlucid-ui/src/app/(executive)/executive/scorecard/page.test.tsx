import { render, waitFor } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { describe, expect, it, vi } from "vitest";

import { AUTHORITY_RANK } from "@/lib/nav-authority";
import type { ComplianceDriftTrendPoint } from "@/types/governance-dashboard";
import type { PilotValueReportJson } from "@/types/pilot-value-report";

import { ExecutiveScorecardClient } from "./ExecutiveScorecardClient";

expect.extend(toHaveNoViolations);

const mockPilotReport: PilotValueReportJson = {
  tenantId: "00000000-0000-0000-0000-000000000001",
  fromUtc: "2026-01-01T00:00:00.000Z",
  toUtc: "2026-05-10T12:00:00.000Z",
  totalRunsCommitted: 4,
  runDetailsTruncated: false,
  runDetailCap: 50,
  totalFindings: 42,
  findingsBySeverity: {
    critical: 1,
    high: 2,
    medium: 5,
    low: 3,
    info: 0,
  },
  totalRecommendationsProduced: 10,
  averagePipelineCompletionSeconds: 120,
  governanceApprovals: 2,
  governanceRejections: 0,
  policyPackAssignments: 1,
  comparisonOrDriftDetections: 0,
  uniqueAgentTypes: ["Topology"],
  committedRunsTimeline: [],
  governancePendingApprovalsNow: 0,
  auditExportTruncated: false,
};

const mockDrift: ComplianceDriftTrendPoint[] = [
  { bucketUtc: "2026-03-01T00:00:00.000Z", changeCount: 4, changesByType: {} },
  { bucketUtc: "2026-04-01T00:00:00.000Z", changeCount: 2, changesByType: {} },
  { bucketUtc: "2026-05-01T00:00:00.000Z", changeCount: 1, changesByType: {} },
];

vi.mock("@/components/OperatorNavAuthorityProvider", () => ({
  useOperatorNavAuthority: () => ({
    callerAuthorityRank: AUTHORITY_RANK.ReadAuthority,
    isAuthorityLoading: false,
    currentPrincipal: {
      provenance: "synthetic",
      syntheticReason: undefined,
      name: null,
      roleClaimValues: [],
      primaryAppRole: null,
      maxAuthority: "ReadAuthority",
      authorityRank: AUTHORITY_RANK.ReadAuthority,
      hasEnterpriseOperatorSurfaces: false,
      hasCommittedArchitectureReview: true,
      permissionClaimValues: [],
    },
  }),
  useNavCallerAuthorityRank: () => AUTHORITY_RANK.ReadAuthority,
}));

vi.mock("@/lib/pilot-value-report-fetch", () => ({
  fetchPilotValueReportJson: vi.fn(),
  getTenantPilotValueReportJson: vi.fn(),
}));

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();

  return {
    ...actual,
    getComplianceDriftTrend: vi.fn(),
  };
});

vi.mock("@/lib/workspace-health-audit-count", () => ({
  countAuditEventsInWindow: vi.fn(),
}));

describe("ExecutiveScorecardClient", () => {
  it("matches snapshot when data loads", async () => {
    const { fetchPilotValueReportJson } = await import("@/lib/pilot-value-report-fetch");
    const { getComplianceDriftTrend } = await import("@/lib/api");
    const { countAuditEventsInWindow } = await import("@/lib/workspace-health-audit-count");

    vi.mocked(fetchPilotValueReportJson).mockResolvedValue(mockPilotReport);
    vi.mocked(getComplianceDriftTrend).mockResolvedValue(mockDrift);
    vi.mocked(countAuditEventsInWindow).mockResolvedValue({ count: 1, exact: true });

    const { container } = render(<ExecutiveScorecardClient />);

    await waitFor(() => {
      expect(container.querySelector('[data-testid="executive-scorecard"]')).toBeTruthy();
      expect(container.textContent).toContain("Architecture reviews completed");
    });

    expect(container.firstChild).toMatchSnapshot();
  });

  it("has no serious axe violations when ready", async () => {
    const { fetchPilotValueReportJson } = await import("@/lib/pilot-value-report-fetch");
    const { getComplianceDriftTrend } = await import("@/lib/api");
    const { countAuditEventsInWindow } = await import("@/lib/workspace-health-audit-count");

    vi.mocked(fetchPilotValueReportJson).mockResolvedValue(mockPilotReport);
    vi.mocked(getComplianceDriftTrend).mockResolvedValue(mockDrift);
    vi.mocked(countAuditEventsInWindow).mockResolvedValue({ count: 0, exact: true });

    const { container } = render(<ExecutiveScorecardClient />);

    await waitFor(() => {
      expect(container.textContent).toContain("Estimated hours saved");
    });

    expect(await axe(container)).toHaveNoViolations();
  });
});
