import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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

const pathnameMock = vi.hoisted(() => ({ value: "/architecture/reviews/run-b" }));

vi.mock("next/navigation", () => ({
  usePathname: () => pathnameMock.value,
  useSearchParams: () => new URLSearchParams(searchParamsHarness.state.query),
}));

import { ReviewFailureTechnicalMetadataDisclosure } from "@/components/reviews/ReviewFailureTechnicalMetadataDisclosure";
import { REVIEW_FAILURE_TECHNICAL_METADATA_OPEN_PARAM } from "@/lib/reviews/review-failure-technical-metadata-disclosure-url";

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
    pathnameMock.value = "/architecture/reviews/run-b";
    window.history.replaceState(
      {},
      "",
      "/architecture/reviews/run-a?reviewTab=findings&q=stale-payment",
    );
  });

  it("opens failure technical metadata from useSearchParams when window.location.search lags after soft navigation", async () => {
    searchParamsHarness.state.query = "reviewTab=overview";

    render(
      <SearchParamsRerenderHost>
        <ReviewFailureTechnicalMetadataDisclosure {...failureProps} runId="run-b" />
      </SearchParamsRerenderHost>,
    );

    fireEvent.click(screen.getByText("Technical failure detail"));

    await waitFor(() => {
      expect(window.location.pathname + window.location.search).toBe(
        `/architecture/reviews/run-b?reviewTab=overview&${REVIEW_FAILURE_TECHNICAL_METADATA_OPEN_PARAM}=1`,
      );
    });
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
      "/architecture/reviews/run-b?reviewFailureTechnicalMetadataOpen=1",
    );
    rerender(
      <SearchParamsRerenderHost>
        <ReviewFailureTechnicalMetadataDisclosure {...failureProps} />
      </SearchParamsRerenderHost>,
    );

    expect(details()).toHaveAttribute("open");

    searchParamsHarness.applyQuery("");
    window.history.replaceState({}, "", "/architecture/reviews/run-b");
    rerender(
      <SearchParamsRerenderHost>
        <ReviewFailureTechnicalMetadataDisclosure {...failureProps} />
      </SearchParamsRerenderHost>,
    );

    expect(details()).not.toHaveAttribute("open");
  });
});
