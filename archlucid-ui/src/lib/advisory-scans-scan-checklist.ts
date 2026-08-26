import type { IntegrationConnectChecklistStep } from "@/components/integrations/IntegrationConnectChecklist";

export function resolveAdvisoryScansScanSteps(input: {
  readonly reviewPicked: boolean;
  readonly scanConfigured: boolean;
  readonly scanComplete: boolean;
}): readonly IntegrationConnectChecklistStep[] {
  return [
    {
      id: "review",
      label: "Pick a review package",
      complete: input.reviewPicked,
    },
    {
      id: "configure",
      label: "Configure scan inputs",
      complete: input.scanConfigured,
    },
    {
      id: "scan",
      label: "Run or load advisory scan results",
      complete: input.scanComplete,
    },
  ];
}

export function resolveAdvisoryScansScanEmphasizedStepId(input: {
  readonly reviewPicked: boolean;
  readonly scanConfigured: boolean;
  readonly scanComplete: boolean;
}): string {
  const steps = resolveAdvisoryScansScanSteps(input);
  const incomplete = steps.find((step) => !step.complete);

  return incomplete?.id ?? "scan";
}
