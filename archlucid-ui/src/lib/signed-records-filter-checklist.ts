import type { IntegrationConnectChecklistStep } from "@/components/integrations/IntegrationConnectChecklist";

export function resolveSignedRecordsFilterSteps(input: {
  readonly reviewPicked: boolean;
  readonly recordsLoaded: boolean;
  readonly filterReady: boolean;
}): readonly IntegrationConnectChecklistStep[] {
  return [
    {
      id: "review",
      label: "Pick a review package",
      complete: input.reviewPicked,
    },
    {
      id: "records",
      label: "Review matching signed records",
      complete: input.recordsLoaded,
    },
    {
      id: "filter",
      label: "Confirm filter and open a record",
      complete: input.filterReady,
    },
  ];
}

export function resolveSignedRecordsFilterEmphasizedStepId(input: {
  readonly reviewPicked: boolean;
  readonly recordsLoaded: boolean;
  readonly filterReady: boolean;
}): string {
  const steps = resolveSignedRecordsFilterSteps(input);
  const incomplete = steps.find((step) => !step.complete);

  return incomplete?.id ?? "filter";
}
