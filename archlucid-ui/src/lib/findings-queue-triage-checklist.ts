import type { IntegrationConnectChecklistStep } from "@/components/integrations/IntegrationConnectChecklist";

export function resolveFindingsQueueTriageSteps(input: {
  readonly reviewPicked: boolean;
  readonly findingOpened: boolean;
  readonly dispositionRecorded: boolean;
}): readonly IntegrationConnectChecklistStep[] {
  return [
    {
      id: "review",
      label: "Pick a review package",
      complete: input.reviewPicked,
    },
    {
      id: "open",
      label: "Open a finding",
      complete: input.findingOpened,
    },
    {
      id: "disposition",
      label: "Record a disposition",
      complete: input.dispositionRecorded,
    },
  ];
}

export function resolveFindingsQueueTriageEmphasizedStepId(input: {
  readonly reviewPicked: boolean;
  readonly findingOpened: boolean;
  readonly dispositionRecorded: boolean;
}): string {
  const steps = resolveFindingsQueueTriageSteps(input);
  const incomplete = steps.find((step) => !step.complete);

  return incomplete?.id ?? "disposition";
}
