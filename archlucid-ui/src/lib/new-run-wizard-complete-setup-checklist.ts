import type { IntegrationConnectChecklistStep } from "@/components/integrations/IntegrationConnectChecklist";

export function resolveNewRunWizardCompleteSetupSteps(input: {
  readonly identityConfigured: boolean;
  readonly evidenceConfigured: boolean;
  readonly reviewStarted: boolean;
}): readonly IntegrationConnectChecklistStep[] {
  return [
    {
      id: "identity",
      label: "Configure identity and goals",
      complete: input.identityConfigured,
    },
    {
      id: "evidence",
      label: "Add evidence or confirm optional skip",
      complete: input.evidenceConfigured,
    },
    {
      id: "start",
      label: "Start architecture review",
      complete: input.reviewStarted,
    },
  ];
}

export function resolveNewRunWizardCompleteSetupEmphasizedStepId(input: {
  readonly identityConfigured: boolean;
  readonly evidenceConfigured: boolean;
  readonly reviewStarted: boolean;
}): string {
  const steps = resolveNewRunWizardCompleteSetupSteps(input);
  const incomplete = steps.find((step) => !step.complete);

  return incomplete?.id ?? "start";
}
