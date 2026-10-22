import { render, screen } from "@testing-library/react";
import { createElement, useSyncExternalStore } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

import { GovernanceFindingsQueueSearchField } from "@/components/governance/findings/GovernanceFindingsQueueSearchField";
import { GOVERNANCE_FINDINGS_QUEUE_FACETS_STORAGE_KEY } from "@/lib/governance/governance-findings-queue-facets-storage";

function SearchParamsRerenderHost({ children }: { readonly children: React.ReactNode }) {
  useSyncExternalStore(
    searchParamsHarness.subscribe,
    () => searchParamsHarness.state.query,
    () => "",
  );

  return createElement("div", null, children);
}

describe("GovernanceFindingsQueueSearchField URL sync", () => {
  beforeEach(() => {
    searchParamsHarness.reset();
    window.localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("preserves storage search query when URL has no q param", () => {
    window.localStorage.setItem(
      GOVERNANCE_FINDINGS_QUEUE_FACETS_STORAGE_KEY,
      JSON.stringify({ registerFilter: "open", searchQuery: "phi" }),
    );

    render(<GovernanceFindingsQueueSearchField />, { wrapper: SearchParamsRerenderHost });

    expect(screen.getByTestId("governance-findings-queue-search")).toHaveValue("phi");
  });

  it("follows q= URL changes without a popstate event", () => {
    searchParamsHarness.state.query = "q=network";

    const { rerender } = render(<GovernanceFindingsQueueSearchField />, { wrapper: SearchParamsRerenderHost });

    expect(screen.getByTestId("governance-findings-queue-search")).toHaveValue("network");

    searchParamsHarness.applyQuery("");
    rerender(<GovernanceFindingsQueueSearchField />);

    expect(screen.getByTestId("governance-findings-queue-search")).toHaveValue("");
  });
});
