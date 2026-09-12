import type { IntegrationConnectChecklistStep } from "@/components/integrations/IntegrationConnectChecklist";

export function resolveWebhooksCreateSteps(input: {
  readonly destinationConfigured: boolean;
  readonly eventsConfigured: boolean;
  readonly subscriptionEnabled: boolean;
  readonly subscriptionsLoaded: boolean;
}): readonly IntegrationConnectChecklistStep[] {
  const enableStepComplete =
    !input.subscriptionsLoaded || input.subscriptionEnabled;

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
      complete: enableStepComplete,
    },
  ];
}

export function resolveWebhooksCreateEmphasizedStepId(input: {
  readonly destinationConfigured: boolean;
  readonly eventsConfigured: boolean;
  readonly subscriptionEnabled: boolean;
  readonly subscriptionsLoaded: boolean;
}): string {
  const steps = resolveWebhooksCreateSteps(input);
  const incomplete = steps.find((step) => !step.complete);

  return incomplete?.id ?? "enable";
}
