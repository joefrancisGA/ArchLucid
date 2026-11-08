import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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
    pathnameMock.value = "/architecture/reviews/run-b";
    window.history.replaceState(
      {},
      "",
      "/architecture/reviews/run-a?reviewTab=findings&q=stale-payment",
    );
  });

  it("opens agent execution log from useSearchParams when window.location.search lags after soft navigation", async () => {
    searchParamsHarness.state.query = "reviewTab=overview";

    render(
      <SearchParamsRerenderHost>
        <ReviewAgentExecutionLogSection results={sampleResults} />
      </SearchParamsRerenderHost>,
    );

    fireEvent.click(screen.getByText("1 agent ran"));

    await waitFor(() => {
      expect(window.location.pathname + window.location.search).toBe(
        `/architecture/reviews/run-b?reviewTab=overview&${RUN_AGENT_EXECUTION_LOG_OPEN_PARAM}=1`,
      );
    });
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
      `/architecture/reviews/run-b?reviewTab=overview&${RUN_AGENT_EXECUTION_LOG_OPEN_PARAM}=1`,
    );
    rerender(
      <SearchParamsRerenderHost>
        <ReviewAgentExecutionLogSection results={sampleResults} />
      </SearchParamsRerenderHost>,
    );

    expect(details()).toHaveAttribute("open");
  });

  it("orders execution rows by instant when createdUtc values use different offsets", () => {
    render(
      <ReviewAgentExecutionLogSection
        results={[
          {
            ...sampleResults[0],
            resultId: "result-cost",
            agentType: 2,
            createdUtc: "2026-10-30T06:30:00-04:00",
          },
          {
            ...sampleResults[0],
            resultId: "result-topology",
            agentType: 1,
            createdUtc: "2026-10-30T10:00:00Z",
          },
        ]}
      />,
    );

    const rows = screen.getAllByRole("row");
    expect(rows[1]).toHaveTextContent("Architecture structure");
    expect(rows[2]).toHaveTextContent("Cost");
  });
});
