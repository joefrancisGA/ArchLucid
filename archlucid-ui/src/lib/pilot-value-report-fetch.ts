import { apiGet } from "@/lib/api";
import { ApiV1Routes } from "@/lib/api-v1-routes";
import type { PilotValueReportJson } from "@/types/pilot-value-report";

export function buildPilotValueReportQuery(fromIso: string | null, toIso: string): string {
  const params = new URLSearchParams();

  if (fromIso !== null && fromIso.length > 0) {
    params.set("fromUtc", fromIso);
  }

  params.set("toUtc", toIso);

  return params.toString();
}

/** Server or browser JSON aggregate; uses shared `apiGet` routing (RSC → upstream, browser → `/api/proxy`). */
export async function getTenantPilotValueReportJson(
  fromIso: string | null,
  toIso: string,
): Promise<PilotValueReportJson> {
  const q = buildPilotValueReportQuery(fromIso, toIso);

  return apiGet<PilotValueReportJson>(`/${ApiV1Routes.tenantPilotValueReport}?${q}`);
}

/** Alias for historical call sites; delegates to {@link getTenantPilotValueReportJson}. */
export async function fetchPilotValueReportJson(fromIso: string | null, toIso: string): Promise<PilotValueReportJson> {
  return getTenantPilotValueReportJson(fromIso, toIso);
}
