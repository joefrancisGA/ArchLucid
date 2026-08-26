import type { IntegrationConnectChecklistStep } from "@/components/integrations/IntegrationConnectChecklist";

export function resolveScorecardScoringSteps(input: {
  readonly reviewPicked: boolean;
  readonly metricsReviewed: boolean;
  readonly exportReady: boolean;
}): readonly IntegrationConnectChecklistStep[] {
  return [
    {
      id: "review",
      label: "Pick a review package",
      complete: input.reviewPicked,
    },
    {
      id: "metrics",
      label: "Review scorecard metrics",
      complete: input.metricsReviewed,
    },
    {
      id: "export",
      label: "Confirm ROI export readiness",
      complete: input.exportReady,
    },
  ];
}

export function resolveScorecardScoringEmphasizedStepId(input: {
  readonly reviewPicked: boolean;
  readonly metricsReviewed: boolean;
  readonly exportReady: boolean;
}): string {
  const steps = resolveScorecardScoringSteps(input);
  const incomplete = steps.find((step) => !step.complete);

  return incomplete?.id ?? "export";
}
