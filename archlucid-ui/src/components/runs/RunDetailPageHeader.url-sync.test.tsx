import { act, render, screen, waitFor } from "@testing-library/react";
import { createElement, useSyncExternalStore, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RUN_DETAIL_BUYER_SPONSOR_BRIEF_EXPORTS_OPEN_PARAM } from "@/lib/runs/run-detail-buyer-sponsor-brief-exports-disclosure-url";
import type { RunSummary } from "@/types/authority";

import { RunDetailPageHeader } from "./RunDetailPageHeader";

vi.mock("@/hooks/useProductionDeskChrome", () => ({
  useProductionEvalChrome: () => true,
}));

vi.mock("@/components/operator/OperatorNavAuthorityProvider", () => ({
  useNavCommittedArchitectureReview: () => false,
}));

vi.mock("@/components/runs/RunStatusBadge", () => ({
  RunStatusBadge: () => null,
}));

vi.mock("@/components/CommitRunButton", () => ({
  CommitRunButton: () => null,
}));

vi.mock("@/components/governance/GovernanceStatusTag", () => ({
  GovernanceStatusTag: () => null,
}));

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
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

function SearchParamsRerenderHost({ children }: { readonly children: ReactNode }) {
  useSyncExternalStore(
    searchParamsHarness.subscribe,
    () => searchParamsHarness.state.query,
    () => "",
  );

  return createElement("div", null, children);
}

const runSummary = {
  runId: "run-1",
  description: "Payments review",
} as RunSummary;

describe("RunDetailPageHeader URL sync", () => {
  beforeEach(() => {
    searchParamsHarness.reset();
    window.history.replaceState({}, "", "/architecture/reviews/run-1");
  });

  it("follows runDetailBuyerSponsorBriefExportsOpen query changes without a popstate event", async () => {
    const renderHeader = () => (
      <SearchParamsRerenderHost>
        <RunDetailPageHeader
          runSummary={runSummary}
          runId="run-1"
          headline="Payments review"
          hasGoldenManifest={true}
          manifestId="manifest-1"
          usedStaticDemoRun={true}
        />
      </SearchParamsRerenderHost>
    );

    const { rerender } = render(renderHeader());

    const details = () => screen.getByText("Download sponsor brief").closest("details") as HTMLDetailsElement;
    expect(details()).not.toHaveAttribute("open");

    act(() => {
      searchParamsHarness.applyQuery(`${RUN_DETAIL_BUYER_SPONSOR_BRIEF_EXPORTS_OPEN_PARAM}=1`);
      window.history.replaceState(
        {},
        "",
        `/architecture/reviews/run-1?${RUN_DETAIL_BUYER_SPONSOR_BRIEF_EXPORTS_OPEN_PARAM}=1`,
      );
    });
    rerender(renderHeader());

    await waitFor(() => {
      expect(details()).toHaveAttribute("open");
    });
  });
});
