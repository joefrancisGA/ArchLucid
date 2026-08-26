import type { IntegrationConnectChecklistStep } from "@/components/integrations/IntegrationConnectChecklist";

export function resolveAlertSimulationRunSteps(input: {
  readonly reviewPicked: boolean;
  readonly inputsConfigured: boolean;
  readonly dryRunComplete: boolean;
}): readonly IntegrationConnectChecklistStep[] {
  return [
    {
      id: "review",
      label: "Pick a review package",
      complete: input.reviewPicked,
    },
    {
      id: "inputs",
      label: "Configure simulation inputs",
      complete: input.inputsConfigured,
    },
    {
      id: "dry-run",
      label: "Run alert dry-run",
      complete: input.dryRunComplete,
    },
  ];
}

export function resolveAlertSimulationRunEmphasizedStepId(input: {
  readonly reviewPicked: boolean;
  readonly inputsConfigured: boolean;
  readonly dryRunComplete: boolean;
}): string {
  const steps = resolveAlertSimulationRunSteps(input);
  const incomplete = steps.find((step) => !step.complete);

  return incomplete?.id ?? "dry-run";
}
