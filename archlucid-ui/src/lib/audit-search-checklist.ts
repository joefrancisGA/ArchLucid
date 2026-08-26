import type { IntegrationConnectChecklistStep } from "@/components/integrations/IntegrationConnectChecklist";

export function resolveAuditSearchSteps(input: {
  readonly reviewPicked: boolean;
  readonly filtersConfigured: boolean;
  readonly searchComplete: boolean;
}): readonly IntegrationConnectChecklistStep[] {
  return [
    {
      id: "review",
      label: "Pick a review package",
      complete: input.reviewPicked,
    },
    {
      id: "filters",
      label: "Configure audit filters",
      complete: input.filtersConfigured,
    },
    {
      id: "search",
      label: "Run the audit search",
      complete: input.searchComplete,
    },
  ];
}

export function resolveAuditSearchEmphasizedStepId(input: {
  readonly reviewPicked: boolean;
  readonly filtersConfigured: boolean;
  readonly searchComplete: boolean;
}): string {
  const steps = resolveAuditSearchSteps(input);
  const incomplete = steps.find((step) => !step.complete);

  return incomplete?.id ?? "search";
}
