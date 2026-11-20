import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { expect, it, vi } from "vitest";

import { listTier2Connections } from "@/lib/api/cloud-connections-api";
import { fetchInfraEvidenceSnapshots } from "@/lib/infra-evidence/infra-evidence-drift-api";

import { useSecureNowCollectionSetupInput } from "./use-securenow-collection-setup-input";

vi.mock("@/lib/api/cloud-connections-api", () => ({ listTier2Connections: vi.fn() }));
vi.mock("@/lib/infra-evidence/infra-evidence-drift-api", () => ({ fetchInfraEvidenceSnapshots: vi.fn() }));

it.each([
  ["Failed", false],
  ["Succeeded", true],
] as const)("uses capture evidence for a configured Azure connection with a %s snapshot", async (captureStatus, succeeded) => {
  vi.mocked(listTier2Connections).mockResolvedValue([{
    connectionId: "azure-connection",
    tenantId: "tenant",
    clientId: "client",
    subscriptionIds: "subscription",
    updatedUtc: "2026-11-14T12:00:00Z",
  }]);
  vi.mocked(fetchInfraEvidenceSnapshots).mockResolvedValue({
    items: [{
      snapshotId: "snapshot",
      captureStatus,
      subscriptionId: "subscription",
      subscriptionName: "Production",
      capturedUtc: "2026-11-14T12:30:00Z",
      resourceCount: succeeded ? 1 : 0,
      relationshipCount: 0,
    }],
    page: 1,
    pageSize: 20,
    totalCount: 1,
    hasMore: false,
  });

  const queryClient = new QueryClient();
  const { result } = renderHook(() => useSecureNowCollectionSetupInput({ snapshotCaptureSucceeded: null }), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  });

  await waitFor(() => expect(result.current.collectionInput).toEqual({
    hasConfiguredProvider: true,
    azureSubscriptionIdsPresent: true,
    hasSuccessfulPull: succeeded,
  }));
});


it("finds a successful capture beyond the first page", async () => {
  vi.mocked(listTier2Connections).mockResolvedValue([]);
  vi.mocked(fetchInfraEvidenceSnapshots).mockReset().mockImplementation(async (page = 1) => ({
    items: [{
      snapshotId: `snapshot-${page}`,
      captureStatus: page === 1 ? "Failed" : "Succeeded",
      subscriptionId: "subscription",
      subscriptionName: "Production",
      capturedUtc: "2026-11-14T12:30:00Z",
      resourceCount: 1,
      relationshipCount: 0,
    }],
    page,
    pageSize: 20,
    totalCount: 21,
    hasMore: page === 1,
  }));

  const queryClient = new QueryClient();
  const { result } = renderHook(() => useSecureNowCollectionSetupInput({ snapshotCaptureSucceeded: null }), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  });

  await waitFor(() => expect(result.current.collectionInput?.hasSuccessfulPull).toBe(true));
  expect(fetchInfraEvidenceSnapshots).toHaveBeenCalledTimes(2);
  expect(fetchInfraEvidenceSnapshots).toHaveBeenNthCalledWith(2, 2, 20);
});
