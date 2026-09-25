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

import { useGovernanceFindingsQueueFacets } from "@/app/(operator)/governance/findings/use-governance-findings-queue-facets";
import { EMPTY_FINDINGS_NATURAL_LANGUAGE_FACETS } from "@/lib/findings/findings-natural-language-filter";

function SearchParamsRerenderHost({ children }: { readonly children: ReactNode }) {
  useSyncExternalStore(
    searchParamsHarness.subscribe,
    () => searchParamsHarness.state.query,
    () => "",
  );

  return createElement("div", null, children);
}

describe("useGovernanceFindingsQueueFacets URL sync", () => {
  beforeEach(() => {
    searchParamsHarness.reset();
    window.localStorage.clear();
  });

  it("follows NL facet URL changes without a popstate event", () => {
    searchParamsHarness.state.query = "severity=critical&status=open";

    const { result, rerender } = renderHook(() => useGovernanceFindingsQueueFacets("tenant"), {
      wrapper: SearchParamsRerenderHost,
    });

    expect(result.current.nlFacets).toEqual({
      severity: "critical",
      status: "open",
      titleKeywords: [],
    });

    searchParamsHarness.applyQuery("");
    rerender();

    expect(result.current.nlFacets).toEqual(EMPTY_FINDINGS_NATURAL_LANGUAGE_FACETS);
  });
});
