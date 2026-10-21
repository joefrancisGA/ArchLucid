import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createElement, useSyncExternalStore, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RunDetailFirstScreenProofStatus } from "@/components/reviews/RunDetailFirstScreenProofStatus";
import { buildRunDetailFirstScreenProofSummary } from "@/lib/runs/run-detail-first-screen-proof-status";
import { RUN_DETAIL_FIRST_SCREEN_PROOF_OPEN_PARAM } from "@/lib/runs/run-detail-first-screen-proof-disclosure-url";

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

const sampleSummary = buildRunDetailFirstScreenProofSummary({
  structuralExecutionMode: "Real",
  roiMetricSources: [{ metricKey: "hours", label: "Hours", value: "4", sourceKind: "TenantMeasured" }],
  proofPackageCompleteness: {
    sponsorProofReadiness: "Sendable",
    agentOutputPilotStrictEvidenceSatisfied: true,
  },
});

describe("RunDetailFirstScreenProofStatus URL sync", () => {
  beforeEach(() => {
    searchParamsHarness.reset();
    pathnameMock.value = "/architecture/reviews/run-b";
    window.history.replaceState(
      {},
      "",
      "/architecture/reviews/run-a?reviewTab=findings&q=stale-payment",
    );
  });

  it("opens proof details from useSearchParams when window.location.search lags after soft navigation", async () => {
    searchParamsHarness.state.query = "reviewTab=overview";

    render(
      <SearchParamsRerenderHost>
        <RunDetailFirstScreenProofStatus summary={sampleSummary} />
      </SearchParamsRerenderHost>,
    );

    fireEvent.click(screen.getByText("View proof details"));

    await waitFor(() => {
      expect(window.location.pathname + window.location.search).toBe(
        `/architecture/reviews/run-b?reviewTab=overview&${RUN_DETAIL_FIRST_SCREEN_PROOF_OPEN_PARAM}=1`,
      );
    });
  });

  it("follows runDetailFirstScreenProofOpen query changes without a popstate event", async () => {
    const { rerender } = render(
      <SearchParamsRerenderHost>
        <RunDetailFirstScreenProofStatus summary={sampleSummary} />
      </SearchParamsRerenderHost>,
    );

    const details = () => screen.getByText("View proof details").closest("details");
    expect(details()).not.toHaveAttribute("open");

    searchParamsHarness.applyQuery(`reviewTab=overview&${RUN_DETAIL_FIRST_SCREEN_PROOF_OPEN_PARAM}=1`);
    window.history.replaceState(
      {},
      "",
      `/architecture/reviews/run-b?reviewTab=overview&${RUN_DETAIL_FIRST_SCREEN_PROOF_OPEN_PARAM}=1`,
    );
    rerender(
      <SearchParamsRerenderHost>
        <RunDetailFirstScreenProofStatus summary={sampleSummary} />
      </SearchParamsRerenderHost>,
    );

    await waitFor(() => {
      expect(details()).toHaveAttribute("open");
    });
  });
});
