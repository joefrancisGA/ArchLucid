import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const pathnameHarness = vi.hoisted(() => ({
  value: "/architecture/reviews/run-1",
}));

vi.mock("next/navigation", () => ({
  usePathname: () => pathnameHarness.value,
}));

import { useRunDetailFindingsToolbarState } from "@/components/findings/use-run-detail-findings-toolbar-state";

describe("useRunDetailFindingsToolbarState", () => {
  afterEach(() => {
    pathnameHarness.value = "/architecture/reviews/run-1";
    window.history.replaceState({}, "", "/");
    vi.useRealTimers();
  });

  it("does not publish the previous review toolbar onto the next review URL", () => {
    vi.useFakeTimers();
    window.history.replaceState({}, "", "/architecture/reviews/run-1?reviewTab=findings");

    const { result, rerender } = renderHook(() => useRunDetailFindingsToolbarState());

    act(() => {
      result.current.setSearchQuery("payment");
      result.current.setOwnerFilter("alex");
      result.current.setFilter("high");
    });

    act(() => {
      vi.advanceTimersByTime(250);
    });

    expect(window.location.pathname).toBe("/architecture/reviews/run-1");
    expect(window.location.search).toContain("q=payment");
    expect(window.location.search).toContain("owner=alex");

    window.history.replaceState({}, "", "/architecture/reviews/run-2?reviewTab=findings");
    pathnameHarness.value = "/architecture/reviews/run-2";
    rerender();

    act(() => {
      vi.advanceTimersByTime(250);
    });

    expect(window.location.pathname).toBe("/architecture/reviews/run-2");
    expect(window.location.search).not.toContain("q=payment");
    expect(window.location.search).not.toContain("owner=alex");
    expect(result.current.filter).toBe("all");
    expect(result.current.searchQuery).toBe("");
    expect(result.current.ownerFilter).toBe("");
  });
});
