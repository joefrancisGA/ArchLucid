import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useOperatorAttentionSummary } from "@/hooks/use-operator-attention-summary";
import { resetOperatorQueryClientForTests } from "@/lib/query/operator-query-client";
import { renderWithOperatorQuery } from "@/testing/render-with-operator-query";

import { fetchAlertsInboxSummary } from "@/components/alerts/alerts-inbox-query-fetch";
import { useOperatorShellStatusConcernFetchEnabled } from "@/components/shell/OperatorShellStatusQueryGate";
import { getGovernanceReviewsAwaitingAction } from "@/lib/api/governance-stickiness-api";
import { fetchAndHydrateOperatorShellStatus } from "@/lib/operator/operator-shell-status-client";

vi.mock("@/components/shell/OperatorShellStatusQueryGate", () => ({
  OperatorShellStatusQueryGate: ({ children }: { children: React.ReactNode }) => children,
  useOperatorShellStatusConcernFetchEnabled: vi.fn(() => true),
}));

vi.mock("@/components/alerts/alerts-inbox-query-fetch", () => ({
  fetchAlertsInboxSummary: vi.fn(),
}));

vi.mock("@/lib/api/governance-stickiness-api", () => ({
  getGovernanceReviewsAwaitingAction: vi.fn(),
}));

vi.mock("@/lib/operator/operator-shell-status-client", () => ({
  fetchAndHydrateOperatorShellStatus: vi.fn(),
}));

vi.mock("@/lib/operator/operator-scope-storage", () => ({
  ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT: "archlucid:operator-scope-changed",
  getEffectiveBrowserProxyScopeHeaders: () => ({
    "x-tenant-id": "tenant-1",
    "x-workspace-id": "workspace-1",
    "x-project-id": "project-1",
  }),
}));

const fetchAlertsInboxSummaryMock = vi.mocked(fetchAlertsInboxSummary);
const getGovernanceReviewsAwaitingActionMock = vi.mocked(getGovernanceReviewsAwaitingAction);
const fetchAndHydrateOperatorShellStatusMock = vi.mocked(fetchAndHydrateOperatorShellStatus);
const concernFetchEnabledMock = vi.mocked(useOperatorShellStatusConcernFetchEnabled);

function AttentionSummaryProbe(): React.JSX.Element {
  const { surfaceCounts, summaries } = useOperatorAttentionSummary({
    unfinishedWorkRailCount: 2,
    runs: [
      {
        runId: "needs-attention",
        projectId: "default",
        hasFindingsSnapshot: true,
        hasGoldenManifest: false,
      },
    ],
  });

  return (
    <div>
      <span data-testid="assigned-count">{surfaceCounts["assigned-to-me-findings"] ?? 0}</span>
      <span data-testid="unfinished-summary">
        {summaries.find((row) => row.partition === "unfinished-work")?.totalCount ?? 0}
      </span>
    </div>
  );
}

describe("useOperatorAttentionSummary (TB-2369)", () => {
  beforeEach(() => {
    resetOperatorQueryClientForTests();
    concernFetchEnabledMock.mockReturnValue(true);
    fetchAlertsInboxSummaryMock.mockResolvedValue({
      open: 3,
      acknowledged: 0,
      resolved: 0,
      blocking: 0,
      lastEvaluatedUtc: null,
    });
    getGovernanceReviewsAwaitingActionMock.mockResolvedValue({
      items: [{ reviewId: "review-1", runId: "run-1", title: "Awaiting" }],
    });
    fetchAndHydrateOperatorShellStatusMock.mockResolvedValue({
      assignedToMeFindingsCount: 4,
    } as Awaited<ReturnType<typeof fetchAndHydrateOperatorShellStatus>>);
  });

  it("rolls inventoried surface counts into partition summaries", async () => {
    renderWithOperatorQuery(<AttentionSummaryProbe />);

    await waitFor(() => {
      expect(screen.getByTestId("assigned-count")).toHaveTextContent("4");
    });

    expect(screen.getByTestId("unfinished-summary")).toHaveTextContent("3");
  });
});
