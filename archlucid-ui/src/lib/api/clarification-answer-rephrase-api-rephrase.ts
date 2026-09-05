import {
  filterQualityGatedInferredAnswers,
  isReadableInferredClarificationAnswer,
} from "@/lib/inferred-clarification-answer-quality";

import { apiPostJson } from "./http";
import type {
  RephraseClarificationAnswersInput,
  RephraseClarificationAnswersResponse,
} from "./clarification-answer-rephrase-api-types";

/** Calls POST /v1/architecture/request/draft/clarification-answers/rephrase. */
export async function rephraseClarificationAnswersFromExtractedText(
  input: RephraseClarificationAnswersInput,
): Promise<RephraseClarificationAnswersResponse> {
  return apiPostJson<RephraseClarificationAnswersResponse>(
    "/v1/architecture/request/draft/clarification-answers/rephrase",
    input,
  );
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
