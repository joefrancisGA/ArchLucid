import type { IntegrationConnectChecklistStep } from "@/components/integrations/IntegrationConnectChecklist";

export function resolveCompositeAlertRulesCreateSteps(input: {
  readonly nameAndSeverityConfigured: boolean;
  readonly conditionsConfigured: boolean;
  readonly ruleSaved: boolean;
}): readonly IntegrationConnectChecklistStep[] {
  return [
    {
      id: "name",
      label: "Name the rule and set severity",
      complete: input.nameAndSeverityConfigured,
    },
    {
      id: "conditions",
      label: "Add two distinct metric conditions",
      complete: input.conditionsConfigured,
    },
    {
      id: "save",
      label: "Save composite rule",
      complete: input.ruleSaved,
    },
  ];
}

export function resolveCompositeAlertRulesCreateEmphasizedStepId(input: {
  readonly nameAndSeverityConfigured: boolean;
  readonly conditionsConfigured: boolean;
  readonly ruleSaved: boolean;
}): string {
  const steps = resolveCompositeAlertRulesCreateSteps(input);
  const incomplete = steps.find((step) => !step.complete);

  return incomplete?.id ?? "save";
}
