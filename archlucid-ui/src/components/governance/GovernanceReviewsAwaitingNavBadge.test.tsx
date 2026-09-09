import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GovernanceReviewsAwaitingNavBadge } from "@/components/governance/GovernanceReviewsAwaitingNavBadge";
import { getGovernanceReviewsAwaitingAction } from "@/lib/api/governance-stickiness-api";
import { resetOperatorQueryClientForTests } from "@/lib/query/operator-query-client";
import { renderWithOperatorQuery } from "@/testing/render-with-operator-query";

vi.mock("@/hooks/use-operator-attention-summary", () => ({
  useOperatorAttentionSummary: () => ({
    summaries: [],
    surfaceCounts: {},
  }),
}));

vi.mock("@/lib/api/governance-stickiness-api", () => ({
  getGovernanceReviewsAwaitingAction: vi.fn(),
}));

vi.mock("@/lib/operator/operator-scope-storage", () => ({
  ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT: "archlucid:operator-scope-changed",
  getEffectiveBrowserProxyScopeHeaders: () => ({
    "x-tenant-id": "tenant-1",
    "x-workspace-id": "workspace-1",
    "x-project-id": "project-1",
  }),
}));

const getGovernanceReviewsAwaitingActionMock = vi.mocked(getGovernanceReviewsAwaitingAction);

describe("GovernanceReviewsAwaitingNavBadge (TB-2144)", () => {
  beforeEach(() => {
    resetOperatorQueryClientForTests();
    getGovernanceReviewsAwaitingActionMock.mockReset();
    getGovernanceReviewsAwaitingActionMock.mockResolvedValue({ items: [] });
  });

  it("renders nothing when awaiting count is zero", async () => {
    const { container, unmount } = renderWithOperatorQuery(<GovernanceReviewsAwaitingNavBadge />);

    await waitFor(() => {
      expect(getGovernanceReviewsAwaitingActionMock).toHaveBeenCalledTimes(1);
    });

    expect(container).toBeEmptyDOMElement();
    unmount();
  });

  it("renders the awaiting-review count when items exist", async () => {
    getGovernanceReviewsAwaitingActionMock.mockResolvedValue({
      items: [
        { runId: "run-1", name: "Review A", newFindingCount: 0 },
        { runId: "run-2", name: "Review B", newFindingCount: 1 },
      ],
    });

    renderWithOperatorQuery(<GovernanceReviewsAwaitingNavBadge />);

    const badge = await screen.findByTestId("governance-awaiting-action-nav-badge");

    expect(badge).toHaveTextContent("2");
    expect(badge).toHaveAttribute("aria-label", "2 reviews awaiting approval");
  });

  it("does not refetch awaiting reviews on remount while query data is still fresh", async () => {
    getGovernanceReviewsAwaitingActionMock.mockResolvedValue({
      items: [{ runId: "run-1", name: "Review A", newFindingCount: 0 }],
    });

    const first = renderWithOperatorQuery(<GovernanceReviewsAwaitingNavBadge />);

    await screen.findByTestId("governance-awaiting-action-nav-badge");
    first.unmount();

    renderWithOperatorQuery(<GovernanceReviewsAwaitingNavBadge />);

    await screen.findByTestId("governance-awaiting-action-nav-badge");
    expect(getGovernanceReviewsAwaitingActionMock).toHaveBeenCalledTimes(1);
  });
});
