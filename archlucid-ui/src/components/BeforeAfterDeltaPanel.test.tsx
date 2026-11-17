import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const trialQueryMock = vi.hoisted(() => vi.fn());
const deltasQueryMock = vi.hoisted(() => vi.fn());

vi.mock("@/components/shell/OperatorShellStatusQueryGate", () => ({
  useOperatorShellStatusConcernFetchEnabled: () => true,
}));

vi.mock("@/hooks/use-tenant-trial-status-query", () => ({
  useTenantTrialStatusQuery: (options: unknown) => trialQueryMock(options),
}));

vi.mock("@/hooks/use-pilot-run-deltas-query", () => ({
  usePilotRunDeltasQuery: (runId: string, options: unknown) => deltasQueryMock(runId, options),
  resolvePilotRunDeltasQueryErrorMessage: () => "Could not load pilot run deltas",
}));

import { BeforeAfterDeltaPanel } from "./BeforeAfterDeltaPanel";

describe("BeforeAfterDeltaPanel", () => {
  beforeEach(() => {
    trialQueryMock.mockReset();
    deltasQueryMock.mockReset();
    deltasQueryMock.mockReturnValue({
      data: undefined,
      isPending: false,
      isError: false,
      error: null,
    });
  });

  it("renders nothing when neither baseline nor measured value is available", async () => {
    trialQueryMock.mockReturnValue({
      data: {
        trialWelcomeRunId: null,
        baselineReviewCycleHours: null,
      },
      isFetched: true,
    });

    const { container } = render(<BeforeAfterDeltaPanel />);

    await waitFor(() => {
      expect(container.querySelector('[data-testid="before-after-delta-panel"]')).toBeNull();
    });
  });

  it("renders both columns and a positive delta when baseline and measured values are present", async () => {
    trialQueryMock.mockReturnValue({
      data: {
        trialWelcomeRunId: "run-welcome-1",
        baselineReviewCycleHours: 16,
        baselineReviewCycleSource: "team estimate",
      },
      isFetched: true,
    });
    deltasQueryMock.mockReturnValue({
      data: {
        timeToCommittedManifestTotalSeconds: 4 * 3600,
      },
      isPending: false,
      isError: false,
      error: null,
    });

    render(<BeforeAfterDeltaPanel />);

    await waitFor(() => {
      expect(screen.getByTestId("before-after-delta-panel")).toBeInTheDocument();
    });

    expect(screen.getByTestId("before-after-delta-baseline-hours")).toHaveTextContent("16.00 h");
    expect(screen.getByTestId("before-after-delta-measured-hours")).toHaveTextContent("4.00 h");
    expect(screen.getByTestId("before-after-delta-summary")).toHaveTextContent(/12\.00 h saved per finalized review/);
    expect(screen.getByTestId("before-after-delta-summary")).toHaveTextContent(/75\.0% improvement/);
  });

  it("uses the explicit runId prop over trialWelcomeRunId from trial-status", async () => {
    trialQueryMock.mockReturnValue({
      data: {
        trialWelcomeRunId: "should-not-be-used",
        baselineReviewCycleHours: 8,
      },
      isFetched: true,
    });
    deltasQueryMock.mockImplementation((runId: string) => ({
      data:
        runId === "explicit-run"
          ? { timeToCommittedManifestTotalSeconds: 2 * 3600 }
          : undefined,
      isPending: false,
      isError: false,
      error: null,
    }));

    render(<BeforeAfterDeltaPanel runId="explicit-run" />);

    await waitFor(() => {
      expect(screen.getByTestId("before-after-delta-summary")).toBeInTheDocument();
    });

    expect(deltasQueryMock).toHaveBeenCalledWith("explicit-run", expect.any(Object));
  });

  it("renders the baseline-only state when no commit measurement is available", async () => {
    trialQueryMock.mockReturnValue({
      data: {
        trialWelcomeRunId: "run-welcome-1",
        baselineReviewCycleHours: 16,
      },
      isFetched: true,
    });
    deltasQueryMock.mockReturnValue({
      data: { timeToCommittedManifestTotalSeconds: null },
      isPending: false,
      isError: false,
      error: null,
    });

    render(<BeforeAfterDeltaPanel />);

    await waitFor(() => {
      expect(screen.getByTestId("before-after-delta-panel")).toBeInTheDocument();
    });

    expect(screen.getByTestId("before-after-delta-baseline-hours")).toHaveTextContent("16.00 h");
    expect(screen.getByTestId("before-after-delta-measured-hours")).toHaveTextContent("Not measured h");
    expect(screen.queryByTestId("before-after-delta-summary")).toBeNull();
  });

  it("renders nothing when trial status fails to load", async () => {
    trialQueryMock.mockReturnValue({
      data: undefined,
      isFetched: false,
      isError: true,
    });

    const { container } = render(<BeforeAfterDeltaPanel />);

    await waitFor(() => {
      expect(container.querySelector('[data-testid="before-after-delta-panel"]')).toBeNull();
    });
  });
});
