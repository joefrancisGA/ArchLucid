import type { IntegrationConnectChecklistStep } from "@/components/integrations/IntegrationConnectChecklist";

export const ARCHITECTURE_DRAFT_START_REVIEW_CHECKLIST_TITLE = "Draft readiness checklist" as const;

export const ARCHITECTURE_DRAFT_START_REVIEW_CHECKLIST_DESCRIPTION_PAGE_LOCAL =
  "These three steps prepare this draft on this page." as const;

export const ARCHITECTURE_DRAFT_START_REVIEW_CHECKLIST_DESCRIPTION_WITH_BANNER =
  "These three steps prepare this draft on this page. Your overall first review progress (7 steps) is tracked in the banner above." as const;

/** @deprecated Prefer {@link resolveArchitectureDraftStartReviewChecklistDescription}. */
export const ARCHITECTURE_DRAFT_START_REVIEW_CHECKLIST_DESCRIPTION =
  ARCHITECTURE_DRAFT_START_REVIEW_CHECKLIST_DESCRIPTION_WITH_BANNER;

/** Page-local checklist intro — references the workspace banner only while it is visible. */
export function resolveArchitectureDraftStartReviewChecklistDescription(
  showWorkspaceFirstReviewProgress: boolean,
): string {
  if (showWorkspaceFirstReviewProgress) {
    return ARCHITECTURE_DRAFT_START_REVIEW_CHECKLIST_DESCRIPTION_WITH_BANNER;
  }

  return ARCHITECTURE_DRAFT_START_REVIEW_CHECKLIST_DESCRIPTION_PAGE_LOCAL;
}

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
