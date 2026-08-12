import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { RunProgressTracker } from "@/components/runs/RunProgressTracker";
import type { RunSummary } from "@/types/authority";

vi.mock("@/lib/api", () => ({
  getRunSummary: vi.fn(),
}));

vi.mock("@/lib/api/architecture-runs", () => ({
  getRunStageTimeline: vi.fn(),
}));

vi.mock("@/hooks/use-workspace-review-duration-estimate", () => ({
  useWorkspaceReviewDurationEstimate: vi.fn(() => ({ estimate: null, loading: false })),
}));

vi.mock("@/hooks/use-review-completion-notification", () => ({
  useReviewCompletionNotification: vi.fn(),
  canPromptForDesktopNotifications: vi.fn(() => false),
}));

import { getRunSummary } from "@/lib/api";
import { getRunStageTimeline } from "@/lib/api/architecture-runs";
import { useWorkspaceReviewDurationEstimate } from "@/hooks/use-workspace-review-duration-estimate";
import { REVIEW_PIPELINE_BACKGROUND_SAFETY_MESSAGE } from "@/lib/review-execution-background-safety-copy";

const mockGetRunSummary = vi.mocked(getRunSummary);
const mockGetRunStageTimeline = vi.mocked(getRunStageTimeline);
const mockUseWorkspaceReviewDurationEstimate = vi.mocked(useWorkspaceReviewDurationEstimate);

const baseSummary: RunSummary = {
  runId: "run-progress-1",
  projectId: "default",
  createdUtc: "2026-01-01T00:00:00.000Z",
};

function committedSummary(runId: string): RunSummary {
  return {
    ...baseSummary,
    runId,
    hasContextSnapshot: true,
    hasGraphSnapshot: true,
    hasFindingsSnapshot: true,
    hasGoldenManifest: true,
  };
}

describe("RunProgressTracker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetRunStageTimeline.mockResolvedValue([]);
    mockUseWorkspaceReviewDurationEstimate.mockReturnValue({ estimate: null, loading: false });

    // jsdom EventSource is unreliable; force the hook onto HTTP polling so `getRunSummary` timing is deterministic.
    vi.stubGlobal(
      "EventSource",
      class MockEventSource {
        addEventListener(type: string, listener: () => void): void {
          if (type === "error") {
            queueMicrotask(() => listener());
          }
        }

        close(): void {}
      },
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("shows pre-finalize ready-to-finalize terminal state without polling", async () => {
    render(
      <RunProgressTracker
        runId="prefinalize-1"
        initialSummary={{
          ...baseSummary,
          runId: "prefinalize-1",
          hasContextSnapshot: true,
          hasGraphSnapshot: true,
          hasFindingsSnapshot: true,
          hasGoldenManifest: false,
        }}
        preFinalizeReadyToFinalize
        buyerAssessmentCopy
      />,
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockGetRunSummary).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "Assessment progress" })).toBeInTheDocument();
    expect(screen.getByText(/Ready to finalize/i)).toBeInTheDocument();
    expect(screen.getByTestId("run-progress-signed-record-row")).toHaveTextContent("Not created yet");
    expect(screen.queryByText(/We're preparing this review/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /retry polling/i })).not.toBeInTheDocument();
  });

  it("enters pre-finalize terminal from live summary while assessment is still running on mount", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });

    mockGetRunSummary.mockResolvedValue({
      ...baseSummary,
      runId: "prefinalize-live-1",
      hasContextSnapshot: true,
      hasGraphSnapshot: true,
      hasFindingsSnapshot: true,
      hasGoldenManifest: false,
    });

    render(
      <RunProgressTracker
        runId="prefinalize-live-1"
        initialSummary={{
          ...baseSummary,
          runId: "prefinalize-live-1",
          hasContextSnapshot: true,
        }}
        preFinalizeReadyToFinalize={false}
        buyerAssessmentCopy
      />,
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2500);
    });

    expect(screen.getByText(/Ready to finalize/i)).toBeInTheDocument();
    expect(screen.getByTestId("run-progress-signed-record-row")).toHaveTextContent("Not created yet");
    expect(screen.queryByText(/We're preparing this review/i)).not.toBeInTheDocument();
  });

  it("uses buyer assessment copy without pipeline jargon while polling", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });

    mockGetRunSummary.mockResolvedValue({
      ...baseSummary,
      runId: "buyer-copy-1",
      hasContextSnapshot: true,
    });

    render(
      <RunProgressTracker
        runId="buyer-copy-1"
        initialSummary={{
          ...baseSummary,
          runId: "buyer-copy-1",
        }}
        buyerAssessmentCopy
      />,
    );

    await act(async () => {
      await new Promise<void>((resolve) => queueMicrotask(resolve));
    });

    expect(screen.getByRole("heading", { name: "Assessment progress" })).toBeInTheDocument();
    expect(screen.getByText(/1 of 3 assessment stages complete/i)).toBeInTheDocument();
    expect(screen.queryByText(/pipeline/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/polling/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/live stream/i)).not.toBeInTheDocument();
  });

  it("shows stage timing table when buyer assessment copy is enabled", async () => {
    mockGetRunStageTimeline.mockResolvedValue([
      {
        stageName: "findings",
        startedUtc: "2026-01-01T00:00:03.000Z",
        completedUtc: "2026-01-01T00:00:10.000Z",
        outcomeStatus: "Succeeded",
        durationMs: 7000,
      },
    ]);

    render(
      <RunProgressTracker
        runId="timeline-table-1"
        initialSummary={{
          ...baseSummary,
          runId: "timeline-table-1",
          hasContextSnapshot: true,
          hasGraphSnapshot: true,
          hasFindingsSnapshot: true,
        }}
        preFinalizeReadyToFinalize
        buyerAssessmentCopy
      />,
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(await screen.findByTestId("run-progress-stage-timeline-table")).toBeInTheDocument();
    expect(screen.getAllByText("Jan 1, 2026, 12:00 AM UTC").length).toBeGreaterThanOrEqual(1);
  });

  it("does not poll when run is already committed", async () => {
    render(
      <RunProgressTracker runId="committed-1" initialSummary={committedSummary("committed-1")} />,
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockGetRunSummary).not.toHaveBeenCalled();
    expect(screen.queryByRole("heading", { name: "Pipeline progress" })).not.toBeInTheDocument();
  });

  it("polls and updates badges as stages complete", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });

    // SSE falls back to polling; Strict Mode doubles effects — many `getRunSummary` calls can run before
    // this assertion. Gate the "all stages ready" response until after we assert the partial snapshot.
    let allowFullSummary = false;
    mockGetRunSummary.mockImplementation(async () => {
      const liveBase = { ...baseSummary, runId: "live-1" };

      if (!allowFullSummary) {
        return { ...liveBase, hasContextSnapshot: true };
      }

      return {
        ...liveBase,
        hasContextSnapshot: true,
        hasGraphSnapshot: true,
        hasFindingsSnapshot: true,
        hasGoldenManifest: true,
      };
    });

    render(
      <RunProgressTracker
        runId="live-1"
        initialSummary={{
          ...baseSummary,
          runId: "live-1",
        }}
      />,
    );

    // Do not use `runOnlyPendingTimersAsync` here: it drains the whole timer queue and advances past
    // RunProgressTracker's 180s watchdog, which disables `useRunSummaryStream` before the next poll.
    await act(async () => {
      await new Promise<void>((resolve) => queueMicrotask(resolve));
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockGetRunSummary).toHaveBeenCalled();
    expect(screen.getAllByText("Complete").length).toBe(1);
    expect(screen.getByTestId("run-progress-current-stage")).toHaveTextContent(
      /Currently: Mapping the architecture/i,
    );

    allowFullSummary = true;

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getAllByText("Complete").length).toBe(4);
  });

  it("stops polling when all stages are ready", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });

    mockGetRunSummary.mockResolvedValue({
      ...baseSummary,
      runId: "stop-1",
      hasContextSnapshot: true,
      hasGraphSnapshot: true,
      hasFindingsSnapshot: true,
      hasGoldenManifest: true,
    });

    render(
      <RunProgressTracker
        runId="stop-1"
        initialSummary={{
          ...baseSummary,
          runId: "stop-1",
          hasContextSnapshot: true,
        }}
      />,
    );

    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });

    expect(mockGetRunSummary.mock.calls.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Pipeline complete — refresh for full detail.")).toBeInTheDocument();

    const callsAfterComplete = mockGetRunSummary.mock.calls.length;

    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });

    expect(mockGetRunSummary.mock.calls.length).toBe(callsAfterComplete);
  });

  it("shows timeout message after max duration", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });

    mockGetRunSummary.mockResolvedValue({
      ...baseSummary,
      runId: "slow-1",
      hasContextSnapshot: true,
    });

    render(
      <RunProgressTracker
        runId="slow-1"
        initialSummary={{
          ...baseSummary,
          runId: "slow-1",
        }}
      />,
    );

    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });

    expect(mockGetRunSummary).toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(180_000);
    });

    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });

    expect(screen.getByText(/We're preparing this review/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retry polling/i })).toBeInTheDocument();
  });

  it("shows granular stage label from stage timeline when available", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });

    mockGetRunSummary.mockResolvedValue({
      ...baseSummary,
      runId: "stage-live-1",
      hasContextSnapshot: true,
    });
    mockGetRunStageTimeline.mockResolvedValue([
      {
        stageName: "findings",
        startedUtc: "2026-01-01T00:00:03.000Z",
        completedUtc: null,
        outcomeStatus: "Running",
      },
    ]);

    render(
      <RunProgressTracker
        runId="stage-live-1"
        initialSummary={{
          ...baseSummary,
          runId: "stage-live-1",
          hasContextSnapshot: true,
        }}
      />,
    );

    await act(async () => {
      await new Promise<void>((resolve) => queueMicrotask(resolve));
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockGetRunStageTimeline).toHaveBeenCalled();
    expect(screen.getByTestId("run-progress-current-stage")).toHaveTextContent(
      /Currently: Analyzing security and cost/i,
    );
  });

  it("shows background-safety and duration estimate when workspace samples exist", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });

    mockUseWorkspaceReviewDurationEstimate.mockReturnValue({
      estimate: { p50Seconds: 180, p90Seconds: 420, sampleSize: 4 },
      loading: false,
    });
    mockGetRunSummary.mockResolvedValue({
      ...baseSummary,
      runId: "estimate-1",
      hasContextSnapshot: true,
    });

    render(
      <RunProgressTracker
        runId="estimate-1"
        initialSummary={{
          ...baseSummary,
          runId: "estimate-1",
        }}
      />,
    );

    await act(async () => {
      await new Promise<void>((resolve) => queueMicrotask(resolve));
    });

    expect(screen.getByTestId("run-progress-background-safety")).toHaveTextContent(
      REVIEW_PIPELINE_BACKGROUND_SAFETY_MESSAGE,
    );
    expect(screen.getByTestId("run-progress-duration-estimate")).toHaveTextContent(
      /Recent reviews in this workspace typically take/i,
    );
  });

  it("shows extended timeout copy when tenant p90 exceeds three minutes", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });

    mockUseWorkspaceReviewDurationEstimate.mockReturnValue({
      estimate: { p50Seconds: 240, p90Seconds: 420, sampleSize: 5 },
      loading: false,
    });
    mockGetRunSummary.mockResolvedValue({
      ...baseSummary,
      runId: "slow-tenant-1",
      hasContextSnapshot: true,
    });

    render(
      <RunProgressTracker
        runId="slow-tenant-1"
        initialSummary={{
          ...baseSummary,
          runId: "slow-tenant-1",
        }}
      />,
    );

    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(483_000);
    });

    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });

    expect(screen.queryByText(/We're preparing this review; this can take a moment/i)).not.toBeInTheDocument();
    expect(screen.getByText(/often take longer than a few minutes/i)).toBeInTheDocument();
  });
});
