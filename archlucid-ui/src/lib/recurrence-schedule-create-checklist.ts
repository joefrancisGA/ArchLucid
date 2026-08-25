import type { IntegrationConnectChecklistStep } from "@/components/integrations/IntegrationConnectChecklist";

export function resolveRecurrenceScheduleCreateSteps(input: {
  readonly reviewConfigured: boolean;
  readonly cadenceConfigured: boolean;
  readonly scheduleSaved: boolean;
}): readonly IntegrationConnectChecklistStep[] {
  return [
    {
      id: "review",
      label: "Choose source review",
      complete: input.reviewConfigured,
    },
    {
      id: "cadence",
      label: "Name schedule and set cron cadence",
      complete: input.cadenceConfigured,
    },
    {
      id: "save",
      label: "Save or enable schedule",
      complete: input.scheduleSaved,
    },
  ];
}

export function resolveRecurrenceScheduleCreateEmphasizedStepId(input: {
  readonly reviewConfigured: boolean;
  readonly cadenceConfigured: boolean;
  readonly scheduleSaved: boolean;
}): string {
  const steps = resolveRecurrenceScheduleCreateSteps(input);
  const incomplete = steps.find((step) => !step.complete);

  return incomplete?.id ?? "save";
}
