import type { QueryClient } from "@tanstack/react-query";

import type { AlertsInboxSummaryCounts } from "@/lib/alerts-inbox-summary";
import type { AlertsInboxSummaryApiDto } from "@/lib/api/alerts-api";
import type { TenantCatalogMigrationStatus } from "@/lib/fetch-tenant-catalog-migration-status";
import type { LlmMonthlyDollarBudgetStatus } from "@/lib/llm-monthly-budget-status";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import type { OperatorScopeQueryKey } from "@/lib/operator/operator-scope-query-key";
import type { TeamExpansionNudgeStatusPayload } from "@/lib/team-expansion-nudge-trigger";
import type { TenantTrialStatusClientPayload } from "@/lib/tenant-trial-status-client";

export type OperatorShellStatusPayload = {
  readonly trialStatus: TenantTrialStatusClientPayload | null;
  readonly catalogMigration: TenantCatalogMigrationStatus | null;
  readonly llmMonthlyBudgetStatus: LlmMonthlyDollarBudgetStatus | null;
  readonly alertsInboxSummary: AlertsInboxSummaryCounts | null;
  readonly usageStatus: TeamExpansionNudgeStatusPayload | null;
};

type OperatorShellStatusApiDto = {
  readonly trialStatus?: TenantTrialStatusClientPayload | null;
  readonly catalogMigration?: TenantCatalogMigrationStatus | null;
  readonly llmMonthlyBudgetStatus?: LlmMonthlyDollarBudgetStatus | null;
  readonly alertsInboxSummary?: AlertsInboxSummaryApiDto | null;
  readonly usageStatus?: TeamExpansionNudgeStatusPayload | null;
};

function mapAlertsInboxSummary(dto: AlertsInboxSummaryApiDto | null | undefined): AlertsInboxSummaryCounts | null {
  if (dto === null || dto === undefined) {
    return null;
  }

  return {
    open: dto.openCount,
    acknowledged: dto.acknowledgedCount,
    resolved: dto.resolvedCount,
    blocking: dto.blockingCount,
    lastEvaluatedUtc: dto.lastEvaluatedUtc ?? null,
  };
}

/** Aggregated operator shell status (`GET /v1/operator/shell-status`). */
export async function fetchOperatorShellStatus(): Promise<OperatorShellStatusPayload> {
  const res = await fetch(
    "/api/proxy/v1/operator/shell-status",
    mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" } }),
  );

  if (!res.ok) {
    throw new Error("operator-shell-status-unavailable");
  }

  const dto = (await res.json()) as OperatorShellStatusApiDto;

  return {
    trialStatus: dto.trialStatus ?? null,
    catalogMigration: dto.catalogMigration ?? null,
    llmMonthlyBudgetStatus: dto.llmMonthlyBudgetStatus ?? null,
    alertsInboxSummary: mapAlertsInboxSummary(dto.alertsInboxSummary),
    usageStatus: dto.usageStatus ?? null,
  };
}

export function hydrateOperatorShellStatusCaches(
  queryClient: QueryClient,
  scope: OperatorScopeQueryKey,
  payload: OperatorShellStatusPayload,
): void {
  if (payload.trialStatus !== null) {
    queryClient.setQueryData(operatorQueryKeys.tenantTrialStatus, payload.trialStatus);
  }

  if (payload.catalogMigration !== null) {
    queryClient.setQueryData(operatorQueryKeys.tenantCatalogMigrationStatus, payload.catalogMigration);
  }

  if (payload.llmMonthlyBudgetStatus !== null) {
    queryClient.setQueryData(operatorQueryKeys.llmMonthlyBudgetStatus, payload.llmMonthlyBudgetStatus);
  }

  if (payload.alertsInboxSummary !== null) {
    queryClient.setQueryData(operatorQueryKeys.alertsInboxSummary(scope), payload.alertsInboxSummary);
  }

  if (payload.usageStatus !== null) {
    queryClient.setQueryData(operatorQueryKeys.tenantUsageStatus, payload.usageStatus);
  }
}
