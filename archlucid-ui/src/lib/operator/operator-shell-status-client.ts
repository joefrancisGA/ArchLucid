import type { QueryClient } from "@tanstack/react-query";

import type { AlertsInboxSummaryCounts } from "@/lib/alerts-inbox-summary";
import type { AlertsInboxSummaryApiDto } from "@/lib/api/alerts-api";
import type { GovernanceReviewsAwaitingActionResponse } from "@/lib/api/governance-stickiness-api";
import type { TenantCatalogMigrationStatus } from "@/lib/fetch-tenant-catalog-migration-status";
import type { LlmMonthlyDollarBudgetStatus } from "@/lib/llm-monthly-budget-status";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import type { OperatorScopeQueryKey } from "@/lib/operator/operator-scope-query-key";
import type { TeamExpansionNudgeStatusPayload } from "@/lib/team-expansion-nudge-trigger";
import type { TenantTrialStatusClientPayload } from "@/lib/tenant-trial-status-client";
import type { OperatorStickinessSnapshotDto } from "@/types/operate-rhythm";
import type { TenantHomepageSettingsResponse } from "@/types/tenant-homepage-settings";

export type OperatorShellStatusPayload = {
  readonly trialStatus: TenantTrialStatusClientPayload | null;
  readonly catalogMigration: TenantCatalogMigrationStatus | null;
  readonly llmMonthlyBudgetStatus: LlmMonthlyDollarBudgetStatus | null;
  readonly alertsInboxSummary: AlertsInboxSummaryCounts | null;
  readonly usageStatus: TeamExpansionNudgeStatusPayload | null;
  readonly homepageSettings: TenantHomepageSettingsResponse | null;
  readonly stickinessSnapshot: OperatorStickinessSnapshotDto | null;
  readonly assignedToMeFindingsCount: number | null;
  readonly reviewsAwaitingAction: GovernanceReviewsAwaitingActionResponse | null;
};

type OperatorShellHomepageSettingsApiDto = {
  readonly selectedRunId?: string | null;
  readonly isConfigured?: boolean;
  readonly isAvailable?: boolean;
  readonly reviewTitle?: string | null;
  readonly architectureName?: string | null;
  readonly completedUtc?: string | null;
  readonly isSampleApproved?: boolean;
};

type OperatorShellStickinessSnapshotApiDto = {
  readonly pilotFunnel?: {
    readonly firstRunCreatedUtc?: string | null;
    readonly firstGoldenManifestUtc?: string | null;
    readonly firstComparisonUtc?: string | null;
    readonly firstArtifactOrBundleDownloadUtc?: string | null;
    readonly firstReplayUtc?: string | null;
    readonly totalRunsInScope?: number;
    readonly committedRunsInScope?: number;
    readonly productLearningSignalsLast90Days?: number;
  };
  readonly latestRunId?: string | null;
  readonly comparisonEventsLast30Days?: number;
  readonly pendingGovernanceApprovals?: number;
};

type OperatorShellStatusApiDto = {
  readonly trialStatus?: TenantTrialStatusClientPayload | null;
  readonly catalogMigration?: TenantCatalogMigrationStatus | null;
  readonly llmMonthlyBudgetStatus?: LlmMonthlyDollarBudgetStatus | null;
  readonly alertsInboxSummary?: AlertsInboxSummaryApiDto | null;
  readonly usageStatus?: TeamExpansionNudgeStatusPayload | null;
  readonly homepageSettings?: OperatorShellHomepageSettingsApiDto | null;
  readonly stickinessSnapshot?: OperatorShellStickinessSnapshotApiDto | null;
  readonly assignedToMeFindingsCount?: number | null;
  readonly reviewsAwaitingAction?: GovernanceReviewsAwaitingActionResponse | null;
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

function mapHomepageSettings(
  dto: OperatorShellHomepageSettingsApiDto | null | undefined,
): TenantHomepageSettingsResponse | null {
  if (dto === null || dto === undefined) {
    return null;
  }

  return {
    selectedRunId: dto.selectedRunId ?? null,
    isConfigured: dto.isConfigured === true,
    isAvailable: dto.isAvailable === true,
    reviewTitle: dto.reviewTitle ?? null,
    architectureName: dto.architectureName ?? null,
    completedUtc: dto.completedUtc ?? null,
    isSampleApproved: dto.isSampleApproved === true,
  };
}

function mapStickinessSnapshot(
  dto: OperatorShellStickinessSnapshotApiDto | null | undefined,
): OperatorStickinessSnapshotDto | null {
  if (dto === null || dto === undefined || dto.pilotFunnel === undefined) {
    return null;
  }

  return {
    pilotFunnel: {
      firstRunCreatedUtc: dto.pilotFunnel.firstRunCreatedUtc ?? null,
      firstGoldenManifestUtc: dto.pilotFunnel.firstGoldenManifestUtc ?? null,
      firstComparisonUtc: dto.pilotFunnel.firstComparisonUtc ?? null,
      firstArtifactOrBundleDownloadUtc: dto.pilotFunnel.firstArtifactOrBundleDownloadUtc ?? null,
      firstReplayUtc: dto.pilotFunnel.firstReplayUtc ?? null,
      totalRunsInScope: dto.pilotFunnel.totalRunsInScope ?? 0,
      committedRunsInScope: dto.pilotFunnel.committedRunsInScope ?? 0,
      productLearningSignalsLast90Days: dto.pilotFunnel.productLearningSignalsLast90Days ?? 0,
    },
    latestRunId: dto.latestRunId ?? null,
    comparisonEventsLast30Days: dto.comparisonEventsLast30Days ?? 0,
    pendingGovernanceApprovals: dto.pendingGovernanceApprovals ?? 0,
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
    homepageSettings: mapHomepageSettings(dto.homepageSettings),
    stickinessSnapshot: mapStickinessSnapshot(dto.stickinessSnapshot),
    assignedToMeFindingsCount: dto.assignedToMeFindingsCount ?? null,
    reviewsAwaitingAction: dto.reviewsAwaitingAction ?? null,
  };
}

/**
 * Fetches aggregated shell status and writes per-concern caches before returning.
 * Hydration must run inside the bootstrap queryFn (not a follow-up effect): concern
 * queries enable on the same render as `isFetched`, and an empty cache would fire
 * sibling GETs such as `/v1/admin/llm-monthly-dollar-budget-status` in parallel.
 */
export async function fetchAndHydrateOperatorShellStatus(
  queryClient: QueryClient,
  scope: OperatorScopeQueryKey,
): Promise<OperatorShellStatusPayload> {
  const payload = await fetchOperatorShellStatus();
  hydrateOperatorShellStatusCaches(queryClient, scope, payload);

  return payload;
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

  if (payload.homepageSettings !== null) {
    queryClient.setQueryData(operatorQueryKeys.tenantHomepageSettings, payload.homepageSettings);
  }

  if (payload.stickinessSnapshot !== null) {
    queryClient.setQueryData(operatorQueryKeys.operatorStickinessSnapshot, payload.stickinessSnapshot);
  }

  if (payload.assignedToMeFindingsCount !== null) {
    queryClient.setQueryData(
      operatorQueryKeys.governanceAssignedToMeFindingsCount(scope),
      payload.assignedToMeFindingsCount,
    );
  }

  if (payload.reviewsAwaitingAction !== null) {
    queryClient.setQueryData(
      operatorQueryKeys.governanceReviewsAwaitingAction(scope),
      payload.reviewsAwaitingAction,
    );
  }
}
