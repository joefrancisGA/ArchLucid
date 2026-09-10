import type { CreateArchitectureRunRequestPayload } from "@/lib/api";
import type { CreateArchitectureRunDocumentPayload } from "@/lib/api/architecture-runs-create-types";
import { isSupportedContextDocumentContentType } from "@/lib/architecture-spine/supported-context-document-content-types";
import { applyFocusedPilotModePolicyReferences } from "@/lib/focused-pilot-mode-policy-packs";
import { evaluatePolicyPackCloudMismatch } from "@/lib/review-quality/review-intake-quality-gates";
import { normalizeCloudProviderForMismatchCheck } from "@/lib/review-quality/policy-pack-cloud-mismatch-for-review";
import type { WizardFormValues } from "@/lib/wizard-schema";

export type WizardCreateRunPayloadOptions = {
  requestSource?: "wizard";
  wizardPresetUsed?: string;
  focusedPilotModeEnabled?: boolean;
};

function resolveWizardPolicyReferences(
  values: WizardFormValues,
  options?: WizardCreateRunPayloadOptions,
): string[] {
  const focusedPilotModeEnabled = options?.focusedPilotModeEnabled ?? true;

  return applyFocusedPilotModePolicyReferences(values.policyReferences, focusedPilotModeEnabled);
}

/** TB-2322 — same mismatch rules as guided intake and committed review detail. */
export function deriveWizardPolicyPackCloudMismatch(
  values: WizardFormValues,
  options?: WizardCreateRunPayloadOptions,
): string | null {
  const policyReferences = resolveWizardPolicyReferences(values, options);

  return evaluatePolicyPackCloudMismatch(
    normalizeCloudProviderForMismatchCheck(values.cloudProvider),
    policyReferences,
  );
}

function mapWizardDocumentsToCreateRunDocuments(
  documents: WizardFormValues["documents"],
): CreateArchitectureRunDocumentPayload[] {
  return documents.flatMap((document) => {
    const name = document.name.trim();
    const content = document.content.trim();
    const contentType = document.contentType.trim();

    if (name.length === 0 || content.length === 0 || !isSupportedContextDocumentContentType(contentType)) {
      return [];
    }

    return [{ name, contentType, content }];
  });
}

/**
 * Maps validated wizard values to the POST `/v1/architecture/request` body (camelCase, optional fields omitted when empty).
 */
export function wizardValuesToCreateRunPayload(
  values: WizardFormValues,
  options?: WizardCreateRunPayloadOptions,
): CreateArchitectureRunRequestPayload {
  const prior = values.priorManifestVersion?.trim();
  const inlineReq = values.inlineRequirements.map((s) => s.trim()).filter(Boolean);
  const documents = mapWizardDocumentsToCreateRunDocuments(
    values.documents.filter((document) => document.name.trim() && document.content.trim()),
  );
  const infra = values.infrastructureDeclarations.filter((d) => d.name.trim() && d.content.trim());

  const payload: CreateArchitectureRunRequestPayload = {
    requestId: values.requestId.trim(),
    description: values.description.trim(),
    systemName: values.systemName.trim(),
    environment: values.environment.trim(),
    cloudProvider: values.cloudProvider,
    constraints: values.constraints.map((s) => s.trim()).filter(Boolean),
    requiredCapabilities: values.requiredCapabilities.map((s) => s.trim()).filter(Boolean),
    assumptions: values.assumptions.map((s) => s.trim()).filter(Boolean),
  };

  if (prior) {
    payload.priorManifestVersion = prior;
  }

  if (inlineReq.length > 0) {
    payload.inlineRequirements = inlineReq;
  }

  const policyReferences = resolveWizardPolicyReferences(values, options);

  if (policyReferences.length > 0) {
    payload.policyReferences = policyReferences;
  }

  if (values.topologyHints.length > 0) {
    payload.topologyHints = values.topologyHints.map((s) => s.trim()).filter(Boolean);
  }

  if (values.securityBaselineHints.length > 0) {
    payload.securityBaselineHints = values.securityBaselineHints.map((s) => s.trim()).filter(Boolean);
  }

  if (documents.length > 0) {
    payload.documents = documents;
  }

  if (infra.length > 0) {
    payload.infrastructureDeclarations = infra;
  }

  if (options?.requestSource !== undefined) {
    payload.requestSource = options.requestSource;
  }

  const wizardPresetUsed = options?.wizardPresetUsed?.trim();

  if (wizardPresetUsed !== undefined && wizardPresetUsed.length > 0) {
    payload.wizardPresetUsed = wizardPresetUsed;
  }

  if (
    values.modelExecutionProfileOverride !== "WorkspaceDefault"
    && values.modelExecutionProfileOverride.length > 0
  ) {
    payload.modelExecutionProfileOverride = values.modelExecutionProfileOverride;
  }

  const aliasOverride = values.modelAliasOverride.trim();

  if (aliasOverride.length > 0) {
    payload.modelAliasOverride = aliasOverride;
  }

  return payload;
}
