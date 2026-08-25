import { apiPostJson } from "./http";
import { CLOUD_TARGET_QUESTION_KEY } from "@/lib/architecture/architecture-creation-question-definition";
import type { DraftElicitationQuestion } from "@/types/draft-intake";

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

/** Calls POST /v1/architecture/request/draft/clarification-answers/rephrase. */
export async function rephraseClarificationAnswersFromExtractedText(
  input: RephraseClarificationAnswersInput,
): Promise<RephraseClarificationAnswersResponse> {
  return apiPostJson<RephraseClarificationAnswersResponse>(
    "/v1/architecture/request/draft/clarification-answers/rephrase",
    input,
  );
}

export function buildClarificationRephraseItems(input: {
  readonly inferredAnswers: Readonly<Record<string, string>>;
  readonly questions: readonly DraftElicitationQuestion[];
}): ClarificationAnswerRephraseItem[] {
  const questionByKey = new Map(input.questions.map((question) => [question.questionKey, question]));
  const items: ClarificationAnswerRephraseItem[] = [];

  for (const [questionKey, extractedAnswer] of Object.entries(input.inferredAnswers)) {
    if (questionKey === CLOUD_TARGET_QUESTION_KEY) {
      continue;
    }

    const trimmedAnswer = extractedAnswer.trim();

    if (trimmedAnswer.length === 0) {
      continue;
    }

    const question = questionByKey.get(questionKey);

    if (question === undefined) {
      continue;
    }

    items.push({
      questionKey,
      questionPrompt: question.prompt,
      extractedAnswer: trimmedAnswer,
    });
  }

  return items;
}

export function mergeRephrasedClarificationAnswers(input: {
  readonly currentAnswers: Readonly<Record<string, string>>;
  readonly inferredAnswers: Readonly<Record<string, string>>;
  readonly rephrasedAnswers: Readonly<Record<string, string>>;
  readonly lockedQuestionKeys: ReadonlySet<string>;
}): Readonly<Record<string, string>> {
  const mergedAnswers: Record<string, string> = { ...input.currentAnswers };

  for (const [questionKey, inferredAnswer] of Object.entries(input.inferredAnswers)) {
    if (input.lockedQuestionKeys.has(questionKey)) {
      continue;
    }

    const existingAnswer = input.currentAnswers[questionKey]?.trim() ?? "";

    if (existingAnswer.length > 0) {
      continue;
    }

    const rephrasedAnswer = input.rephrasedAnswers[questionKey]?.trim() ?? "";
    mergedAnswers[questionKey] = rephrasedAnswer.length > 0 ? rephrasedAnswer : inferredAnswer;
  }

  return mergedAnswers;
}
