import type { SecureNowCollectionMissingInput } from "@/lib/product-line/securenow-collection-missing-reason";
import { resolveSecureNowCollectionSetupSteps } from "@/lib/product-line/securenow-collection-setup-checklist";

export function isSecureNowCollectionSetupComplete(input: SecureNowCollectionMissingInput): boolean {
  const steps = resolveSecureNowCollectionSetupSteps(input);

  return steps.every((step) => step.complete);
}

export function formatSecureNowCollectionSetupProgressSummary(
  input: SecureNowCollectionMissingInput,
): string {
  const steps = resolveSecureNowCollectionSetupSteps(input);
  const completeCount = steps.filter((step) => step.complete).length;

  return `Collection setup: ${completeCount} of ${steps.length} complete.`;
}
