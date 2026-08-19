export type ReviewStartStageId =
  | "creating-workspace"
  | "applying-template"
  | "preparing-questions"
  | "opening-review";

export type ReviewStartStageDefinition = {
  readonly id: ReviewStartStageId;
  readonly label: string;
};

export const REVIEW_START_STAGE_CREATING_WORKSPACE: ReviewStartStageDefinition = {
  id: "creating-workspace",
  label: "Creating review workspace",
};

export const REVIEW_START_STAGE_APPLYING_TEMPLATE: ReviewStartStageDefinition = {
  id: "applying-template",
  label: "Applying the selected template",
};

export const REVIEW_START_STAGE_PREPARING_QUESTIONS: ReviewStartStageDefinition = {
  id: "preparing-questions",
  label: "Preparing review questions",
};

export const REVIEW_START_STAGE_OPENING_REVIEW: ReviewStartStageDefinition = {
  id: "opening-review",
  label: "Opening the review",
};

export function resolveReviewStartStages(hasTemplate: boolean): readonly ReviewStartStageDefinition[] {
  if (hasTemplate) {
    return [
      REVIEW_START_STAGE_CREATING_WORKSPACE,
      REVIEW_START_STAGE_APPLYING_TEMPLATE,
      REVIEW_START_STAGE_PREPARING_QUESTIONS,
      REVIEW_START_STAGE_OPENING_REVIEW,
    ];
  }

  return [
    REVIEW_START_STAGE_CREATING_WORKSPACE,
    REVIEW_START_STAGE_PREPARING_QUESTIONS,
    REVIEW_START_STAGE_OPENING_REVIEW,
  ];
}

export function reviewStartStageIndex(
  stages: readonly ReviewStartStageDefinition[],
  activeStageId: ReviewStartStageId,
): number {
  const index = stages.findIndex((stage) => stage.id === activeStageId);

  return index >= 0 ? index : 0;
}
