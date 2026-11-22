import { trimRequiredText, trimTextFields } from "./api-boundary-normalization";
import { apiGet, apiPostJson } from "./http";
import { optionalHostedRunId, toTier2HostedRunResult, type Tier2HostedRunResult } from "./tier2-hosted-run-response";

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
  return apiPostJson<Tier2ConnectionResponse>(
    "/v1/azure-extractor/connections",
    trimTextFields(body, ["tenantId", "clientId", "subscriptionIds"]),
  );
}

export async function listTier2Connections(): Promise<Tier2ConnectionResponse[]> {
  const raw = await apiGet<unknown>("/v1/azure-extractor/connections");

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
      tenantId: typeof row.tenantId === "string" ? row.tenantId.trim() : "",
      clientId: typeof row.clientId === "string" ? row.clientId.trim() : "",
      subscriptionIds: typeof row.subscriptionIds === "string" ? row.subscriptionIds.trim() : "",
      updatedUtc: typeof row.updatedUtc === "string" ? row.updatedUtc.trim() : "",
    }];
  });
}

export interface Tier2HostedRunValidationBody {
  subscriptionId: string;
  runId?: string;
}

export type Tier2HostedRunValidationResponse = Tier2HostedRunResult;

/** On-demand hosted Tier 2 pull after connection save (202 Accepted on success). */
export async function validateTier2ConnectionHostedRun(
  body: Tier2HostedRunValidationBody,
): Promise<Tier2HostedRunValidationResponse> {
  const normalizedBody: Tier2HostedRunValidationBody = {
    subscriptionId: trimRequiredText(body.subscriptionId, "subscriptionId"),
    ...optionalHostedRunId(body.runId),
  };

  return toTier2HostedRunResult(await apiPostJson<unknown>("/v1/admin/azure-extractor/hosted/run", normalizedBody));
}
