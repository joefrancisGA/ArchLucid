import type { IntegrationConnectChecklistStep } from "@/components/integrations/IntegrationConnectChecklist";

export function resolveBaselineSaveSteps(input: {
  readonly measurementsEntered: boolean;
  readonly validationReady: boolean;
  readonly saveComplete: boolean;
}): readonly IntegrationConnectChecklistStep[] {
  return [
    {
      id: "measurements",
      label: "Enter baseline measurement fields",
      complete: input.measurementsEntered,
    },
    {
      id: "validation",
      label: "Resolve validation and note requirements",
      complete: input.validationReady,
    },
    {
      id: "save",
      label: "Save workspace baseline",
      complete: input.saveComplete,
    },
  ];
}

export function resolveBaselineSaveEmphasizedStepId(input: {
  readonly measurementsEntered: boolean;
  readonly validationReady: boolean;
  readonly saveComplete: boolean;
}): string {
  const steps = resolveBaselineSaveSteps(input);
  const incomplete = steps.find((step) => !step.complete);

  return incomplete?.id ?? "save";
}
