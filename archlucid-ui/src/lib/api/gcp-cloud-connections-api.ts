import { trimRequiredText, trimTextFields } from "./api-boundary-normalization";
import { apiDelete, apiGet, apiPostJson } from "./http";
import { optionalHostedRunId, toTier2HostedRunResult } from "./tier2-hosted-run-response";

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
  return apiPostJson<GcpTier2ConnectionResponse>(
    "/v1/gcp-extractor/connections",
    trimTextFields(body, ["projectId", "workloadIdentityPoolProvider", "serviceAccountEmail"]),
  );
}

export async function listGcpTier2Connections(): Promise<GcpTier2ConnectionResponse[]> {
  const raw = await apiGet<unknown>("/v1/gcp-extractor/connections");

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
      projectId: typeof row.projectId === "string" ? row.projectId.trim() : "",
      workloadIdentityPoolProvider:
        typeof row.workloadIdentityPoolProvider === "string" ? row.workloadIdentityPoolProvider.trim() : "",
      serviceAccountEmail: typeof row.serviceAccountEmail === "string" ? row.serviceAccountEmail.trim() : "",
      status: typeof row.status === "string" ? row.status.trim() : "",
      lastPolledUtc: typeof row.lastPolledUtc === "string" ? row.lastPolledUtc.trim() : null,
      updatedUtc: typeof row.updatedUtc === "string" ? row.updatedUtc.trim() : "",
    }];
  });
}

export async function disconnectGcpTier2Connection(connectionId: string): Promise<void> {
  const normalizedConnectionId = connectionId.trim();

  if (normalizedConnectionId.length === 0) {
    throw new Error("connectionId is required.");
  }

  await apiDelete(`/v1/gcp-extractor/connections/${encodeURIComponent(normalizedConnectionId)}`);
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
  const normalizedBody: GcpTier2HostedRunBody = {
    connectionId: trimRequiredText(body.connectionId, "connectionId"),
    ...optionalHostedRunId(body.runId),
  };

  return toTier2HostedRunResult(await apiPostJson<unknown>("/v1/admin/gcp-extractor/hosted/run", normalizedBody));
}
