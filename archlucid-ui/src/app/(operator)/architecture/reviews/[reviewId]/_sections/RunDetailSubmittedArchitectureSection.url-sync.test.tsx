import { render, screen, waitFor } from "@testing-library/react";
import { createElement, useSyncExternalStore, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SUBMITTED_ARCHITECTURE_OPEN_PARAM } from "@/lib/reviews/submitted-architecture-disclosure-url";

import { RunDetailSubmittedArchitectureSection } from "./RunDetailSubmittedArchitectureSection";

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

describe("RunDetailSubmittedArchitectureSection URL sync", () => {
  beforeEach(() => {
    searchParamsHarness.reset();
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?reviewTab=overview");
  });

  it("follows submittedArchitectureOpen query changes without a popstate event", async () => {
    const { rerender } = render(
      <SearchParamsRerenderHost>
        <RunDetailSubmittedArchitectureSection
          architectureText={null}
          canEditSource={false}
          editHref={null}
        />
      </SearchParamsRerenderHost>,
    );

    const sectionDetails = () => screen.getByTestId("submitted-architecture-collapsible");
    expect(sectionDetails()).not.toHaveAttribute("open");

    searchParamsHarness.applyQuery(`reviewTab=overview&${SUBMITTED_ARCHITECTURE_OPEN_PARAM}=1`);
    window.history.replaceState(
      {},
      "",
      `/architecture/reviews/run-abc?reviewTab=overview&${SUBMITTED_ARCHITECTURE_OPEN_PARAM}=1`,
    );
    rerender(
      <SearchParamsRerenderHost>
        <RunDetailSubmittedArchitectureSection
          architectureText={null}
          canEditSource={false}
          editHref={null}
        />
      </SearchParamsRerenderHost>,
    );

    await waitFor(() => {
      expect(sectionDetails()).toHaveAttribute("open");
    });
  });
});
