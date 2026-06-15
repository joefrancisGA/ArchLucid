import { ApiV1Routes } from "@/lib/api-v1-routes";
import { buildApiRequestErrorFromParts } from "@/lib/api-error";
import { applyCorrelationHeaders } from "@/lib/api/http";
import type { ExecutiveRoiSummary } from "@/lib/executive-summary-markdown";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";

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
