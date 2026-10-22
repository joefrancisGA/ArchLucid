import { render, waitFor } from "@testing-library/react";
import { createElement, useSyncExternalStore, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RUN_DETAIL_WORKSPACE_DISCLOSURES_EXPANDED_PARAM } from "@/lib/runs/run-detail-workspace-disclosures-expanded-disclosure-url";

import { RunDetailWorkspaceDisclosureProvider } from "./RunDetailWorkspaceShell";

const searchParamsHarness = vi.hoisted(() => {
  const listeners = new Set<() => void>();
  const state = { query: "reviewTab=overview" };

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
      state.query = "reviewTab=overview";
    },
  };
});

vi.mock("next/navigation", () => ({
  usePathname: () => "/architecture/reviews/run-abc",
  useSearchParams: () => new URLSearchParams(searchParamsHarness.state.query),
}));

function SearchParamsRerenderHost({ children }: { readonly children: ReactNode }) {
  useSyncExternalStore(
    searchParamsHarness.subscribe,
    () => searchParamsHarness.state.query,
    () => "reviewTab=overview",
  );

  return createElement("div", null, children);
}

describe("RunDetailWorkspaceDisclosureProvider URL sync", () => {
  beforeEach(() => {
    searchParamsHarness.reset();
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?reviewTab=overview");
  });

  it("follows runDetailWorkspaceDisclosuresExpanded query changes without a popstate event", async () => {
    const { rerender } = render(
      <SearchParamsRerenderHost>
        <RunDetailWorkspaceDisclosureProvider>
          <details data-workspace-disclosure>
            <summary>Section A</summary>
          </details>
        </RunDetailWorkspaceDisclosureProvider>
      </SearchParamsRerenderHost>,
    );

    const disclosure = () => document.querySelector<HTMLDetailsElement>("details[data-workspace-disclosure]");
    expect(disclosure()?.open).toBe(false);

    searchParamsHarness.applyQuery(
      `reviewTab=overview&${RUN_DETAIL_WORKSPACE_DISCLOSURES_EXPANDED_PARAM}=1`,
    );
    window.history.replaceState(
      {},
      "",
      `/architecture/reviews/run-abc?reviewTab=overview&${RUN_DETAIL_WORKSPACE_DISCLOSURES_EXPANDED_PARAM}=1`,
    );
    rerender(
      <SearchParamsRerenderHost>
        <RunDetailWorkspaceDisclosureProvider>
          <details data-workspace-disclosure>
            <summary>Section A</summary>
          </details>
        </RunDetailWorkspaceDisclosureProvider>
      </SearchParamsRerenderHost>,
    );

    await waitFor(() => {
      expect(disclosure()?.open).toBe(true);
    });
  });
});
