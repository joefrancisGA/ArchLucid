import { ApiV1Routes } from "@/lib/api-v1-routes";
import { apiGet } from "@/lib/api/http";
import type { components } from "@/lib/api-types.generated";

export type SponsorRoiHistoryPoint = components["schemas"]["SponsorRoiHistoryPoint"];
export type SponsorRoiEnvironmentSlice = components["schemas"]["SponsorRoiEnvironmentSavingsSlice"];

export async function fetchSponsorRoiSummaryHistory(): Promise<SponsorRoiHistoryPoint[]> {
  const json = await apiGet<components["schemas"]["SponsorRoiHistoryResponse"]>(
    `/${ApiV1Routes.roiSponsorReport}/history`,
  );

  return json.points ?? [];
}

export async function fetchSponsorRoiEnvironmentSavings(): Promise<SponsorRoiEnvironmentSlice[]> {
  const json = await apiGet<components["schemas"]["SponsorRoiExportResponse"]>(
    `/${ApiV1Routes.roiSponsorReport}/export`,
  );

  return json.savingsByEnvironment ?? [];
}
