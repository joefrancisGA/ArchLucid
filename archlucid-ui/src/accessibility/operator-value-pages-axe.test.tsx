import { render } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/insights/executive-summary",
  useSearchParams: () => ({
    get: () => null,
    toString: () => "",
  }),
  redirect: vi.fn(),
  permanentRedirect: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  apiGet: vi.fn().mockResolvedValue([]),
  downloadValueReportDocx: vi.fn(),
  downloadBoardPackPdf: vi.fn(),
  listAdvisorySchedules: vi.fn().mockResolvedValue([]),
  getAdvisoryScheduleDetail: vi.fn().mockResolvedValue(null),
  listAdvisoryExecutions: vi.fn().mockResolvedValue([]),
  createAdvisorySchedule: vi.fn(),
  updateAdvisorySchedule: vi.fn(),
  deleteAdvisorySchedule: vi.fn(),
  listDigests: vi.fn().mockResolvedValue([]),
  getDigestDetail: vi.fn().mockResolvedValue(null),
  listDigestSubscriptions: vi.fn().mockResolvedValue([]),
  createDigestSubscription: vi.fn(),
  updateDigestSubscription: vi.fn(),
  deleteDigestSubscription: vi.fn(),
  listPlanningPlans: vi.fn().mockResolvedValue([]),
  createPlanningPlan: vi.fn(),
  getPlanningPlanDetail: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/lib/pilot-value-report-fetch", () => ({
  getTenantPilotValueReportJson: vi.fn().mockResolvedValue({
    tenantId: "tenant-1",
    fromUtc: "2026-01-01T00:00:00.000Z",
    toUtc: "2026-02-01T00:00:00.000Z",
    totalRunsCommitted: 2,
    runDetailsTruncated: false,
    runDetailCap: 50,
    totalFindings: 8,
    findingsBySeverity: { critical: 0, high: 1, medium: 2, low: 3, info: 2 },
    totalRecommendationsProduced: 4,
    averagePipelineCompletionSeconds: 90,
    governanceApprovals: 2,
    governanceRejections: 0,
    policyPackAssignments: 1,
    comparisonOrDriftDetections: 0,
    uniqueAgentTypes: [],
    committedRunsTimeline: [],
    governancePendingApprovalsNow: 1,
    auditExportTruncated: false,
  }),
  fetchPilotValueReportJson: vi.fn(),
  buildPilotValueReportQuery: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

vi.mock("@/hooks/use-operate-capability", () => ({
  useOperateCapability: () => false,
}));

// LayerHeader reads layerGuidance + contextHints.layerHeaderEnterpriseRankCue; stub the full shape.
vi.mock("@/lib/use-nav-surface", () => ({
  useNavSurface: () => ({
    links: [],
    mutationCapability: false,
    layerGuidance: {
      layerBadge: "Pilot",
      headline: "Stub headline",
      useWhen: "For accessibility tests.",
      firstPilotNote: null,
      enterpriseFootnote: null,
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
    callerAuthorityRank: 0,
    showExtended: true,
    showAdvanced: true,
    mounted: true,
  }),
}));

vi.mock("@/hooks/useViewportNarrow", () => ({
  useViewportNarrow: () => false,
}));

vi.mock("@/lib/current-principal", () => ({
  buildAuthMeProxyRequestInit: vi.fn().mockReturnValue({}),
}));

vi.mock("@/lib/scope-defaults", () => ({
  DEFAULT_DEV_TENANT_ID: "00000000-0000-0000-0000-000000000000",
}));

vi.mock("@/components/operator/OperatorNavAuthorityProvider", () => ({
  useNavCallerAuthorityRank: () => "admin",
  useOperatorNavAuthority: () => ({
    rank: "admin",
    isLoading: false,
    refresh: vi.fn(),
  }),
}));

vi.mock("@/components/advisory/AdvisoryHubClient", () => ({
  AdvisoryHubClient: () => <div data-testid="stub-advisory-hub">Advisory Hub</div>,
}));

/** RSC advisory-scans page is async; Vitest client render needs a sync stub. */
vi.mock("@/app/(operator)/governance/advisory-scans/page", () => ({
  __esModule: true,
  default: function AdvisoryScansPageStub() {
    return <div data-testid="stub-advisory-page">Advisory</div>;
  },
}));

vi.mock("@/components/digests/DigestsHubClient", () => ({
  DigestsHubClient: () => <div data-testid="stub-digests-hub">Digests</div>,
}));

vi.mock("@/components/planning/PlanningHubClient", () => ({
  PlanningHubClient: () => <div data-testid="stub-planning-hub">Planning</div>,
}));

vi.mock("@/app/(operator)/insights/improvement-planning/_sections/load-planning-page-data", () => {
  const summary = {
    generatedUtc: "2026-01-01T00:00:00.000Z",
    themeCount: 0,
    planCount: 0,
    totalThemeEvidenceSignals: 0,
    maxPlanPriorityScore: 0,
    totalLinkedSignalsAcrossPlans: 0,
  };

  return {
    loadPlanningPageData: () =>
      Promise.resolve({
        kind: "data" as const,
        summary,
        themes: [],
        plans: [],
        generatedUtc: summary.generatedUtc,
        usedPlanningDemoFallback: false,
        failure: null,
      }),
  };
});

vi.mock("@/app/(operator)/insights/executive-summary/_sections/load-value-report-page-data", () => ({
  loadValueReportPageData: () =>
    Promise.resolve({
      initialFromUtc: "2026-01-01T00:00",
      initialToUtc: "2026-02-01T00:00",
      preview: {
        tenantId: "tenant-1",
        fromUtc: "2026-01-01T00:00:00.000Z",
        toUtc: "2026-02-01T00:00:00.000Z",
        totalRunsCommitted: 2,
        runDetailsTruncated: false,
        runDetailCap: 50,
        totalFindings: 8,
        findingsBySeverity: { critical: 0, high: 1, medium: 2, low: 3, info: 2 },
        totalRecommendationsProduced: 4,
        averagePipelineCompletionSeconds: 90,
        governanceApprovals: 2,
        governanceRejections: 0,
        policyPackAssignments: 1,
        comparisonOrDriftDetections: 0,
        uniqueAgentTypes: [],
        committedRunsTimeline: [],
        governancePendingApprovalsNow: 1,
        auditExportTruncated: false,
      },
    }),
}));

import SponsorReportExecutiveSummaryPage from "@/app/(operator)/insights/executive-summary/page";
import AdvisoryScansPage from "@/app/(operator)/governance/advisory-scans/page";
import DigestsPage from "@/app/(operator)/architecture/digests/page";
import PlanningPage from "@/app/(operator)/insights/improvement-planning/page";

expect.extend(toHaveNoViolations);

describe("operator value + advisory pages — axe (Vitest)", () => {
  it(
    "SponsorReportExecutiveSummaryPage has no serious axe violations",
    async () => {
      const page = await SponsorReportExecutiveSummaryPage();
      const { container } = render(page);

      expect(await axe(container)).toHaveNoViolations();
    },
    20_000,
  );

  it(
    "AdvisoryScansPage has no serious axe violations",
    async () => {
      const { container } = render(<AdvisoryScansPage />);

      expect(await axe(container)).toHaveNoViolations();
    },
    20_000,
  );

  it(
    "DigestsPage has no serious axe violations",
    async () => {
      const { container } = render(<DigestsPage />);

      expect(await axe(container)).toHaveNoViolations();
    },
    20_000,
  );

  it(
    "PlanningPage has no serious axe violations",
    async () => {
      const page = await PlanningPage();
      const { container } = render(page);

      expect(await axe(container)).toHaveNoViolations();
    },
    20_000,
  );
});
