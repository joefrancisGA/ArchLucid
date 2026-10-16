import { act, render, screen, waitFor } from "@testing-library/react";
import { createElement, useSyncExternalStore, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { FindingDispositionEvent } from "@/lib/api/governance-stickiness-api";
import { FINDING_INSPECT_WAIVER_CONFIRM_PARAM } from "@/lib/findings/finding-inspect-governance-panel-url";

import { FindingInspectGovernanceStickinessPanel } from "./FindingInspectGovernanceStickinessPanel";

vi.mock("@/hooks/use-operate-capability", () => ({
  useOperateCapability: () => true,
}));

const listFindingDispositions = vi.fn(async () => [] as FindingDispositionEvent[]);

vi.mock("@/lib/api/governance-stickiness-api", () => ({
  listFindingDispositions: (...args: unknown[]) => listFindingDispositions(...args),
  listRiskExceptions: vi.fn(async () => []),
  createRiskException: vi.fn(),
  recordFindingDisposition: vi.fn(),
  recordFindingDispositionWith401Resume: vi.fn(),
  revokeRiskException: vi.fn(),
  defaultRiskExceptionExpiresAtUtc: () => "2099-01-01T00:00:00.000Z",
}));

vi.mock("@/lib/api/finding-remediation-assignment-api", () => ({
  upsertFindingRemediationAssignment: vi.fn(),
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: () => false,
  };
});

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
  usePathname: () => "/architecture/reviews/run-1/findings/finding-1/inspect",
  useSearchParams: () => new URLSearchParams(searchParamsHarness.state.query),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

function SearchParamsRerenderHost({ children }: { readonly children: ReactNode }) {
  useSyncExternalStore(
    searchParamsHarness.subscribe,
    () => searchParamsHarness.state.query,
    () => "",
  );

  return createElement("div", null, children);
}

describe("FindingInspectGovernanceStickinessPanel URL sync", () => {
  beforeEach(() => {
    searchParamsHarness.reset();
    listFindingDispositions.mockResolvedValue([]);
    window.history.replaceState({}, "", "/architecture/reviews/run-1/findings/finding-1/inspect");
  });

  it("follows waiverConfirm query changes without a popstate event", async () => {
    const renderPanel = () => (
      <SearchParamsRerenderHost>
        <FindingInspectGovernanceStickinessPanel findingId="finding-1" runId="run-1" />
      </SearchParamsRerenderHost>
    );

    const { rerender } = render(renderPanel());

    expect(screen.queryByRole("heading", { name: "Create risk exception?" })).toBeNull();

    act(() => {
      searchParamsHarness.applyQuery(`${FINDING_INSPECT_WAIVER_CONFIRM_PARAM}=1`);
      window.history.replaceState(
        {},
        "",
        `/architecture/reviews/run-1/findings/finding-1/inspect?${FINDING_INSPECT_WAIVER_CONFIRM_PARAM}=1`,
      );
    });
    rerender(renderPanel());

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Create risk exception?" })).toBeInTheDocument();
    });
  });
});
