import type { IntegrationConnectChecklistStep } from "@/components/integrations/IntegrationConnectChecklist";

export function resolveStandardsRulesResolveSteps(input: {
  readonly reviewPicked: boolean;
  readonly rulesFiltered: boolean;
  readonly resolveReady: boolean;
}): readonly IntegrationConnectChecklistStep[] {
  return [
    {
      id: "review",
      label: "Pick a review package",
      complete: input.reviewPicked,
    },
    {
      id: "filters",
      label: "Filter standards rules",
      complete: input.rulesFiltered,
    },
    {
      id: "resolve",
      label: "Review resolution outcomes",
      complete: input.resolveReady,
    },
  ];
}

export function resolveStandardsRulesResolveEmphasizedStepId(input: {
  readonly reviewPicked: boolean;
  readonly rulesFiltered: boolean;
  readonly resolveReady: boolean;
}): string {
  const steps = resolveStandardsRulesResolveSteps(input);
  const incomplete = steps.find((step) => !step.complete);

  return incomplete?.id ?? "resolve";
}
