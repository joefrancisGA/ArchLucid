import type { IntegrationConnectChecklistStep } from "@/components/integrations/IntegrationConnectChecklist";

export function resolveAlertTuningRecommendSteps(input: {
  readonly signalChosen: boolean;
  readonly windowSet: boolean;
  readonly recommendComplete: boolean;
}): readonly IntegrationConnectChecklistStep[] {
  return [
    {
      id: "signal",
      label: "Choose a signal or rule type",
      complete: input.signalChosen,
    },
    {
      id: "window",
      label: "Set the project or review window",
      complete: input.windowSet,
    },
    {
      id: "recommend",
      label: "Run recommend",
      complete: input.recommendComplete,
    },
  ];
}

export function resolveAlertTuningRecommendEmphasizedStepId(input: {
  readonly signalChosen: boolean;
  readonly windowSet: boolean;
  readonly recommendComplete: boolean;
}): string {
  const steps = resolveAlertTuningRecommendSteps(input);
  const incomplete = steps.find((step) => !step.complete);

  return incomplete?.id ?? "recommend";
}
