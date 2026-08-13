export type AgentModelCatalogEvaluationRow = {
  readonly taskType: string;
  readonly evaluationState: string;
  readonly evidenceJson?: string | null;
  readonly evaluatedUtc?: string | null;
};

export type AgentModelCatalogRow = {
  readonly aliasId: string;
  readonly providerConnectionKind: string;
  readonly deploymentName?: string | null;
  readonly tierBinding?: string | null;
  readonly capabilityTags: readonly string[];
  readonly approvedTaskTypes: readonly string[];
  readonly structuredOutputLevel: string;
  readonly dataBoundary: string;
  readonly lifecycleStatus: string;
  readonly structuredOutputProbeUtc?: string | null;
  readonly evaluations: readonly AgentModelCatalogEvaluationRow[];
};

export type RecordAgentModelCatalogEvaluationRequest = {
  readonly evaluationState: string;
  readonly evidenceJson?: string | null;
};

export async function fetchAdminAgentModelCatalog(): Promise<AgentModelCatalogRow[]> {
  const res = await fetch("/api/proxy/v1/admin/agent-model-catalog", {
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(`agent-model-catalog ${res.status}`);
  }

  return (await res.json()) as AgentModelCatalogRow[];
}

export async function upsertAdminAgentModelCatalogRow(row: AgentModelCatalogRow): Promise<AgentModelCatalogRow> {
  const res = await fetch(`/api/proxy/v1/admin/agent-model-catalog/${encodeURIComponent(row.aliasId)}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(row),
  });

  if (!res.ok) {
    throw new Error(`agent-model-catalog upsert ${res.status}`);
  }

  return (await res.json()) as AgentModelCatalogRow;
}

export async function recordAdminAgentModelCatalogEvaluation(
  aliasId: string,
  taskType: string,
  body: RecordAgentModelCatalogEvaluationRequest,
): Promise<AgentModelCatalogRow> {
  const res = await fetch(
    `/api/proxy/v1/admin/agent-model-catalog/${encodeURIComponent(aliasId)}/evaluations/${encodeURIComponent(taskType)}/record`,
    {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );

  if (!res.ok) {
    throw new Error(`agent-model-catalog evaluation ${res.status}`);
  }

  return (await res.json()) as AgentModelCatalogRow;
}
