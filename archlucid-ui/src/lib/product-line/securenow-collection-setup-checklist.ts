import type { IntegrationConnectChecklistStep } from "@/components/integrations/IntegrationConnectChecklist";

import type { SecureNowCollectionMissingInput } from "@/lib/product-line/securenow-collection-missing-reason";
import { resolveSecureNowCollectionMissingDetail } from "@/lib/product-line/securenow-collection-missing-reason";
import { isSecureNowCollectionSetupComplete } from "@/lib/product-line/format-securenow-collection-setup-progress";

export const SECURENOW_COLLECTION_SETUP_CHECKLIST_TITLE = "Collection setup" as const;

export const SECURENOW_COLLECTION_SETUP_RECOVERY_HREF = "/integrations/cloud-connections" as const;

export function resolveSecureNowCollectionSetupSteps(
  input: SecureNowCollectionMissingInput,
): readonly IntegrationConnectChecklistStep[] {
  return [
    {
      id: "provider",
      label: "Cloud provider configured",
      complete: input.hasConfiguredProvider,
    },
    {
      id: "subscription",
      label: "Subscription scope selected",
      complete: input.azureSubscriptionIdsPresent,
    },
    {
      id: "capture",
      label: "Latest capture succeeded",
      complete: input.hasSuccessfulPull,
    },
  ];
}

export function resolveSecureNowCollectionSetupEmphasizedStepId(
  input: SecureNowCollectionMissingInput,
): string {
  const steps = resolveSecureNowCollectionSetupSteps(input);
  const incomplete = steps.find((step) => !step.complete);

  return incomplete?.id ?? "capture";
}

export function resolveSecureNowCollectionSetupRecoveryHref(
  input: SecureNowCollectionMissingInput,
): string {
  const emphasizedStepId = resolveSecureNowCollectionSetupEmphasizedStepId(input);

  return resolveSecureNowCollectionSetupStepRecoveryHref(emphasizedStepId);
}

export function resolveSecureNowCollectionSetupStepRecoveryHref(stepId: string): string {
  switch (stepId) {
    case "provider":
      return "/integrations/cloud-connections#cloud-connections-options-heading";
    case "subscription":
      return "/integrations/cloud-connections/azure";
    case "capture":
      return "/administration/connection-status";
    default:
      return SECURENOW_COLLECTION_SETUP_RECOVERY_HREF;
  }
}

export type SecureNowCollectionPrimaryBlocker = {
  readonly stepId: string;
  readonly stepLabel: string;
  readonly detail: string;
  readonly recoveryHref: string;
};

/** First incomplete collection step — one headline blocker for Home and cloud connections. */
export function resolveSecureNowCollectionPrimaryBlocker(
  input: SecureNowCollectionMissingInput,
): SecureNowCollectionPrimaryBlocker | null {
  if (isSecureNowCollectionSetupComplete(input)) {
    return null;
  }

  const steps = resolveSecureNowCollectionSetupSteps(input);
  const emphasizedStepId = resolveSecureNowCollectionSetupEmphasizedStepId(input);
  const step = steps.find((entry) => entry.id === emphasizedStepId);

  if (step === undefined || step.complete) {
    return null;
  }

  return {
    stepId: step.id,
    stepLabel: step.label,
    detail: resolveSecureNowCollectionMissingDetail(input),
    recoveryHref: resolveSecureNowCollectionSetupStepRecoveryHref(step.id),
  };
}
