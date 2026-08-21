export type FindingSeverity = "Info" | "Warning" | "Error" | "Critical";

export type ReviewClarificationQuestion = {
  readonly questionId: string;
  readonly prompt: string;
  readonly sourceFindingId: string;
  readonly sourceFindingType: string;
  readonly severity: FindingSeverity;
  readonly missingItem: string;
};

export type ReviewClarificationDelta = {
  readonly priorRunId: string;
  readonly resolvedByEvidenceQuestionIds: readonly string[];
  readonly resolvedByAssertionQuestionIds: readonly string[];
  readonly stillOpenQuestionIds: readonly string[];
};

export type ReviewClarificationQuestionsResponse = {
  readonly runId: string;
  readonly questions: readonly ReviewClarificationQuestion[];
  readonly totalDerivedCount: number;
  readonly clarificationRoundAvailable: boolean;
  readonly deltaFromPriorRun: ReviewClarificationDelta | null;
};
