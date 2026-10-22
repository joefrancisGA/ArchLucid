import type { AgentModelCatalogRow } from "@/lib/agent-model-catalog-ops";

/** Curated catalog rows for ING al-ui-rate screenshots when admin API is unavailable. */
export const WORKBOOK_AGENT_MODEL_CATALOG_DEMO_ROWS: readonly AgentModelCatalogRow[] = [
  {
    aliasId: "architect-desk-default",
    providerConnectionKind: "AzureOpenAI",
    deploymentName: "gpt-4o-architect-desk",
    tierBinding: "standard",
    capabilityTags: ["structured-output", "long-context"],
    approvedTaskTypes: ["ArchitectureReview"],
    structuredOutputLevel: "JsonSchema",
    dataBoundary: "TenantIsolated",
    externalSubprocessorDisclosureComplete: true,
    lifecycleStatus: "Active",
    structuredOutputProbeUtc: "2026-01-10T08:00:00Z",
    evaluations: [
      {
        taskType: "ArchitectureReview",
        evaluationState: "Pass",
        evidenceJson: "{\"faithfulness\":0.94}",
        evaluatedUtc: "2026-01-12T14:30:00Z",
      },
      {
        taskType: "GovernanceSummary",
        evaluationState: "NotEvaluated",
        evidenceJson: null,
        evaluatedUtc: null,
      },
    ],
  },
  {
    aliasId: "governance-summary",
    providerConnectionKind: "AzureOpenAI",
    deploymentName: "gpt-4o-governance",
    tierBinding: "standard",
    capabilityTags: ["structured-output"],
    approvedTaskTypes: ["GovernanceSummary"],
    structuredOutputLevel: "JsonSchema",
    dataBoundary: "TenantIsolated",
    externalSubprocessorDisclosureComplete: true,
    lifecycleStatus: "Active",
    structuredOutputProbeUtc: "2026-01-08T08:00:00Z",
    evaluations: [
      {
        taskType: "GovernanceSummary",
        evaluationState: "Pass",
        evidenceJson: "{\"faithfulness\":0.91}",
        evaluatedUtc: "2026-01-11T09:15:00Z",
      },
    ],
  },
] as const;

export function tryWorkbookAgentModelCatalogDemoFallback(): AgentModelCatalogRow[] | null {
  return [...WORKBOOK_AGENT_MODEL_CATALOG_DEMO_ROWS];
}
