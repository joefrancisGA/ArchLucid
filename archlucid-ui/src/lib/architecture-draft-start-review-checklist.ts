import type { IntegrationConnectChecklistStep } from "@/components/integrations/IntegrationConnectChecklist";

export const ARCHITECTURE_DRAFT_START_REVIEW_CHECKLIST_TITLE = "Draft readiness checklist" as const;

export const ARCHITECTURE_DRAFT_START_REVIEW_CHECKLIST_DESCRIPTION =
  "These three steps prepare this draft on this page. Your overall first review progress (7 steps) is tracked in the banner above." as const;

export function resolveArchitectureDraftStartReviewSteps(input: {
  readonly nameAndScopeConfigured: boolean;
  readonly qualityReadinessConfigured: boolean;
  readonly reviewStarted: boolean;
}): readonly IntegrationConnectChecklistStep[] {
  return [
    {
      id: "scope",
      label: "Name the architecture and fill scope",
      complete: input.nameAndScopeConfigured,
    },
    {
      id: "readiness",
      label: "Confirm quality attributes and review readiness",
      complete: input.qualityReadinessConfigured,
    },
    {
      id: "start",
      label: "Start architecture review",
      complete: input.reviewStarted,
    },
  ];
}

export function resolveArchitectureDraftStartReviewEmphasizedStepId(input: {
  readonly nameAndScopeConfigured: boolean;
  readonly qualityReadinessConfigured: boolean;
  readonly reviewStarted: boolean;
}): string {
  const steps = resolveArchitectureDraftStartReviewSteps(input);
  const incomplete = steps.find((step) => !step.complete);

  return incomplete?.id ?? "start";
}
