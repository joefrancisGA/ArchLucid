import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/pilot-recent-deltas-client", () => ({
  fetchPilotRecentDeltas: vi.fn(),
}));

import type {
  RecentPilotRunDeltaRow,
  RecentPilotRunDeltasPayload,
} from "@/components/BeforeAfterDelta/types";
import { useWorkspaceReviewDurationEstimate } from "@/hooks/use-workspace-review-duration-estimate";
import { fetchPilotRecentDeltas } from "@/lib/pilot-recent-deltas-client";
import { renderWithOperatorQuery } from "@/testing/render-with-operator-query";

const mockFetchPilotRecentDeltas = vi.mocked(fetchPilotRecentDeltas);

function deltaRow(runId: string, totalSeconds: number | null): RecentPilotRunDeltaRow {
  return {
    runId,
    requestId: `request-${runId}`,
    runCreatedUtc: "2026-08-01T00:00:00Z",
    manifestCommittedUtc: "2026-08-01T00:20:00Z",
    timeToCommittedManifestTotalSeconds: totalSeconds,
    totalFindings: 4,
    topFindingSeverity: "High",
    isDemoTenant: false,
  };
}

function deltasPayload(...durationsSeconds: readonly (number | null)[]): RecentPilotRunDeltasPayload {
  const items = durationsSeconds.map((seconds, index) => deltaRow(`run-${index}`, seconds));

  return {
    items,
    requestedCount: items.length,
    returnedCount: items.length,
    medianTotalFindings: 4,
    medianTimeToCommittedManifestTotalSeconds: null,
    medianLlmCallCount: null,
  };
}

function EstimateProbe({ enabled }: { readonly enabled: boolean }): React.JSX.Element {
  const { estimate, loading } = useWorkspaceReviewDurationEstimate(enabled);

  return (
    <div>
      <span data-testid="loading">{loading ? "loading" : "idle"}</span>
      <span data-testid="estimate">{estimate === null ? "none" : `${estimate.sampleSize}`}</span>
    </div>
  );
}

describe("useWorkspaceReviewDurationEstimate", () => {
  beforeEach(() => {
    mockFetchPilotRecentDeltas.mockReset();
  });

  it("reports idle and reads nothing while disabled", async () => {
    renderWithOperatorQuery(<EstimateProbe enabled={false} />);

    expect(screen.getByTestId("loading")).toHaveTextContent("idle");
    expect(screen.getByTestId("estimate")).toHaveTextContent("none");
    expect(mockFetchPilotRecentDeltas).not.toHaveBeenCalled();
  });

  it("derives the band from recent finalized reviews", async () => {
    mockFetchPilotRecentDeltas.mockResolvedValue(deltasPayload(600, 1200, 1800));

    renderWithOperatorQuery(<EstimateProbe enabled />);

    await waitFor(() => {
      expect(screen.getByTestId("estimate")).toHaveTextContent("3");
    });

    expect(screen.getByTestId("loading")).toHaveTextContent("idle");
    expect(mockFetchPilotRecentDeltas).toHaveBeenCalledWith(12);
  });

  it("reports no band when too few reviews carry a duration", async () => {
    mockFetchPilotRecentDeltas.mockResolvedValue(deltasPayload(600, null));

    renderWithOperatorQuery(<EstimateProbe enabled />);

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("idle");
    });

    expect(screen.getByTestId("estimate")).toHaveTextContent("none");
  });

  it("reports no band when the read fails", async () => {
    mockFetchPilotRecentDeltas.mockRejectedValue(new Error("unreachable"));

    renderWithOperatorQuery(<EstimateProbe enabled />);

    // The shared client retries once, so settling takes longer than the default waitFor window.
    await waitFor(
      () => {
        expect(screen.getByTestId("loading")).toHaveTextContent("idle");
      },
      { timeout: 5_000 },
    );

    expect(screen.getByTestId("estimate")).toHaveTextContent("none");
  });
});
