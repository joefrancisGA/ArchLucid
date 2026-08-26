import type { IntegrationConnectChecklistStep } from "@/components/integrations/IntegrationConnectChecklist";

export function resolveValueReportReportingSteps(input: {
  readonly reviewPicked: boolean;
  readonly reportReviewed: boolean;
  readonly exportReady: boolean;
}): readonly IntegrationConnectChecklistStep[] {
  return [
    {
      id: "review",
      label: "Pick a review package",
      complete: input.reviewPicked,
    },
    {
      id: "report",
      label: "Review sponsor report metrics",
      complete: input.reportReviewed,
    },
    {
      id: "export",
      label: "Confirm report export readiness",
      complete: input.exportReady,
    },
  ];
}

export function resolveValueReportReportingEmphasizedStepId(input: {
  readonly reviewPicked: boolean;
  readonly reportReviewed: boolean;
  readonly exportReady: boolean;
}): string {
  const steps = resolveValueReportReportingSteps(input);
  const incomplete = steps.find((step) => !step.complete);

  return incomplete?.id ?? "export";
}
