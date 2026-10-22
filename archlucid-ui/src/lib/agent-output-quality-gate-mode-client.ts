import type { components } from "@/lib/api-types.generated";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { applyCorrelationHeaders } from "@/lib/api/http";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import {
  normalizeProxyJsonResponseFailure,
  proxyJsonGet,
  proxyJsonPut,
} from "@/lib/proxy-json-client";
import { getOperatorQueryClient } from "@/lib/query/operator-query-client";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";

export type TenantAgentOutputQualityGateModeResponse =
  components["schemas"]["TenantAgentOutputQualityGateModeResponse"];

export type QualityGateMode = "WarnOnly" | "PilotStrict";

const MODE_PROXY_PATH = "/api/proxy/v1/admin/settings/agent-output-quality-gate-mode";

export function parseAgentOutputQualityGateMode(
  body: unknown,
): TenantAgentOutputQualityGateModeResponse | null {
  if (body == null || typeof body !== "object") {
    return null;
  }

  const record = body as TenantAgentOutputQualityGateModeResponse;
  const effectiveMode = record.effectiveMode;
  const source = record.source;
  const hostDefaultMode = record.hostDefaultMode;

  if (effectiveMode !== "WarnOnly" && effectiveMode !== "PilotStrict") {
    return null;
  }

  if (hostDefaultMode !== "WarnOnly" && hostDefaultMode !== "PilotStrict") {
    return null;
  }

  if (source !== "HostDefault" && source !== "TenantOverride") {
    return null;
  }

  return record;
}

export async function fetchAgentOutputQualityGateMode(): Promise<TenantAgentOutputQualityGateModeResponse> {
  const payload = await proxyJsonGet<TenantAgentOutputQualityGateModeResponse>(MODE_PROXY_PATH, {
    cache: "no-store",
  });
  const parsed = parseAgentOutputQualityGateMode(payload);

  if (parsed == null) {
    throw toApiLoadFailure(new Error("Unexpected quality gate mode response from the API."));
  }

  return parsed;
}

export async function updateAgentOutputQualityGateMode(mode: QualityGateMode): Promise<void> {
  await proxyJsonPut<void>(MODE_PROXY_PATH, { mode });
}

export async function clearAgentOutputQualityGateModeOverride(): Promise<void> {
  const scoped = mergeRegistrationScopeForProxy({
    credentials: "include",
    method: "DELETE",
    headers: { Accept: "application/json" },
  });
  const { headers, correlationId } = applyCorrelationHeaders(scoped.headers ?? {});
  const response = await fetch(MODE_PROXY_PATH, { ...scoped, headers });
  const text = await response.text();

  if (!response.ok) {
    throw normalizeProxyJsonResponseFailure(response, text, correlationId);
  }
}

export async function invalidateAgentOutputQualityGateModeCache(): Promise<void> {
  await getOperatorQueryClient().invalidateQueries({ queryKey: operatorQueryKeys.agentOutputQualityGateMode });
}
