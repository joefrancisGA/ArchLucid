import type { IntegrationConnectChecklistStep } from "@/components/integrations/IntegrationConnectChecklist";

export function resolveDigestSubscriptionsWorkflowSteps(input: {
  readonly reviewPicked: boolean;
  readonly destinationConfigured: boolean;
  readonly subscriptionEnabled: boolean;
}): readonly IntegrationConnectChecklistStep[] {
  return [
    {
      id: "review",
      label: "Pick a review package",
      complete: input.reviewPicked,
    },
    {
      id: "destination",
      label: "Add channel and destination",
      complete: input.destinationConfigured,
    },
    {
      id: "enable",
      label: "Save and enable subscription",
      complete: input.subscriptionEnabled,
    },
  ];
}

export function resolveDigestSubscriptionsWorkflowEmphasizedStepId(input: {
  readonly reviewPicked: boolean;
  readonly destinationConfigured: boolean;
  readonly subscriptionEnabled: boolean;
}): string {
  const steps = resolveDigestSubscriptionsWorkflowSteps(input);
  const incomplete = steps.find((step) => !step.complete);

  return incomplete?.id ?? "enable";
}
