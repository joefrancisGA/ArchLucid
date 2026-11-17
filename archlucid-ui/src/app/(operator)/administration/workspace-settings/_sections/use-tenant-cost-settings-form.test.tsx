// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { expect, it, vi } from "vitest";
import { useTenantCostSettingsForm } from "./use-tenant-cost-settings-form";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
const scope = vi.hoisted(() => ({ tenantId: "tenant-a" }));

vi.mock("@/hooks/use-operator-scope-record", () => ({
  useOperatorScopeRecord: () => scope,
}));
vi.mock("@/hooks/use-livelihood-document-guards", () => ({
  useLivelihoodDocumentGuards: () => ({}),
}));
vi.mock("@/lib/demo-ui-env", () => ({ isNextPublicDemoMode: () => false }));
it.each([
  { tenantId: "tenant-a", expectedRate: "150", expectedDirty: true },
  { tenantId: "tenant-b", expectedRate: "125", expectedDirty: false },
])("reconciles a settings refresh for $tenantId", async ({ tenantId, expectedRate, expectedDirty }) => {
  scope.tenantId = "tenant-a";
  const client = new QueryClient();
  const prior = {
    architectHourlyRateUsd: 100,
    averageIncidentCostUsd: 200,
    eaDiscountPercentage: 0,
    isTenantConfigured: true,
    updatedUtc: null,
  };
  client.setQueryData(operatorQueryKeys.tenantCostSettings, prior);
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const { result, rerender, unmount } = renderHook(() => useTenantCostSettingsForm({ canEdit: true }), { wrapper });
  try {
    act(() => result.current.setHourlyRate("150"));
    expect(result.current.dirty).toBe(true);
    scope.tenantId = tenantId;
    client.setQueryData(operatorQueryKeys.tenantCostSettings, {
      ...prior,
      architectHourlyRateUsd: 125,
      averageIncidentCostUsd: 250,
    });

    rerender();
    await waitFor(() => expect(result.current.incidentCost).toBe("250"));
    expect(result.current.hourlyRate).toBe(expectedRate);
    expect(result.current.dirty).toBe(expectedDirty);
  } finally {
    unmount();
    client.clear();
  }
});
