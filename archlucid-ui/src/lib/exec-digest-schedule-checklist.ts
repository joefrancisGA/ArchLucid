import type { IntegrationConnectChecklistStep } from "@/components/integrations/IntegrationConnectChecklist";

export function resolveExecDigestScheduleSteps(input: {
  readonly recipientsConfigured: boolean;
  readonly scheduleConfigured: boolean;
  readonly deliveryEnabled: boolean;
}): readonly IntegrationConnectChecklistStep[] {
  return [
    {
      id: "recipients",
      label: "Add sponsor digest recipients",
      complete: input.recipientsConfigured,
    },
    {
      id: "schedule",
      label: "Set weekly send day and time",
      complete: input.scheduleConfigured,
    },
    {
      id: "enable",
      label: "Save schedule and enable delivery",
      complete: input.deliveryEnabled,
    },
  ];
}

export function resolveExecDigestScheduleEmphasizedStepId(input: {
  readonly recipientsConfigured: boolean;
  readonly scheduleConfigured: boolean;
  readonly deliveryEnabled: boolean;
}): string {
  const steps = resolveExecDigestScheduleSteps(input);
  const incomplete = steps.find((step) => !step.complete);

  return incomplete?.id ?? "enable";
}
