import { ApiV1Routes } from "@/lib/api-v1-routes";
import { buildApiRequestErrorFromParts } from "@/lib/api-error";
import { applyCorrelationHeaders } from "@/lib/api/http";
import type { SponsorRoiSummary } from "@/lib/sponsor/sponsor-report-markdown";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import { getOperatorQueryClient } from "@/lib/query/operator-query-client";
import { OPERATOR_QUERY_STALE_MS } from "@/lib/query/operator-query-stale-time";

const SPONSOR_ROI_SUMMARY_PATH = `/api/proxy/${ApiV1Routes.roiSponsorReport}`;

/** Browser fetch for sponsor ROI summary with correlation id on all failure paths (TB-271). */
export async function fetchSponsorRoiSummaryClient(): Promise<SponsorRoiSummary> {
  const baseInit = mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" } });
  const { headers, correlationId } = applyCorrelationHeaders(baseInit.headers ?? {});

  const response = await fetch(SPONSOR_ROI_SUMMARY_PATH, { ...baseInit, headers });

  if (!response.ok) {
    const bodyText = await response.text();

    throw buildApiRequestErrorFromParts(response, bodyText, correlationId);
  }

  return (await response.json()) as SponsorRoiSummary;
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
