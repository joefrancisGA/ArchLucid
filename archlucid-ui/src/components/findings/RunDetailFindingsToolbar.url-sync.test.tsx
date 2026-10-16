import { act, render, screen, waitFor } from "@testing-library/react";
import { createElement, useSyncExternalStore, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { FINDINGS_FILTER_PANEL_OPEN_PARAM } from "@/lib/findings/run-detail-findings-filter-disclosure-url";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";

import { RunDetailFindingsToolbar } from "./RunDetailFindingsToolbar";

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
  usePathname: () => "/architecture/reviews/run-1",
  useSearchParams: () => new URLSearchParams(searchParamsHarness.state.query),
  useRouter: () => ({ replace: vi.fn() }),
}));

function SearchParamsRerenderHost({ children }: { readonly children: ReactNode }) {
  useSyncExternalStore(
    searchParamsHarness.subscribe,
    () => searchParamsHarness.state.query,
    () => "",
  );

  return createElement("div", null, children);
}

const findings: QuickDecisionFinding[] = [
  {
    findingId: "f-1",
    title: "Finding one",
    recommendation: "",
    severityValue: 1,
    findingOrder: 0,
    isMuted: false,
    muteReason: null,
    enforcementTier: "Blocking",
    humanReviewStatus: null,
    aiReasoning: { reasoningTrace: "", wireJson: "{}" },
  },
];

function renderToolbar() {
  return (
    <SearchParamsRerenderHost>
      <RunDetailFindingsToolbar
        findings={findings}
        filter="all"
        onFilterChange={vi.fn()}
        jobView="triage"
        onJobViewChange={vi.fn()}
        ownerFilter=""
        onOwnerFilterChange={vi.fn()}
        domainFilter=""
        onDomainFilterChange={vi.fn()}
        searchQuery=""
        onSearchQueryChange={vi.fn()}
        sort="severity"
        onSortChange={vi.fn()}
        originFilter="all"
        onOriginFilterChange={vi.fn()}
        groundingFilter="all"
        onGroundingFilterChange={vi.fn()}
        layout="compact"
      />
    </SearchParamsRerenderHost>
  );
}

describe("RunDetailFindingsToolbar URL sync", () => {
  beforeEach(() => {
    searchParamsHarness.reset();
    window.history.replaceState({}, "", "/architecture/reviews/run-1");
  });

  it("follows findingsFilterPanelOpen query changes without a popstate event", async () => {
    const { rerender } = render(renderToolbar());

    const details = () => screen.getByText("Filter findings").closest("details") as HTMLDetailsElement;
    expect(details()).not.toHaveAttribute("open");

    act(() => {
      searchParamsHarness.applyQuery(`${FINDINGS_FILTER_PANEL_OPEN_PARAM}=1`);
      window.history.replaceState(
        {},
        "",
        `/architecture/reviews/run-1?${FINDINGS_FILTER_PANEL_OPEN_PARAM}=1`,
      );
    });
    rerender(renderToolbar());

    await waitFor(() => {
      expect(details()).toHaveAttribute("open");
    });
  });
});
