import { apiDelete, apiGet, apiPostJson } from "./http";

export interface GcpTier2ConnectionResponse {
  connectionId: string;
  projectId: string;
  workloadIdentityPoolProvider: string;
  serviceAccountEmail: string;
  status: string;
  lastPolledUtc: string | null;
  updatedUtc: string;
}

export interface GcpTier2ConnectionConfigureBody {
  projectId: string;
  workloadIdentityPoolProvider: string;
  serviceAccountEmail: string;
}

export async function configureGcpTier2Connection(
  body: GcpTier2ConnectionConfigureBody,
): Promise<GcpTier2ConnectionResponse> {
  return apiPostJson<GcpTier2ConnectionResponse>("/v1/gcp-extractor/connections", body);
}

export async function listGcpTier2Connections(): Promise<GcpTier2ConnectionResponse[]> {
  return apiGet<GcpTier2ConnectionResponse[]>("/v1/gcp-extractor/connections");
}

export async function disconnectGcpTier2Connection(connectionId: string): Promise<void> {
  await apiDelete(`/v1/gcp-extractor/connections/${connectionId}`);
}

export interface GcpTier2HostedRunBody {
  connectionId: string;
  runId?: string;
}

export interface GcpTier2HostedRunResponse {
  packageId: string;
  resourceCount: number;
}

/** On-demand hosted Tier 2 GCP pull after connection save (202 Accepted on success). */
export async function triggerGcpTier2HostedRun(
  body: GcpTier2HostedRunBody,
): Promise<GcpTier2HostedRunResponse> {
  return apiPostJson<GcpTier2HostedRunResponse>("/v1/admin/gcp-extractor/hosted/run", body);
}
