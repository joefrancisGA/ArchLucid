import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { expect, it, vi } from "vitest";

import { fetchInfraEvidenceSnapshots } from "@/lib/infra-evidence/infra-evidence-drift-api";
import type { InfraEvidenceSnapshotSummary } from "@/lib/infra-evidence/infra-evidence-drift-types";

import { useSecureNowLatestSucceededSnapshotId } from "./use-securenow-latest-succeeded-snapshot-id";

vi.mock("@/lib/infra-evidence/infra-evidence-drift-api", () => ({
  fetchInfraEvidenceSnapshots: vi.fn(),
}));

function snapshot(snapshotId: string, captureStatus: string): InfraEvidenceSnapshotSummary {
  return {
    snapshotId,
    captureStatus,
    subscriptionId: "subscription",
    subscriptionName: "Production",
    capturedUtc: "2026-11-14T12:00:00Z",
    resourceCount: 1,
    relationshipCount: 0,
  };
}

it("finds the most recent successful capture beyond the first page of unsuccessful captures", async () => {
  const fetchSnapshots = vi.mocked(fetchInfraEvidenceSnapshots);
  fetchSnapshots
    .mockResolvedValueOnce({
      items: Array.from({ length: 20 }, (_unused, index) => snapshot(`failed-${index}`, "Failed")),
      totalCount: 22,
      page: 1,
      pageSize: 20,
      hasMore: true,
    })
    .mockResolvedValueOnce({
      items: [snapshot("success", "Succeeded"), snapshot("older-success", "Succeeded")],
      totalCount: 22,
      page: 2,
      pageSize: 20,
      hasMore: false,
    });

  const queryClient = new QueryClient();
  const { result } = renderHook(() => useSecureNowLatestSucceededSnapshotId(), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  });

  await waitFor(() => expect(result.current.latestSnapshotId).toBe("success"));
  expect(result.current.succeededSnapshotCountOnFirstPage).toBe(0);
  expect(fetchSnapshots).toHaveBeenCalledTimes(2);
  expect(fetchSnapshots).toHaveBeenLastCalledWith(2, 20);
});
