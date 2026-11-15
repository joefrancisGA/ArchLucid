import type { components } from "@/lib/openapi-schemas";

import { formatExportSealedManifestAwareApiError } from "./export-sealed-manifest-conflict";
import { comparisonRecordBlockedReason } from "@/lib/compare/comparison-record-blocked-reason";
import { comparisonSearchBlockedReason } from "@/lib/compare/comparison-search-blocked-reason";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { apiGetSealedManifestAware } from "./api-get-sealed-manifest-aware";
import { positiveIntegerOrDefault, trimOptionalText, trimRequiredPathSegment } from "./api-boundary-normalization";

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

  const comparisonType = trimOptionalText(query.comparisonType);
  const leftRunId = trimOptionalText(query.leftRunId);
  const rightRunId = trimOptionalText(query.rightRunId);
  const leftExportRecordId = trimOptionalText(query.leftExportRecordId);
  const rightExportRecordId = trimOptionalText(query.rightExportRecordId);
  const label = trimOptionalText(query.label);
  const cursor = trimOptionalText(query.cursor);

  if (comparisonType !== undefined) params.set("comparisonType", comparisonType);
  if (leftRunId !== undefined) params.set("leftRunId", leftRunId);
  if (rightRunId !== undefined) params.set("rightRunId", rightRunId);
  if (leftExportRecordId !== undefined) params.set("leftExportRecordId", leftExportRecordId);
  if (rightExportRecordId !== undefined) params.set("rightExportRecordId", rightExportRecordId);
  if (label !== undefined) params.set("label", label);
  if (cursor !== undefined) params.set("cursor", cursor);
  if (query.pageSize !== undefined) params.set("pageSize", String(positiveIntegerOrDefault(query.pageSize, 50)));

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
  const normalizedComparisonRecordId = trimRequiredPathSegment(comparisonRecordId, "comparisonRecordId");

  try {
    return await apiGetSealedManifestAware<ComparisonRecordResponse>(
      `/v1/architecture/comparisons/${encodeURIComponent(normalizedComparisonRecordId)}`,
    );
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = comparisonRecordBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}

/** Loads the markdown summary for a persisted comparison record. */
export async function getComparisonSummary(comparisonRecordId: string): Promise<ComparisonSummaryResponse> {
  const normalizedComparisonRecordId = trimRequiredPathSegment(comparisonRecordId, "comparisonRecordId");

  try {
    return await apiGetSealedManifestAware<ComparisonSummaryResponse>(
      `/v1/architecture/comparisons/${encodeURIComponent(normalizedComparisonRecordId)}/summary`,
    );
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = comparisonRecordBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }

}
