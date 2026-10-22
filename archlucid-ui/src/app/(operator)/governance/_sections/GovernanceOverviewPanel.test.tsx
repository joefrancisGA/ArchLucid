import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  GOVERNANCE_OVERVIEW_FINDINGS_ACTION,
  GOVERNANCE_OVERVIEW_NO_PENDING_DESCRIPTION,
  GOVERNANCE_OVERVIEW_SUBMIT_DISABLED_HINT,
} from "@/lib/governance/governance-overview-copy";
import { renderWithOperatorQuery } from "@/testing/render-with-operator-query";
import { useOperatorQueryTestLifecycle } from "@/testing/operator-query-test-helpers";

import { GovernanceOverviewPanel } from "./GovernanceOverviewPanel";

const apiHoisted = vi.hoisted(() => ({
  getGovernanceDashboard: vi.fn(),
  getGovernanceDecisionsNeededSummary: vi.fn(),
  listRunsByProjectPaged: vi.fn(),
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

vi.mock("@/hooks/use-ask-project-runs-query", () => ({
  useAskProjectRunsQuery: () => ({
    data: { items: [], totalCount: 0, page: 1, pageSize: 50, hasMore: false },
    isPending: false,
    isError: false,
    isFetched: true,
    refetch: vi.fn(),
  }),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

describe("GovernanceOverviewPanel (GOP P0)", () => {
  useOperatorQueryTestLifecycle();

  const onFocusSubmit = vi.fn(() => ({ kind: "blocked-empty-review" as const }));

  beforeEach(() => {
    onFocusSubmit.mockClear();
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

  it("disables submit CTA with visible reason when no review is selected (P0-1)", async () => {
    renderWithOperatorQuery(
      <GovernanceOverviewPanel
        buyerPolishedShell={false}
        canMutateWorkflow
        queryRunId=""
        setQueryRunId={vi.fn()}
        onLoadReview={vi.fn()}
        onFocusSubmit={onFocusSubmit}
        onFocusPending={vi.fn()}
        listsLoading={false}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("governance-overview-submit-action")).toBeDisabled();
    });

    expect(screen.getByTestId("governance-overview-submit-disabled-hint")).toHaveTextContent(
      GOVERNANCE_OVERVIEW_SUBMIT_DISABLED_HINT,
    );

    fireEvent.click(screen.getByTestId("governance-overview-submit-action"));

    expect(onFocusSubmit).not.toHaveBeenCalled();
  });

  it("shows summary freshness, scope, and segregation lines (P0-2 / P0-5)", async () => {
    renderWithOperatorQuery(
      <GovernanceOverviewPanel
        buyerPolishedShell={false}
        canMutateWorkflow
        queryRunId=""
        setQueryRunId={vi.fn()}
        onLoadReview={vi.fn()}
        onFocusSubmit={onFocusSubmit}
        onFocusPending={vi.fn()}
        listsLoading={false}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("governance-overview-last-refreshed")).toBeInTheDocument();
    });

    expect(screen.getByTestId("governance-overview-summary-authority")).toHaveTextContent(/segregation of duties/i);
    expect(screen.getByTestId("governance-overview-summary-refresh")).toBeInTheDocument();
  });

  it("distinguishes linked metric cards from read-only approved reviews card (P0-6)", async () => {
    renderWithOperatorQuery(
      <GovernanceOverviewPanel
        buyerPolishedShell={false}
        canMutateWorkflow
        queryRunId=""
        setQueryRunId={vi.fn()}
        onLoadReview={vi.fn()}
        onFocusSubmit={onFocusSubmit}
        onFocusPending={vi.fn()}
        listsLoading={false}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("governance-overview-metric-link-blocking-findings")).toBeInTheDocument();
    });

    expect(screen.getByTestId("governance-overview-metric-readonly-approved-reviews")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: GOVERNANCE_OVERVIEW_FINDINGS_ACTION })).toHaveAttribute(
      "href",
      "/governance/findings",
    );
  });

  it("uses above copy for empty pending state (P0-1 layout order)", async () => {
    renderWithOperatorQuery(
      <GovernanceOverviewPanel
        buyerPolishedShell={false}
        canMutateWorkflow
        queryRunId=""
        setQueryRunId={vi.fn()}
        onLoadReview={vi.fn()}
        onFocusSubmit={onFocusSubmit}
        onFocusPending={vi.fn()}
        listsLoading={false}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("governance-overview-no-pending-compact")).toBeInTheDocument();
    });

    expect(screen.getByText(GOVERNANCE_OVERVIEW_NO_PENDING_DESCRIPTION)).toHaveTextContent(/above/i);
    expect(screen.getByText(GOVERNANCE_OVERVIEW_NO_PENDING_DESCRIPTION)).not.toHaveTextContent(/below/i);
  });
});
