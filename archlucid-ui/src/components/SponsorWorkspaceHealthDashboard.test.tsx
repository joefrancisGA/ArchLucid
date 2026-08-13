import { screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  buyerPolishedShellVitestOverride,
  extendBuyerPolishedShellVitestMock,
} from "@/testing/buyer-polished-shell-vitest-override";
import { SPONSOR_DASHBOARD_HREF } from "@/lib/sponsor-dashboard-route";
import { renderWithOperatorQuery } from "@/testing/render-with-operator-query";
import { useOperatorQueryTestLifecycle } from "@/testing/operator-query-test-helpers";

const apiHoisted = vi.hoisted(() => ({
  getGovernanceDashboard: vi.fn(),
  getComplianceDriftTrend: vi.fn(),
  getGovernanceDecisionsNeededSummary: vi.fn(),
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) =>
  extendBuyerPolishedShellVitestMock(importOriginal),
);

vi.mock("next/navigation", () => ({
  usePathname: () => SPONSOR_DASHBOARD_HREF,
}));

vi.mock("@/components/operator/OperatorNavAuthorityProvider", () => ({
  useNavCallerAuthorityRank: () => 2,
  useNavCommittedArchitectureReview: () => false,
}));

vi.mock("@/lib/use-nav-surface", () => ({
  useNavSurface: () => ({
    links: [],
    mutationCapability: false,
    layerGuidance: {
      layerBadge: "Governance",
      headline: "Sponsor Workspace Health — governance and value signals in your current scope.",
      useWhen: "Use after Pilot proof when sponsors need pre-finalization outcomes.",
      firstPilotNote: null,
      enterpriseFootnote: "Read-only tiles; writes stay in workflow, findings queue, and audit.",
      omitReviewPackageScopeHelp: undefined,
    },
    contextHints: {
      enterpriseNavGroupHint: "",
      enterpriseExecutePageHint: null,
      layerHeaderEnterpriseRankCue: null,
      governanceResolutionRank: "",
      alertsInboxRank: "",
      auditLogRank: "",
      alertOperatorToolingRank: "",
      governanceDashboardReaderAction: null,
    },
    callerAuthorityRank: 2,
    showExtended: true,
    showAdvanced: true,
    mounted: true,
  }),
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button">Help</div>,
}));

vi.mock("@/components/governance/DataArchivalDegradedBanner", () => ({
  DataArchivalDegradedBanner: () => null,
}));

vi.mock("@/components/governance/GovernanceBypassAuditPanel", () => ({
  GovernanceBypassAuditPanel: () => null,
}));

vi.mock("@/components/ComplianceDriftChartPdfExport", () => ({
  ComplianceDriftChartPdfExport: () => <div data-testid="compliance-drift-chart-stub" />,
}));

vi.mock("@/lib/api", () => ({
  getGovernanceDashboard: apiHoisted.getGovernanceDashboard,
  getComplianceDriftTrend: apiHoisted.getComplianceDriftTrend,
}));

vi.mock("@/lib/api/policy-governance-api", () => ({
  getGovernanceDashboard: apiHoisted.getGovernanceDashboard,
}));

vi.mock("@/lib/api/governance-stickiness-api", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/api/governance-stickiness-api")>();

  return {
    ...mod,
    getGovernanceDecisionsNeededSummary: apiHoisted.getGovernanceDecisionsNeededSummary,
  };
});

vi.mock("@/lib/query/operator-query-persist-client", () => ({
  setupOperatorQueryClientPersistence: () => {},
}));

vi.mock("@/lib/workspace-health-audit-count", () => ({
  countAuditEventsInWindow: vi.fn(),
}));

vi.mock("@/lib/pilot-value-report-fetch", () => ({
  fetchPilotValueReportJson: vi.fn(),
}));

vi.mock("@/lib/operator/operator-scope-storage", () => ({
  getEffectiveBrowserProxyScopeHeaders: () => ({
    "x-tenant-id": "tenant-a",
    "x-workspace-id": "workspace-a",
    "x-project-id": "project-a",
  }),
  readOperatorScopeFromStorage: () => null,
}));

import { countAuditEventsInWindow } from "@/lib/workspace-health-audit-count";
import { fetchPilotValueReportJson } from "@/lib/pilot-value-report-fetch";
import { executiveWorkspaceHealthKpiTitle } from "@/lib/sponsor-workspace-health-page-copy";
import { SponsorWorkspaceHealthDashboard } from "@/components/SponsorWorkspaceHealthDashboard";

const stubPilotReport = {
  tenantId: "00000000-0000-0000-0000-000000000001",
  fromUtc: "2026-01-01T00:00:00.000Z",
  toUtc: "2026-06-01T00:00:00.000Z",
  totalRunsCommitted: 0,
  runDetailsTruncated: false,
  runDetailCap: 50,
  totalFindings: 0,
  findingsBySeverity: { critical: 1, high: 2, medium: 0, low: 0, info: 0 },
  totalRecommendationsProduced: 0,
  averagePipelineCompletionSeconds: null,
  governanceApprovals: 0,
  governanceRejections: 0,
  policyPackAssignments: 0,
  comparisonOrDriftDetections: 0,
  uniqueAgentTypes: [],
  committedRunsTimeline: [],
  governancePendingApprovalsNow: 0,
  auditExportTruncated: false,
};

describe("SponsorWorkspaceHealthDashboard", () => {
  useOperatorQueryTestLifecycle();

  beforeEach(() => {
    buyerPolishedShellVitestOverride.value = true;
    apiHoisted.getGovernanceDashboard.mockResolvedValue({
      pendingApprovals: [],
      recentDecisions: [],
      recentChanges: [],
      pendingCount: 0,
    });
    apiHoisted.getComplianceDriftTrend.mockResolvedValue([]);
    apiHoisted.getGovernanceDecisionsNeededSummary.mockResolvedValue({
      pendingApprovals: 0,
      staleRisks: 0,
      unownedHighSeverityRisks: 0,
      findingsAwaitingEvidence: 0,
      waiversExpiringWithin14Days: 0,
      deferredFindingsDue: 0,
      totalDecisionItems: 0,
    });
    vi.mocked(countAuditEventsInWindow).mockResolvedValue({ count: 0, exact: true });
    vi.mocked(fetchPilotValueReportJson).mockResolvedValue(stubPilotReport);
  });

  afterEach(() => {
    buyerPolishedShellVitestOverride.value = null;
    vi.clearAllMocks();
  });

  it("shows h1 on loading before data resolves", () => {
    renderWithOperatorQuery(<SponsorWorkspaceHealthDashboard />);

    expect(screen.getByRole("heading", { level: 1, name: "Workspace overview" })).toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.getByText("Loading workspace overview…")).toBeInTheDocument();
  });

  it("renders buyer KPI titles without numbered prefixes when ready", async () => {
    renderWithOperatorQuery(<SponsorWorkspaceHealthDashboard />);

    await waitFor(() => {
      expect(screen.getByTestId("compliance-drift-chart-stub")).toBeInTheDocument();
    });

    expect(
      screen.getByRole("heading", { level: 2, name: executiveWorkspaceHealthKpiTitle("preCommitOutcomes", true) }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /^1\./ })).toBeNull();
    expect(screen.queryByTestId("layer-header-collapsible-guidance")).toBeNull();
    expect(screen.getByTestId("sponsor-workspace-health-session-scope")).toBeInTheDocument();
  });
});
