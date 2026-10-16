import { render, screen, waitFor } from "@testing-library/react";
import { createElement, useSyncExternalStore, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RUN_TECHNICAL_DETAILS_OPEN_PARAM } from "@/lib/runs/run-detail-operator-technical-disclosure-url";

import { RunDetailOperatorTechnicalDisclosure } from "./RunDetailOperatorTechnicalDisclosure";

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

describe("RunDetailOperatorTechnicalDisclosure URL sync", () => {
  beforeEach(() => {
    searchParamsHarness.reset();
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?reviewTab=overview");
  });

  it("follows runTechnicalDetailsOpen query changes without a popstate event", async () => {
    const { rerender } = render(
      <SearchParamsRerenderHost>
        <RunDetailOperatorTechnicalDisclosure>
          <p>Trace metadata</p>
        </RunDetailOperatorTechnicalDisclosure>
      </SearchParamsRerenderHost>,
    );

    const trigger = () => screen.getByRole("button", { name: "Technical details" });
    expect(trigger()).toHaveAttribute("aria-expanded", "false");

    searchParamsHarness.applyQuery(`reviewTab=overview&${RUN_TECHNICAL_DETAILS_OPEN_PARAM}=1`);
    window.history.replaceState(
      {},
      "",
      `/architecture/reviews/run-abc?reviewTab=overview&${RUN_TECHNICAL_DETAILS_OPEN_PARAM}=1`,
    );
    rerender(
      <SearchParamsRerenderHost>
        <RunDetailOperatorTechnicalDisclosure>
          <p>Trace metadata</p>
        </RunDetailOperatorTechnicalDisclosure>
      </SearchParamsRerenderHost>,
    );

    await waitFor(() => {
      expect(trigger()).toHaveAttribute("aria-expanded", "true");
    });
  });
});
