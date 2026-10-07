import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TRACK_STEP_INDEX } from "./new-run-wizard-steps";

const useRunSummaryStream = vi.fn(() => ({ summary: null }));

vi.mock("@/hooks/useRunSummaryStream", () => ({
  useRunSummaryStream: (...args: unknown[]) => useRunSummaryStream(...args),
}));

import { useNewRunWizardTrackStream } from "./use-new-run-wizard-track-stream";

describe("useNewRunWizardTrackStream", () => {
  it("keeps summary polling enabled on every quick-review step after a run is spawned", () => {
    useRunSummaryStream.mockClear();

    renderHook(() =>
      useNewRunWizardTrackStream({
        runId: "run-123",
        wizardMode: "quick",
        stepIndex: 0,
      }),
    );

    expect(useRunSummaryStream).toHaveBeenCalledWith("run-123", {
      enabled: true,
      retryToken: 0,
    });
  });

  it("enables summary polling on the track step only in full wizard mode", () => {
    useRunSummaryStream.mockClear();

    renderHook(() =>
      useNewRunWizardTrackStream({
        runId: "run-123",
        wizardMode: "full",
        stepIndex: TRACK_STEP_INDEX,
      }),
    );

    expect(useRunSummaryStream).toHaveBeenCalledWith("run-123", {
      enabled: true,
      retryToken: 0,
    });

    useRunSummaryStream.mockClear();

    renderHook(() =>
      useNewRunWizardTrackStream({
        runId: "run-123",
        wizardMode: "full",
        stepIndex: 0,
      }),
    );

    expect(useRunSummaryStream).toHaveBeenCalledWith("run-123", {
      enabled: false,
      retryToken: 0,
    });
  });
});
