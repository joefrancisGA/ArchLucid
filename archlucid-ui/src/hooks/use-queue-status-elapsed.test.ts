import { renderHook, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useQueueStatusElapsed } from "@/hooks/use-queue-status-elapsed";
import { RE_RUN_REVIEW_PROGRESS_TICK_MS } from "@/lib/re-run-review-wait-copy";

describe("useQueueStatusElapsed", () => {
  const nowMs = () => Date.now();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns zero before the first 10s refresh tick", () => {
    const { result } = renderHook(() =>
      useQueueStatusElapsed({
        active: true,
        stageLabel: "Queued",
        nowMs,
      }),
    );

    expect(result.current).toBe(0);

    act(() => {
      vi.advanceTimersByTime(RE_RUN_REVIEW_PROGRESS_TICK_MS - 1);
    });

    expect(result.current).toBe(0);
  });

  it("reports elapsed time on each 10s refresh tick", () => {
    const { result } = renderHook(() =>
      useQueueStatusElapsed({
        active: true,
        stageLabel: "Queued",
        nowMs,
      }),
    );

    act(() => {
      vi.advanceTimersByTime(RE_RUN_REVIEW_PROGRESS_TICK_MS);
    });

    expect(result.current).toBe(RE_RUN_REVIEW_PROGRESS_TICK_MS);

    act(() => {
      vi.advanceTimersByTime(RE_RUN_REVIEW_PROGRESS_TICK_MS);
    });

    expect(result.current).toBe(RE_RUN_REVIEW_PROGRESS_TICK_MS * 2);
  });

  it("resets elapsed when the stage label changes", () => {
    const { result, rerender } = renderHook(
      (props: { stageLabel: string }) =>
        useQueueStatusElapsed({
          active: true,
          stageLabel: props.stageLabel,
          nowMs,
        }),
      { initialProps: { stageLabel: "Queued" } },
    );

    act(() => {
      vi.advanceTimersByTime(RE_RUN_REVIEW_PROGRESS_TICK_MS);
    });

    expect(result.current).toBe(RE_RUN_REVIEW_PROGRESS_TICK_MS);

    rerender({ stageLabel: "Running agents" });

    expect(result.current).toBe(0);

    act(() => {
      vi.advanceTimersByTime(RE_RUN_REVIEW_PROGRESS_TICK_MS);
    });

    expect(result.current).toBe(RE_RUN_REVIEW_PROGRESS_TICK_MS);
  });
});
