import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createElement, useSyncExternalStore, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RunDetailOverviewTransparencyTrail } from "@/components/reviews/RunDetailOverviewTransparencyTrail";
import { TRANSPARENCY_TRAIL_OPEN_PARAM } from "@/lib/reviews/transparency-trail-open-url";

const workspaceModeMock = vi.hoisted(() => ({ isWorkingMode: false }));

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

vi.mock("@/components/WorkspaceModeProvider", () => ({
  useWorkspaceMode: () => ({
    isWorkingMode: workspaceModeMock.isWorkingMode,
  }),
}));

const pathnameMock = vi.hoisted(() => ({ value: "/architecture/reviews/run-b" }));

vi.mock("next/navigation", () => ({
  usePathname: () => pathnameMock.value,
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

const sampleVerdict = {
  kind: "SoftInfeasible" as const,
  summary: "Not feasible as specified.",
  transparencyTrail: {
    asserted: [{ key: "businessOutcome", value: "Reduce triage time" }],
    inferred: [],
    skipped: [],
  },
};

describe("RunDetailOverviewTransparencyTrail URL sync", () => {
  beforeEach(() => {
    workspaceModeMock.isWorkingMode = false;
    searchParamsHarness.reset();
    pathnameMock.value = "/architecture/reviews/run-b";
    window.history.replaceState(
      {},
      "",
      "/architecture/reviews/run-a?reviewTab=findings&q=stale-payment",
    );
  });

  it("opens transparency trail from useSearchParams when window.location.search lags after soft navigation", async () => {
    searchParamsHarness.state.query = "reviewTab=overview";

    render(
      <SearchParamsRerenderHost>
        <RunDetailOverviewTransparencyTrail feasibilityVerdict={sampleVerdict} runCompleted={false} />
      </SearchParamsRerenderHost>,
    );

    fireEvent.click(screen.getByText("Transparency trail"));

    await waitFor(() => {
      expect(window.location.pathname + window.location.search).toBe(
        `/architecture/reviews/run-b?reviewTab=overview&${TRANSPARENCY_TRAIL_OPEN_PARAM}=1`,
      );
    });
  });

  it("follows transparencyTrailOpen query changes without a popstate event", async () => {
    const { rerender } = render(
      <SearchParamsRerenderHost>
        <RunDetailOverviewTransparencyTrail feasibilityVerdict={sampleVerdict} runCompleted={false} />
      </SearchParamsRerenderHost>,
    );

    const panel = () => screen.getByTestId("transparency-trail-panel");
    expect(panel()).not.toHaveAttribute("open");

    searchParamsHarness.applyQuery(`reviewTab=overview&${TRANSPARENCY_TRAIL_OPEN_PARAM}=1`);
    window.history.replaceState(
      {},
      "",
      `/architecture/reviews/run-b?reviewTab=overview&${TRANSPARENCY_TRAIL_OPEN_PARAM}=1`,
    );
    rerender(
      <SearchParamsRerenderHost>
        <RunDetailOverviewTransparencyTrail feasibilityVerdict={sampleVerdict} runCompleted={false} />
      </SearchParamsRerenderHost>,
    );

    await waitFor(() => {
      expect(panel()).toHaveAttribute("open");
    });
  });
});
