import { render, screen } from "@testing-library/react";
import { createElement, useSyncExternalStore, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  ReviewAgentExecutionLogSection,
  RUN_AGENT_EXECUTION_LOG_DISCLOSURE_TEST_ID,
} from "@/components/reviews/ReviewAgentExecutionLogSection";
import { RUN_AGENT_EXECUTION_LOG_OPEN_PARAM } from "@/lib/runs/run-agent-execution-log-disclosure-url";
import type { RunDetailAgentResult } from "@/types/authority";

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

function SearchParamsRerenderHost({ children }: { readonly children: ReactNode }) {
  useSyncExternalStore(
    searchParamsHarness.subscribe,
    () => searchParamsHarness.state.query,
    () => "reviewTab=overview",
  );

  return createElement("div", null, children);
}

const sampleResults: readonly RunDetailAgentResult[] = [
  {
    resultId: "result-1",
    runId: "run-abc",
    taskId: "task-1",
    agentType: 0,
    claims: [],
    evidenceRefs: [],
  },
];

describe("ReviewAgentExecutionLogSection URL sync", () => {
  beforeEach(() => {
    searchParamsHarness.reset();
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?reviewTab=overview");
  });

  it("follows runAgentExecutionLogOpen query changes without a popstate event", () => {
    const { rerender } = render(
      <SearchParamsRerenderHost>
        <ReviewAgentExecutionLogSection results={sampleResults} />
      </SearchParamsRerenderHost>,
    );

    const details = () => screen.getByTestId(RUN_AGENT_EXECUTION_LOG_DISCLOSURE_TEST_ID);

    expect(details()).not.toHaveAttribute("open");

    searchParamsHarness.applyQuery(`reviewTab=overview&${RUN_AGENT_EXECUTION_LOG_OPEN_PARAM}=1`);
    window.history.replaceState(
      {},
      "",
      `/architecture/reviews/run-abc?reviewTab=overview&${RUN_AGENT_EXECUTION_LOG_OPEN_PARAM}=1`,
    );
    rerender(
      <SearchParamsRerenderHost>
        <ReviewAgentExecutionLogSection results={sampleResults} />
      </SearchParamsRerenderHost>,
    );

    expect(details()).toHaveAttribute("open");
  });
});
