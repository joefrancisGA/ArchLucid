import { render, screen, waitFor } from "@testing-library/react";
import { createElement, useSyncExternalStore, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SPONSOR_REHEARSAL_PREVIEW_OPEN_PARAM } from "@/lib/reviews/sponsor-rehearsal-preview-disclosure-url";

import { SponsorRehearsalPreviewPanel } from "./SponsorRehearsalPreviewPanel";

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

describe("SponsorRehearsalPreviewPanel URL sync", () => {
  beforeEach(() => {
    searchParamsHarness.reset();
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?reviewTab=overview");
  });

  it("follows sponsorRehearsalPreviewOpen query changes without a popstate event", async () => {
    const { rerender } = render(
      <SearchParamsRerenderHost>
        <SponsorRehearsalPreviewPanel input={{}} />
      </SearchParamsRerenderHost>,
    );

    const panel = () => screen.getByTestId("sponsor-rehearsal-preview");
    expect(panel()).not.toHaveAttribute("open");

    searchParamsHarness.applyQuery(`reviewTab=overview&${SPONSOR_REHEARSAL_PREVIEW_OPEN_PARAM}=1`);
    window.history.replaceState(
      {},
      "",
      `/architecture/reviews/run-abc?reviewTab=overview&${SPONSOR_REHEARSAL_PREVIEW_OPEN_PARAM}=1`,
    );
    rerender(
      <SearchParamsRerenderHost>
        <SponsorRehearsalPreviewPanel input={{}} />
      </SearchParamsRerenderHost>,
    );

    await waitFor(() => {
      expect(panel()).toHaveAttribute("open");
    });
  });
});
