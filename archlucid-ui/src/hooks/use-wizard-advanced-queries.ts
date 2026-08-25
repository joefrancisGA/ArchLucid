"use client";

import type { AgentExecutionCostPreviewPayload } from "@/components/wizard/RunWizardCostPreviewCard";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import { createOperatorQueryHook } from "@/lib/query/create-operator-query-hook";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import type { ModelEngineSelectionOptionsResponse } from "@/lib/model-governance-types";

async function fetchAgentExecutionCostPreview(
  previewUrl: string,
): Promise<AgentExecutionCostPreviewPayload> {
  const res = await fetch(previewUrl, { method: "GET", credentials: "include" });

  if (!res.ok) {
    throw new Error(`Preview unavailable (${res.status})`);
  }

  return (await res.json()) as AgentExecutionCostPreviewPayload;
}

export function useAgentExecutionCostPreviewQuery(previewUrl: string) {
  return createOperatorQueryHook<AgentExecutionCostPreviewPayload>({
    queryKey: operatorQueryKeys.agentExecutionCostPreview(previewUrl),
    queryFn: () => fetchAgentExecutionCostPreview(previewUrl),
  });
}

async function fetchModelEngineSelectionOptions(): Promise<ModelEngineSelectionOptionsResponse | null> {
  const res = await fetch(
    "/api/proxy/v1/architecture/model-engine-selection-options",
    mergeRegistrationScopeForProxy({
      headers: { Accept: "application/json" },
      cache: "no-store",
    }),
  );

  if (!res.ok) {
    return null;
  }

  const body = (await res.json()) as ModelEngineSelectionOptionsResponse;

  if (!Array.isArray(body.options)) {
    return null;
  }

  return body;
}

export function useModelEngineSelectionOptionsQuery() {
  return createOperatorQueryHook<ModelEngineSelectionOptionsResponse | null>({
    queryKey: operatorQueryKeys.modelEngineSelectionOptions,
    queryFn: fetchModelEngineSelectionOptions,
  });
}
