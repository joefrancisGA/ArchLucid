import type { ChatIntakeArchitectureRequest } from "@/lib/api/architecture-chat-intake-api";
import type { WizardFormValues } from "@/lib/wizard-schema";

function normalizeCloudProvider(value: ChatIntakeArchitectureRequest["cloudProvider"]): WizardFormValues["cloudProvider"] {
  if (value === "Azure" || value === "Aws" || value === "Gcp") {
    return value;
  }

  return "None";
}

/** Applies parsed chat-intake fields onto existing wizard state (preserves requestId and empty advanced lists). */
export function mergeChatIntakeIntoWizardValues(
  current: WizardFormValues,
  parsed: ChatIntakeArchitectureRequest,
): WizardFormValues {
  return {
    ...current,
    description: parsed.description.trim(),
    systemName: parsed.systemName.trim(),
    environment: parsed.environment.trim(),
    cloudProvider: normalizeCloudProvider(parsed.cloudProvider),
    constraints: parsed.constraints ?? [],
    requiredCapabilities: parsed.requiredCapabilities ?? [],
    assumptions: parsed.assumptions ?? [],
    inlineRequirements: parsed.inlineRequirements ?? [],
    policyReferences: parsed.policyReferences ?? [],
    topologyHints: parsed.topologyHints ?? [],
    securityBaselineHints: parsed.securityBaselineHints ?? [],
    priorManifestVersion: parsed.priorManifestVersion?.trim() ?? current.priorManifestVersion,
    documents: parsed.documents ?? current.documents,
    infrastructureDeclarations: parsed.infrastructureDeclarations ?? current.infrastructureDeclarations,
  };
}
