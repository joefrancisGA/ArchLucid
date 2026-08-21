import type { QueryClient } from "@tanstack/react-query";

import type { AlertsInboxSummaryCounts } from "@/lib/alerts-inbox-summary";
import type { TenantCatalogMigrationStatus } from "@/lib/fetch-tenant-catalog-migration-status";
import type { LlmMonthlyDollarBudgetStatus } from "@/lib/llm-monthly-budget-status";
import { buildOperatorQueryPersistBuster } from "@/lib/query/operator-query-persist-scope";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import type { OperatorScopeQueryKey } from "@/lib/operator/operator-scope-query-key";
import { getOperatorScopeQueryKeySnapshot } from "@/lib/operator/operator-scope-query-key";
import type { TenantTrialStatusClientPayload } from "@/lib/tenant-trial-status-client";

const OPERATOR_SHELL_STABLE_CACHE_STORAGE_KEY = "archlucid:operator-shell-stable:v1";
const OPERATOR_SHELL_STABLE_CACHE_MAX_AGE_MS = 30 * 60_000;

type OperatorShellStableCachePayload = {
  readonly writtenAtMs: number;
  readonly buster: string;
  readonly scope: string;
  readonly trialStatus?: TenantTrialStatusClientPayload | null;
  readonly catalogMigration?: TenantCatalogMigrationStatus;
  readonly llmMonthlyBudgetStatus?: LlmMonthlyDollarBudgetStatus;
  readonly alertsInboxSummary?: AlertsInboxSummaryCounts;
};

function isStableTrialStatus(status: TenantTrialStatusClientPayload | null | undefined): boolean {
  const lifecycle = status?.status?.trim();

  return (
    lifecycle === undefined ||
    lifecycle.length === 0 ||
    lifecycle === "None" ||
    lifecycle === "Converted"
  );
}

function isStableCatalogMigration(status: TenantCatalogMigrationStatus | undefined): boolean {
  return status?.inMigration !== true;
}

function isStableLlmBudgetStatus(status: LlmMonthlyDollarBudgetStatus | undefined): boolean {
  return status?.monthlyBudgetMonitoringActive !== true;
}

/** Drop session stable shell snapshots when operator scope changes — scope match alone is not enough after tenant switch-back. */
export function clearOperatorShellStableCache(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.removeItem(OPERATOR_SHELL_STABLE_CACHE_STORAGE_KEY);
  } catch {
    /* private mode */
  }
}

export function readOperatorShellStableCache(): OperatorShellStableCachePayload | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(OPERATOR_SHELL_STABLE_CACHE_STORAGE_KEY);

    if (raw === null) {
      return null;
    }

    const parsed = JSON.parse(raw) as OperatorShellStableCachePayload;

    if (
      typeof parsed.writtenAtMs !== "number" ||
      Date.now() - parsed.writtenAtMs > OPERATOR_SHELL_STABLE_CACHE_MAX_AGE_MS
    ) {
      window.sessionStorage.removeItem(OPERATOR_SHELL_STABLE_CACHE_STORAGE_KEY);

      return null;
    }

    if (
      parsed.buster !== buildOperatorQueryPersistBuster() ||
      parsed.scope !== getOperatorScopeQueryKeySnapshot()
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function writeOperatorShellStableCache(args: {
  readonly trialStatus?: TenantTrialStatusClientPayload | null;
  readonly catalogMigration?: TenantCatalogMigrationStatus;
  readonly llmMonthlyBudgetStatus?: LlmMonthlyDollarBudgetStatus;
  readonly alertsInboxSummary?: AlertsInboxSummaryCounts;
}): void {
  if (typeof window === "undefined") {
    return;
  }

  const stableTrial = isStableTrialStatus(args.trialStatus);
  const stableMigration = isStableCatalogMigration(args.catalogMigration);
  const stableBudget = isStableLlmBudgetStatus(args.llmMonthlyBudgetStatus);

  if (!stableTrial && !stableMigration && !stableBudget && args.alertsInboxSummary === undefined) {
    return;
  }

  const payload: OperatorShellStableCachePayload = {
    writtenAtMs: Date.now(),
    buster: buildOperatorQueryPersistBuster(),
    scope: getOperatorScopeQueryKeySnapshot(),
    ...(stableTrial && args.trialStatus !== undefined ? { trialStatus: args.trialStatus } : {}),
    ...(stableMigration && args.catalogMigration !== undefined
      ? { catalogMigration: args.catalogMigration }
      : {}),
    ...(stableBudget && args.llmMonthlyBudgetStatus !== undefined
      ? { llmMonthlyBudgetStatus: args.llmMonthlyBudgetStatus }
      : {}),
    ...(args.alertsInboxSummary !== undefined ? { alertsInboxSummary: args.alertsInboxSummary } : {}),
  };

  try {
    window.sessionStorage.setItem(OPERATOR_SHELL_STABLE_CACHE_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* private mode */
  }
}

export function hydrateOperatorShellStableCache(
  queryClient: QueryClient,
  scope: OperatorScopeQueryKey,
): boolean {
  const cached = readOperatorShellStableCache();

  if (cached === null) {
    return false;
  }

  if (cached.trialStatus !== undefined) {
    queryClient.setQueryData(operatorQueryKeys.tenantTrialStatus, cached.trialStatus);
  }

  if (cached.catalogMigration !== undefined) {
    queryClient.setQueryData(operatorQueryKeys.tenantCatalogMigrationStatus, cached.catalogMigration);
  }

  if (cached.llmMonthlyBudgetStatus !== undefined) {
    queryClient.setQueryData(operatorQueryKeys.llmMonthlyBudgetStatus, cached.llmMonthlyBudgetStatus);
  }

  if (cached.alertsInboxSummary !== undefined) {
    queryClient.setQueryData(operatorQueryKeys.alertsInboxSummary(scope), cached.alertsInboxSummary);
  }

  return true;
}
