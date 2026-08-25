import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getEffectiveBrowserProxyScopeHeaders, writeOperatorScopeToStorage, ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT } from "@/lib/operator/operator-scope-storage";
import { OPERATOR_SCOPE_COOKIE_NAME } from "@/lib/operator/operator-scope-cookie";
import { OPERATOR_RECENT_VIEWS_STORAGE_KEY } from "@/lib/operator/operator-recent-views";
import { HAS_EXISTING_RUNS_CACHE_KEY } from "@/lib/operator/operator-run-presence";
import { DEV_SCOPE_PROJECT_ID, DEV_SCOPE_TENANT_ID, DEV_SCOPE_WORKSPACE_ID } from "@/lib/scope";
import { getOperatorQueryClient, resetOperatorQueryClientForTests } from "@/lib/query/operator-query-client";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";

describe("operator-scope-storage", () => {
  beforeEach(() => {
    resetOperatorQueryClientForTests();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    localStorage.clear();
  });

  it("getEffectiveBrowserProxyScopeHeaders_usesLocalStorageWhenAllIdsSet", () => {
    writeOperatorScopeToStorage({
      tenantId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      workspaceId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      projectId: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      workspaceLabel: "WS",
      projectLabel: "PR",
    });
    const h = getEffectiveBrowserProxyScopeHeaders();
    expect(h["x-tenant-id"]).toBe("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    expect(h["x-workspace-id"]).toBe("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    expect(h["x-project-id"]).toBe("cccccccc-cccc-cccc-cccc-cccccccccccc");
    expect(document.cookie).toContain(`${OPERATOR_SCOPE_COOKIE_NAME}=`);
  });

  it("getEffectiveBrowserProxyScopeHeaders_fallsBackToDevDefaultsWhenNoOverride", () => {
    const h = getEffectiveBrowserProxyScopeHeaders();
    expect(h["x-tenant-id"]).toBe(DEV_SCOPE_TENANT_ID);
    expect(h["x-workspace-id"]).toBe(DEV_SCOPE_WORKSPACE_ID);
    expect(h["x-project-id"]).toBe(DEV_SCOPE_PROJECT_ID);
  });

  it("writeOperatorScopeToStorage_dispatchesScopeChangedEvent", () => {
    const listener = vi.fn();
    window.addEventListener(ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT, listener);

    writeOperatorScopeToStorage({
      tenantId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      workspaceId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      projectId: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      workspaceLabel: "WS",
      projectLabel: "PR",
    });

    expect(listener).toHaveBeenCalledTimes(1);
    window.removeEventListener(ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT, listener);
  });

  it("writeOperatorScopeToStorage_clears_scope_agnostic_client_caches", () => {
    localStorage.setItem(
      OPERATOR_RECENT_VIEWS_STORAGE_KEY,
      JSON.stringify({
        schemaVersion: 1,
        entries: [{ href: "/architecture/reviews/old", label: "Review", kind: "review", visitedAtUtc: "2026-08-01T00:00:00Z" }],
      }),
    );
    localStorage.setItem(HAS_EXISTING_RUNS_CACHE_KEY, "1");

    writeOperatorScopeToStorage({
      tenantId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      workspaceId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      projectId: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      workspaceLabel: "WS",
      projectLabel: "PR",
    });

    expect(localStorage.getItem(OPERATOR_RECENT_VIEWS_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(HAS_EXISTING_RUNS_CACHE_KEY)).toBeNull();
  });

  it("writeOperatorScopeToStorage_clears_billing_subscription_status_cache", () => {
    const queryClient = getOperatorQueryClient();
    queryClient.setQueryData(operatorQueryKeys.billingSubscriptionStatus, {
      hasSubscription: true,
      tierCode: "Enterprise",
      status: "active",
      isPaymentPastDue: false,
    });

    writeOperatorScopeToStorage({
      tenantId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      workspaceId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      projectId: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      workspaceLabel: "WS",
      projectLabel: "PR",
    });

    expect(queryClient.getQueryData(operatorQueryKeys.billingSubscriptionStatus)).toBeUndefined();
  });
});
