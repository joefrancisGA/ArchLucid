import type { CreateArchitectureRunRequestPayload } from "@/lib/api";
import type { WizardFormValues } from "@/lib/wizard-schema";

/**
 * Maps validated wizard values to the POST `/v1/architecture/request` body (camelCase, optional fields omitted when empty).
 */
export function wizardValuesToCreateRunPayload(values: WizardFormValues): CreateArchitectureRunRequestPayload {
  const prior = values.priorManifestVersion?.trim();
  const inlineReq = values.inlineRequirements.map((s) => s.trim()).filter(Boolean);
  const documents = values.documents.filter((d) => d.name.trim() && d.content.trim());
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

  if (values.policyReferences.length > 0) {
    payload.policyReferences = values.policyReferences.map((s) => s.trim()).filter(Boolean);
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

  return payload;
}
