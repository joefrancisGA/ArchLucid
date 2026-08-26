import type { IntegrationConnectChecklistStep } from "@/components/integrations/IntegrationConnectChecklist";

export function resolveGraphInspectSteps(input: {
  readonly reviewPicked: boolean;
  readonly graphLoaded: boolean;
  readonly inspectComplete: boolean;
}): readonly IntegrationConnectChecklistStep[] {
  return [
    {
      id: "review",
      label: "Pick a review package",
      complete: input.reviewPicked,
    },
    {
      id: "load",
      label: "Load the evidence graph",
      complete: input.graphLoaded,
    },
    {
      id: "inspect",
      label: "Inspect linked evidence nodes",
      complete: input.inspectComplete,
    },
  ];
}

export function resolveGraphInspectEmphasizedStepId(input: {
  readonly reviewPicked: boolean;
  readonly graphLoaded: boolean;
  readonly inspectComplete: boolean;
}): string {
  const steps = resolveGraphInspectSteps(input);
  const incomplete = steps.find((step) => !step.complete);

  return incomplete?.id ?? "inspect";
}
