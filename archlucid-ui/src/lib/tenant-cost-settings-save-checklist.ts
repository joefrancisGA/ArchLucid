import type { IntegrationConnectChecklistStep } from "@/components/integrations/IntegrationConnectChecklist";

export function resolveTenantCostSettingsSaveSteps(input: {
  readonly ratesTouched: boolean;
  readonly eaDiscountAcknowledged: boolean;
  readonly saveComplete: boolean;
}): readonly IntegrationConnectChecklistStep[] {
  return [
    {
      id: "fields",
      label: "Enter architect rate and incident cost",
      complete: input.ratesTouched,
    },
    {
      id: "ea-discount",
      label: "Confirm EA discount percentage",
      complete: input.eaDiscountAcknowledged,
    },
    {
      id: "save",
      label: "Save cost settings",
      complete: input.saveComplete,
    },
  ];
}

export function resolveTenantCostSettingsSaveEmphasizedStepId(input: {
  readonly ratesTouched: boolean;
  readonly eaDiscountAcknowledged: boolean;
  readonly fieldsValid: boolean;
  readonly saveComplete: boolean;
}): string {
  const steps = resolveTenantCostSettingsSaveSteps(input);
  const incomplete = steps.find((step) => !step.complete);

  if (incomplete !== undefined) {
    return incomplete.id;
  }

  if (!input.fieldsValid) {
    return "fields";
  }

  return "save";
}
