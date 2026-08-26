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

export type TenantFindingEngineControlsResponse = {
  effectiveEnableLlmJudge: boolean;
  effectiveEnableLlmJudgeForEngineFindings: boolean;
  effectivePortfolioRecurrenceEnabled: boolean;
  hostDefaultEnableLlmJudge: boolean;
  hostDefaultEnableLlmJudgeForEngineFindings: boolean;
  hostDefaultPortfolioRecurrenceEnabled: boolean;
  enableLlmJudgeOverridden: boolean;
  enableLlmJudgeForEngineFindingsOverridden: boolean;
  portfolioRecurrenceEnabledOverridden: boolean;
};

export type TenantFindingEngineControlsUpdateRequest = {
  enableLlmJudge: boolean;
  enableLlmJudgeForEngineFindings: boolean;
  portfolioRecurrenceEnabled: boolean;
};

const PROXY_PATH = "/api/proxy/v1/admin/settings/finding-engine-controls";

export function parseTenantFindingEngineControls(body: unknown): TenantFindingEngineControlsResponse | null {
  if (body == null || typeof body !== "object") {
    return null;
  }

  const record = body as TenantFindingEngineControlsResponse;

  if (typeof record.effectiveEnableLlmJudge !== "boolean") {
    return null;
  }

  if (typeof record.effectiveEnableLlmJudgeForEngineFindings !== "boolean") {
    return null;
  }

  if (typeof record.effectivePortfolioRecurrenceEnabled !== "boolean") {
    return null;
  }

  return record;
}

export async function fetchTenantFindingEngineControls(): Promise<TenantFindingEngineControlsResponse> {
  const payload = await proxyJsonGet<TenantFindingEngineControlsResponse>(PROXY_PATH, {
    cache: "no-store",
  });
  const parsed = parseTenantFindingEngineControls(payload);

  if (parsed == null) {
    throw toApiLoadFailure(new Error("Unexpected finding engine controls response from the API."));
  }

  return parsed;
}

export async function updateTenantFindingEngineControls(
  request: TenantFindingEngineControlsUpdateRequest,
): Promise<void> {
  await proxyJsonPut<void>(PROXY_PATH, request);
}

export async function clearTenantFindingEngineControlsOverrides(): Promise<void> {
  const scoped = mergeRegistrationScopeForProxy({
    credentials: "include",
    method: "DELETE",
    headers: { Accept: "application/json" },
  });
  const { headers, correlationId } = applyCorrelationHeaders(scoped.headers ?? {});
  const response = await fetch(PROXY_PATH, { ...scoped, headers });
  const text = await response.text();

  if (!response.ok) {
    throw normalizeProxyJsonResponseFailure(response, text, correlationId);
  }
}

export async function invalidateTenantFindingEngineControlsCache(): Promise<void> {
  await getOperatorQueryClient().invalidateQueries({ queryKey: operatorQueryKeys.findingEngineControls });
}
