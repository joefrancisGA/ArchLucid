import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { RunSummary } from "@/types/authority";

const refresh = vi.fn();
const useRunSummaryStreamMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh,
  }),
}));

vi.mock("@/hooks/useRunSummaryStream", () => ({
  useRunSummaryStream: (...args: unknown[]) => useRunSummaryStreamMock(...args),
}));

import { useIncrementalReviewFindingsRefresh } from "./use-incremental-review-findings-refresh";

function summaryWithFindings(hasFindingsSnapshot: boolean): RunSummary {
  return { hasFindingsSnapshot } as unknown as RunSummary;
}

describe("useIncrementalReviewFindingsRefresh", () => {
  beforeEach(() => {
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
  });
});
