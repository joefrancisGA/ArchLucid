import { ApiV1Routes } from "@/lib/api-v1-routes";
import { formatExportSealedManifestAwareApiError } from "@/lib/api/export-sealed-manifest-conflict";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { proxyJsonGet } from "@/lib/proxy-json-client";
import { sponsorRoiSummaryBlockedReason } from "@/lib/roi/sponsor-roi-summary-blocked-reason";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import { getOperatorQueryClient } from "@/lib/query/operator-query-client";
import { OPERATOR_QUERY_STALE_MS } from "@/lib/query/operator-query-stale-time";
import type { SponsorRoiSummary } from "@/lib/sponsor/sponsor-report-markdown";

const SPONSOR_ROI_SUMMARY_PATH = `/api/proxy/${ApiV1Routes.roiSponsorReport}`;

/** Browser fetch for sponsor ROI summary with correlation id on all failure paths (TB-271). */
export async function fetchSponsorRoiSummaryClient(): Promise<SponsorRoiSummary> {
  try {
    return await proxyJsonGet<SponsorRoiSummary>(SPONSOR_ROI_SUMMARY_PATH);
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = sponsorRoiSummaryBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(error));
  }
}

/** Imperative read through the shared TanStack Query cache (TB-562). */
export async function fetchSponsorRoiSummaryCached(
  options?: { force?: boolean },
): Promise<SponsorRoiSummary> {
  const queryClient = getOperatorQueryClient();

  if (options?.force === true) {
    await queryClient.invalidateQueries({ queryKey: operatorQueryKeys.sponsorRoiSummary });
  }

  return queryClient.fetchQuery({
    queryKey: operatorQueryKeys.sponsorRoiSummary,
    queryFn: fetchSponsorRoiSummaryClient,
    staleTime: OPERATOR_QUERY_STALE_MS,
  });
}

/** Clears cached sponsor ROI summary (for example after disposition changes). */
export async function invalidateSponsorRoiSummaryCache(): Promise<void> {
  await getOperatorQueryClient().invalidateQueries({ queryKey: operatorQueryKeys.sponsorRoiSummary });
}
