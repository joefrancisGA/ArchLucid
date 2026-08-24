import type { IntegrationConnectChecklistStep } from "@/components/integrations/IntegrationConnectChecklist";

export function resolveServiceNowIntegrationConnectSteps(input: {
  readonly credentialsReady: boolean;
  readonly destinationConfigured: boolean;
  readonly connectionVerified: boolean;
}): readonly IntegrationConnectChecklistStep[] {
  return [
    { id: "connect", label: "Connect ServiceNow credentials", complete: input.credentialsReady },
    {
      id: "destination",
      label: "Choose destination table and routing",
      complete: input.destinationConfigured,
    },
    { id: "test", label: "Send a connection test", complete: input.connectionVerified },
  ];
}

export function resolveServiceNowIntegrationEmphasizedStepId(input: {
  readonly credentialsReady: boolean;
  readonly destinationConfigured: boolean;
  readonly connectionVerified: boolean;
}): string {
  const steps = resolveServiceNowIntegrationConnectSteps(input);
  const incomplete = steps.find((step) => !step.complete);

  return incomplete?.id ?? "test";
}
