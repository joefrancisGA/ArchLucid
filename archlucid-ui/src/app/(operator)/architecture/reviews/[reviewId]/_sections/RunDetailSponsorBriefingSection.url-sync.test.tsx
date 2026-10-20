import { render, screen, waitFor } from "@testing-library/react";
import { createElement, useSyncExternalStore, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RUN_DETAIL_SPONSOR_BRIEFING_OPEN_PARAM } from "@/lib/runs/run-detail-sponsor-briefing-disclosure-url";

import { RunDetailSponsorBriefingSection } from "./RunDetailSponsorBriefingSection";

vi.mock("./run-detail-sponsor-briefing-deferred-chunks", () => ({
  EmailRunToSponsorBannerDeferred: () => null,
  PilotRoiValidationHandoffClientDeferred: () => null,
}));

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

describe("RunDetailSponsorBriefingSection URL sync", () => {
  beforeEach(() => {
    searchParamsHarness.reset();
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?reviewTab=overview");
  });

  it("follows runDetailSponsorBriefingOpen query changes without a popstate event", async () => {
    const { rerender } = render(
      <SearchParamsRerenderHost>
        <RunDetailSponsorBriefingSection
          runId="run-abc"
          manifestId="manifest-1"
          curatedSampleRun={false}
          buyerPolishedArtifactTable={true}
          sponsorDocxAvailable={false}
        />
      </SearchParamsRerenderHost>,
    );

    const details = () => screen.getByTestId("run-detail-sponsor-briefing");
    expect(details()).toHaveAttribute("open");

    searchParamsHarness.applyQuery(`reviewTab=overview&${RUN_DETAIL_SPONSOR_BRIEFING_OPEN_PARAM}=0`);
    window.history.replaceState(
      {},
      "",
      `/architecture/reviews/run-abc?reviewTab=overview&${RUN_DETAIL_SPONSOR_BRIEFING_OPEN_PARAM}=0`,
    );
    rerender(
      <SearchParamsRerenderHost>
        <RunDetailSponsorBriefingSection
          runId="run-abc"
          manifestId="manifest-1"
          curatedSampleRun={false}
          buyerPolishedArtifactTable={true}
          sponsorDocxAvailable={false}
        />
      </SearchParamsRerenderHost>,
    );

    await waitFor(() => {
      expect(details()).not.toHaveAttribute("open");
    });
  });
});
