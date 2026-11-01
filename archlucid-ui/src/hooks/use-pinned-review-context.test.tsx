import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { usePinnedReviewContext } from "./use-pinned-review-context";

let searchQuery = "pinRunId=pinned-review&tab=old";

vi.mock("next/navigation", () => ({
  usePathname: () => "/architecture/reviews/current-review",
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(searchQuery),
}));

vi.mock("@/components/WorkspaceModeProvider", () => ({
  useWorkspaceMode: () => ({ isWorkingMode: true }),
}));

vi.mock("@/hooks/use-run-summary-query", () => ({
  useRunSummaryQuery: () => ({
    data: undefined,
    error: null,
    isLoading: false,
  }),
}));

vi.mock("@/hooks/use-pinned-review-explanation-query", () => ({
  usePinnedReviewExplanationQuery: () => ({
    data: undefined,
    isLoading: false,
  }),
}));

describe("usePinnedReviewContext", () => {
  beforeEach(() => {
    searchQuery = "pinRunId=pinned-review&tab=old";
    window.history.replaceState(null, "", "/architecture/reviews/current-review?pinRunId=pinned-review&tab=old");
  });

  it("preserves the current router query when closing after soft navigation", () => {
    const { result, rerender } = renderHook(() => usePinnedReviewContext("current-review"));

    searchQuery = "pinRunId=pinned-review&tab=new";
    rerender();

    act(() => {
      result.current.closePin();
    });

    expect(window.location.search).toBe("?tab=new");
  });
});
