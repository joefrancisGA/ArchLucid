import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { GovernanceApprovalRequest } from "@/types/governance-workflow";
import { GOVERNANCE_WORKFLOW_OUTCOME_NO_REQUESTS } from "@/lib/governance/governance-workflow-section-copy";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

const apiHoisted = vi.hoisted(() => ({
  listApprovalRequests: vi.fn(),
  listPromotions: vi.fn(),
  listActivations: vi.fn(),
  getGovernanceDashboard: vi.fn(),
  getGovernanceDecisionsNeededSummary: vi.fn(),
  listRunsByProjectPaged: vi.fn(),
  getRunSummary: vi.fn(),
  getRunDetail: vi.fn(),
}));

vi.mock("@/hooks/use-operate-capability", () => ({
  useOperateCapability: (): boolean => false,
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...mod,
    isBuyerPolishedOperatorShellEnv: (): boolean => false,
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
    getRunSummary: apiHoisted.getRunSummary,
    getRunDetail: apiHoisted.getRunDetail,
  };
});

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={typeof href === "string" ? href : "#"} {...rest}>
      {children}
    </a>
  ),
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
  const quickstart = await import("@/components/governance/GovernanceInteractiveQuickstartContent");
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
    GovernanceInteractiveQuickstartContentDeferred: quickstart.GovernanceInteractiveQuickstartContent,
    GovernanceApprovalStoryCardDeferred: storyCard.GovernanceApprovalStoryCard,
    AdvancedOptionsAccordionDeferred: advancedOptions.AdvancedOptionsAccordion,
  };
});

import { GovernanceWorkflowPageContent } from "./GovernanceWorkflowPageContent";

const approvedRequest: GovernanceApprovalRequest = {
  approvalRequestId: "claims-intake-approval-001",
  runId: SHOWCASE_STATIC_DEMO_RUN_ID,
  manifestVersion: "3.4.1",
  sourceEnvironment: "dev",
  targetEnvironment: "test",
  status: "Approved",
  requestedBy: "Taylor Morgan",
  reviewedBy: "Jordan Lee",
  requestComment: "Request governed use of the finalized intake review after privacy review.",
  reviewComment: "Approved — maintain weekly monitoring on unstructured attachment volume.",
  requestedUtc: "2026-01-14T21:00:00.000Z",
  reviewedUtc: "2026-01-14T22:05:00.000Z",
};

describe("GovernanceWorkflowPageContent approval state", () => {
  beforeEach(() => {
    apiHoisted.listApprovalRequests.mockResolvedValue([]);
    apiHoisted.listPromotions.mockResolvedValue([]);
    apiHoisted.listActivations.mockResolvedValue([]);
    apiHoisted.getGovernanceDashboard.mockResolvedValue({
      pendingApprovals: [],
      recentDecisions: [],
      recentChanges: [],
      pendingCount: 0,
    });
    apiHoisted.getGovernanceDecisionsNeededSummary.mockResolvedValue({
      pendingApprovals: 0,
      staleRisks: 0,
      unownedHighSeverityRisks: 0,
      findingsAwaitingEvidence: 0,
      waiversExpiringWithin14Days: 0,
      deferredFindingsDue: 0,
      totalDecisionItems: 0,
    });
    apiHoisted.listRunsByProjectPaged.mockResolvedValue({
      items: [{ runId: "gov-ui-shape-run", projectId: "default", description: "UI shape fixture", createdUtc: "" }],
      totalCount: 1,
      page: 1,
      pageSize: 50,
      hasMore: false,
    });
    apiHoisted.getRunSummary.mockResolvedValue({
      runId: "gov-ui-shape-run",
      projectId: "default",
      createdUtc: "",
      displayName: "",
      description: "",
    });
    apiHoisted.getRunDetail.mockResolvedValue({ data: { run: { currentManifestVersion: "" } } });
  });

  it("renders the governance job router triad with Approval queue current (TB-2230)", async () => {
    render(<GovernanceWorkflowPageContent />);

    const strip = await screen.findByTestId("governance-job-router");
    expect(strip).toHaveAttribute("data-current-job", "approve-governance");
    expect(screen.getByTestId("governance-job-router-option-approve-governance")).toHaveAttribute(
      "data-current",
      "true",
    );
    expect(screen.getByTestId("governance-job-router-option-triage-findings")).toHaveAttribute(
      "href",
      "/governance/findings",
    );
    expect(screen.getByTestId("governance-job-router-option-record-decisions")).toHaveAttribute(
      "href",
      "/governance/decision-register",
    );
  });

  it("shows no-request guidance without completion messaging when a review has no approval history", async () => {
    render(<GovernanceWorkflowPageContent />);

    fireEvent.change(screen.getByLabelText("Review"), { target: { value: "gov-ui-shape-run" } });
    fireEvent.click(screen.getByTestId("governance-overview-load-review"));

    await waitFor(() => {
      expect(screen.getByTestId("governance-review-context-bar")).toBeInTheDocument();
    });

    expect(screen.getByText("No approval requests for this review")).toBeInTheDocument();
    expect(screen.getByTestId("governance-workflow-outcome-banner")).toHaveTextContent(
      GOVERNANCE_WORKFLOW_OUTCOME_NO_REQUESTS,
    );
    expect(screen.queryByTestId("governance-buyer-approval-record-lead")).not.toBeInTheDocument();
    expect(screen.queryByText(/approval path complete/i)).not.toBeInTheDocument();
  });

  it("shows supporting approval request history when an approved request exists", async () => {
    apiHoisted.listApprovalRequests.mockResolvedValue([approvedRequest]);
    render(<GovernanceWorkflowPageContent />);

    fireEvent.change(screen.getByLabelText("Review"), { target: { value: SHOWCASE_STATIC_DEMO_RUN_ID } });
    fireEvent.click(screen.getByTestId("governance-overview-load-review"));

    await waitFor(() => {
      expect(screen.getByTestId("governance-approval-requests-section")).toBeInTheDocument();
    });

    expect(screen.queryByText("No approval requests for this review")).not.toBeInTheDocument();
    expect(screen.queryByTestId("governance-workflow-outcome-banner")).not.toBeInTheDocument();
    expect(screen.getByText(/Taylor Morgan/i)).toBeInTheDocument();
    expect(screen.getByText(/Jordan Lee/i)).toBeInTheDocument();
  });
});
