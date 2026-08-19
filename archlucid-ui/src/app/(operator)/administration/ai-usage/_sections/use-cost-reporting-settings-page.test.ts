import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getOperatorQueryClient } from "@/lib/query/operator-query-client";

const nav = vi.hoisted(() => ({
  callerAuthorityRank: 3,
  isAuthorityLoading: false,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => "/administration/ai-usage",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/components/operator/OperatorNavAuthorityProvider", () => ({
  useOperatorNavAuthority: () => ({
    callerAuthorityRank: nav.callerAuthorityRank,
    isAuthorityLoading: nav.isAuthorityLoading,
  }),
}));

const fetchCostReporting = vi.hoisted(() => vi.fn());
const fetchBudgetCached = vi.hoisted(() => vi.fn());
const fetchAdminDashboard = vi.hoisted(() => vi.fn());

vi.mock("@/lib/llm-cost-reporting", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/llm-cost-reporting")>();

  return {
    ...actual,
    fetchLlmCostReportingDashboard: fetchCostReporting,
  };
});

vi.mock("@/lib/llm-monthly-budget-status", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/llm-monthly-budget-status")>();

  return {
    ...actual,
    fetchLlmMonthlyDollarBudgetStatusCached: fetchBudgetCached,
  };
});

vi.mock("@/lib/admin-ai-usage-dashboard", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/admin-ai-usage-dashboard")>();

  return {
    ...actual,
    fetchAdminAiUsageDashboard: fetchAdminDashboard,
  };
});

import { useCostReportingSettingsPage } from "./use-cost-reporting-settings-page";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });

  return { promise, resolve };
}

function mockDashboardPayload() {
  return {
    daily: [{ bucketUtc: "2026-07-01T00:00:00Z", estimatedCostUsd: 12.5, promptTokens: 1, completionTokens: 1 }],
    byWorkspaceProject: [],
    topRuns: [],
    currency: "USD",
    isMocked: false,
    asOfUtc: "2026-07-10T12:00:00.000Z",
  };
}

function mockBudgetStatus() {
  return {
    monthlyBudgetMonitoringActive: true,
    blocksAdditionalLlmExecution: false,
    utcMonth: "2026-07",
    hardCutoffUsdPerUtcMonth: 75,
    effectiveHardCapUsd: 75,
    purchasedCapBumpUsd: 0,
    estimatedUsdPressure: 12.5,
    assumedNextCallReservationUsd: 1,
    hardCapUtilizationFraction: 12.5 / 75,
    warnFraction: 0.75,
    remainingBudgetUsd: 62.5,
    asOfUtc: "2026-07-10T12:00:00.000Z",
  };
}

function mockAdminDashboard() {
  return {
    budgetAmountUsd: 75,
    usedAmountUsd: 12.5,
    remainingAmountUsd: 62.5,
    resetPeriod: "UTC month",
    hardStopEnabled: true,
    trialExpirationUtc: null,
    workspaceKind: "Trial",
    customerAiProviderConfigured: true,
    usageByFeatureUsd: {},
    recentEvents: [],
    asOfUtc: "2026-07-10T12:00:00.000Z",
  };
}

describe("useCostReportingSettingsPage (P0 load)", () => {
  beforeEach(() => {
    nav.callerAuthorityRank = 3;
    nav.isAuthorityLoading = false;
    fetchCostReporting.mockReset();
    fetchBudgetCached.mockReset();
    fetchAdminDashboard.mockReset();
    getOperatorQueryClient().clear();
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts all three fetches in parallel on mount", async () => {
    const costDeferred = deferred<ReturnType<typeof mockDashboardPayload>>();
    const budgetDeferred = deferred<ReturnType<typeof mockBudgetStatus>>();
    const adminDeferred = deferred<ReturnType<typeof mockAdminDashboard>>();

    fetchCostReporting.mockReturnValue(costDeferred.promise);
    fetchBudgetCached.mockReturnValue(budgetDeferred.promise);
    fetchAdminDashboard.mockReturnValue(adminDeferred.promise);

    renderHook(() => useCostReportingSettingsPage({ demo: false }));

    await waitFor(() => {
      expect(fetchCostReporting).toHaveBeenCalledTimes(1);
      expect(fetchBudgetCached).toHaveBeenCalledTimes(1);
      expect(fetchAdminDashboard).toHaveBeenCalledTimes(1);
    });

    expect(fetchBudgetCached).toHaveBeenCalledWith(
      expect.not.objectContaining({ force: true }),
    );

    await act(async () => {
      costDeferred.resolve(mockDashboardPayload());
      budgetDeferred.resolve(mockBudgetStatus());
      adminDeferred.resolve(mockAdminDashboard());
    });
  });

  it("sets delayed state after 8s while cost reporting is still loading", async () => {
    vi.useFakeTimers();

    const costDeferred = deferred<ReturnType<typeof mockDashboardPayload>>();
    fetchCostReporting.mockReturnValue(costDeferred.promise);
    fetchBudgetCached.mockResolvedValue(mockBudgetStatus());
    fetchAdminDashboard.mockResolvedValue(mockAdminDashboard());

    const { result } = renderHook(() => useCostReportingSettingsPage({ demo: false }));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(8_000);
    });

    expect(result.current.derived.costReportingState).toBe("delayed");

    await act(async () => {
      costDeferred.resolve(mockDashboardPayload());
      await vi.runOnlyPendingTimersAsync();
    });
  });

  it("marks cost reporting as error when the fetch aborts", async () => {
    fetchCostReporting.mockRejectedValue(new DOMException("Aborted", "AbortError"));
    fetchBudgetCached.mockResolvedValue(mockBudgetStatus());
    fetchAdminDashboard.mockResolvedValue(mockAdminDashboard());

    const { result } = renderHook(() => useCostReportingSettingsPage({ demo: false }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.derived.costReportingState).toBe("error");
    });
  });

  it("reuses cached budget status on initial mount and forces refresh on retry", async () => {
    fetchCostReporting.mockResolvedValue(mockDashboardPayload());
    fetchBudgetCached.mockResolvedValue(mockBudgetStatus());
    fetchAdminDashboard.mockResolvedValue(mockAdminDashboard());

    const { result } = renderHook(() => useCostReportingSettingsPage({ demo: false }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(fetchBudgetCached).toHaveBeenLastCalledWith(
      expect.not.objectContaining({ force: true }),
    );

    await act(async () => {
      await result.current.load({ forceRefresh: true });
    });

    expect(fetchBudgetCached).toHaveBeenLastCalledWith(expect.objectContaining({ force: true }));
  });

  it("aborts a superseded load so stale success cannot be dropped behind a newer failure", async () => {
    const slowCostDeferred = deferred<ReturnType<typeof mockDashboardPayload>>();
    fetchCostReporting.mockReturnValueOnce(slowCostDeferred.promise);
    fetchCostReporting.mockRejectedValue(new DOMException("Aborted", "AbortError"));
    fetchBudgetCached.mockResolvedValue(mockBudgetStatus());
    fetchAdminDashboard.mockResolvedValue(mockAdminDashboard());

    const { result } = renderHook(() => useCostReportingSettingsPage({ demo: false }));

    await waitFor(() => {
      expect(fetchCostReporting).toHaveBeenCalledTimes(1);
    });

    await act(async () => {
      await result.current.load({ forceRefresh: true });
    });

    await waitFor(() => {
      expect(fetchCostReporting).toHaveBeenCalledTimes(2);
      expect(result.current.derived.costReportingState).toBe("error");
    });

    await act(async () => {
      slowCostDeferred.resolve(mockDashboardPayload());
    });

    expect(result.current.derived.costReportingState).toBe("error");
    expect(result.current.data).toBeNull();
  });
});
