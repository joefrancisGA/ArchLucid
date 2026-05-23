import { apiGet, apiPostJson } from "./http";

export interface Tier2ConnectionResponse {
  connectionId: string;
  tenantId: string;
  clientId: string;
  subscriptionIds: string;
  updatedUtc: string;
}

export interface Tier2ConnectionConfigureBody {
  tenantId: string;
  clientId: string;
  subscriptionIds: string;
}

export async function configureTier2Connection(
  body: Tier2ConnectionConfigureBody,
): Promise<Tier2ConnectionResponse> {
  return apiPostJson<Tier2ConnectionResponse>("/v1/azure-extractor/connections", body);
}

export async function listTier2Connections(): Promise<Tier2ConnectionResponse[]> {
  return apiGet<Tier2ConnectionResponse[]>("/v1/azure-extractor/connections");
}
