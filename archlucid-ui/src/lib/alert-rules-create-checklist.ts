import type { IntegrationConnectChecklistStep } from "@/components/integrations/IntegrationConnectChecklist";

export function resolveAlertRulesCreateSteps(input: {
  readonly signalConfigured: boolean;
  readonly thresholdConfigured: boolean;
  readonly ruleEnabled: boolean;
}): readonly IntegrationConnectChecklistStep[] {
  return [
    {
      id: "signal",
      label: "Choose alert signal",
      complete: input.signalConfigured,
    },
    {
      id: "threshold",
      label: "Set threshold condition",
      complete: input.thresholdConfigured,
    },
    {
      id: "enable",
      label: "Enable rule on save",
      complete: input.ruleEnabled,
    },
  ];
}

export function resolveAlertRulesCreateEmphasizedStepId(input: {
  readonly signalConfigured: boolean;
  readonly thresholdConfigured: boolean;
  readonly ruleEnabled: boolean;
}): string {
  const steps = resolveAlertRulesCreateSteps(input);
  const incomplete = steps.find((step) => !step.complete);

  return incomplete?.id ?? "enable";
}
