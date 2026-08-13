import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { OperatorNextBestActionDto } from "@/lib/api/tenant-customer-success";
import type { OperatorStickinessSnapshotDto } from "@/types/operate-rhythm";

const useOperatorNextBestActionsQuery = vi.fn();
const useOperatorStickinessSnapshotQuery = vi.fn();
const isBuyerPolishedOperatorShellEnv = vi.fn(() => false);

vi.mock("@/hooks/use-operator-next-best-actions-query", () => ({
  useOperatorNextBestActionsQuery: () => useOperatorNextBestActionsQuery(),
}));

vi.mock("@/hooks/use-operator-stickiness-snapshot-query", () => ({
  useOperatorStickinessSnapshotQuery: () => useOperatorStickinessSnapshotQuery(),
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: () => isBuyerPolishedOperatorShellEnv(),
    isNextPublicDemoMode: () => false,
  };
});

vi.mock("@/lib/operator/operator-static-demo", () => ({
  isStaticDemoPayloadFallbackEnabled: () => false,
}));

import { OperatorHomeStickinessCockpit } from "./OperatorHomeStickinessCockpit";

const NEXT_ACTIONS_HEADING = "Recommended next steps";
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

const sampleActions: readonly OperatorNextBestActionDto[] = [
  {
    actionId: "commit-latest",
    title: "Commit the latest architecture package",
    reason: "One review is finished but not committed.",
    href: "/architecture/reviews/run-1",
  },
];

describe("OperatorHomeStickinessCockpit (TB-2191)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isBuyerPolishedOperatorShellEnv.mockReturnValue(false);
  });

  it("renders next steps and the pilot snapshot when both have data", () => {
    useOperatorNextBestActionsQuery.mockReturnValue(settledQuery([...sampleActions]));
    useOperatorStickinessSnapshotQuery.mockReturnValue(settledQuery(snapshot()));

    render(<OperatorHomeStickinessCockpit />);

    expect(screen.getByRole("heading", { name: NEXT_ACTIONS_HEADING })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: SNAPSHOT_HEADING })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: sampleActions[0].title })).toHaveAttribute(
      "href",
      sampleActions[0].href,
    );
  });

  it("shows no empty scaffolding for a workspace with no reviews", () => {
    useOperatorNextBestActionsQuery.mockReturnValue(settledQuery([]));
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

  it("suppresses next steps but keeps the snapshot in the buyer-polished shell", () => {
    isBuyerPolishedOperatorShellEnv.mockReturnValue(true);
    useOperatorNextBestActionsQuery.mockReturnValue(settledQuery([...sampleActions]));
    useOperatorStickinessSnapshotQuery.mockReturnValue(settledQuery(snapshot()));

    render(<OperatorHomeStickinessCockpit />);

    expect(screen.queryByRole("heading", { name: NEXT_ACTIONS_HEADING })).toBeNull();
    expect(screen.getByRole("heading", { name: SNAPSHOT_HEADING })).toBeInTheDocument();
  });

  it("never renders a health score, which stays internal-only until the worker calculates it", () => {
    useOperatorNextBestActionsQuery.mockReturnValue(settledQuery([...sampleActions]));
    useOperatorStickinessSnapshotQuery.mockReturnValue(settledQuery(snapshot()));

    render(<OperatorHomeStickinessCockpit />);

    expect(screen.queryByText(/health score/i)).toBeNull();
    expect(screen.queryByText(/composite/i)).toBeNull();
  });
});
