import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { GovernanceResolutionPageViewModel } from "./governance-resolution-page-view-model";
import { useGovernanceResolutionRows } from "./use-governance-resolution-rows";

const navigation = vi.hoisted(() => {
  const router = { replace: vi.fn() };
  return { search: new URLSearchParams(), router };
});

vi.mock("next/navigation", () => ({
  usePathname: () => "/governance/standards-and-rules",
  useSearchParams: () => navigation.search,
  useRouter: () => navigation.router,
}));

const pathname = "/governance/standards-and-rules";
const model = {
  buyerPolishedShell: false,
  data: null,
  failure: null,
  lastRefreshedAt: null,
  loading: false,
} as GovernanceResolutionPageViewModel;

function setLocation(query: string) {
  navigation.search = new URLSearchParams(query);
  window.history.replaceState(null, "", `${pathname}?${query}`);
}

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  navigation.router.replace.mockClear();
});

describe("Standards & Rules filter navigation", () => {
  it("keeps a just-typed search when a severity chip navigates before the debounce", () => {
    vi.useFakeTimers();
    setLocation("q=prior");
    const { result, rerender } = renderHook(() => useGovernanceResolutionRows(model));

    act(() => {
      result.current.setSearchQuery("current");
      result.current.setFilters({ ...result.current.filters, searchQuery: "current" });
    });
    expect(result.current.searchQuery).toBe("current");

    act(() => {
      setLocation("q=prior&severity=high");
      rerender();
    });

    expect(result.current.searchQuery).toBe("current");
    expect(result.current.filters).toMatchObject({ searchQuery: "current", severity: "high" });
    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(navigation.router.replace).toHaveBeenLastCalledWith(
      `${pathname}?q=current&severity=high`, { scroll: false },
    );
  });

  it("adopts a different query when navigation changes q", () => {
    setLocation("q=prior");
    const { result, rerender } = renderHook(() => useGovernanceResolutionRows(model));

    act(() => {
      setLocation("q=other&severity=high");
      rerender();
    });

    expect(result.current.searchQuery).toBe("other");
    expect(result.current.filters).toMatchObject({ searchQuery: "other", severity: "high" });
  });
});
