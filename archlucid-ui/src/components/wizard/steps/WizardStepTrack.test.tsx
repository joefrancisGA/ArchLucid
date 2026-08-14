import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useEffect, useState, type ReactElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { WizardStepTrack } from "@/components/wizard/steps/WizardStepTrack";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { RunSummary } from "@/types/authority";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/lib/api", () => ({
  getRunSummary: vi.fn(),
}));

vi.mock("@/hooks/use-workspace-review-duration-estimate", () => ({
  useWorkspaceReviewDurationEstimate: vi.fn(() => ({ estimate: null, loading: false })),
}));

import { getRunSummary } from "@/lib/api";
import { useWorkspaceReviewDurationEstimate } from "@/hooks/use-workspace-review-duration-estimate";

const mockGetRunSummary = vi.mocked(getRunSummary);
const mockUseWorkspaceReviewDurationEstimate = vi.mocked(useWorkspaceReviewDurationEstimate);

function renderWithTooltips(node: ReactElement) {
  return render(<TooltipProvider delayDuration={0}>{node}</TooltipProvider>);
}

const baseSummary: RunSummary = {
  runId: "run-track-1",
  projectId: "default",
  createdUtc: "2026-01-01T00:00:00.000Z",
};

function TrackPollingHarness({ runId }: { runId: string }) {
  const [pollSummary, setPollSummary] = useState<RunSummary | null>(null);

  useEffect(() => {
    const tick = async () => {
      const next: RunSummary = await mockGetRunSummary(runId);
      setPollSummary(next);
    };

    void tick();
    const intervalId = window.setInterval(() => void tick(), 3000);

    return () => window.clearInterval(intervalId);
  }, [reviewId]);

  return (
    <TooltipProvider delayDuration={0}>
      <WizardStepTrack runId={runId} pollSummary={pollSummary} />
    </TooltipProvider>
  );
}

describe("WizardStepTrack", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseWorkspaceReviewDurationEstimate.mockReturnValue({ estimate: null, loading: false });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows Pending badges when pipeline flags are false or summary is null", () => {
    renderWithTooltips(<WizardStepTrack runId="r1" pollSummary={{ ...baseSummary, runId: "r1" }} />);

    expect(screen.getAllByText("Pending").length).toBeGreaterThanOrEqual(4);
  });

  it("marks stages Complete as flags flip true", () => {
    const { rerender } = renderWithTooltips(
      <WizardStepTrack
        runId="r1"
        pollSummary={{
          ...baseSummary,
          runId: "r1",
          hasContextSnapshot: true,
          hasGraphSnapshot: true,
        }}
      />,
    );

    expect(screen.getAllByText("Complete").length).toBe(2);
    expect(screen.getAllByText("Pending").length).toBe(2);

    rerender(
      <TooltipProvider delayDuration={0}>
        <WizardStepTrack
          runId="r1"
          pollSummary={{
            ...baseSummary,
            runId: "r1",
            hasContextSnapshot: true,
            hasGraphSnapshot: true,
            hasFindingsSnapshot: true,
            hasGoldenManifest: true,
          }}
        />
      </TooltipProvider>,
    );

    expect(screen.getAllByText("Complete").length).toBe(4);
  });

  it("renders Open review detail when hasGoldenManifest is true", () => {
    renderWithTooltips(
      <WizardStepTrack
        runId="golden-1"
        pollSummary={{
          ...baseSummary,
          runId: "golden-1",
          hasGoldenManifest: true,
        }}
      />,
    );

    const link = screen.getByRole("link", { name: "Open review detail" });
    expect(link).toHaveAttribute("href", "/architecture/reviews/golden-1?fromGeneration=1");
  });

  it("advances polled summary when the interval callback runs (mock setInterval + getRunSummary)", async () => {
    let intervalHandler: (() => void) | undefined;
    vi.spyOn(globalThis, "setInterval").mockImplementation((handler, delay) => {
      if (delay === 3000 && typeof handler === "function") {
        intervalHandler = handler as () => void;
      }

      return 42 as unknown as ReturnType<typeof setInterval>;
    });
    vi.spyOn(globalThis, "clearInterval").mockImplementation(() => {
      /* no-op */
    });

    mockGetRunSummary
      .mockResolvedValueOnce({
        ...baseSummary,
        hasContextSnapshot: true,
      })
      .mockResolvedValue({
        ...baseSummary,
        hasContextSnapshot: true,
        hasGraphSnapshot: true,
        hasFindingsSnapshot: true,
        hasGoldenManifest: true,
      });

    render(<TrackPollingHarness runId={baseSummary.runId} />);

    await waitFor(() => {
      expect(screen.getAllByText("Complete").length).toBeGreaterThanOrEqual(1);
    });

    await waitFor(() => {
      expect(intervalHandler).toBeDefined();
    });

    await act(async () => {
      intervalHandler?.();
    });

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(screen.getByRole("link", { name: "Open review detail" })).toBeInTheDocument();
    });

    expect(mockGetRunSummary.mock.calls.length).toBeGreaterThanOrEqual(2);

    vi.restoreAllMocks();
  });

  it("uses vi.useFakeTimers to advance a 3s polling interval", () => {
    vi.useFakeTimers();

    try {
      const tick = vi.fn();
      const id = window.setInterval(tick, 3000);
      vi.advanceTimersByTime(2999);
      expect(tick).not.toHaveBeenCalled();
      vi.advanceTimersByTime(1);
      expect(tick).toHaveBeenCalledTimes(1);
      window.clearInterval(id);
    } finally {
      vi.useRealTimers();
    }
  });

  it("frames the elapsed poll watchdog as still running, not failed", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });

    renderWithTooltips(
      <WizardStepTrack
        runId="slow-1"
        pollSummary={{
          ...baseSummary,
          runId: "slow-1",
          hasContextSnapshot: true,
        }}
      />,
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(180_000);
    });

    expect(screen.getByText(/nothing was canceled and analysis is still running/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /retry/i })).toBeNull();
    expect(screen.getByRole("button", { name: /keep watching/i })).toBeInTheDocument();
  });

  it("calls onRetryPolling when the operator retries after a stall", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const onRetryPolling = vi.fn();

    renderWithTooltips(
      <WizardStepTrack
        runId="slow-2"
        pollSummary={{
          ...baseSummary,
          runId: "slow-2",
          hasContextSnapshot: true,
        }}
        onRetryPolling={onRetryPolling}
      />,
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(180_000);
    });

    fireEvent.click(screen.getByRole("button", { name: /keep watching/i }));
    expect(onRetryPolling).toHaveBeenCalledTimes(1);
  });

  it("encodes run id on Compare two reviews when the golden manifest is ready", () => {
    renderWithTooltips(
      <WizardStepTrack
        runId="run-encode-9"
        pollSummary={{
          ...baseSummary,
          runId: "run-encode-9",
          hasGoldenManifest: true,
        }}
      />,
    );

    expect(screen.getByRole("link", { name: "Compare two reviews" })).toHaveAttribute(
      "href",
      "/insights/compare-two-reviews?priorRunId=run-encode-9",
    );
  });
});
