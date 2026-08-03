import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { GovernanceApprovalRequest } from "@/types/governance-workflow";
import { GOVERNANCE_WORKFLOW_OUTCOME_NO_REQUESTS } from "@/lib/governance-workflow-section-copy";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

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
    isBuyerPolishedOperatorShellEnv: (): boolean => false,
  };
});

vi.mock("@/lib/operator-static-demo", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/operator-static-demo")>();

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

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

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
