import type { IntegrationConnectChecklistStep } from "@/components/integrations/IntegrationConnectChecklist";

export function resolveScimIssueTokenSteps(input: {
  readonly baseUrlReady: boolean;
  readonly tokenIssued: boolean;
  readonly verifyComplete: boolean;
}): readonly IntegrationConnectChecklistStep[] {
  return [
    {
      id: "base-url",
      label: "Copy SCIM base URL for your IdP",
      complete: input.baseUrlReady,
    },
    {
      id: "issue",
      label: "Issue a provisioning token",
      complete: input.tokenIssued,
    },
    {
      id: "verify",
      label: "Verify IdP connectivity",
      complete: input.verifyComplete,
    },
  ];
}

export function resolveScimIssueTokenEmphasizedStepId(input: {
  readonly baseUrlReady: boolean;
  readonly tokenIssued: boolean;
  readonly verifyComplete: boolean;
}): string {
  const steps = resolveScimIssueTokenSteps(input);
  const incomplete = steps.find((step) => !step.complete);

  return incomplete?.id ?? "verify";
}
