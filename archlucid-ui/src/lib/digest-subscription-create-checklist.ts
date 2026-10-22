import type { IntegrationConnectChecklistStep } from "@/components/integrations/IntegrationConnectChecklist";

export function resolveDigestSubscriptionCreateSteps(input: {
  readonly nameConfigured: boolean;
  readonly destinationConfigured: boolean;
  readonly subscriptionSaved: boolean;
}): readonly IntegrationConnectChecklistStep[] {
  return [
    {
      id: "name",
      label: "Name the digest subscription",
      complete: input.nameConfigured,
    },
    {
      id: "destination",
      label: "Set channel and destination",
      complete: input.destinationConfigured,
    },
    {
      id: "save",
      label: "Save and enable subscription",
      complete: input.subscriptionSaved,
    },
  ];
}

export function resolveDigestSubscriptionCreateEmphasizedStepId(input: {
  readonly nameConfigured: boolean;
  readonly destinationConfigured: boolean;
  readonly subscriptionSaved: boolean;
}): string {
  const steps = resolveDigestSubscriptionCreateSteps(input);
  const incomplete = steps.find((step) => !step.complete);

  return incomplete?.id ?? "save";
}
