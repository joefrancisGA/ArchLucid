import type { QueryClient } from "@tanstack/react-query";

import { operatorQueryKeys } from "@/lib/query/operator-query-keys";

/** TanStack keys hydrated by shell status without a scope segment — must not survive tenant switch. */
export const OPERATOR_SHELL_STATUS_SCOPE_AGNOSTIC_QUERY_KEYS = [
  operatorQueryKeys.tenantTrialStatus,
  operatorQueryKeys.tenantCatalogMigrationStatus,
  operatorQueryKeys.llmMonthlyBudgetStatus,
  operatorQueryKeys.tenantUsageStatus,
  operatorQueryKeys.tenantHomepageSettings,
  operatorQueryKeys.operatorStickinessSnapshot,
] as const;

export function clearOperatorShellStatusScopeAgnosticCaches(queryClient: QueryClient): void {
  for (const queryKey of OPERATOR_SHELL_STATUS_SCOPE_AGNOSTIC_QUERY_KEYS) {
    queryClient.removeQueries({ queryKey, exact: true });
  }
}
