import type { IntegrationConnectChecklistStep } from "@/components/integrations/IntegrationConnectChecklist";
import type { RunState } from "@/app/(operator)/architecture/architecture-intelligence/_sections/architecture-intelligence-types";

export function hasActionableArchitectureIntelligenceResult(runState: RunState | null): boolean {
  if (runState?.kind !== "reasoning") {
    return false;
  }

  const result = runState.result;

  return (
    result.model.elements.length > 0 ||
    result.specialistReviews.some((review) => review.findings.length > 0) ||
    result.recommendations.length > 0 ||
    result.mustNotFailViolations.length > 0 ||
    (result.interview?.framingQuestions?.length ?? 0) > 0 ||
    (result.interview?.evidenceDrivenQuestions?.length ?? 0) > 0 ||
    (result.adversarial?.substantiatedFindings?.length ?? 0) > 0 ||
    (result.validationResults?.length ?? 0) > 0
  );
}

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
      label: "Start analysis",
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
