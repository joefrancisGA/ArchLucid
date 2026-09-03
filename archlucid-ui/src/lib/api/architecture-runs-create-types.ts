import type { components } from "@/lib/openapi-schemas";

/** Attached context document (camelCase JSON — matches API `ContextDocumentRequest`). */
export type CreateArchitectureRunDocumentPayload = {
  name: string;
  contentType: string;
  content: string;
};

/** IaC / declaration blob (camelCase JSON — matches API `InfrastructureDeclarationRequest`). */
export type CreateArchitectureRunInfrastructureDeclarationPayload = {
  name: string;
  format: string;
  content: string;
};

/** Body shape for POST /v1/architecture/request (operator wizard + full `ArchitectureRequest` surface). */
export type CreateArchitectureRunRequestPayload = {
  requestId: string;
  description: string;
  systemName: string;
  environment: string;
  cloudProvider: "None" | "Azure" | "Aws" | "Gcp";
  constraints: string[];
  requiredCapabilities: string[];
  assumptions: string[];
  priorManifestVersion?: string;
  inlineRequirements?: string[];
  documents?: CreateArchitectureRunDocumentPayload[];
  policyReferences?: string[];
  topologyHints?: string[];
  securityBaselineHints?: string[];
  infrastructureDeclarations?: CreateArchitectureRunInfrastructureDeclarationPayload[];
  requestSource?: "wizard" | "cli";
  wizardPresetUsed?: string;
  modelExecutionProfileOverride?: "Economy" | "Balanced" | "HighAssurance";
  modelAliasOverride?: string;
  intakeQuestionAnswers?: Record<string, string>;
  intakeTransparencyTrail?: {
    asserted: readonly { key: string; value: string }[];
    inferred: readonly { key: string; value: string; confidence: number }[];
    skipped: readonly { questionKey: string; tier: "Must" | "Should" }[];
  };
};

/** Response envelope for POST /v1/architecture/request. */
export type CreateArchitectureRunResponsePayload =
  components["schemas"]["CreateArchitectureRunResponse"];

export type CreateArchitectureRunAsyncResult = {
  readonly operationId: string;
  readonly runId: string;
  readonly location: string | null;
};
