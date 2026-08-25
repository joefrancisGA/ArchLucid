import type { IntegrationConnectChecklistStep } from "@/components/integrations/IntegrationConnectChecklist";

export function resolveWebhooksCreateSteps(input: {
  readonly destinationConfigured: boolean;
  readonly eventsConfigured: boolean;
  readonly subscriptionEnabled: boolean;
}): readonly IntegrationConnectChecklistStep[] {
  return [
    {
      id: "destination",
      label: "Set destination URL and signing secret",
      complete: input.destinationConfigured,
    },
    {
      id: "events",
      label: "Select outbound events",
      complete: input.eventsConfigured,
    },
    {
      id: "enable",
      label: "Save and enable subscription",
      complete: input.subscriptionEnabled,
    },
  ];
}

export function resolveWebhooksCreateEmphasizedStepId(input: {
  readonly destinationConfigured: boolean;
  readonly eventsConfigured: boolean;
  readonly subscriptionEnabled: boolean;
}): string {
  const steps = resolveWebhooksCreateSteps(input);
  const incomplete = steps.find((step) => !step.complete);

  return incomplete?.id ?? "enable";
}
