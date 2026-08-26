import type { IntegrationConnectChecklistStep } from "@/components/integrations/IntegrationConnectChecklist";

export function resolveReplayValidationSteps(input: {
  readonly reviewPicked: boolean;
  readonly modeConfigured: boolean;
  readonly validationComplete: boolean;
}): readonly IntegrationConnectChecklistStep[] {
  return [
    {
      id: "review",
      label: "Pick a review package",
      complete: input.reviewPicked,
    },
    {
      id: "mode",
      label: "Choose validation depth",
      complete: input.modeConfigured,
    },
    {
      id: "validate",
      label: "Run validation",
      complete: input.validationComplete,
    },
  ];
}

export function resolveReplayValidationEmphasizedStepId(input: {
  readonly reviewPicked: boolean;
  readonly modeConfigured: boolean;
  readonly validationComplete: boolean;
}): string {
  const steps = resolveReplayValidationSteps(input);
  const incomplete = steps.find((step) => !step.complete);

  return incomplete?.id ?? "validate";
}
