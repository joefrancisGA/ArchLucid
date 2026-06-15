import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AUTHORITY_RANK } from "@/lib/nav-authority";
import type { ComplianceDriftTrendPoint } from "@/types/governance-dashboard";
import type { PilotValueReportJson } from "@/types/pilot-value-report";

import { ExecutiveScorecardClient } from "./ExecutiveScorecardClient";

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

describe("ExecutiveScorecardClient recommended actions", () => {
  it("shows drift recommendation first when drift activity is positive", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          orphanCandidates: { candidateCount: 0, annualSavingsUsd: 0 },
        }),
      } as Response),
    );
    const { fetchPilotValueReportJson } = await import("@/lib/pilot-value-report-fetch");
    const { getComplianceDriftTrend } = await import("@/lib/api");
    const { countAuditEventsInWindow } = await import("@/lib/workspace-health-audit-count");

    vi.mocked(fetchPilotValueReportJson).mockResolvedValue(mockPilotReport);
    vi.mocked(getComplianceDriftTrend).mockResolvedValue([
      { bucketUtc: "2026-03-01T00:00:00.000Z", changeCount: 4, changesByType: {} },
      { bucketUtc: "2026-04-01T00:00:00.000Z", changeCount: 2, changesByType: {} },
    ] satisfies ComplianceDriftTrendPoint[]);
    vi.mocked(countAuditEventsInWindow).mockResolvedValue({ count: 0, exact: true });

    render(<ExecutiveScorecardClient />);

    await waitFor(() => {
      expect(screen.getByTestId("executive-scorecard-recommended-actions")).toBeInTheDocument();
    });

    const actions = screen.getAllByRole("listitem");

    expect(actions[0]?.textContent).toMatch(/drifted policy changes/i);
    expect(screen.getByTestId("executive-scorecard-action-compliance-drift")).toHaveTextContent("Open in Operator →");
  });

  it("shows healthy message when no recommendations apply", async () => {
    const { fetchPilotValueReportJson } = await import("@/lib/pilot-value-report-fetch");
    const { getComplianceDriftTrend } = await import("@/lib/api");
    const { countAuditEventsInWindow } = await import("@/lib/workspace-health-audit-count");

    vi.mocked(fetchPilotValueReportJson).mockResolvedValue(mockPilotReport);
    vi.mocked(getComplianceDriftTrend).mockResolvedValue([]);
    vi.mocked(countAuditEventsInWindow).mockResolvedValue({ count: 0, exact: true });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ orphanCandidates: { candidateCount: 0, annualSavingsUsd: 0 } }),
      } as Response),
    );

    render(<ExecutiveScorecardClient />);

    await waitFor(() => {
      expect(screen.getByText(/No actions needed — all signals are healthy/i)).toBeInTheDocument();
    });
  });
});
