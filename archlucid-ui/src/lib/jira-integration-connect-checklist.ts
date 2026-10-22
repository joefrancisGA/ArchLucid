import type { IntegrationConnectChecklistStep } from "@/components/integrations/IntegrationConnectChecklist";

export function resolveJiraIntegrationConnectSteps(input: {
  readonly oauthConnectReady: boolean;
  readonly credentialsReady: boolean;
  readonly connectionVerified: boolean;
}): readonly IntegrationConnectChecklistStep[] {
  return [
    { id: "connect", label: "Connect Jira credentials", complete: input.oauthConnectReady },
    {
      id: "destination",
      label: "Choose destination project and routing",
      complete: input.credentialsReady,
    },
    { id: "test", label: "Send a connection test", complete: input.connectionVerified },
  ];
}

export function resolveJiraIntegrationEmphasizedStepId(input: {
  readonly oauthConnectReady: boolean;
  readonly credentialsReady: boolean;
  readonly connectionVerified: boolean;
}): string {
  const steps = resolveJiraIntegrationConnectSteps(input);
  const incomplete = steps.find((step) => !step.complete);

  return incomplete?.id ?? "test";
}
