import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CtoDemoLiveRunProgressRail } from "./CtoDemoLiveRunProgressRail";

const createArchitectureRun = vi.fn();
const getRunStageTimeline = vi.fn();
const getRunSummary = vi.fn();

vi.mock("@/lib/api", () => ({
  createArchitectureRun: (...args: unknown[]) => createArchitectureRun(...args),
  getRunStageTimeline: (...args: unknown[]) => getRunStageTimeline(...args),
  getRunSummary: (...args: unknown[]) => getRunSummary(...args),
}));

describe("CtoDemoLiveRunProgressRail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    createArchitectureRun.mockResolvedValue({ run: { runId: "run-1" } });
    getRunStageTimeline.mockRejectedValue(new Error("timeline unavailable"));
    getRunSummary.mockRejectedValue(new Error("summary unavailable"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("surfaces stalled polling with retry instead of looping forever", async () => {
    render(
      <CtoDemoLiveRunProgressRail
        payload={{
          description: "demo brief",
          executionMode: "Simulator",
        }}
      />,
    );

    await waitFor(() => {
      expect(createArchitectureRun).toHaveBeenCalled();
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2_000 * 6);
    });

    expect(await screen.findByTestId("cto-demo-live-run-poll-stalled")).toBeInTheDocument();
    expect(screen.getByTestId("cto-demo-live-run-retry-poll")).toBeInTheDocument();

    getRunStageTimeline.mockResolvedValue([]);
    getRunSummary.mockResolvedValue({ hasGoldenManifest: false });

    fireEvent.click(screen.getByTestId("cto-demo-live-run-retry-poll"));

    await waitFor(() => {
      expect(screen.queryByTestId("cto-demo-live-run-poll-stalled")).not.toBeInTheDocument();
    });
  });
});
