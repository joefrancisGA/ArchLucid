import type { IntegrationConnectChecklistStep } from "@/components/integrations/IntegrationConnectChecklist";

export function resolveTeamsIntegrationConnectSteps(input: {
  readonly secretNameConfigured: boolean;
  readonly testSucceeded: boolean;
}): readonly IntegrationConnectChecklistStep[] {
  return [
    { id: "prerequisites", label: "Review Teams webhook prerequisites", complete: true },
    {
      id: "secret",
      label: "Store incoming webhook secret name in Key Vault",
      complete: input.secretNameConfigured,
    },
    {
      id: "test",
      label: "Send a test notification",
      complete: input.testSucceeded,
    },
  ];
}

export function resolveTeamsIntegrationEmphasizedStepId(input: {
  readonly secretNameConfigured: boolean;
  readonly testSucceeded: boolean;
}): string {
  if (!input.secretNameConfigured) {
    return "secret";
  }

  if (!input.testSucceeded) {
    return "test";
  }

  return "test";
}
