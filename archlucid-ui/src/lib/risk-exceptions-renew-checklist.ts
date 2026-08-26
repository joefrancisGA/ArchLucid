import type { IntegrationConnectChecklistStep } from "@/components/integrations/IntegrationConnectChecklist";

export function resolveRiskExceptionsRenewSteps(input: {
  readonly reviewPicked: boolean;
  readonly expiringReviewed: boolean;
  readonly renewReady: boolean;
}): readonly IntegrationConnectChecklistStep[] {
  return [
    {
      id: "review",
      label: "Pick a review package",
      complete: input.reviewPicked,
    },
    {
      id: "expiring",
      label: "Review expiring exceptions",
      complete: input.expiringReviewed,
    },
    {
      id: "renew",
      label: "Confirm renewal readiness",
      complete: input.renewReady,
    },
  ];
}

export function resolveRiskExceptionsRenewEmphasizedStepId(input: {
  readonly reviewPicked: boolean;
  readonly expiringReviewed: boolean;
  readonly renewReady: boolean;
}): string {
  const steps = resolveRiskExceptionsRenewSteps(input);
  const incomplete = steps.find((step) => !step.complete);

  return incomplete?.id ?? "renew";
}
