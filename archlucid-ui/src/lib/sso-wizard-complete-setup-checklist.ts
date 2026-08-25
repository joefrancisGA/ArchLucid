import type { IntegrationConnectChecklistStep } from "@/components/integrations/IntegrationConnectChecklist";

export function resolveSsoWizardCompleteSetupSteps(input: {
  readonly idpAndProtocolComplete: boolean;
  readonly providerConfigured: boolean;
  readonly verifiedAndReady: boolean;
}): readonly IntegrationConnectChecklistStep[] {
  return [
    {
      id: "idp",
      label: "Choose identity provider and protocol",
      complete: input.idpAndProtocolComplete,
    },
    {
      id: "provider",
      label: "Configure provider metadata and role mapping",
      complete: input.providerConfigured,
    },
    {
      id: "verify",
      label: "Verify sign-in and save configuration",
      complete: input.verifiedAndReady,
    },
  ];
}

export function resolveSsoWizardCompleteSetupEmphasizedStepId(input: {
  readonly idpAndProtocolComplete: boolean;
  readonly providerConfigured: boolean;
  readonly verifiedAndReady: boolean;
}): string {
  const steps = resolveSsoWizardCompleteSetupSteps(input);
  const incomplete = steps.find((step) => !step.complete);

  return incomplete?.id ?? "verify";
}
