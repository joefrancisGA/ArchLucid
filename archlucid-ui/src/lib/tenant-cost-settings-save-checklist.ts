import type { IntegrationConnectChecklistStep } from "@/components/integrations/IntegrationConnectChecklist";

export function resolveTenantCostSettingsSaveSteps(input: {
  readonly fieldsValid: boolean;
  readonly saveComplete: boolean;
}): readonly IntegrationConnectChecklistStep[] {
  return [
    {
      id: "fields",
      label: "Enter architect rate and incident cost",
      complete: input.fieldsValid,
    },
    {
      id: "ea-discount",
      label: "Confirm EA discount percentage",
      complete: input.fieldsValid,
    },
    {
      id: "save",
      label: "Save workspace cost settings",
      complete: input.saveComplete,
    },
  ];
}

export function resolveTenantCostSettingsSaveEmphasizedStepId(input: {
  readonly fieldsValid: boolean;
  readonly saveComplete: boolean;
}): string {
  const steps = resolveTenantCostSettingsSaveSteps(input);
  const incomplete = steps.find((step) => !step.complete);

  return incomplete?.id ?? "save";
}
