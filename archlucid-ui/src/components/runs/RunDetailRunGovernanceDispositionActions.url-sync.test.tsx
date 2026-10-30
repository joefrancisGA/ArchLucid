import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createElement, useSyncExternalStore, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RunDetailRunGovernanceDispositionActions } from "@/components/runs/RunDetailRunGovernanceDispositionActions";
import { recordRunOperatorGovernanceDisposition } from "@/lib/api/architecture-runs";
import { RUN_GOVERNANCE_DISP_DECISION_PARAM } from "@/lib/governance/run-governance-disposition-confirm-url";

vi.mock("@/lib/api/architecture-runs", () => ({
  recordRunOperatorGovernanceDisposition: vi.fn(),
}));

vi.mock("@/lib/await-minimum-visible-duration", () => ({
  awaitMinimumVisibleDuration: vi.fn(async () => undefined),
}));

vi.mock("@/lib/demo-ui-env", () => ({
  isBuyerPolishedOperatorShellEnv: () => false,
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

const pathnameMock = vi.hoisted(() => ({ value: "/architecture/reviews/run-abc" }));

vi.mock("next/navigation", () => ({
  usePathname: () => pathnameMock.value,
  useRouter: () => ({ refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(searchParamsHarness.state.query),
}));

function SearchParamsRerenderHost({ children }: { readonly children: ReactNode }) {
  useSyncExternalStore(
    searchParamsHarness.subscribe,
    () => searchParamsHarness.state.query,
    () => "",
  );

  return createElement("div", null, children);
}

describe("RunDetailRunGovernanceDispositionActions URL sync", () => {
  beforeEach(() => {
    searchParamsHarness.reset();
    pathnameMock.value = "/architecture/reviews/run-abc";
    window.history.replaceState({}, "", "/architecture/reviews/run-abc");
  });

  it("follows runDispDecision query changes without a popstate event", async () => {
    const { rerender } = render(
      <SearchParamsRerenderHost>
        <RunDetailRunGovernanceDispositionActions runId="run-abc" hasCommitBlockingFailures={false} />
      </SearchParamsRerenderHost>,
    );

    expect(screen.queryByRole("button", { name: "Confirm Approved" })).toBeNull();

    searchParamsHarness.applyQuery(`${RUN_GOVERNANCE_DISP_DECISION_PARAM}=approved`);
    window.history.replaceState(
      {},
      "",
      `/architecture/reviews/run-abc?${RUN_GOVERNANCE_DISP_DECISION_PARAM}=approved`,
    );
    rerender(
      <SearchParamsRerenderHost>
        <RunDetailRunGovernanceDispositionActions runId="run-abc" hasCommitBlockingFailures={false} />
      </SearchParamsRerenderHost>,
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Confirm Approved" })).toBeInTheDocument();
    });

    expect(vi.mocked(recordRunOperatorGovernanceDisposition)).not.toHaveBeenCalled();
  });

  it("writes governance disposition confirm from useSearchParams when window.location.search lags after soft navigation", async () => {
    searchParamsHarness.state.query = "reviewTab=overview";
    window.history.replaceState(
      {},
      "",
      "/architecture/reviews/run-a?reviewTab=findings&q=stale-payment",
    );

    render(
      <SearchParamsRerenderHost>
        <RunDetailRunGovernanceDispositionActions runId="run-abc" hasCommitBlockingFailures={false} />
      </SearchParamsRerenderHost>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Approve review" }));

    await waitFor(() => {
      expect(window.location.pathname + window.location.search).toBe(
        `/architecture/reviews/run-abc?reviewTab=overview&${RUN_GOVERNANCE_DISP_DECISION_PARAM}=approved`,
      );
    });
  });
});
