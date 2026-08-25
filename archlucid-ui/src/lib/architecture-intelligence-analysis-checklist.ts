import type { IntegrationConnectChecklistStep } from "@/components/integrations/IntegrationConnectChecklist";

export function resolveArchitectureIntelligenceAnalysisSteps(input: {
  readonly reviewPicked: boolean;
  readonly descriptionWritten: boolean;
  readonly analysisComplete: boolean;
}): readonly IntegrationConnectChecklistStep[] {
  return [
    {
      id: "review",
      label: "Pick a review",
      complete: input.reviewPicked,
    },
    {
      id: "description",
      label: "Write a description",
      complete: input.descriptionWritten,
    },
    {
      id: "analyze",
      label: "Run analysis",
      complete: input.analysisComplete,
    },
  ];
}

export function resolveArchitectureIntelligenceAnalysisEmphasizedStepId(input: {
  readonly reviewPicked: boolean;
  readonly descriptionWritten: boolean;
  readonly analysisComplete: boolean;
}): string {
  const steps = resolveArchitectureIntelligenceAnalysisSteps(input);
  const incomplete = steps.find((step) => !step.complete);

  return incomplete?.id ?? "analyze";
}
