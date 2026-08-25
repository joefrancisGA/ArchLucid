import type { IntegrationConnectChecklistStep } from "@/components/integrations/IntegrationConnectChecklist";

export function resolveCloudConnectionsConnectSteps(input: {
  readonly providerSelected: boolean;
  readonly connectionConfigured: boolean;
  readonly connectionValidated: boolean;
}): readonly IntegrationConnectChecklistStep[] {
  return [
    {
      id: "provider",
      label: "Choose Azure, AWS, or GCP",
      complete: input.providerSelected,
    },
    {
      id: "configure",
      label: "Configure credentials and scope",
      complete: input.connectionConfigured,
    },
    {
      id: "validate",
      label: "Run a connection validation pull",
      complete: input.connectionValidated,
    },
  ];
}

export function resolveCloudConnectionsEmphasizedStepId(input: {
  readonly providerSelected: boolean;
  readonly connectionConfigured: boolean;
  readonly connectionValidated: boolean;
}): string {
  const steps = resolveCloudConnectionsConnectSteps(input);
  const incomplete = steps.find((step) => !step.complete);

  return incomplete?.id ?? "validate";
}
