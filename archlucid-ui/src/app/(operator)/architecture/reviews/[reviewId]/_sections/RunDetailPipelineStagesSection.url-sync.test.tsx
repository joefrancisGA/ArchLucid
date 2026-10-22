import { render, screen, waitFor } from "@testing-library/react";
import { createElement, useSyncExternalStore, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RUN_PIPELINE_STAGES_OPEN_PARAM } from "@/lib/runs/run-pipeline-stages-disclosure-url";

import { RunDetailPipelineStagesSection } from "./RunDetailPipelineStagesSection";

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

vi.mock("@/components/runs/RunTraceViewerLink", () => ({
  RunTraceViewerLink: () => null,
}));

function SearchParamsRerenderHost({ children }: { readonly children: ReactNode }) {
  useSyncExternalStore(
    searchParamsHarness.subscribe,
    () => searchParamsHarness.state.query,
    () => "reviewTab=overview",
  );

  return createElement("div", null, children);
}

const stageTimeline = [
  {
    stageName: "intake",
    outcomeStatus: "Succeeded",
    durationMs: 1200,
  },
];

describe("RunDetailPipelineStagesSection URL sync", () => {
  beforeEach(() => {
    searchParamsHarness.reset();
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?reviewTab=overview");
  });

  it("follows runPipelineStagesOpen query changes without a popstate event", async () => {
    const { rerender } = render(
      <SearchParamsRerenderHost>
        <RunDetailPipelineStagesSection stageTimeline={stageTimeline} />
      </SearchParamsRerenderHost>,
    );

    const stagesDetails = () => screen.getByTestId("run-detail-pipeline-stages-collapsible");
    expect(stagesDetails()).not.toHaveAttribute("open");

    searchParamsHarness.applyQuery(`reviewTab=overview&${RUN_PIPELINE_STAGES_OPEN_PARAM}=1`);
    window.history.replaceState(
      {},
      "",
      `/architecture/reviews/run-abc?reviewTab=overview&${RUN_PIPELINE_STAGES_OPEN_PARAM}=1`,
    );
    rerender(
      <SearchParamsRerenderHost>
        <RunDetailPipelineStagesSection stageTimeline={stageTimeline} />
      </SearchParamsRerenderHost>,
    );

    await waitFor(() => {
      expect(stagesDetails()).toHaveAttribute("open");
    });
  });
});
