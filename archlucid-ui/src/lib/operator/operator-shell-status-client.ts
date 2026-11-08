import type { QueryClient } from "@tanstack/react-query";

import type { AlertsInboxSummaryCounts } from "@/lib/alerts-inbox-summary";
import type { AlertsInboxSummaryApiDto } from "@/lib/api/alerts-api";
import type { GovernanceReviewsAwaitingActionResponse } from "@/lib/api/governance-stickiness-api";
import type { TenantCatalogMigrationStatus } from "@/lib/fetch-tenant-catalog-migration-status";
import type { LlmMonthlyDollarBudgetStatus } from "@/lib/llm-monthly-budget-status";
import { proxyJsonGet } from "@/lib/proxy-json-client";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import type { OperatorScopeQueryKey } from "@/lib/operator/operator-scope-query-key";
import type { TeamExpansionNudgeStatusPayload } from "@/lib/team-expansion-nudge-trigger";
import type { TenantTrialStatusClientPayload } from "@/lib/tenant-trial-status-client";
import {
  normalizeOperatorHomeNonNegativeCount,
  normalizeOperatorShellNullableCount,
} from "@/lib/operator/run-home-status";
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
    open: normalizeOperatorHomeNonNegativeCount(dto.openCount),
    acknowledged: normalizeOperatorHomeNonNegativeCount(dto.acknowledgedCount),
    resolved: normalizeOperatorHomeNonNegativeCount(dto.resolvedCount),
    blocking: normalizeOperatorHomeNonNegativeCount(dto.blockingCount),
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

function emptyStickinessPilotFunnel(): OperatorStickinessSnapshotDto["pilotFunnel"] {
  return {
    firstRunCreatedUtc: null,
    firstGoldenManifestUtc: null,
    firstComparisonUtc: null,
    firstArtifactOrBundleDownloadUtc: null,
    firstReplayUtc: null,
    totalRunsInScope: 0,
    committedRunsInScope: 0,
    productLearningSignalsLast90Days: 0,
  };
}

function mapStickinessPilotFunnel(
  funnel: NonNullable<OperatorShellStickinessSnapshotApiDto["pilotFunnel"]>,
): OperatorStickinessSnapshotDto["pilotFunnel"] {
  return {
    firstRunCreatedUtc: funnel.firstRunCreatedUtc ?? null,
    firstGoldenManifestUtc: funnel.firstGoldenManifestUtc ?? null,
    firstComparisonUtc: funnel.firstComparisonUtc ?? null,
    firstArtifactOrBundleDownloadUtc: funnel.firstArtifactOrBundleDownloadUtc ?? null,
    firstReplayUtc: funnel.firstReplayUtc ?? null,
    totalRunsInScope: normalizeOperatorHomeNonNegativeCount(funnel.totalRunsInScope),
    committedRunsInScope: normalizeOperatorHomeNonNegativeCount(funnel.committedRunsInScope),
    productLearningSignalsLast90Days: normalizeOperatorHomeNonNegativeCount(
      funnel.productLearningSignalsLast90Days,
    ),
  };
}

function mapStickinessSnapshot(
  dto: OperatorShellStickinessSnapshotApiDto | null | undefined,
): OperatorStickinessSnapshotDto | null {
  if (dto === null || dto === undefined) {
    return null;
  }

  const pilotFunnel = dto.pilotFunnel;

  if (pilotFunnel === null || pilotFunnel === undefined) {
    const hasTopLevelMetrics =
      dto.latestRunId !== undefined
      || dto.comparisonEventsLast30Days !== undefined
      || dto.pendingGovernanceApprovals !== undefined;

    if (!hasTopLevelMetrics) {
      return null;
    }

    return {
      pilotFunnel: emptyStickinessPilotFunnel(),
      latestRunId: dto.latestRunId ?? null,
      comparisonEventsLast30Days: normalizeOperatorHomeNonNegativeCount(dto.comparisonEventsLast30Days),
      pendingGovernanceApprovals: normalizeOperatorHomeNonNegativeCount(dto.pendingGovernanceApprovals),
    };
  }

  return {
    pilotFunnel: mapStickinessPilotFunnel(pilotFunnel),
    latestRunId: dto.latestRunId ?? null,
    comparisonEventsLast30Days: normalizeOperatorHomeNonNegativeCount(dto.comparisonEventsLast30Days),
    pendingGovernanceApprovals: normalizeOperatorHomeNonNegativeCount(dto.pendingGovernanceApprovals),
  };
}

/** Aggregated operator shell status (`GET /v1/operator/shell-status`). */
export async function fetchOperatorShellStatus(): Promise<OperatorShellStatusPayload> {
  const dto = await proxyJsonGet<OperatorShellStatusApiDto>("/api/proxy/v1/operator/shell-status");

  return {
    trialStatus: dto.trialStatus ?? null,
    catalogMigration: dto.catalogMigration ?? null,
    llmMonthlyBudgetStatus: dto.llmMonthlyBudgetStatus ?? null,
    alertsInboxSummary: mapAlertsInboxSummary(dto.alertsInboxSummary),
    usageStatus: dto.usageStatus ?? null,
    homepageSettings: mapHomepageSettings(dto.homepageSettings),
    stickinessSnapshot: mapStickinessSnapshot(dto.stickinessSnapshot),
    assignedToMeFindingsCount: normalizeOperatorShellNullableCount(dto.assignedToMeFindingsCount),
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

function hydrateNullableQueryCache<T>(
  queryClient: QueryClient,
  queryKey: readonly unknown[],
  value: T | null,
): void {
  if (value !== null) {
    queryClient.setQueryData(queryKey, value);
  } else {
    queryClient.removeQueries({ queryKey, exact: true });
  }
}

export function hydrateOperatorShellStatusCaches(
  queryClient: QueryClient,
  scope: OperatorScopeQueryKey,
  payload: OperatorShellStatusPayload,
): void {
  hydrateNullableQueryCache(queryClient, operatorQueryKeys.tenantTrialStatus, payload.trialStatus);
  hydrateNullableQueryCache(queryClient, operatorQueryKeys.tenantCatalogMigrationStatus, payload.catalogMigration);
  hydrateNullableQueryCache(queryClient, operatorQueryKeys.llmMonthlyBudgetStatus, payload.llmMonthlyBudgetStatus);
  hydrateNullableQueryCache(queryClient, operatorQueryKeys.alertsInboxSummary(scope), payload.alertsInboxSummary);
  hydrateNullableQueryCache(queryClient, operatorQueryKeys.tenantUsageStatus, payload.usageStatus);
  hydrateNullableQueryCache(queryClient, operatorQueryKeys.tenantHomepageSettings, payload.homepageSettings);
  hydrateNullableQueryCache(queryClient, operatorQueryKeys.operatorStickinessSnapshot, payload.stickinessSnapshot);
  hydrateNullableQueryCache(
    queryClient,
    operatorQueryKeys.governanceAssignedToMeFindingsCount(scope),
    payload.assignedToMeFindingsCount,
  );
  hydrateNullableQueryCache(
    queryClient,
    operatorQueryKeys.governanceReviewsAwaitingAction(scope),
    payload.reviewsAwaitingAction,
  );
}
