import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { OperatorStickinessSnapshotDto } from "@/types/operate-rhythm";

const useOperatorStickinessSnapshotQuery = vi.fn();

vi.mock("@/hooks/use-operator-stickiness-snapshot-query", () => ({
  useOperatorStickinessSnapshotQuery: () => useOperatorStickinessSnapshotQuery(),
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

describe("OperatorHomeStickinessCockpit (TB-2191 / TB-2232)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the pilot snapshot when funnel data exists", () => {
    useOperatorStickinessSnapshotQuery.mockReturnValue(settledQuery(snapshot()));

    render(<OperatorHomeStickinessCockpit />);

    expect(screen.getByRole("heading", { name: SNAPSHOT_HEADING })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Recommended next steps" })).toBeNull();
  });

  it("shows no empty scaffolding for a workspace with no reviews", () => {
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

    expect(screen.getByTestId("operator-home-stickiness-cockpit")).toBeEmptyDOMElement();
  });

  it("never renders a health score, which stays internal-only until the worker calculates it", () => {
    useOperatorStickinessSnapshotQuery.mockReturnValue(settledQuery(snapshot()));

    render(<OperatorHomeStickinessCockpit />);

    expect(screen.queryByText(/health score/i)).toBeNull();
    expect(screen.queryByText(/composite/i)).toBeNull();
  });
});
