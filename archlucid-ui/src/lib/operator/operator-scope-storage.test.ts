import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { FRICTIONLESS_TRIAL_SESSION_STORAGE_KEY } from "@/lib/frictionless-trial-session";
import {
  markOperatorHomeRunsSnapshotStale,
  consumeOperatorHomeRunsSnapshotStale,
} from "@/lib/operator/operator-home-lifecycle-notify";
import { getEffectiveBrowserProxyScopeHeaders, writeOperatorScopeToStorage, ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT } from "@/lib/operator/operator-scope-storage";
import { OPERATOR_SCOPE_COOKIE_NAME } from "@/lib/operator/operator-scope-cookie";
import { OPERATOR_RECENT_VIEWS_STORAGE_KEY } from "@/lib/operator/operator-recent-views";
import { HAS_EXISTING_RUNS_CACHE_KEY } from "@/lib/operator/operator-run-presence";
import { HAS_SEEN_ONBOARDING_STORAGE_KEY } from "@/lib/operator/operator-welcome-onboarding-storage";
import {
  OPERATOR_HOME_DISCLOSURE_COLLAPSED_VALUE,
  OPERATOR_HOME_DISCLOSURE_STORAGE_KEYS,
} from "@/lib/operator/operator-home-disclosure-storage";
import { DEV_SCOPE_PROJECT_ID, DEV_SCOPE_TENANT_ID, DEV_SCOPE_WORKSPACE_ID } from "@/lib/scope";
import { getOperatorQueryClient, resetOperatorQueryClientForTests } from "@/lib/query/operator-query-client";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import { clearOidcSession, persistTokenResponse } from "@/lib/oidc/session";

describe("operator-scope-storage", () => {
  beforeEach(() => {
    clearOidcSession();
    resetOperatorQueryClientForTests();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    clearOidcSession();
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

  it("writeOperatorScopeToStorage_clears_llm_monthly_budget_status_cache", () => {
    const queryClient = getOperatorQueryClient();
    queryClient.setQueryData(operatorQueryKeys.llmMonthlyBudgetStatus, {
      monthlyBudgetMonitoringActive: true,
      blocksAdditionalLlmExecution: false,
      utcMonth: "2026-08",
      hardCutoffUsdPerUtcMonth: 100,
      effectiveHardCapUsd: 100,
      purchasedCapBumpUsd: null,
      estimatedUsdPressure: 10,
      assumedNextCallReservationUsd: null,
      hardCapUtilizationFraction: 0.25,
      warnFraction: 0.75,
    });

    writeOperatorScopeToStorage({
      tenantId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      workspaceId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      projectId: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      workspaceLabel: "WS",
      projectLabel: "PR",
    });

    expect(queryClient.getQueryData(operatorQueryKeys.llmMonthlyBudgetStatus)).toBeUndefined();
  });

  it("writeOperatorScopeToStorage_clears_frictionless_trial_session_when_signed_in", () => {
    persistTokenResponse({
      access_token: "signed-in-access-token",
      token_type: "Bearer",
      expires_in: 3600,
    });
    localStorage.setItem(FRICTIONLESS_TRIAL_SESSION_STORAGE_KEY, "1");

    writeOperatorScopeToStorage({
      tenantId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      workspaceId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      projectId: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      workspaceLabel: "WS",
      projectLabel: "PR",
    });

    expect(localStorage.getItem(FRICTIONLESS_TRIAL_SESSION_STORAGE_KEY)).toBeNull();
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

  it("writeOperatorScopeToStorage_clears_user_attention_summary_cache", () => {
    const queryClient = getOperatorQueryClient();
    queryClient.setQueryData(operatorQueryKeys.userAttentionSummary, {
      assignedToMeFindingsCount: 9,
      awaitingApprovalCount: 2,
      alertsOpenCount: 1,
    });

    writeOperatorScopeToStorage({
      tenantId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      workspaceId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      projectId: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      workspaceLabel: "WS",
      projectLabel: "PR",
    });

    expect(queryClient.getQueryData(operatorQueryKeys.userAttentionSummary)).toBeUndefined();
  });

  it("writeOperatorScopeToStorage_clears_welcome_onboarding_dismissal", () => {
    localStorage.setItem(HAS_SEEN_ONBOARDING_STORAGE_KEY, "true");

    writeOperatorScopeToStorage({
      tenantId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      workspaceId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      projectId: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      workspaceLabel: "WS",
      projectLabel: "PR",
    });

    expect(localStorage.getItem(HAS_SEEN_ONBOARDING_STORAGE_KEY)).toBeNull();
  });

  it("writeOperatorScopeToStorage_clears_operator_home_runs_stale_flag", () => {
    markOperatorHomeRunsSnapshotStale();

    writeOperatorScopeToStorage({
      tenantId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      workspaceId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      projectId: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      workspaceLabel: "WS",
      projectLabel: "PR",
    });

    expect(consumeOperatorHomeRunsSnapshotStale()).toBe(false);
  });

  it("writeOperatorScopeToStorage_clears_home_disclosure_prefs", () => {
    localStorage.setItem(
      OPERATOR_HOME_DISCLOSURE_STORAGE_KEYS.pilotStartHere,
      OPERATOR_HOME_DISCLOSURE_COLLAPSED_VALUE,
    );

    writeOperatorScopeToStorage({
      tenantId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      workspaceId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      projectId: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      workspaceLabel: "WS",
      projectLabel: "PR",
    });

    expect(localStorage.getItem(OPERATOR_HOME_DISCLOSURE_STORAGE_KEYS.pilotStartHere)).toBeNull();
  });
});
