import { act, renderHook, type ReactNode } from "@testing-library/react";
import { createElement, useSyncExternalStore } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const searchParamsHarness = vi.hoisted(() => {
  const listeners = new Set<() => void>();
  const state = { query: "" };

  return {
    state,
    subscribe(listener: () => void): () => void {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
    applyQuery(query: string): void {
      state.query = query;

      for (const listener of listeners) {
        listener();
      }
    },
    reset(): void {
      state.query = "";
    },
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/governance/findings",
  useSearchParams: () => new URLSearchParams(searchParamsHarness.state.query),
}));

vi.mock("@/components/product-line/ProductLineProvider", () => ({
  useProductLine: () => ({ productLine: "architecture" }),
}));

const readCachedLastOpenArchitectureId = vi.hoisted(() => vi.fn(() => null));

vi.mock("@/lib/desk-continuity-preference", () => ({
  readCachedLastOpenArchitectureId,
}));

import { writeGroupByResourcePreference } from "@/lib/governance/governance-findings-group-by-resource-storage";

import { useGovernanceFindingsFilter } from "@/components/governance/findings/use-governance-findings-filter";

function SearchParamsRerenderHost({ children }: { readonly children: ReactNode }) {
  useSyncExternalStore(
    searchParamsHarness.subscribe,
    () => searchParamsHarness.state.query,
    () => "",
  );

  return createElement("div", null, children);
}

describe("useGovernanceFindingsFilter URL sync", () => {
  beforeEach(() => {
    searchParamsHarness.reset();
    window.localStorage.clear();
  });

  it("follows filter= URL changes without a popstate event", () => {
    searchParamsHarness.state.query = "filter=open";

    const { result, rerender } = renderHook(() => useGovernanceFindingsFilter({ mode: "tenant" }), {
      wrapper: SearchParamsRerenderHost,
    });

    expect(result.current.registerFilter).toBe("open");

    searchParamsHarness.applyQuery("");
    rerender();

    expect(result.current.registerFilter).toBe("all");
  });

  it("preserves in-session groupBy when URL never had groupBy and another param changes", () => {
    const { result, rerender } = renderHook(() => useGovernanceFindingsFilter({ mode: "tenant" }), {
      wrapper: SearchParamsRerenderHost,
    });

    act(() => {
      result.current.applyGroupByResource(true);
    });
    rerender();
    expect(result.current.groupByResource).toBe(true);

    searchParamsHarness.applyQuery("filter=open");
    rerender();

    expect(result.current.groupByResource).toBe(true);
  });

  it("turns groupBy off when groupBy= is cleared from the URL without a popstate event", () => {
    writeGroupByResourcePreference(true);
    searchParamsHarness.state.query = "groupBy=resource&runId=run-1";

    const { result, rerender } = renderHook(() => useGovernanceFindingsFilter({ mode: "tenant" }), {
      wrapper: SearchParamsRerenderHost,
    });

    expect(result.current.groupByResource).toBe(true);

    searchParamsHarness.applyQuery("runId=run-1");
    rerender();

    expect(result.current.groupByResource).toBe(false);
  });

  it("clears architecture scope when architectureId= is removed from the URL without a popstate event", () => {
    readCachedLastOpenArchitectureId.mockReturnValue("arch-cached");

    searchParamsHarness.state.query = "architectureId=arch-explicit";

    const { result, rerender } = renderHook(
      () => useGovernanceFindingsFilter({ mode: "tenant", isWorkingMode: true }),
      { wrapper: SearchParamsRerenderHost },
    );

    expect(result.current.scopedArchitectureId).toBe("arch-explicit");

    searchParamsHarness.applyQuery("");
    rerender();

    expect(result.current.scopedArchitectureId).toBeNull();
  });

  it("clears desk-continuity architecture when setScopedArchitectureId(null) without architectureId in URL", () => {
    readCachedLastOpenArchitectureId.mockReturnValue("arch-cached");

    const { result, rerender } = renderHook(
      () => useGovernanceFindingsFilter({ mode: "tenant", isWorkingMode: true }),
      { wrapper: SearchParamsRerenderHost },
    );

    expect(result.current.scopedArchitectureId).toBe("arch-cached");

    act(() => {
      result.current.setScopedArchitectureId(null);
    });
    rerender();

    expect(result.current.scopedArchitectureId).toBeNull();
  });

  it("follows groupBy URL changes without a popstate event", () => {
    searchParamsHarness.state.query = "groupBy=resource";

    const { result, rerender } = renderHook(() => useGovernanceFindingsFilter({ mode: "tenant" }), {
      wrapper: SearchParamsRerenderHost,
    });

    expect(result.current.groupByResource).toBe(true);

    searchParamsHarness.applyQuery("");
    rerender();

    expect(result.current.groupByResource).toBe(false);
  });
});
