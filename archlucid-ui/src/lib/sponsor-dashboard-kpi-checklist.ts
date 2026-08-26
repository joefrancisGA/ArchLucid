import type { IntegrationConnectChecklistStep } from "@/components/integrations/IntegrationConnectChecklist";

export function resolveSponsorDashboardKpiSteps(input: {
  readonly reviewPicked: boolean;
  readonly kpisReviewed: boolean;
  readonly exportReady: boolean;
}): readonly IntegrationConnectChecklistStep[] {
  return [
    {
      id: "review",
      label: "Pick a review package",
      complete: input.reviewPicked,
    },
    {
      id: "kpis",
      label: "Review sponsor KPI tiles",
      complete: input.kpisReviewed,
    },
    {
      id: "export",
      label: "Confirm export readiness",
      complete: input.exportReady,
    },
  ];
}

export function resolveSponsorDashboardKpiEmphasizedStepId(input: {
  readonly reviewPicked: boolean;
  readonly kpisReviewed: boolean;
  readonly exportReady: boolean;
}): string {
  const steps = resolveSponsorDashboardKpiSteps(input);
  const incomplete = steps.find((step) => !step.complete);

  return incomplete?.id ?? "export";
}
