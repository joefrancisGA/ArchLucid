import { render, screen, waitFor } from "@testing-library/react";
import { createElement, useSyncExternalStore, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RUN_PIPELINE_TIMELINE_OPEN_PARAM } from "@/lib/runs/run-pipeline-timeline-disclosure-url";

import { RunDetailPipelineTimelineSection } from "./RunDetailPipelineTimelineSection";

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

vi.mock("@/components/AuthorityPipelineTimeline", () => ({
  AuthorityPipelineTimeline: () => <div data-testid="authority-pipeline-timeline" />,
}));

function SearchParamsRerenderHost({ children }: { readonly children: ReactNode }) {
  useSyncExternalStore(
    searchParamsHarness.subscribe,
    () => searchParamsHarness.state.query,
    () => "reviewTab=overview",
  );

  return createElement("div", null, children);
}

const baseProps = {
  runId: "run-abc",
  buyerPolishedArtifactTable: false,
  pipelineTimelineFailure: null,
  pipelineTimelineForUi: [],
};

describe("RunDetailPipelineTimelineSection URL sync", () => {
  beforeEach(() => {
    searchParamsHarness.reset();
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?reviewTab=overview");
  });

  it("follows runPipelineTimelineOpen query changes without a popstate event", async () => {
    const { rerender } = render(
      <SearchParamsRerenderHost>
        <RunDetailPipelineTimelineSection {...baseProps} />
      </SearchParamsRerenderHost>,
    );

    const timelineDetails = () => screen.getByTestId("run-pipeline-timeline-collapsible");
    expect(timelineDetails()).not.toHaveAttribute("open");

    searchParamsHarness.applyQuery(`reviewTab=overview&${RUN_PIPELINE_TIMELINE_OPEN_PARAM}=1`);
    window.history.replaceState(
      {},
      "",
      `/architecture/reviews/run-abc?reviewTab=overview&${RUN_PIPELINE_TIMELINE_OPEN_PARAM}=1`,
    );
    rerender(
      <SearchParamsRerenderHost>
        <RunDetailPipelineTimelineSection {...baseProps} />
      </SearchParamsRerenderHost>,
    );

    await waitFor(() => {
      expect(timelineDetails()).toHaveAttribute("open");
    });
  });
});
