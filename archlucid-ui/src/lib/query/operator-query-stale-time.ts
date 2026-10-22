/** Shared stale window for operator shell status queries (trial, health, budget, usage). */
export const OPERATOR_QUERY_STALE_MS = 60_000;

/** Catalog migration idle tenants — stable `inMigration=false` rarely changes. */
export const OPERATOR_SHELL_MIGRATION_IDLE_STALE_MS = 15 * 60_000;

/** Paid / converted trial lifecycle — trial banners are not active. */
export const OPERATOR_SHELL_TRIAL_STABLE_STALE_MS = 10 * 60_000;

/** LLM budget when monitoring is off or posture is stable. */
export const OPERATOR_SHELL_LLM_BUDGET_STABLE_STALE_MS = 5 * 60_000;

/** Active LLM budget monitoring — longer than the 60s poll so observers share one fetch. */
export const OPERATOR_SHELL_LLM_BUDGET_ACTIVE_STALE_MS = 90_000;

/** Keep inactive shell queries in memory for five minutes before garbage collection. */
export const OPERATOR_QUERY_GC_MS = 5 * 60_000;

type TrialStatusLike = {
  readonly status?: string | null;
};

type CatalogMigrationLike = {
  readonly inMigration?: boolean;
};

type LlmBudgetLike = {
  readonly monthlyBudgetMonitoringActive?: boolean;
};

export function resolveTenantCatalogMigrationStaleTime(
  status: CatalogMigrationLike | undefined,
): number {
  return status?.inMigration === true ? OPERATOR_QUERY_STALE_MS : OPERATOR_SHELL_MIGRATION_IDLE_STALE_MS;
}

export function resolveTenantTrialStatusStaleTime(status: TrialStatusLike | null | undefined): number {
  const lifecycle = status?.status?.trim();

  if (
    lifecycle === undefined ||
    lifecycle.length === 0 ||
    lifecycle === "None" ||
    lifecycle === "Converted"
  ) {
    return OPERATOR_SHELL_TRIAL_STABLE_STALE_MS;
  }

  return OPERATOR_QUERY_STALE_MS;
}

export function resolveLlmMonthlyBudgetStatusStaleTime(status: LlmBudgetLike | undefined): number {
  return status?.monthlyBudgetMonitoringActive === true
    ? OPERATOR_SHELL_LLM_BUDGET_ACTIVE_STALE_MS
    : OPERATOR_SHELL_LLM_BUDGET_STABLE_STALE_MS;
}
