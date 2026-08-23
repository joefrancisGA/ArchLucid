import { ApiV1Routes } from "@/lib/api-v1-routes";
import { proxyJsonGet } from "@/lib/proxy-json-client";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import { getOperatorQueryClient } from "@/lib/query/operator-query-client";
import { OPERATOR_QUERY_STALE_MS } from "@/lib/query/operator-query-stale-time";
import type { SponsorRoiSummary } from "@/lib/sponsor/sponsor-report-markdown";
import type { ComplianceDriftTrendPoint } from "@/types/governance-dashboard";

const SPONSOR_DASHBOARD_BUNDLE_PATH = `/api/proxy/${ApiV1Routes.roiSponsorDashboardBundle}`;

export type SponsorDashboardBundle = {
  sponsorReport: SponsorRoiSummary;
  complianceDriftTrend: ComplianceDriftTrendPoint[];
};

/** Browser fetch for sponsor dashboard bundle (ROI summary + 30d drift trend). */
export async function fetchSponsorDashboardBundleClient(): Promise<SponsorDashboardBundle> {
  return proxyJsonGet<SponsorDashboardBundle>(SPONSOR_DASHBOARD_BUNDLE_PATH);
}

/** Imperative read through the shared TanStack Query cache. */
export async function fetchSponsorDashboardBundleCached(
  options?: { force?: boolean },
): Promise<SponsorDashboardBundle> {
  const queryClient = getOperatorQueryClient();

  if (options?.force === true) {
    await queryClient.invalidateQueries({ queryKey: operatorQueryKeys.sponsorDashboardBundle });
  }

  return queryClient.fetchQuery({
    queryKey: operatorQueryKeys.sponsorDashboardBundle,
    queryFn: fetchSponsorDashboardBundleClient,
    staleTime: OPERATOR_QUERY_STALE_MS,
  });
}
