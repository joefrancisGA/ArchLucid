import type { IntegrationConnectChecklistStep } from "@/components/integrations/IntegrationConnectChecklist";

export function resolveAzureBoardsIntegrationConnectSteps(input: {
  readonly credentialsReady: boolean;
  readonly settingsReady: boolean;
  readonly connectionVerified: boolean;
}): readonly IntegrationConnectChecklistStep[] {
  return [
    {
      id: "connect",
      label: "Connect organization URL and secure token reference",
      complete: input.credentialsReady,
    },
    {
      id: "destination",
      label: "Choose default project and work item type",
      complete: input.settingsReady,
    },
    {
      id: "test",
      label: "Send a connection test",
      complete: input.connectionVerified,
    },
  ];
}

export function resolveAzureBoardsIntegrationEmphasizedStepId(input: {
  readonly credentialsReady: boolean;
  readonly settingsReady: boolean;
  readonly connectionVerified: boolean;
}): string {
  const steps = resolveAzureBoardsIntegrationConnectSteps(input);
  const incomplete = steps.find((step) => !step.complete);

  return incomplete?.id ?? "test";
}
