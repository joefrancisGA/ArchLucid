import { render, screen, waitFor } from "@testing-library/react";
import { createElement, useSyncExternalStore, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { RunDetail } from "@/types/authority";
import { RUN_DETAIL_PROVENANCE_IDENTIFIERS_OPEN_PARAM } from "@/lib/runs/run-detail-provenance-identifiers-disclosure-url";

import { RunDetailProvenanceSummaryCard } from "./RunDetailProvenanceSummaryCard";

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

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode; [key: string]: unknown }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/CopyIdButton", () => ({
  CopyIdButton: () => <button type="button">Copy</button>,
}));

vi.mock("@/components/reviews/RunDetailEngineProvenanceRow", () => ({
  RunDetailEngineProvenanceRow: () => null,
}));

function SearchParamsRerenderHost({ children }: { readonly children: ReactNode }) {
  useSyncExternalStore(
    searchParamsHarness.subscribe,
    () => searchParamsHarness.state.query,
    () => "reviewTab=overview",
  );

  return createElement("div", null, children);
}

const minimalRun = {
  contextSnapshotId: "ctx-1",
  graphSnapshotId: "graph-1",
} as RunDetail["run"];

describe("RunDetailProvenanceSummaryCard URL sync", () => {
  beforeEach(() => {
    searchParamsHarness.reset();
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?reviewTab=overview");
  });

  it("follows runDetailProvenanceIdentifiersOpen query changes without a popstate event", async () => {
    const { rerender } = render(
      <SearchParamsRerenderHost>
        <RunDetailProvenanceSummaryCard runId="run-abc" run={minimalRun} manifestId="manifest-1" />
      </SearchParamsRerenderHost>,
    );

    const identifiersDetails = () => screen.getByText("Identifiers").closest("details");
    expect(identifiersDetails()).not.toHaveAttribute("open");

    searchParamsHarness.applyQuery(
      `reviewTab=overview&${RUN_DETAIL_PROVENANCE_IDENTIFIERS_OPEN_PARAM}=1`,
    );
    window.history.replaceState(
      {},
      "",
      `/architecture/reviews/run-abc?reviewTab=overview&${RUN_DETAIL_PROVENANCE_IDENTIFIERS_OPEN_PARAM}=1`,
    );
    rerender(
      <SearchParamsRerenderHost>
        <RunDetailProvenanceSummaryCard runId="run-abc" run={minimalRun} manifestId="manifest-1" />
      </SearchParamsRerenderHost>,
    );

    await waitFor(() => {
      expect(identifiersDetails()).toHaveAttribute("open");
    });
  });
});
