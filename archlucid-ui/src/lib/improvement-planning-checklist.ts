import type { IntegrationConnectChecklistStep } from "@/components/integrations/IntegrationConnectChecklist";

export function resolveImprovementPlanningSteps(input: {
  readonly reviewPicked: boolean;
  readonly themesReviewed: boolean;
  readonly planReady: boolean;
}): readonly IntegrationConnectChecklistStep[] {
  return [
    {
      id: "review",
      label: "Pick a review package",
      complete: input.reviewPicked,
    },
    {
      id: "themes",
      label: "Review improvement themes",
      complete: input.themesReviewed,
    },
    {
      id: "plan",
      label: "Confirm plan export readiness",
      complete: input.planReady,
    },
  ];
}

export function resolveImprovementPlanningEmphasizedStepId(input: {
  readonly reviewPicked: boolean;
  readonly themesReviewed: boolean;
  readonly planReady: boolean;
}): string {
  const steps = resolveImprovementPlanningSteps(input);
  const incomplete = steps.find((step) => !step.complete);

  return incomplete?.id ?? "plan";
}
