import { apiPostJson } from "./http";
import { CLOUD_TARGET_QUESTION_KEY } from "@/lib/architecture/architecture-creation-question-definition";
import {
  filterQualityGatedInferredAnswers,
  isReadableInferredClarificationAnswer,
} from "@/lib/inferred-clarification-answer-quality";
import { extractClarificationEvidenceSnippet } from "@/lib/universal-intake-clarification-evidence-snippet";
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
  const gatedAnswers = filterQualityGatedInferredAnswers(input.inferredAnswers);

  for (const [questionKey, extractedAnswer] of Object.entries(gatedAnswers)) {
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

export function buildClarificationRephraseItemsForEmptyKeys(input: {
  readonly corpus: string;
  readonly inferredAnswers: Readonly<Record<string, string>>;
  readonly questions: readonly DraftElicitationQuestion[];
  readonly currentAnswers: Readonly<Record<string, string>>;
  readonly lockedQuestionKeys: ReadonlySet<string>;
}): ClarificationAnswerRephraseItem[] {
  const trimmedCorpus = input.corpus.trim();

  if (trimmedCorpus.length === 0) {
    return [];
  }

  const items: ClarificationAnswerRephraseItem[] = [];

  for (const question of input.questions) {
    if (input.lockedQuestionKeys.has(question.questionKey)) {
      continue;
    }

    const existingAnswer = input.currentAnswers[question.questionKey]?.trim() ?? "";

    if (existingAnswer.length > 0) {
      continue;
    }

    if (input.inferredAnswers[question.questionKey] !== undefined) {
      continue;
    }

    if (question.questionKey === CLOUD_TARGET_QUESTION_KEY) {
      continue;
    }

    const evidenceSnippet = extractClarificationEvidenceSnippet(trimmedCorpus, question.questionKey);

    if (evidenceSnippet === null || evidenceSnippet.trim().length === 0) {
      continue;
    }

    items.push({
      questionKey: question.questionKey,
      questionPrompt: question.prompt,
      extractedAnswer: evidenceSnippet.trim(),
    });
  }

  return items;
}

export function mergeRephrasedClarificationAnswers(input: {
  readonly currentAnswers: Readonly<Record<string, string>>;
  readonly inferredAnswers: Readonly<Record<string, string>>;
  readonly rephrasedAnswers: Readonly<Record<string, string>>;
  readonly lockedQuestionKeys: ReadonlySet<string>;
}): {
  readonly mergedAnswers: Readonly<Record<string, string>>;
  readonly rephrasedQuestionKeys: readonly string[];
} {
  const gatedInferred = filterQualityGatedInferredAnswers(input.inferredAnswers);
  const mergedAnswers: Record<string, string> = { ...input.currentAnswers };
  const rephrasedQuestionKeys: string[] = [];

  for (const [questionKey, inferredAnswer] of Object.entries(gatedInferred)) {
    if (input.lockedQuestionKeys.has(questionKey)) {
      continue;
    }

    const existingAnswer = input.currentAnswers[questionKey]?.trim() ?? "";

    if (existingAnswer.length > 0) {
      continue;
    }

    const rephrasedAnswer = input.rephrasedAnswers[questionKey]?.trim() ?? "";
    const candidate =
      rephrasedAnswer.length > 0 && isReadableInferredClarificationAnswer(rephrasedAnswer)
        ? rephrasedAnswer
        : inferredAnswer;

    if (!isReadableInferredClarificationAnswer(candidate)) {
      continue;
    }

    mergedAnswers[questionKey] = candidate;

    if (rephrasedAnswer.length > 0 && rephrasedAnswer !== inferredAnswer) {
      rephrasedQuestionKeys.push(questionKey);
    }
  }

  for (const [questionKey, rephrasedAnswer] of Object.entries(input.rephrasedAnswers)) {
    if (input.lockedQuestionKeys.has(questionKey)) {
      continue;
    }

    if (gatedInferred[questionKey] !== undefined) {
      continue;
    }

    const existingAnswer = input.currentAnswers[questionKey]?.trim() ?? "";

    if (existingAnswer.length > 0) {
      continue;
    }

    const trimmed = rephrasedAnswer.trim();

    if (!isReadableInferredClarificationAnswer(trimmed)) {
      continue;
    }

    mergedAnswers[questionKey] = trimmed;
    rephrasedQuestionKeys.push(questionKey);
  }

  return {
    mergedAnswers,
    rephrasedQuestionKeys,
  };
}
