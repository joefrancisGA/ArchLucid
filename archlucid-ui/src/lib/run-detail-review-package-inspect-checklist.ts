import type { IntegrationConnectChecklistStep } from "@/components/integrations/IntegrationConnectChecklist";

export function resolveRunDetailReviewPackageInspectSteps(input: {
  readonly reviewPicked: boolean;
  readonly packageLoaded: boolean;
  readonly findingsReviewed: boolean;
}): readonly IntegrationConnectChecklistStep[] {
  return [
    {
      id: "review",
      label: "Open the review package workspace",
      complete: input.reviewPicked,
    },
    {
      id: "package",
      label: "Review decision snapshot and package summary",
      complete: input.packageLoaded,
    },
    {
      id: "findings",
      label: "Triage findings or open the review record",
      complete: input.findingsReviewed,
    },
  ];
}

export function resolveRunDetailReviewPackageInspectEmphasizedStepId(input: {
  readonly reviewPicked: boolean;
  readonly packageLoaded: boolean;
  readonly findingsReviewed: boolean;
}): string {
  const steps = resolveRunDetailReviewPackageInspectSteps(input);
  const incomplete = steps.find((step) => !step.complete);

  return incomplete?.id ?? "findings";
}
