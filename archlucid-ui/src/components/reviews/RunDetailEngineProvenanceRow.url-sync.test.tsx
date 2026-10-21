import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createElement, useSyncExternalStore, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RunDetailEngineProvenanceRow } from "@/components/reviews/RunDetailEngineProvenanceRow";
import type { ReviewRunEngineProvenance } from "@/lib/review-engine-provenance-display";
import { RUN_ENGINE_PROVENANCE_OPEN_PARAM } from "@/lib/runs/run-engine-provenance-disclosure-url";

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

const sampleProvenance: ReviewRunEngineProvenance = {
  providerKind: "azure-openai",
  deploymentOrModelId: "gpt-4o-arch",
  promptPackVersion: "architecture-review-v0.4",
  policyPackVersion: "Healthcare Claims v0.2",
  outputSchemaVersion: "FindingsSnapshot v2",
  runTimestampUtc: "2026-06-16T12:00:00Z",
  estimatedCostUsd: 0.0042,
};

describe("RunDetailEngineProvenanceRow URL sync", () => {
  beforeEach(() => {
    searchParamsHarness.reset();
    pathnameMock.value = "/architecture/reviews/run-b";
    window.history.replaceState(
      {},
      "",
      "/architecture/reviews/run-a?reviewTab=findings&q=stale-payment",
    );
  });

  it("opens engine provenance from useSearchParams when window.location.search lags after soft navigation", async () => {
    searchParamsHarness.state.query = "reviewTab=overview";

    render(
      <SearchParamsRerenderHost>
        <RunDetailEngineProvenanceRow provenance={sampleProvenance} />
      </SearchParamsRerenderHost>,
    );

    fireEvent.click(screen.getByText("Engine & model"));

    await waitFor(() => {
      expect(window.location.pathname + window.location.search).toBe(
        `/architecture/reviews/run-b?reviewTab=overview&${RUN_ENGINE_PROVENANCE_OPEN_PARAM}=1`,
      );
    });
  });

  it("follows runEngineProvenanceOpen query changes without a popstate event", async () => {
    const { rerender } = render(
      <SearchParamsRerenderHost>
        <RunDetailEngineProvenanceRow provenance={sampleProvenance} />
      </SearchParamsRerenderHost>,
    );

    const details = () => screen.getByText("Engine & model").closest("details");
    expect(details()).not.toHaveAttribute("open");

    searchParamsHarness.applyQuery(`reviewTab=overview&${RUN_ENGINE_PROVENANCE_OPEN_PARAM}=1`);
    window.history.replaceState(
      {},
      "",
      `/architecture/reviews/run-b?reviewTab=overview&${RUN_ENGINE_PROVENANCE_OPEN_PARAM}=1`,
    );
    rerender(
      <SearchParamsRerenderHost>
        <RunDetailEngineProvenanceRow provenance={sampleProvenance} />
      </SearchParamsRerenderHost>,
    );

    await waitFor(() => {
      expect(details()).toHaveAttribute("open");
    });
  });
});
