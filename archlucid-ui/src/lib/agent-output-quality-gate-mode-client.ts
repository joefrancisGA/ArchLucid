import type { components } from "@/lib/api-types.generated";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
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
  const res = await fetch(
    MODE_PROXY_PATH,
    mergeRegistrationScopeForProxy({
      headers: { Accept: "application/json" },
      cache: "no-store",
    }),
  );

  if (!res.ok) {
    throw new Error(
      res.status === 401 || res.status === 403
        ? "Admin session required to manage quality gate mode."
        : `Quality gate settings unavailable (HTTP ${res.status}).`,
    );
  }

  const parsed = parseAgentOutputQualityGateMode(await res.json());

  if (parsed == null) {
    throw new Error("Unexpected quality gate mode response from the API.");
  }

  return parsed;
}

export async function updateAgentOutputQualityGateMode(mode: QualityGateMode): Promise<void> {
  const res = await fetch(
    MODE_PROXY_PATH,
    mergeRegistrationScopeForProxy({
      method: "PUT",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ mode }),
    }),
  );

  if (!res.ok) {
    throw new Error(`Failed to update quality gate mode (HTTP ${res.status}).`);
  }
}

export async function clearAgentOutputQualityGateModeOverride(): Promise<void> {
  const res = await fetch(
    MODE_PROXY_PATH,
    mergeRegistrationScopeForProxy({ method: "DELETE", headers: { Accept: "application/json" } }),
  );

  if (!res.ok) {
    throw new Error(`Failed to reset quality gate mode (HTTP ${res.status}).`);
  }
}

export async function invalidateAgentOutputQualityGateModeCache(): Promise<void> {
  await getOperatorQueryClient().invalidateQueries({ queryKey: operatorQueryKeys.agentOutputQualityGateMode });
}
