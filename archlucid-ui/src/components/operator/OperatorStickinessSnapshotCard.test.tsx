import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { OperatorStickinessSnapshotDto } from "@/types/operate-rhythm";

const useOperatorStickinessSnapshotQuery = vi.fn();
const useAssignedToMeFindingsCountQuery = vi.fn();

vi.mock("@/hooks/use-operator-stickiness-snapshot-query", () => ({
  useOperatorStickinessSnapshotQuery: () => useOperatorStickinessSnapshotQuery(),
}));

vi.mock("@/hooks/use-assigned-to-me-findings-count-query", () => ({
  useAssignedToMeFindingsCountQuery: () => useAssignedToMeFindingsCountQuery(),
}));

vi.mock("@/lib/demo-ui-env", () => ({
  isBuyerPolishedOperatorShellEnv: () => true,
}));

import { OperatorStickinessSnapshotCard } from "@/components/operator/OperatorStickinessSnapshotCard";
import { GOVERNANCE_APPROVAL_QUEUE_PATH } from "@/lib/governance/governance-route-paths";

function settledQuery<T>(data: T) {
  return { data, isPending: false, isError: false, error: null };
}

function snapshot(overrides?: Partial<OperatorStickinessSnapshotDto>): OperatorStickinessSnapshotDto {
  return {
    pilotFunnel: {
      totalRunsInScope: 1,
      committedRunsInScope: 0,
      productLearningSignalsLast90Days: 0,
      firstGoldenManifestUtc: null,
      firstComparisonUtc: null,
    },
    latestRunId: "run-1",
    comparisonEventsLast30Days: 0,
    pendingGovernanceApprovals: 0,
    ...overrides,
  };
}

describe("OperatorStickinessSnapshotCard approval habit links", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAssignedToMeFindingsCountQuery.mockReturnValue(settledQuery(0));
  });

  it("hides the approval queue link when there are no pending approvals", () => {
    useOperatorStickinessSnapshotQuery.mockReturnValue(settledQuery(snapshot()));

    render(<OperatorStickinessSnapshotCard />);

    expect(screen.queryByRole("link", { name: "View approval" })).not.toBeInTheDocument();
  });

  it("shows the approval queue link when pending approvals exist", () => {
    useOperatorStickinessSnapshotQuery.mockReturnValue(
      settledQuery(snapshot({ pendingGovernanceApprovals: 2 })),
    );

    render(<OperatorStickinessSnapshotCard />);

    expect(screen.getByRole("link", { name: "View approval" })).toHaveAttribute(
      "href",
      GOVERNANCE_APPROVAL_QUEUE_PATH,
    );
  });
});
