import type { IntegrationConnectChecklistStep } from "@/components/integrations/IntegrationConnectChecklist";

export function resolveRiskExceptionCreateSteps(input: {
  readonly ownerAssigned: boolean;
  readonly evidenceDocumented: boolean;
  readonly waiverCreated: boolean;
}): readonly IntegrationConnectChecklistStep[] {
  return [
    {
      id: "owner",
      label: "Assign exception owner",
      complete: input.ownerAssigned,
    },
    {
      id: "evidence",
      label: "Document rationale and evidence reference",
      complete: input.evidenceDocumented,
    },
    {
      id: "create",
      label: "Create risk exception waiver",
      complete: input.waiverCreated,
    },
  ];
}

export function resolveRiskExceptionCreateEmphasizedStepId(input: {
  readonly ownerAssigned: boolean;
  readonly evidenceDocumented: boolean;
  readonly waiverCreated: boolean;
}): string {
  const steps = resolveRiskExceptionCreateSteps(input);
  const incomplete = steps.find((step) => !step.complete);

  return incomplete?.id ?? "create";
}
