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

function applyParsedString(current: string, parsed: string | null | undefined): string {
  if (parsed === null || parsed === undefined) {
    return current;
  }

  return parsed.trim();
}

function applyParsedArray<T>(current: readonly T[], parsed: readonly T[] | null | undefined): T[] {
  if (parsed === null || parsed === undefined) {
    return [...current];
  }

  return [...parsed];
}

/** Applies parsed chat-intake fields onto existing wizard state (preserves requestId). */
export function mergeChatIntakeIntoWizardValues(
  current: WizardFormValues,
  parsed: ChatIntakeArchitectureRequest,
): WizardFormValues {
  const next: WizardFormValues = {
    ...current,
    description: applyParsedString(current.description, parsed.description),
    systemName: applyParsedString(current.systemName, parsed.systemName),
    environment: applyParsedString(current.environment, parsed.environment),
    cloudProvider: (() => {
      if (parsed.cloudProvider === null || parsed.cloudProvider === undefined) {
        return current.cloudProvider;
      }

      const normalized = normalizeCloudProvider(parsed.cloudProvider);

      return normalized === null ? current.cloudProvider : normalized;
    })(),
    constraints: applyParsedArray(current.constraints, parsed.constraints),
    requiredCapabilities: applyParsedArray(current.requiredCapabilities, parsed.requiredCapabilities),
    assumptions: applyParsedArray(current.assumptions, parsed.assumptions),
    inlineRequirements: applyParsedArray(current.inlineRequirements, parsed.inlineRequirements),
    policyReferences: applyParsedArray(current.policyReferences, parsed.policyReferences),
    topologyHints: applyParsedArray(current.topologyHints, parsed.topologyHints),
    securityBaselineHints: applyParsedArray(current.securityBaselineHints, parsed.securityBaselineHints),
  };

  if (parsed.priorManifestVersion !== null && parsed.priorManifestVersion !== undefined) {
    next.priorManifestVersion = parsed.priorManifestVersion.trim();
  }

  if (parsed.documents !== null && parsed.documents !== undefined) {
    next.documents = parsed.documents;
  }

  if (parsed.infrastructureDeclarations !== null && parsed.infrastructureDeclarations !== undefined) {
    next.infrastructureDeclarations = parsed.infrastructureDeclarations;
  }

  return next;
}
