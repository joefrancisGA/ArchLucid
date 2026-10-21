import { act, render, screen, waitFor } from "@testing-library/react";
import { createElement, useSyncExternalStore, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RUN_FINDINGS_EXPLAIN_ID_PARAM } from "@/lib/runs/run-findings-explainability-url";
import type { FindingTraceConfidenceDto } from "@/types/explanation";

import { RunFindingExplainabilityTable } from "./RunFindingExplainabilityTable";

vi.mock("@tanstack/react-virtual", () => ({
  useVirtualizer: () => ({
    getVirtualItems: () => [{ index: 0, key: "0", start: 0 }],
    getTotalSize: () => 48,
    measureElement: vi.fn(),
  }),
}));

vi.mock("@/components/findings/FindingExplainabilityDialog", () => ({
  FindingExplainabilityDialog: ({ open }: { readonly open: boolean }) =>
    open ? <div data-testid="finding-explainability-dialog-mock" /> : null,
}));

vi.mock("@/components/findings/FindingAiReasoningDialog", () => ({
  FindingAiReasoningDialog: () => null,
}));

vi.mock("@/lib/use-itsm-finding-correlations", () => ({
  usePrefetchItsmFindingCorrelations: vi.fn(),
}));

vi.mock("@/components/itsm/ItsmOutboundQuickActions", () => ({
  ItsmOutboundQuickActions: () => null,
}));

vi.mock("@/components/CopyFindingAsWorkItemButton", () => ({
  CopyTraceRowWorkItemButton: () => null,
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
  usePathname: () => "/architecture/reviews/r1/runs/run1",
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

const rows: FindingTraceConfidenceDto[] = [
  {
    findingId: "finding-1",
    findingTitle: "Sample finding",
    confidenceLevel: "High",
    traceCompletenessRatio: 0.9,
    missingTraceFields: [],
    ruleId: "rule-1",
  },
];

describe("RunFindingExplainabilityTable URL sync", () => {
  beforeEach(() => {
    searchParamsHarness.reset();
    window.history.replaceState({}, "", "/architecture/reviews/r1/runs/run1");
  });

  it("follows explainId query changes without a popstate event", async () => {
    const renderTable = () => (
      <SearchParamsRerenderHost>
        <RunFindingExplainabilityTable runId="run1" rows={rows} />
      </SearchParamsRerenderHost>
    );

    const { rerender } = render(renderTable());

    expect(screen.queryByTestId("finding-explainability-dialog-mock")).not.toBeInTheDocument();

    act(() => {
      searchParamsHarness.applyQuery(`${RUN_FINDINGS_EXPLAIN_ID_PARAM}=finding-1`);
      window.history.replaceState(
        {},
        "",
        `/architecture/reviews/r1/runs/run1?${RUN_FINDINGS_EXPLAIN_ID_PARAM}=finding-1`,
      );
    });
    rerender(renderTable());

    await waitFor(() => {
      expect(screen.getByTestId("finding-explainability-dialog-mock")).toBeInTheDocument();
    });
  });

  it("closes explainability dialog when explainId is cleared without a popstate event", async () => {
    const openQuery = `${RUN_FINDINGS_EXPLAIN_ID_PARAM}=finding-1`;
    searchParamsHarness.applyQuery(openQuery);
    window.history.replaceState({}, "", `/architecture/reviews/r1/runs/run1?${openQuery}`);

    const renderTable = () => (
      <SearchParamsRerenderHost>
        <RunFindingExplainabilityTable runId="run1" rows={rows} />
      </SearchParamsRerenderHost>
    );

    const { rerender } = render(renderTable());

    await waitFor(() => {
      expect(screen.getByTestId("finding-explainability-dialog-mock")).toBeInTheDocument();
    });

    act(() => {
      searchParamsHarness.applyQuery("");
      window.history.replaceState({}, "", "/architecture/reviews/r1/runs/run1");
    });
    rerender(renderTable());

    await waitFor(() => {
      expect(screen.queryByTestId("finding-explainability-dialog-mock")).not.toBeInTheDocument();
    });
  });

});
