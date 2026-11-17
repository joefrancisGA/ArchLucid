import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { RunSummary } from "@/types/authority";

const routerRefresh = vi.fn();
let streamedSummary: RunSummary | null = null;

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: routerRefresh }),
}));

vi.mock("@/hooks/useRunSummaryStream", () => ({
  useRunSummaryStream: () => ({ summary: streamedSummary }),
}));

import { useIncrementalReviewFindingsRefresh } from "./use-incremental-review-findings-refresh";

function runSummary(runId: string, hasFindingsSnapshot: boolean): RunSummary {
  return {
    runId,
    hasFindingsSnapshot,
  } as RunSummary;
}

describe("useIncrementalReviewFindingsRefresh", () => {
  beforeEach(() => {
    routerRefresh.mockReset();
    streamedSummary = null;
  });

  it("does not refresh when disabled", async () => {
    streamedSummary = runSummary("run-1", true);

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
    streamedSummary = runSummary("run-1", true);

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
    streamedSummary = runSummary("run-1", false);

    const { rerender } = renderHook(() =>
      useIncrementalReviewFindingsRefresh({
        runId: "run-1",
        enabled: true,
      }),
    );

    await waitFor(() => {
      expect(routerRefresh).not.toHaveBeenCalled();
    });

    streamedSummary = runSummary("run-1", true);
    rerender();

    await waitFor(() => {
      expect(routerRefresh).toHaveBeenCalledTimes(1);
    });

    streamedSummary = runSummary("run-1", true);
    rerender();

    await waitFor(() => {
      expect(routerRefresh).toHaveBeenCalledTimes(1);
    });
  });

  it("resets baseline when runId changes", async () => {
    streamedSummary = runSummary("run-1", false);

    const { rerender } = renderHook(
      ({ runId }: { runId: string }) =>
        useIncrementalReviewFindingsRefresh({
          runId,
          enabled: true,
        }),
      { initialProps: { runId: "run-1" } },
    );

    streamedSummary = runSummary("run-1", true);
    rerender({ runId: "run-1" });

    await waitFor(() => {
      expect(routerRefresh).toHaveBeenCalledTimes(1);
    });

    routerRefresh.mockReset();
    streamedSummary = runSummary("run-2", false);
    rerender({ runId: "run-2" });

    streamedSummary = runSummary("run-2", true);
    rerender({ runId: "run-2" });

    await waitFor(() => {
      expect(routerRefresh).toHaveBeenCalledTimes(1);
    });
  });
});
