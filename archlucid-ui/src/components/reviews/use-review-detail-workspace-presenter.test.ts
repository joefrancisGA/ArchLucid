import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useReviewDetailWorkspacePresenter } from "@/components/reviews/use-review-detail-workspace-presenter";

const searchParamsHarness = vi.hoisted(() => ({
  query: "reviewTab=overview",
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/architecture/reviews/run-b",
  useSearchParams: () => new URLSearchParams(searchParamsHarness.query),
}));

describe("useReviewDetailWorkspacePresenter", () => {
  beforeEach(() => {
    searchParamsHarness.query = "reviewTab=overview";
    window.history.replaceState(
      {},
      "",
      "/architecture/reviews/run-a?reviewTab=findings&q=stale-payment",
    );
  });

  it("enters presenter mode from useSearchParams when window.location.search lags after soft navigation", () => {
    const { result } = renderHook(() => useReviewDetailWorkspacePresenter());

    act(() => {
      result.current.enterPresenter();
    });

    expect(window.location.pathname + window.location.search).toBe(
      "/architecture/reviews/run-b?reviewTab=overview&presenter=1",
    );
  });
});
