import { renderHook, type ReactNode } from "@testing-library/react";
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

vi.mock("@/lib/desk-continuity-preference", () => ({
  readCachedLastOpenArchitectureId: vi.fn(() => null),
}));

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
});
