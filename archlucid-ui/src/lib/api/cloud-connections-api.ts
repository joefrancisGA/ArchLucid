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

export interface Tier2HostedRunValidationBody {
  subscriptionId: string;
  runId?: string;
}

export interface Tier2HostedRunValidationResponse {
  packageId: string;
  resourceCount: number;
}

/** On-demand hosted Tier 2 pull after connection save (202 Accepted on success). */
export async function validateTier2ConnectionHostedRun(
  body: Tier2HostedRunValidationBody,
): Promise<Tier2HostedRunValidationResponse> {
  return apiPostJson<Tier2HostedRunValidationResponse>("/v1/admin/azure-extractor/hosted/run", body);
}
