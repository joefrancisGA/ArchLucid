import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { expect, it, vi } from "vitest";

import { collectionRunsQueryKeys, useTriggerCollectionRunMutation } from "@/hooks/use-collection-runs-query";
import { triggerCollectionRun, type CollectionRun } from "@/lib/collection-runs-api";
import { useOperatorScopeQueryKey } from "@/hooks/use-operator-scope-query-key";
import { getOperatorScopeQueryKeySnapshot } from "@/lib/operator/operator-scope-query-key";

vi.mock("@/lib/collection-runs-api", () => ({
  fetchCollectionRuns: vi.fn(),
  triggerCollectionRun: vi.fn(),
}));
vi.mock("@/hooks/use-operator-scope-query-key", () => ({ useOperatorScopeQueryKey: vi.fn() }));
vi.mock("@/lib/operator/operator-scope-query-key", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/operator/operator-scope-query-key")>()),
  getOperatorScopeQueryKeySnapshot: vi.fn(),
}));

it("marks only the submitting workspace stale after the operator switches workspaces", async () => {
  const originalScope = { tenantId: "tenant", workspaceId: "original", projectId: "project" };
  const nextScope = { ...originalScope, workspaceId: "next" };
  vi.mocked(useOperatorScopeQueryKey).mockReturnValue(originalScope);
  vi.mocked(getOperatorScopeQueryKeySnapshot).mockReturnValue("tenant:original:project");

  let finish!: (run: CollectionRun) => void;
  vi.mocked(triggerCollectionRun).mockReturnValue(new Promise((resolve) => { finish = resolve; }));

  const client = new QueryClient();
  const invalidate = vi.spyOn(client, "invalidateQueries");
  const { result, rerender } = renderHook(() => useTriggerCollectionRunMutation(), {
    wrapper: ({ children }: { children: ReactNode }) =>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>,
  });

  act(() => result.current.mutate("request-key"));
  await waitFor(() => expect(triggerCollectionRun).toHaveBeenCalledWith("request-key"));

  vi.mocked(useOperatorScopeQueryKey).mockReturnValue(nextScope);
  vi.mocked(getOperatorScopeQueryKeySnapshot).mockReturnValue("tenant:next:project");
  rerender();

  await act(async () => { finish({ runId: "accepted", status: "Running" }); });
  await waitFor(() => expect(result.current.isSuccess).toBe(true));

  expect(invalidate).toHaveBeenCalledExactlyOnceWith({
    queryKey: collectionRunsQueryKeys.list(originalScope),
    refetchType: "none",
  });
});
