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
  const raw = await apiGet<unknown>("/v1/aws-extractor/connections");

  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.flatMap((item) => {
    if (item === null || typeof item !== "object" || Array.isArray(item)) {
      return [];
    }

    const row = item as Record<string, unknown>;

    return [{
      connectionId: typeof row.connectionId === "string" ? row.connectionId.trim() : "",
      accountId: typeof row.accountId === "string" ? row.accountId.trim() : "",
      region: typeof row.region === "string" ? row.region.trim() : "",
      roleArn: typeof row.roleArn === "string" ? row.roleArn.trim() : "",
      status: typeof row.status === "string" ? row.status.trim() : "",
      lastPolledUtc: typeof row.lastPolledUtc === "string" ? row.lastPolledUtc.trim() : null,
      updatedUtc: typeof row.updatedUtc === "string" ? row.updatedUtc.trim() : "",
    }];
  });
}

export async function disconnectAwsTier2Connection(connectionId: string): Promise<void> {
  const normalizedConnectionId = connectionId.trim();

  if (normalizedConnectionId.length === 0) {
    throw new Error("connectionId is required.");
  }

  await apiDelete(`/v1/aws-extractor/connections/${encodeURIComponent(normalizedConnectionId)}`);
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
