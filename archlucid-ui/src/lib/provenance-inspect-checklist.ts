import type { IntegrationConnectChecklistStep } from "@/components/integrations/IntegrationConnectChecklist";

export function resolveProvenanceInspectSteps(input: {
  readonly reviewPicked: boolean;
  readonly provenanceLoaded: boolean;
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
      label: "Load provenance trail",
      complete: input.provenanceLoaded,
    },
    {
      id: "inspect",
      label: "Inspect linkage points and relationships",
      complete: input.inspectComplete,
    },
  ];
}

export function resolveProvenanceInspectEmphasizedStepId(input: {
  readonly reviewPicked: boolean;
  readonly provenanceLoaded: boolean;
  readonly inspectComplete: boolean;
}): string {
  const steps = resolveProvenanceInspectSteps(input);
  const incomplete = steps.find((step) => !step.complete);

  return incomplete?.id ?? "inspect";
}
