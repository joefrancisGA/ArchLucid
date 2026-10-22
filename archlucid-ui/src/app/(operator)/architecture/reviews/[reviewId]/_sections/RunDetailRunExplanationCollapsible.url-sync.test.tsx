import { render, screen, waitFor } from "@testing-library/react";
import { createElement, useSyncExternalStore, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RUN_ASSESSMENT_NARRATIVE_OPEN_PARAM } from "@/lib/reviews/run-assessment-narrative-url";

import { RunDetailRunExplanationCollapsible } from "./RunDetailRunExplanationCollapsible";

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

vi.mock("./run-detail-explanation-collapsible-deferred-chunks", () => ({
  RunDetailFindingsWorkspaceDeferred: () => <div data-testid="findings-workspace-deferred" />,
  RunExplanationSectionDeferred: () => null,
  FindingsWhatIfAnalysisPanelDeferred: () => null,
  RunFindingExplainabilityTableDeferred: () => null,
}));

vi.mock("./RunDetailSponsorModeExplanationCard", () => ({
  RunDetailSponsorModeExplanationCard: () => null,
}));

function SearchParamsRerenderHost({ children }: { readonly children: ReactNode }) {
  useSyncExternalStore(
    searchParamsHarness.subscribe,
    () => searchParamsHarness.state.query,
    () => "reviewTab=overview",
  );

  return createElement("div", null, children);
}

const emptyInsightDensityView = { checklistCoverage: [], curation: null };

describe("RunDetailRunExplanationCollapsible URL sync", () => {
  beforeEach(() => {
    searchParamsHarness.reset();
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?reviewTab=overview");
  });

  it("follows runAssessmentNarrativeOpen query changes without a popstate event", async () => {
    const { rerender } = render(
      <SearchParamsRerenderHost>
        <RunDetailRunExplanationCollapsible
          runId="run-abc"
          buyerPolishedArtifactTable={false}
          quickDecisionFindings={[]}
          quickDecisionFromExplanationFallback={false}
          findingWireSnapshots={{}}
          findingCountDisplay={0}
          warningCountDisplay={0}
          explanationSummary={null}
          explanationFailure={null}
          baselineAnnualCostUsd={null}
          decisionExplainability={null}
          insightDensityView={emptyInsightDensityView}
        />
      </SearchParamsRerenderHost>,
    );

    const narrativeDetails = () => screen.getByTestId("run-detail-assessment-narrative");
    expect(narrativeDetails()).not.toHaveAttribute("open");

    searchParamsHarness.applyQuery(`reviewTab=overview&${RUN_ASSESSMENT_NARRATIVE_OPEN_PARAM}=1`);
    window.history.replaceState(
      {},
      "",
      `/architecture/reviews/run-abc?reviewTab=overview&${RUN_ASSESSMENT_NARRATIVE_OPEN_PARAM}=1`,
    );
    rerender(
      <SearchParamsRerenderHost>
        <RunDetailRunExplanationCollapsible
          runId="run-abc"
          buyerPolishedArtifactTable={false}
          quickDecisionFindings={[]}
          quickDecisionFromExplanationFallback={false}
          findingWireSnapshots={{}}
          findingCountDisplay={0}
          warningCountDisplay={0}
          explanationSummary={null}
          explanationFailure={null}
          baselineAnnualCostUsd={null}
          decisionExplainability={null}
          insightDensityView={emptyInsightDensityView}
        />
      </SearchParamsRerenderHost>,
    );

    await waitFor(() => {
      expect(narrativeDetails()).toHaveAttribute("open");
    });
  });
});
