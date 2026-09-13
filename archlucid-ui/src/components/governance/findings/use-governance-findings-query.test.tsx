import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useGovernanceFindingsQuery } from "@/components/governance/findings/use-governance-findings-query";

const { fetchGovernanceFindingQueueRowsMock } = vi.hoisted(() => ({
  fetchGovernanceFindingQueueRowsMock: vi.fn(),
}));

vi.mock("@/components/governance/findings/governance-findings-query-fetch", () => ({
  fetchGovernanceFindingQueueRows: fetchGovernanceFindingQueueRowsMock,
}));

vi.mock("@/lib/buyer/buyer-demo-content-gating", () => ({
  shouldUseGovernanceCuratedDemoSpine: () => false,
}));

vi.mock("@/hooks/use-operator-scope-query-key", () => ({
  useOperatorScopeQueryKey: () => "scope-test",
}));

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe("useGovernanceFindingsQuery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("clears loadFailed while a refresh is in flight", async () => {
    fetchGovernanceFindingQueueRowsMock
      .mockResolvedValueOnce({
        rows: [],
        loadFailed: true,
        failure: {
          correlationId: "corr-1",
          httpStatus: 502,
          errorCode: null,
          attemptedAtUtc: "2026-09-13T00:00:00.000Z",
          blockedReason: null,
        },
      })
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({ rows: [], loadFailed: false, failure: null });
            }, 50);
          }),
      );

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    const { result } = renderHook(() => useGovernanceFindingsQuery(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.loadFailed).toBe(true);
    });

    act(() => {
      result.current.refresh();
    });

    await waitFor(() => {
      expect(result.current.refreshing).toBe(true);
      expect(result.current.loadFailed).toBe(false);
      expect(result.current.loadFailure).toBeNull();
    });

    await waitFor(() => {
      expect(result.current.refreshing).toBe(false);
      expect(result.current.loadFailed).toBe(false);
    });
  });
});
