<<<<<<< HEAD
import { act, renderHook } from "@testing-library/react";
=======
import { renderHook, waitFor } from "@testing-library/react";
>>>>>>> e6428a95ee (fix(ui): address PR #959 CI and review feedback)
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { RunSummary } from "@/types/authority";

<<<<<<< HEAD
const refresh = vi.fn();
const useRunSummaryStreamMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh,
  }),
}));

vi.mock("@/hooks/useRunSummaryStream", () => ({
  useRunSummaryStream: (...args: unknown[]) => useRunSummaryStreamMock(...args),
=======
const routerRefresh = vi.fn();
let streamedSummary: RunSummary | null = null;

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: routerRefresh }),
}));

vi.mock("@/hooks/useRunSummaryStream", () => ({
  useRunSummaryStream: () => ({ summary: streamedSummary }),
>>>>>>> e6428a95ee (fix(ui): address PR #959 CI and review feedback)
}));

import { useIncrementalReviewFindingsRefresh } from "./use-incremental-review-findings-refresh";

<<<<<<< HEAD
function summaryWithFindings(hasFindingsSnapshot: boolean): RunSummary {
  return { hasFindingsSnapshot } as unknown as RunSummary;
=======
function runSummary(hasFindingsSnapshot: boolean): RunSummary {
  return {
    runId: "run-1",
    hasFindingsSnapshot,
  } as RunSummary;
>>>>>>> e6428a95ee (fix(ui): address PR #959 CI and review feedback)
}

describe("useIncrementalReviewFindingsRefresh", () => {
  beforeEach(() => {
<<<<<<< HEAD
    refresh.mockReset();
    useRunSummaryStreamMock.mockReset();
  });

  it("refreshes only on the first false-to-true findings snapshot transition", () => {
    let summary: RunSummary | null = null;
    useRunSummaryStreamMock.mockImplementation(() => ({ summary }));

    const { rerender } = renderHook(
      ({ runId, enabled, initialHasFindingsSnapshot }: { runId: string; enabled: boolean; initialHasFindingsSnapshot?: boolean }) =>
        useIncrementalReviewFindingsRefresh({ runId, enabled, initialHasFindingsSnapshot }),
      { initialProps: { runId: "run-1", enabled: true, initialHasFindingsSnapshot: undefined } },
    );

    act(() => {
      summary = summaryWithFindings(false);
      rerender({ runId: "run-1", enabled: true, initialHasFindingsSnapshot: undefined });
    });

    expect(refresh).not.toHaveBeenCalled();

    act(() => {
      summary = summaryWithFindings(true);
      rerender({ runId: "run-1", enabled: true, initialHasFindingsSnapshot: undefined });
    });

    expect(refresh).toHaveBeenCalledTimes(1);

    act(() => {
      summary = summaryWithFindings(true);
      rerender({ runId: "run-1", enabled: true, initialHasFindingsSnapshot: undefined });
    });

    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("never refreshes when disabled", () => {
    let summary: RunSummary | null = summaryWithFindings(false);
    useRunSummaryStreamMock.mockImplementation(() => ({ summary }));

    const { rerender } = renderHook(
      ({ runId, enabled }: { runId: string; enabled: boolean }) =>
        useIncrementalReviewFindingsRefresh({ runId, enabled }),
      { initialProps: { runId: "run-1", enabled: false } },
    );

    act(() => {
      summary = summaryWithFindings(true);
      rerender({ runId: "run-1", enabled: false });
    });

    expect(refresh).not.toHaveBeenCalled();
=======
    routerRefresh.mockReset();
    streamedSummary = null;
  });

  it("does not refresh when disabled", async () => {
    streamedSummary = runSummary(true);

    renderHook(() =>
      useIncrementalReviewFindingsRefresh({
        runId: "run-1",
        enabled: false,
      }),
    );

    await waitFor(() => {
      expect(routerRefresh).not.toHaveBeenCalled();
    });
  });

  it("does not refresh on the first streamed summary baseline", async () => {
    streamedSummary = runSummary(true);

    renderHook(() =>
      useIncrementalReviewFindingsRefresh({
        runId: "run-1",
        enabled: true,
      }),
    );

    await waitFor(() => {
      expect(routerRefresh).not.toHaveBeenCalled();
    });
  });

  it("refreshes only on the first false-to-true findings snapshot transition", async () => {
    streamedSummary = runSummary(false);

    const { rerender } = renderHook(() =>
      useIncrementalReviewFindingsRefresh({
        runId: "run-1",
        enabled: true,
      }),
    );

    await waitFor(() => {
      expect(routerRefresh).not.toHaveBeenCalled();
    });

    streamedSummary = runSummary(true);
    rerender();

    await waitFor(() => {
      expect(routerRefresh).toHaveBeenCalledTimes(1);
    });

    streamedSummary = runSummary(true);
    rerender();

    await waitFor(() => {
      expect(routerRefresh).toHaveBeenCalledTimes(1);
    });
  });

  it("resets baseline when runId changes", async () => {
    streamedSummary = runSummary(false);

    const { rerender } = renderHook(
      ({ runId }: { runId: string }) =>
        useIncrementalReviewFindingsRefresh({
          runId,
          enabled: true,
        }),
      { initialProps: { runId: "run-1" } },
    );

    streamedSummary = runSummary(true);
    rerender({ runId: "run-1" });

    await waitFor(() => {
      expect(routerRefresh).toHaveBeenCalledTimes(1);
    });

    routerRefresh.mockReset();
    streamedSummary = runSummary(false);
    rerender({ runId: "run-2" });

    streamedSummary = runSummary(true);
    rerender({ runId: "run-2" });

    await waitFor(() => {
      expect(routerRefresh).toHaveBeenCalledTimes(1);
    });
>>>>>>> e6428a95ee (fix(ui): address PR #959 CI and review feedback)
  });
});
