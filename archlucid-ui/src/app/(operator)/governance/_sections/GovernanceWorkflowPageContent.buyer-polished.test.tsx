import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GOVERNANCE_OVERVIEW_PAGE_LEAD, BUYER_GOVERNANCE_OVERVIEW_PAGE_LEAD } from "@/lib/governance/governance-overview-copy";
import { GOVERNANCE_WORKSPACE_HEALTH_HREF } from "@/lib/governance/governance-route-paths";
import { renderWithOperatorQuery } from "@/testing/render-with-operator-query";
import { useOperatorQueryTestLifecycle } from "@/testing/operator-query-test-helpers";

const apiHoisted = vi.hoisted(() => ({
  listApprovalRequests: vi.fn(),
  listPromotions: vi.fn(),
  listActivations: vi.fn(),
  getGovernanceDashboard: vi.fn(),
  getGovernanceDecisionsNeededSummary: vi.fn(),
  listRunsByProjectPaged: vi.fn(),
}));

vi.mock("@/hooks/use-operate-capability", () => ({
  useOperateCapability: (): boolean => false,
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...mod,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
  };
});

vi.mock("@/lib/operator/operator-static-demo", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/operator/operator-static-demo")>();

  return {
    ...mod,
    isStaticDemoPayloadFallbackEnabled: (): boolean => false,
    shouldSeedStaticDemoGovernanceRecordsForRun: (): boolean => false,
  };
});

vi.mock("next/navigation", () => ({
  usePathname: (): string => "/governance/approval-queue",
  useRouter: (): { push: () => void; replace: () => void } => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: (): URLSearchParams => new URLSearchParams(),
}));

vi.mock("@/lib/api", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/api")>();

  return {
    ...mod,
    listApprovalRequests: apiHoisted.listApprovalRequests,
    listPromotions: apiHoisted.listPromotions,
    listActivations: apiHoisted.listActivations,
    getGovernanceDashboard: apiHoisted.getGovernanceDashboard,
    getGovernanceDecisionsNeededSummary: apiHoisted.getGovernanceDecisionsNeededSummary,
    listRunsByProjectPaged: apiHoisted.listRunsByProjectPaged,
  };
});

vi.mock("@/lib/api/policy-governance-api", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/api/policy-governance-api")>();

  return {
    ...mod,
    listApprovalRequests: apiHoisted.listApprovalRequests,
    listPromotions: apiHoisted.listPromotions,
    listActivations: apiHoisted.listActivations,
    getGovernanceDashboard: apiHoisted.getGovernanceDashboard,
    fetchGovernanceEnvironmentCatalog: vi.fn().mockResolvedValue({
      isAdministratorConfigured: false,
      environments: [],
    }),
  };
});

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

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

vi.mock("./governance-workflow-deferred-chunks", async () => {
  const contextBar = await import("./GovernanceReviewContextBar");
  const overview = await import("./GovernanceOverviewPanel");
  const submit = await import("./GovernanceWorkflowSubmitSection");
  const approvals = await import("./GovernanceWorkflowApprovalsList");
  const promotions = await import("./GovernanceWorkflowPromotionsActivationsSection");
  const dialogs = await import("./GovernanceWorkflowDialogs");
  const buyerStrip = await import("@/components/cto-demo/CtoDemoBuyerValueStrip");
  const segregation = await import("@/components/cto-demo/CtoDemoSegregationCallout");
  const previewHint = await import("@/components/OperateCapabilityHints");
  const storyCard = await import("@/components/governance/GovernanceApprovalStoryCard");
  const advancedOptions = await import("@/components/AdvancedOptionsAccordion");

  return {
    GovernanceOverviewPanelDeferred: overview.GovernanceOverviewPanel,
    GovernanceReviewContextBarDeferred: contextBar.GovernanceReviewContextBar,
    GovernanceWorkflowSubmitSectionDeferred: submit.GovernanceWorkflowSubmitSection,
    GovernanceWorkflowApprovalsListDeferred: approvals.GovernanceWorkflowApprovalsList,
    GovernanceWorkflowPromotionsActivationsSectionDeferred:
      promotions.GovernanceWorkflowPromotionsActivationsSection,
    GovernanceWorkflowDialogsDeferred: dialogs.GovernanceWorkflowDialogs,
    CtoDemoBuyerValueStripDeferred: buyerStrip.CtoDemoBuyerValueStrip,
    CtoDemoSegregationCalloutDeferred: segregation.CtoDemoSegregationCallout,
    CtoDemoGovernancePreviewHintDeferred: previewHint.CtoDemoGovernancePreviewHint,
    GovernanceApprovalStoryCardDeferred: storyCard.GovernanceApprovalStoryCard,
    AdvancedOptionsAccordionDeferred: advancedOptions.AdvancedOptionsAccordion,
  };
});

vi.mock("@/lib/use-nav-surface", () => ({
  useNavSurface: () => ({
    links: [],
    mutationCapability: false,
    layerGuidance: {
      layerBadge: "Approval",
      headline: "Submit finalized architecture outputs for approval review and promotion.",
      useWhen: "Pick one review and move from submission through approval.",
      firstPilotNote: null,
      enterpriseFootnote: "Approvals follow the configured approval path.",
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

import { buyerPolishedRouteOrientation } from "@/lib/buyer/buyer-polished-route-orientation";

import { GovernanceWorkflowPageContent } from "./GovernanceWorkflowPageContent";

describe("GovernanceWorkflowPageContent buyer-polished chrome (TB-1434)", () => {
  useOperatorQueryTestLifecycle();

  beforeEach(() => {
    apiHoisted.listApprovalRequests.mockResolvedValue([]);
    apiHoisted.listPromotions.mockResolvedValue([]);
    apiHoisted.listActivations.mockResolvedValue([]);
    apiHoisted.getGovernanceDashboard.mockResolvedValue({
      pendingApprovals: [
        {
          approvalRequestId: "pending-1",
          runId: "run-pending",
          manifestVersion: "1.0.0",
          status: "Submitted",
          sourceEnvironment: "dev",
          targetEnvironment: "prod",
          requestedBy: "owner",
          requestedUtc: "2026-01-01T00:00:00Z",
        },
      ],
      recentDecisions: [],
      recentChanges: [],
      pendingCount: 1,
    });
    apiHoisted.getGovernanceDecisionsNeededSummary.mockResolvedValue({
      pendingApprovals: 1,
      staleRisks: 0,
      unownedHighSeverityRisks: 0,
      findingsAwaitingEvidence: 0,
      waiversExpiringWithin14Days: 0,
      deferredFindingsDue: 0,
      totalDecisionItems: 0,
    });
    apiHoisted.listRunsByProjectPaged.mockResolvedValue({
      items: [],
      totalCount: 0,
      page: 1,
      pageSize: 50,
      hasMore: false,
    });
  });

  it("keeps one overview lead on OperatorPageHeader — strip orientation is null (TB-1434)", async () => {
    expect(buyerPolishedRouteOrientation("/governance/approval-queue")).toBeNull();

    renderWithOperatorQuery(<GovernanceWorkflowPageContent />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 2, name: "Approval queue" })).toBeInTheDocument();
    });

    expect(screen.getByTestId("governance-overview-page-title")).toBeInTheDocument();

    expect(screen.getAllByText(BUYER_GOVERNANCE_OVERVIEW_PAGE_LEAD)).toHaveLength(1);
    expect(screen.queryByText(GOVERNANCE_OVERVIEW_PAGE_LEAD)).not.toBeInTheDocument();
    expect(screen.queryByTestId("layer-context-strip")).not.toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Workspace health" })).toHaveAttribute(
      "href",
      GOVERNANCE_WORKSPACE_HEALTH_HREF,
    );
    expect(screen.getByTestId("layer-header-collapsible-guidance")).toBeInTheDocument();
    expect(screen.getByTestId("approval-queue-sources")).toBeInTheDocument();
    expect(screen.queryByTestId("governance-interactive-quickstart")).not.toBeInTheDocument();
    expect(screen.queryAllByText("How approval works")).toHaveLength(1);
    expect(screen.queryByTestId("governance-sample-overview-banner")).not.toBeInTheDocument();
    expect(screen.queryByTestId("inline-guidance-governance-overview-next")).not.toBeInTheDocument();
    expect(screen.queryByTestId("governance-overview-submit-action")).not.toBeInTheDocument();
  });
});
