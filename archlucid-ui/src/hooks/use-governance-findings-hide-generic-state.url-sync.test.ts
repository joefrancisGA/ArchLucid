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

import { useGovernanceFindingsHideGenericState } from "@/hooks/use-governance-findings-hide-generic-state";
import { resetFindingsVisibilitySessionStateForTests } from "@/lib/findings/findings-visibility-preference";

function SearchParamsRerenderHost({ children }: { readonly children: ReactNode }) {
  useSyncExternalStore(
    searchParamsHarness.subscribe,
    () => searchParamsHarness.state.query,
    () => "",
  );

  return createElement("div", null, children);
}

describe("GovernanceFindingsQueueClient hideGeneric URL sync", () => {
  beforeEach(() => {
    searchParamsHarness.reset();
    resetFindingsVisibilitySessionStateForTests();
  });

  it("follows hideGeneric URL changes without a popstate event", () => {
    searchParamsHarness.state.query = "hideGeneric=1";

    const { result, rerender } = renderHook(() => useGovernanceFindingsHideGenericState(), {
      wrapper: SearchParamsRerenderHost,
    });

    expect(result.current.hideGenericLowDensity).toBe(true);

    searchParamsHarness.applyQuery("");
    rerender();

    expect(result.current.hideGenericLowDensity).toBe(false);
  });
});
