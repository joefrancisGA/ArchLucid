import type { IntegrationConnectChecklistStep } from "@/components/integrations/IntegrationConnectChecklist";

export function resolveTenantCostSettingsSaveSteps(input: {
  readonly isTenantConfigured: boolean;
  readonly ratesValid: boolean;
  readonly eaDiscountValid: boolean;
  readonly saveComplete: boolean;
}): readonly IntegrationConnectChecklistStep[] {
  const ratesComplete = input.isTenantConfigured || input.ratesValid;
  const eaComplete = input.isTenantConfigured || input.eaDiscountValid;

  return [
    {
      id: "fields",
      label: "Enter architect rate and incident cost",
      complete: ratesComplete,
    },
    {
      id: "ea-discount",
      label: "Confirm EA discount percentage",
      complete: eaComplete,
    },
    {
      id: "save",
      label: "Save cost settings",
      complete: input.saveComplete,
    },
  ];
}

export function resolveTenantCostSettingsSaveEmphasizedStepId(input: {
  readonly isTenantConfigured: boolean;
  readonly ratesValid: boolean;
  readonly eaDiscountValid: boolean;
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
