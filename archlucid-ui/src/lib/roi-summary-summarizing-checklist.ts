import type { IntegrationConnectChecklistStep } from "@/components/integrations/IntegrationConnectChecklist";

export function resolveRoiSummarySummarizingSteps(input: {
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
      label: "Review ROI summary metrics",
      complete: input.metricsReviewed,
    },
    {
      id: "export",
      label: "Confirm sponsor export readiness",
      complete: input.exportReady,
    },
  ];
}

export function resolveRoiSummarySummarizingEmphasizedStepId(input: {
  readonly reviewPicked: boolean;
  readonly metricsReviewed: boolean;
  readonly exportReady: boolean;
}): string {
  const steps = resolveRoiSummarySummarizingSteps(input);
  const incomplete = steps.find((step) => !step.complete);

  return incomplete?.id ?? "export";
}
