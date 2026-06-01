import { apiGet, apiPostJson } from "@/lib/api-client";

export type ItsmFindingCorrelationListItem = {
  provider: string;
  externalKey: string;
  externalSysId?: string | null;
  createdUtc: string;
  externalUrl?: string | null;
};

export type ItsmFindingCorrelationsByFindingResponse = {
  findingId: string;
  correlations: ItsmFindingCorrelationListItem[];
};

export type CreateItsmOutboundIssueResponse = {
  provider: string;
  externalKey: string;
};

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
