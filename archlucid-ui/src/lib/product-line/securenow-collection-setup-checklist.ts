import type { IntegrationConnectChecklistStep } from "@/components/integrations/IntegrationConnectChecklist";

import type { SecureNowCollectionMissingInput } from "@/lib/product-line/securenow-collection-missing-reason";

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
  _input: SecureNowCollectionMissingInput,
): string {
  return SECURENOW_COLLECTION_SETUP_RECOVERY_HREF;
}
