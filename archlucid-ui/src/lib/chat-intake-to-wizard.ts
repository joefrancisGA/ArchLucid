import type { ChatIntakeArchitectureRequest } from "@/lib/api/architecture-chat-intake-api";
import type { WizardFormValues } from "@/lib/wizard-schema";

function normalizeCloudProvider(
  value: ChatIntakeArchitectureRequest["cloudProvider"],
): WizardFormValues["cloudProvider"] | null {
  if (value === "Azure" || value === "Aws" || value === "Gcp") {
    return value;
  }

  if (value === "None") {
    return "None";
  }

  return null;
}

function retainNonEmptyString(current: string, parsed: string | null | undefined): string {
  if (parsed === null || parsed === undefined) {
    return current;
  }

  const trimmed = parsed.trim();

  if (trimmed.length === 0) {
    return current;
  }

  return trimmed;
}

function retainProvidedArray<T>(current: readonly T[], parsed: readonly T[] | null | undefined): T[] {
  if (parsed === null || parsed === undefined) {
    return [...current];
  }

  if (parsed.length === 0) {
    return [...current];
  }

  return [...parsed];
}

/** Applies parsed chat-intake fields onto existing wizard state (preserves requestId and empty advanced lists). */
export function mergeChatIntakeIntoWizardValues(
  current: WizardFormValues,
  parsed: ChatIntakeArchitectureRequest,
): WizardFormValues {
  const next: WizardFormValues = {
    ...current,
    description: retainNonEmptyString(current.description, parsed.description),
    systemName: retainNonEmptyString(current.systemName, parsed.systemName),
    environment: retainNonEmptyString(current.environment, parsed.environment),
    cloudProvider: (() => {
      if (parsed.cloudProvider === null || parsed.cloudProvider === undefined) {
        return current.cloudProvider;
      }

      const normalized = normalizeCloudProvider(parsed.cloudProvider);

      return normalized === null ? current.cloudProvider : normalized;
    })(),
    constraints: retainProvidedArray(current.constraints, parsed.constraints),
    requiredCapabilities: retainProvidedArray(current.requiredCapabilities, parsed.requiredCapabilities),
    assumptions: retainProvidedArray(current.assumptions, parsed.assumptions),
    inlineRequirements: retainProvidedArray(current.inlineRequirements, parsed.inlineRequirements),
    policyReferences: retainProvidedArray(current.policyReferences, parsed.policyReferences),
    topologyHints: retainProvidedArray(current.topologyHints, parsed.topologyHints),
    securityBaselineHints: retainProvidedArray(current.securityBaselineHints, parsed.securityBaselineHints),
  };

  if (parsed.priorManifestVersion !== null && parsed.priorManifestVersion !== undefined) {
    const trimmedPrior = parsed.priorManifestVersion.trim();

    if (trimmedPrior.length > 0) {
      next.priorManifestVersion = trimmedPrior;
    }
  }

  if (parsed.documents !== null && parsed.documents !== undefined && parsed.documents.length > 0) {
    next.documents = parsed.documents;
  }

  if (
    parsed.infrastructureDeclarations !== null
    && parsed.infrastructureDeclarations !== undefined
    && parsed.infrastructureDeclarations.length > 0
  ) {
    next.infrastructureDeclarations = parsed.infrastructureDeclarations;
  }

  return next;
}
