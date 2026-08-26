import type { IntegrationConnectChecklistStep } from "@/components/integrations/IntegrationConnectChecklist";

export function resolveDecisionRegisterFilterSteps(input: {
  readonly reviewPicked: boolean;
  readonly filtersConfigured: boolean;
  readonly registerReviewed: boolean;
}): readonly IntegrationConnectChecklistStep[] {
  return [
    {
      id: "review",
      label: "Pick a review package",
      complete: input.reviewPicked,
    },
    {
      id: "filters",
      label: "Configure decision filters",
      complete: input.filtersConfigured,
    },
    {
      id: "register",
      label: "Review filtered decisions",
      complete: input.registerReviewed,
    },
  ];
}

export function resolveDecisionRegisterFilterEmphasizedStepId(input: {
  readonly reviewPicked: boolean;
  readonly filtersConfigured: boolean;
  readonly registerReviewed: boolean;
}): string {
  const steps = resolveDecisionRegisterFilterSteps(input);
  const incomplete = steps.find((step) => !step.complete);

  return incomplete?.id ?? "register";
}
