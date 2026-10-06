import { render, screen } from "@testing-library/react";
import { createElement, useSyncExternalStore, type ReactNode } from "react";
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
  usePathname: () => "/architecture/reviews/run-abc",
  useSearchParams: () => new URLSearchParams(searchParamsHarness.state.query),
}));

import { ReviewFailureTechnicalMetadataDisclosure } from "@/components/reviews/ReviewFailureTechnicalMetadataDisclosure";

function SearchParamsRerenderHost({ children }: { readonly children: ReactNode }) {
  useSyncExternalStore(
    searchParamsHarness.subscribe,
    () => searchParamsHarness.state.query,
    () => "",
  );

  return createElement("div", null, children);
}

const failureProps = {
  runId: "run-abc",
  lastFailureSummary: {
    failureClass: "invalidOperation",
    reasonCode: "NoScheduledAgentTasks",
  },
};

describe("ReviewFailureTechnicalMetadataDisclosure", () => {
  beforeEach(() => {
    searchParamsHarness.reset();
    window.history.replaceState({}, "", "/architecture/reviews/run-abc");
  });

  it("follows reviewFailureTechnicalMetadataOpen query changes without a popstate event", () => {
    const { rerender } = render(
      <SearchParamsRerenderHost>
        <ReviewFailureTechnicalMetadataDisclosure {...failureProps} />
      </SearchParamsRerenderHost>,
    );

    const details = () => screen.getByTestId("review-package-failure-technical-metadata");

    expect(details()).not.toHaveAttribute("open");

    searchParamsHarness.applyQuery("reviewFailureTechnicalMetadataOpen=1");
    window.history.replaceState(
      {},
      "",
      "/architecture/reviews/run-abc?reviewFailureTechnicalMetadataOpen=1",
    );
    rerender(
      <SearchParamsRerenderHost>
        <ReviewFailureTechnicalMetadataDisclosure {...failureProps} />
      </SearchParamsRerenderHost>,
    );

    expect(details()).toHaveAttribute("open");

    searchParamsHarness.applyQuery("");
    window.history.replaceState({}, "", "/architecture/reviews/run-abc");
    rerender(
      <SearchParamsRerenderHost>
        <ReviewFailureTechnicalMetadataDisclosure {...failureProps} />
      </SearchParamsRerenderHost>,
    );

    expect(details()).not.toHaveAttribute("open");
  });
});
