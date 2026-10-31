import { afterEach, describe, expect, it, vi } from "vitest";
import { getOperatorQueryClient, resetOperatorQueryClientForTests } from "@/lib/query/operator-query-client";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";

import {
  ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT,
  OPERATOR_SCOPE_STORAGE_KEY,
  readOperatorScopeFromStorage,
  refreshOperatorScopeFromCrossTabStorage,
  subscribeOperatorScopeStorageChanges,
  writeOperatorScopeToStorage,
} from "./operator-scope-storage";

describe("operator-scope-storage cross-tab (LW-085 / LW-088)", () => {
  afterEach(() => {
    window.localStorage.clear();
    resetOperatorQueryClientForTests();
    vi.restoreAllMocks();
  });

  it("notifies subscribers when another tab writes scope storage", () => {
    const listener = vi.fn();

    subscribeOperatorScopeStorageChanges(listener);

    window.dispatchEvent(
      new StorageEvent("storage", {
        key: OPERATOR_SCOPE_STORAGE_KEY,
        newValue: JSON.stringify({
          tenantId: "tenant-a",
          workspaceId: "workspace-b",
          projectId: "project-b",
          workspaceLabel: "B",
          projectLabel: "Secondary",
        }),
      }),
    );

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("refreshes dependent client state from cross-tab storage without rewriting storage", () => {
    const events: string[] = [];

    window.addEventListener(ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT, () => {
      events.push("changed");
    });

    writeOperatorScopeToStorage({
      tenantId: "tenant-a",
      workspaceId: "workspace-a",
      projectId: "project-a",
      workspaceLabel: "A",
      projectLabel: "Primary",
    });

    refreshOperatorScopeFromCrossTabStorage();

    expect(events).toContain("changed");
    expect(readOperatorScopeFromStorage()?.workspaceId).toBe("workspace-a");
  });

  it("evicts outgoing tenant cache before synchronously notifying same-tab and cross-tab subscribers", () => {
    const queryClient = getOperatorQueryClient();
    queryClient.setQueryData(operatorQueryKeys.tenantCostSettings, { tenantId: "tenant-a" });
    queryClient.setQueryData(operatorQueryKeys.userPreferences, { theme: "dark" });

    const observed: Array<{ tenantId: string | null; cost: unknown; preferences: unknown }> = [];
    const unsubscribe = subscribeOperatorScopeStorageChanges(() => {
      observed.push({
        tenantId: readOperatorScopeFromStorage()?.tenantId ?? null,
        cost: queryClient.getQueryData(operatorQueryKeys.tenantCostSettings),
        preferences: queryClient.getQueryData(operatorQueryKeys.userPreferences),
      });
    });

    try {
      writeOperatorScopeToStorage({
        tenantId: "tenant-b",
        workspaceId: "workspace-b",
        projectId: "project-b",
        workspaceLabel: "B",
        projectLabel: "Secondary",
      });
      expect(observed).toEqual([{
        tenantId: "tenant-b",
        cost: undefined,
        preferences: { theme: "dark" },
      }]);

      queryClient.setQueryData(operatorQueryKeys.tenantCostSettings, { tenantId: "tenant-b" });
      refreshOperatorScopeFromCrossTabStorage();
      expect(observed).toEqual([
        { tenantId: "tenant-b", cost: undefined, preferences: { theme: "dark" } },
        { tenantId: "tenant-b", cost: undefined, preferences: { theme: "dark" } },
      ]);
    } finally {
      unsubscribe();
    }
  });

});
