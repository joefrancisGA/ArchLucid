import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { OperatorStickinessSnapshotDto } from "@/types/operate-rhythm";

const useOperatorStickinessSnapshotQuery = vi.fn();
const useNavCommittedArchitectureReview = vi.fn();
const useOperatorHomeWorkspaceActivity = vi.fn();
const useArchitectureDraftRegistryEntries = vi.fn();
const useCorePilotCommitContextQuery = vi.fn();

vi.mock("@/hooks/use-operator-stickiness-snapshot-query", () => ({
  useOperatorStickinessSnapshotQuery: () => useOperatorStickinessSnapshotQuery(),
}));

vi.mock("@/components/operator/OperatorNavAuthorityProvider", () => ({
  useNavCommittedArchitectureReview: () => useNavCommittedArchitectureReview(),
}));

vi.mock("@/components/operator-home/operator-home-workspace-activity-context", () => ({
  useOperatorHomeWorkspaceActivity: () => useOperatorHomeWorkspaceActivity(),
}));

vi.mock("@/hooks/use-architecture-draft-registry-entries", () => ({
  useArchitectureDraftRegistryEntries: () => useArchitectureDraftRegistryEntries(),
}));

vi.mock("@/hooks/use-core-pilot-commit-context-query", () => ({
  useCorePilotCommitContextQuery: () => useCorePilotCommitContextQuery(),
}));

import { OperatorHomeStickinessCockpit } from "./OperatorHomeStickinessCockpit";

const SNAPSHOT_HEADING = "Pilot & repeat usage";

function settledQuery<T>(data: T) {
  return { data, isPending: false, isError: false, error: null };
}

function snapshot(overrides?: Partial<OperatorStickinessSnapshotDto>): OperatorStickinessSnapshotDto {
  return {
    pilotFunnel: {
      totalRunsInScope: 4,
      committedRunsInScope: 2,
      productLearningSignalsLast90Days: 7,
      firstGoldenManifestUtc: null,
      firstComparisonUtc: null,
    },
    latestRunId: "run-1",
    comparisonEventsLast30Days: 3,
    pendingGovernanceApprovals: 1,
    ...overrides,
  };
}

describe("OperatorHomeStickinessCockpit (TB-2191 / TB-2232 / TB-2331)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useNavCommittedArchitectureReview.mockReturnValue(false);
    useOperatorHomeWorkspaceActivity.mockReturnValue({ hasWorkspaceReviews: true });
    useArchitectureDraftRegistryEntries.mockReturnValue([]);
    useCorePilotCommitContextQuery.mockReturnValue({
      isPending: false,
      data: { hasCommittedManifest: false },
    });
  });

  it("renders the pilot snapshot when funnel data exists", () => {
    useOperatorStickinessSnapshotQuery.mockReturnValue(settledQuery(snapshot()));

    render(<OperatorHomeStickinessCockpit />);

    expect(screen.getByRole("heading", { name: SNAPSHOT_HEADING })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Recommended next steps" })).toBeNull();
  });

  it("hides the cockpit on first-session eval-empty home (TB-2331)", () => {
    useOperatorHomeWorkspaceActivity.mockReturnValue({ hasWorkspaceReviews: false });
    useOperatorStickinessSnapshotQuery.mockReturnValue(
      settledQuery(
        snapshot({
          pilotFunnel: {
            totalRunsInScope: 0,
            committedRunsInScope: 0,
            productLearningSignalsLast90Days: 0,
            firstGoldenManifestUtc: null,
            firstComparisonUtc: null,
          },
        }),
      ),
    );

    render(<OperatorHomeStickinessCockpit />);

    expect(screen.queryByTestId("operator-home-stickiness-cockpit")).toBeNull();
  });

  it("never renders a health score, which stays internal-only until the worker calculates it", () => {
    useOperatorStickinessSnapshotQuery.mockReturnValue(settledQuery(snapshot()));

    render(<OperatorHomeStickinessCockpit />);

    expect(screen.queryByText(/health score/i)).toBeNull();
    expect(screen.queryByText(/composite/i)).toBeNull();
  });
});
