import type { IntegrationConnectChecklistStep } from "@/components/integrations/IntegrationConnectChecklist";

export function resolveApiKeysIssueSteps(input: {
  readonly slotSelected: boolean;
  readonly confirmAcknowledged: boolean;
  readonly secretStored: boolean;
}): readonly IntegrationConnectChecklistStep[] {
  return [
    {
      id: "slot",
      label: "Choose Admin or ReadOnly credential slot",
      complete: input.slotSelected,
    },
    {
      id: "confirm",
      label: "Confirm rotation or overlap policy",
      complete: input.confirmAcknowledged,
    },
    {
      id: "store",
      label: "Copy and store the new secret",
      complete: input.secretStored,
    },
  ];
}

export function resolveApiKeysIssueEmphasizedStepId(input: {
  readonly slotSelected: boolean;
  readonly confirmAcknowledged: boolean;
  readonly secretStored: boolean;
}): string {
  const steps = resolveApiKeysIssueSteps(input);
  const incomplete = steps.find((step) => !step.complete);

  return incomplete?.id ?? "store";
}
