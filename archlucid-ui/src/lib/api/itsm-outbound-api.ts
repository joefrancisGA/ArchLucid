import { apiGet, apiPostJson } from "@/lib/api-client";
import type { components } from "@/lib/openapi-schemas";

export type ItsmFindingCorrelationListItem = components["schemas"]["ItsmFindingCorrelationListItem"];
export type ItsmFindingCorrelationsByFindingResponse =
  components["schemas"]["ItsmFindingCorrelationsByFindingResponse"];
export type CreateItsmOutboundIssueResponse = components["schemas"]["CreateItsmOutboundIssueResponse"];

export async function listItsmFindingCorrelations(
  findingId: string,
): Promise<ItsmFindingCorrelationsByFindingResponse> {
  const q = new URLSearchParams();
  q.set("findingId", findingId);

  return apiGet<ItsmFindingCorrelationsByFindingResponse>(
    `/v1/integrations/itsm/correlations?${q}`,
  );
}

export async function createItsmOutboundIssue(
  findingId: string,
  provider: "Jira" | "ServiceNow",
): Promise<CreateItsmOutboundIssueResponse> {
  return apiPostJson<CreateItsmOutboundIssueResponse>("/v1/integrations/itsm/outbound/issues", {
    findingId,
    provider,
  });
}
