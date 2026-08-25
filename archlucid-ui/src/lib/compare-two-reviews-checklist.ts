import type { IntegrationConnectChecklistStep } from "@/components/integrations/IntegrationConnectChecklist";

export function resolveCompareTwoReviewsSteps(input: {
  readonly priorPicked: boolean;
  readonly laterPicked: boolean;
  readonly compareComplete: boolean;
}): readonly IntegrationConnectChecklistStep[] {
  return [
    {
      id: "prior",
      label: "Pick the prior review",
      complete: input.priorPicked,
    },
    {
      id: "later",
      label: "Pick the later review",
      complete: input.laterPicked,
    },
    {
      id: "compare",
      label: "Run compare",
      complete: input.compareComplete,
    },
  ];
}

export function resolveCompareTwoReviewsEmphasizedStepId(input: {
  readonly priorPicked: boolean;
  readonly laterPicked: boolean;
  readonly compareComplete: boolean;
}): string {
  const steps = resolveCompareTwoReviewsSteps(input);
  const incomplete = steps.find((step) => !step.complete);

  return incomplete?.id ?? "compare";
}
