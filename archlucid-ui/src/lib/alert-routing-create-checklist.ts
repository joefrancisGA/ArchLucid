import type { IntegrationConnectChecklistStep } from "@/components/integrations/IntegrationConnectChecklist";

export function resolveAlertRoutingCreateSteps(input: {
  readonly channelConfigured: boolean;
  readonly destinationConfigured: boolean;
  readonly destinationSaved: boolean;
}): readonly IntegrationConnectChecklistStep[] {
  return [
    {
      id: "channel",
      label: "Choose delivery channel",
      complete: input.channelConfigured,
    },
    {
      id: "destination",
      label: "Set destination and severity criteria",
      complete: input.destinationConfigured,
    },
    {
      id: "save",
      label: "Save and test destination",
      complete: input.destinationSaved,
    },
  ];
}

export function resolveAlertRoutingCreateEmphasizedStepId(input: {
  readonly channelConfigured: boolean;
  readonly destinationConfigured: boolean;
  readonly destinationSaved: boolean;
}): string {
  const steps = resolveAlertRoutingCreateSteps(input);
  const incomplete = steps.find((step) => !step.complete);

  return incomplete?.id ?? "save";
}
