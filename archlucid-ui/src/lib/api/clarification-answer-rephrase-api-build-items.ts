import { CLOUD_TARGET_QUESTION_KEY } from "@/lib/architecture/architecture-creation-question-definition";
import {
  filterQualityGatedInferredAnswers,
} from "@/lib/inferred-clarification-answer-quality";
import { extractClarificationEvidenceSnippet } from "@/lib/universal-intake-clarification-evidence-snippet";
import type { DraftElicitationQuestion } from "@/types/draft-intake";

import type { ClarificationAnswerRephraseItem } from "./clarification-answer-rephrase-api-types";

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
