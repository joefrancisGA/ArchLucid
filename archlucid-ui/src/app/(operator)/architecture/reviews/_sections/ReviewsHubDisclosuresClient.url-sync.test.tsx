import { fireEvent, render, screen } from "@testing-library/react";
import { createElement, useSyncExternalStore, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { REVIEWS_HUB_MORE_WAYS_OPEN_PARAM } from "@/lib/reviews/reviews-hub-disclosure-url";

import { ReviewsHubDisclosuresClient } from "./ReviewsHubDisclosuresClient";

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

const committedHrefs = vi.hoisted(() => [] as string[]);

vi.mock("@/lib/navigation/replace-if-href-changed", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/navigation/replace-if-href-changed")>();

  return {
    ...actual,
    readWindowLocationSearch: () => searchParamsHarness.state.query,
    commitHrefIfChanged: (href: string) => {
      committedHrefs.push(href);

      return true;
    },
  };
});

vi.mock("next/navigation", () => ({
  usePathname: () => "/architecture/reviews",
  useSearchParams: () => new URLSearchParams(searchParamsHarness.state.query),
}));

vi.mock("@/components/operator/OperatorAttentionKindStrip", () => ({
  OperatorAttentionKindStrip: () => null,
}));
vi.mock("@/components/operator/ArchitectureObjectMapStrip", () => ({
  ArchitectureObjectMapStrip: () => null,
}));
vi.mock("./reviews-hub-deferred-chunks", () => ({
  ReviewsHubBeforeAfterDeltaPanelDeferred: () => null,
  ReviewsHubExploreSamplesDeferred: () => null,
  ReviewsHubPackageIncludesDeferred: () => null,
  RunsIndexBeforeAfterPanelDeferred: () => null,
}));

function SearchParamsRerenderHost({ children }: { readonly children: ReactNode }) {
  useSyncExternalStore(
    searchParamsHarness.subscribe,
    () => searchParamsHarness.state.query,
    () => "",
  );

  return createElement("div", null, children);
}

describe("ReviewsHubDisclosuresClient URL sync", () => {
  beforeEach(() => {
    searchParamsHarness.reset();
    committedHrefs.length = 0;
    window.history.replaceState({}, "", "/architecture/reviews");
  });

  it("writes reviews hub disclosure state from useSearchParams when window.location.search lags after soft navigation", () => {
    window.history.replaceState({}, "", "/architecture/reviews?staleToolbar=q-old");

    const { rerender } = render(
      <SearchParamsRerenderHost>
        <ReviewsHubDisclosuresClient attentionSuppressKinds={[]} firstCommittedRunId={null} />
      </SearchParamsRerenderHost>,
    );

    searchParamsHarness.applyQuery("");
    rerender(
      <SearchParamsRerenderHost>
        <ReviewsHubDisclosuresClient attentionSuppressKinds={[]} firstCommittedRunId={null} />
      </SearchParamsRerenderHost>,
    );

    const moreWays = screen.getByTestId("reviews-hub-more-ways") as HTMLDetailsElement;
    fireEvent(
      moreWays,
      new Event("toggle", {
        bubbles: true,
      }),
    );

    expect(committedHrefs.length).toBeGreaterThan(0);
    const lastHref = committedHrefs.at(-1) ?? "";
    expect(lastHref).toContain(`${REVIEWS_HUB_MORE_WAYS_OPEN_PARAM}=1`);
    expect(lastHref).not.toContain("staleToolbar");
    expect(lastHref).not.toContain("q-old");
  });
});
