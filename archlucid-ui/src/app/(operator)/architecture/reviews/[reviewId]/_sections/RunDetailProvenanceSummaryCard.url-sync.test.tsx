import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createElement, useSyncExternalStore, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { RunDetail } from "@/types/authority";
import { RUN_DETAIL_PROVENANCE_IDENTIFIERS_OPEN_PARAM } from "@/lib/runs/run-detail-provenance-identifiers-disclosure-url";

import { RunDetailProvenanceSummaryCard } from "./RunDetailProvenanceSummaryCard";

const searchParamsHarness = vi.hoisted(() => {
  const listeners = new Set<() => void>();
  const state = { query: "reviewTab=overview", windowQuery: null as string | null };

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
    setWindowLocationSearch(query: string): void {
      state.windowQuery = query;
    },
    readWindowLocationSearch(): string {
      return state.windowQuery ?? state.query;
    },
    reset(): void {
      state.query = "reviewTab=overview";
      state.windowQuery = null;
    },
  };
});

const committedHrefs = vi.hoisted(() => [] as string[]);

vi.mock("@/lib/navigation/replace-if-href-changed", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/navigation/replace-if-href-changed")>();

  return {
    ...actual,
    readWindowLocationSearch: () => searchParamsHarness.readWindowLocationSearch(),
    commitHrefIfChanged: (href: string) => {
      committedHrefs.push(href);

      return true;
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
    committedHrefs.length = 0;
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

  it("writes provenance identifiers disclosure from useSearchParams when window.location.search lags after soft navigation", () => {
    searchParamsHarness.applyQuery("reviewTab=overview");
    searchParamsHarness.setWindowLocationSearch("reviewTab=overview&staleToolbar=q-old");

    const { rerender } = render(
      <SearchParamsRerenderHost>
        <RunDetailProvenanceSummaryCard runId="run-abc" run={minimalRun} manifestId="manifest-1" />
      </SearchParamsRerenderHost>,
    );

    searchParamsHarness.applyQuery("reviewTab=overview");
    rerender(
      <SearchParamsRerenderHost>
        <RunDetailProvenanceSummaryCard runId="run-abc" run={minimalRun} manifestId="manifest-1" />
      </SearchParamsRerenderHost>,
    );

    const summaryEl = screen.getByText("Identifiers");
    fireEvent.click(summaryEl);

    if (committedHrefs.length === 0) {
      const details = summaryEl.closest("details");

      if (details !== null) {
        fireEvent(details, new Event("toggle", { bubbles: true }));
      }
    }

    expect(committedHrefs.length).toBeGreaterThan(0);
    const lastHref = committedHrefs.at(-1) ?? "";
    expect(lastHref).toContain(RUN_DETAIL_PROVENANCE_IDENTIFIERS_OPEN_PARAM);
    expect(lastHref).toContain("reviewTab=overview");
    expect(lastHref).not.toContain("staleToolbar");
  });
});
