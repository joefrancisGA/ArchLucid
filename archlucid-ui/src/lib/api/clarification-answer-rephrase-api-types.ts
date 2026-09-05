/** One clarification answer to humanize via POST /v1/architecture/request/draft/clarification-answers/rephrase. */
export type ClarificationAnswerRephraseItem = {
  questionKey: string;
  questionPrompt: string;
  extractedAnswer: string;
};

/** Body for POST /v1/architecture/request/draft/clarification-answers/rephrase. */
export type RephraseClarificationAnswersInput = {
  items: readonly ClarificationAnswerRephraseItem[];
};

/** Humanized clarification answers keyed by questionKey. */
export type RephraseClarificationAnswersResponse = {
  rephrasedAnswers: Readonly<Record<string, string>>;
};
