import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GOVERNANCE_OVERVIEW_PAGE_LEAD } from "@/lib/governance-overview-copy";

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

vi.mock("@/lib/operator-static-demo", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/operator-static-demo")>();

  return {
    ...mod,
    isStaticDemoPayloadFallbackEnabled: (): boolean => false,
    shouldSeedStaticDemoGovernanceRecordsForRun: (): boolean => false,
  };
});

vi.mock("next/navigation", () => ({
  usePathname: (): string => "/governance",
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

import { buyerPolishedRouteOrientation } from "@/lib/buyer-polished-route-orientation";

import { GovernanceWorkflowPageContent } from "./GovernanceWorkflowPageContent";

describe("GovernanceWorkflowPageContent buyer-polished chrome (TB-1434)", () => {
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
      items: [],
      totalCount: 0,
      page: 1,
      pageSize: 50,
      hasMore: false,
    });
  });

  it("keeps one overview lead on OperatorPageHeader — strip orientation is null (TB-1434)", async () => {
    expect(buyerPolishedRouteOrientation("/governance")).toBeNull();

    render(<GovernanceWorkflowPageContent />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Governance" })).toBeInTheDocument();
    });

    expect(screen.getAllByText(GOVERNANCE_OVERVIEW_PAGE_LEAD)).toHaveLength(1);
    expect(screen.queryByTestId("layer-context-strip")).not.toBeInTheDocument();
  });
});
