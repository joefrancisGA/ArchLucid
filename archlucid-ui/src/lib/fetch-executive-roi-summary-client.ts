import { ApiV1Routes } from "@/lib/api-v1-routes";
import { buildApiRequestErrorFromParts } from "@/lib/api-error";
import { applyCorrelationHeaders } from "@/lib/api/http";
import type { ExecutiveRoiSummary } from "@/lib/executive/executive-summary-markdown";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import { getOperatorQueryClient } from "@/lib/query/operator-query-client";
import { OPERATOR_QUERY_STALE_MS } from "@/lib/query/operator-query-stale-time";

const EXECUTIVE_ROI_SUMMARY_PATH = `/api/proxy/${ApiV1Routes.roiExecutiveSummary}`;

/** Browser fetch for executive ROI summary with correlation id on all failure paths (TB-271). */
export async function fetchExecutiveRoiSummaryClient(): Promise<ExecutiveRoiSummary> {
  const baseInit = mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" } });
  const { headers, correlationId } = applyCorrelationHeaders(baseInit.headers ?? {});

  const response = await fetch(EXECUTIVE_ROI_SUMMARY_PATH, { ...baseInit, headers });

  if (!response.ok) {
    const bodyText = await response.text();

    throw buildApiRequestErrorFromParts(response, bodyText, correlationId);
  }

  return (await response.json()) as ExecutiveRoiSummary;
}

/** Imperative read through the shared TanStack Query cache (TB-562). */
export async function fetchExecutiveRoiSummaryCached(
  options?: { force?: boolean },
): Promise<ExecutiveRoiSummary> {
  const queryClient = getOperatorQueryClient();

  if (options?.force === true) {
    await queryClient.invalidateQueries({ queryKey: operatorQueryKeys.executiveRoiSummary });
  }

  return queryClient.fetchQuery({
    queryKey: operatorQueryKeys.executiveRoiSummary,
    queryFn: fetchExecutiveRoiSummaryClient,
    staleTime: OPERATOR_QUERY_STALE_MS,
  });
}

/** Clears cached executive ROI summary (for example after disposition changes). */
export async function invalidateExecutiveRoiSummaryCache(): Promise<void> {
  await getOperatorQueryClient().invalidateQueries({ queryKey: operatorQueryKeys.executiveRoiSummary });
}
