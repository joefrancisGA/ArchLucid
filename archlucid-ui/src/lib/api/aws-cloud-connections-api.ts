import { apiDelete, apiGet, apiPostJson } from "./http";

export interface AwsTier2ConnectionResponse {
  connectionId: string;
  accountId: string;
  region: string;
  roleArn: string;
  status: string;
  lastPolledUtc: string | null;
  updatedUtc: string;
}

export interface AwsTier2ConnectionConfigureBody {
  accountId: string;
  region: string;
  roleArn: string;
}

export async function configureAwsTier2Connection(
  body: AwsTier2ConnectionConfigureBody,
): Promise<AwsTier2ConnectionResponse> {
  return apiPostJson<AwsTier2ConnectionResponse>("/v1/aws-extractor/connections", body);
}

export async function listAwsTier2Connections(): Promise<AwsTier2ConnectionResponse[]> {
  return apiGet<AwsTier2ConnectionResponse[]>("/v1/aws-extractor/connections");
}

export async function disconnectAwsTier2Connection(connectionId: string): Promise<void> {
  await apiDelete(`/v1/aws-extractor/connections/${connectionId}`);
}

export interface AwsTier2HostedRunBody {
  connectionId: string;
  runId?: string;
}

export interface AwsTier2HostedRunResponse {
  packageId: string;
  resourceCount: number;
}

/** On-demand hosted Tier 2 AWS pull after connection save (202 Accepted on success). */
export async function triggerAwsTier2HostedRun(
  body: AwsTier2HostedRunBody,
): Promise<AwsTier2HostedRunResponse> {
  return apiPostJson<AwsTier2HostedRunResponse>("/v1/admin/aws-extractor/hosted/run", body);
}
