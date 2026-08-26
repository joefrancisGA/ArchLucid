import type { IntegrationConnectChecklistStep } from "@/components/integrations/IntegrationConnectChecklist";

export function resolvePatternLibraryBrowseSteps(input: {
  readonly reviewPicked: boolean;
  readonly catalogReviewed: boolean;
  readonly browseComplete: boolean;
}): readonly IntegrationConnectChecklistStep[] {
  return [
    {
      id: "review",
      label: "Pick a review package",
      complete: input.reviewPicked,
    },
    {
      id: "catalog",
      label: "Review matching patterns",
      complete: input.catalogReviewed,
    },
    {
      id: "browse",
      label: "Open a pattern record",
      complete: input.browseComplete,
    },
  ];
}

export function resolvePatternLibraryBrowseEmphasizedStepId(input: {
  readonly reviewPicked: boolean;
  readonly catalogReviewed: boolean;
  readonly browseComplete: boolean;
}): string {
  const steps = resolvePatternLibraryBrowseSteps(input);
  const incomplete = steps.find((step) => !step.complete);

  return incomplete?.id ?? "browse";
}
