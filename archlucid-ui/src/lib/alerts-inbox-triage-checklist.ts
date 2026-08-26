import type { IntegrationConnectChecklistStep } from "@/components/integrations/IntegrationConnectChecklist";

export function resolveAlertsInboxTriageSteps(input: {
  readonly reviewPicked: boolean;
  readonly alertSelected: boolean;
  readonly triageActionComplete: boolean;
}): readonly IntegrationConnectChecklistStep[] {
  return [
    {
      id: "review",
      label: "Pick a review package",
      complete: input.reviewPicked,
    },
    {
      id: "select",
      label: "Select alerts to triage",
      complete: input.alertSelected,
    },
    {
      id: "acknowledge",
      label: "Acknowledge or resolve alerts",
      complete: input.triageActionComplete,
    },
  ];
}

export function resolveAlertsInboxTriageEmphasizedStepId(input: {
  readonly reviewPicked: boolean;
  readonly alertSelected: boolean;
  readonly triageActionComplete: boolean;
}): string {
  const steps = resolveAlertsInboxTriageSteps(input);
  const incomplete = steps.find((step) => !step.complete);

  return incomplete?.id ?? "acknowledge";
}
