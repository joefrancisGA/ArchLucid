import type { components } from "@/lib/openapi-schemas";

import { formatExportSealedManifestAwareApiError } from "./export-sealed-manifest-conflict";
import { comparisonRecordBlockedReason } from "@/lib/compare/comparison-record-blocked-reason";
import { comparisonSearchBlockedReason } from "@/lib/compare/comparison-search-blocked-reason";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { apiGetSealedManifestAware } from "./api-get-sealed-manifest-aware";

export type ComparisonRecordResponse = components["schemas"]["ComparisonRecordResponse"];
export type ComparisonSummaryResponse = components["schemas"]["ComparisonSummaryResponse"];
export type ComparisonHistoryResponse = components["schemas"]["ComparisonHistoryResponse"];

export type ComparisonSearchQuery = {
  readonly comparisonType?: string;
  readonly leftRunId?: string;
  readonly rightRunId?: string;
  readonly leftExportRecordId?: string;
  readonly rightExportRecordId?: string;
  readonly label?: string;
  readonly cursor?: string;
  readonly pageSize?: number;
};

/** Searches persisted comparison audit rows with optional run/export filters. */
export async function searchComparisonRecords(
  query: ComparisonSearchQuery = {},
): Promise<ComparisonHistoryResponse> {
  const params = new URLSearchParams();

  if (query.comparisonType) params.set("comparisonType", query.comparisonType);
  if (query.leftRunId) params.set("leftRunId", query.leftRunId);
  if (query.rightRunId) params.set("rightRunId", query.rightRunId);
  if (query.leftExportRecordId) params.set("leftExportRecordId", query.leftExportRecordId);
  if (query.rightExportRecordId) params.set("rightExportRecordId", query.rightExportRecordId);
  if (query.label) params.set("label", query.label);
  if (query.cursor) params.set("cursor", query.cursor);
  if (typeof query.pageSize === "number") params.set("pageSize", String(query.pageSize));

  const suffix = params.size > 0 ? `?${params.toString()}` : "";

  try {
    return await apiGetSealedManifestAware<ComparisonHistoryResponse>(`/v1/architecture/comparisons${suffix}`);
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = comparisonSearchBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}

/** Loads one persisted comparison audit row. */
export async function getComparisonRecord(comparisonRecordId: string): Promise<ComparisonRecordResponse> {
  try {
    return await apiGetSealedManifestAware<ComparisonRecordResponse>(
      `/v1/architecture/comparisons/${encodeURIComponent(comparisonRecordId)}`,
    );
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = comparisonRecordBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}

/** Loads the markdown summary for a persisted comparison record. */
export async function getComparisonSummary(comparisonRecordId: string): Promise<ComparisonSummaryResponse> {
  try {
    return await apiGetSealedManifestAware<ComparisonSummaryResponse>(
      `/v1/architecture/comparisons/${encodeURIComponent(comparisonRecordId)}/summary`,
    );
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = comparisonRecordBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }

}
