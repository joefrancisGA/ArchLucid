import type { IntegrationConnectChecklistStep } from "@/components/integrations/IntegrationConnectChecklist";

export function resolveGovernanceWorkflowSubmitSteps(input: {
  readonly reviewPicked: boolean;
  readonly requiredFieldsComplete: boolean;
  readonly submitComplete: boolean;
}): readonly IntegrationConnectChecklistStep[] {
  return [
    {
      id: "review",
      label: "Pick a review package",
      complete: input.reviewPicked,
    },
    {
      id: "fields",
      label: "Complete version and environment fields",
      complete: input.requiredFieldsComplete,
    },
    {
      id: "submit",
      label: "Submit for resolve outcomes",
      complete: input.submitComplete,
    },
  ];
}

export function resolveGovernanceWorkflowSubmitEmphasizedStepId(input: {
  readonly reviewPicked: boolean;
  readonly requiredFieldsComplete: boolean;
  readonly submitComplete: boolean;
}): string {
  const steps = resolveGovernanceWorkflowSubmitSteps(input);
  const incomplete = steps.find((step) => !step.complete);

  return incomplete?.id ?? "submit";
}
