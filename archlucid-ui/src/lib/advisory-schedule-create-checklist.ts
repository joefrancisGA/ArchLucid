import type { IntegrationConnectChecklistStep } from "@/components/integrations/IntegrationConnectChecklist";

export function resolveAdvisoryScheduleCreateChecklistSteps(input: {
  readonly reviewConfigured: boolean;
  readonly frequencyConfigured: boolean;
  readonly scheduleSaved: boolean;
}): readonly IntegrationConnectChecklistStep[] {
  return [
    {
      id: "review",
      label: "Choose review project scope",
      complete: input.reviewConfigured,
    },
    {
      id: "frequency",
      label: "Set scan frequency and timing",
      complete: input.frequencyConfigured,
    },
    {
      id: "save",
      label: "Save schedule",
      complete: input.scheduleSaved,
    },
  ];
}

export function resolveAdvisoryScheduleCreateChecklistEmphasizedStepId(input: {
  readonly reviewConfigured: boolean;
  readonly frequencyConfigured: boolean;
  readonly scheduleSaved: boolean;
}): string {
  const steps = resolveAdvisoryScheduleCreateChecklistSteps(input);
  const incomplete = steps.find((step) => !step.complete);

  return incomplete?.id ?? "save";
}
