import type { IntegrationConnectChecklistStep } from "@/components/integrations/IntegrationConnectChecklist";

export function resolveRecurrenceSchedulesWorkflowSteps(input: {
  readonly reviewPicked: boolean;
  readonly scheduleConfigured: boolean;
  readonly scheduleEnabled: boolean;
}): readonly IntegrationConnectChecklistStep[] {
  return [
    {
      id: "review",
      label: "Pick a review package",
      complete: input.reviewPicked,
    },
    {
      id: "schedule",
      label: "Configure recurrence schedule",
      complete: input.scheduleConfigured,
    },
    {
      id: "enable",
      label: "Enable schedule delivery",
      complete: input.scheduleEnabled,
    },
  ];
}

export function resolveRecurrenceSchedulesWorkflowEmphasizedStepId(input: {
  readonly reviewPicked: boolean;
  readonly scheduleConfigured: boolean;
  readonly scheduleEnabled: boolean;
}): string {
  const steps = resolveRecurrenceSchedulesWorkflowSteps(input);
  const incomplete = steps.find((step) => !step.complete);

  return incomplete?.id ?? "enable";
}
