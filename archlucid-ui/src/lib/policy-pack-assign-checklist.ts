import type { IntegrationConnectChecklistStep } from "@/components/integrations/IntegrationConnectChecklist";

export function resolvePolicyPackAssignSteps(input: {
  readonly reviewPicked: boolean;
  readonly packSelected: boolean;
  readonly versionConfigured: boolean;
}): readonly IntegrationConnectChecklistStep[] {
  return [
    {
      id: "review",
      label: "Pick review for assignment context",
      complete: input.reviewPicked,
    },
    {
      id: "pack",
      label: "Select pack and published version",
      complete: input.packSelected && input.versionConfigured,
    },
    {
      id: "assign",
      label: "Assign pack to workspace scope",
      complete: input.reviewPicked && input.packSelected && input.versionConfigured,
    },
  ];
}

export function resolvePolicyPackAssignEmphasizedStepId(input: {
  readonly reviewPicked: boolean;
  readonly packSelected: boolean;
  readonly versionConfigured: boolean;
}): string {
  const steps = resolvePolicyPackAssignSteps(input);
  const incomplete = steps.find((step) => !step.complete);

  return incomplete?.id ?? "assign";
}
