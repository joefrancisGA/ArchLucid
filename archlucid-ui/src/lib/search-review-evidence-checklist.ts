import type { IntegrationConnectChecklistStep } from "@/components/integrations/IntegrationConnectChecklist";

export function resolveSearchReviewEvidenceSteps(input: {
  readonly reviewPicked: boolean;
  readonly queryConfigured: boolean;
  readonly searchComplete: boolean;
}): readonly IntegrationConnectChecklistStep[] {
  return [
    {
      id: "review",
      label: "Pick a review package",
      complete: input.reviewPicked,
    },
    {
      id: "query",
      label: "Configure search query",
      complete: input.queryConfigured,
    },
    {
      id: "search",
      label: "Run evidence search",
      complete: input.searchComplete,
    },
  ];
}

export function resolveSearchReviewEvidenceEmphasizedStepId(input: {
  readonly reviewPicked: boolean;
  readonly queryConfigured: boolean;
  readonly searchComplete: boolean;
}): string {
  const steps = resolveSearchReviewEvidenceSteps(input);
  const incomplete = steps.find((step) => !step.complete);

  return incomplete?.id ?? "search";
}
