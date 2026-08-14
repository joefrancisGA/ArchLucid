import { apiGet } from "@/lib/api/http";
import type { PilotValueReportJson } from "@/types/pilot-value-report";

export type TenantRoiSummaryPageBundleResponse = {
  readonly pilotToDate: PilotValueReportJson;
  readonly rollingWindow: PilotValueReportJson;
  readonly pilotToDatePreCommitBlocks: { readonly count: number; readonly exact: boolean };
  readonly rollingWindowPreCommitBlocks: { readonly count: number; readonly exact: boolean };
};

export async function fetchTenantRoiSummaryPageBundle(
  rollingDays = 30,
): Promise<TenantRoiSummaryPageBundleResponse> {
  const query = new URLSearchParams({ rollingDays: String(rollingDays) });

  return apiGet<TenantRoiSummaryPageBundleResponse>(`/v1/tenant/roi-summary-page-bundle?${query}`);
}
