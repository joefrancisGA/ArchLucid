import type { IntegrationConnectChecklistStep } from "@/components/integrations/IntegrationConnectChecklist";

export function resolveImpactPreviewSimulateSteps(input: {
  readonly baselinePicked: boolean;
  readonly candidatePicked: boolean;
  readonly simulateComplete: boolean;
}): readonly IntegrationConnectChecklistStep[] {
  return [
    {
      id: "baseline",
      label: "Pick a baseline review",
      complete: input.baselinePicked,
    },
    {
      id: "candidate",
      label: "Pick a candidate change",
      complete: input.candidatePicked,
    },
    {
      id: "simulate",
      label: "Run simulation",
      complete: input.simulateComplete,
    },
  ];
}

export function resolveImpactPreviewSimulateEmphasizedStepId(input: {
  readonly baselinePicked: boolean;
  readonly candidatePicked: boolean;
  readonly simulateComplete: boolean;
}): string {
  const steps = resolveImpactPreviewSimulateSteps(input);
  const incomplete = steps.find((step) => !step.complete);

  return incomplete?.id ?? "simulate";
}
