import { ARCHITECTURE_DRAFT_UNKNOWN_CONFIRM_LABEL } from "@/lib/architecture/architecture-draft-structured-brief";
import {
  ARCHITECTURE_CREATION_UNIVERSAL_QUESTIONS,
  buildArchitectureCreationQuestionSelection,
} from "@/lib/architecture/architecture-creation-question-definition";
import { resolveUniversalIntakeMustEngineFieldHint } from "@/lib/intake/universal-intake-must-engine-coverage";
import type { TransparencyTrail } from "@/types/feasibility-verdict";

export const UNIVERSAL_INTAKE_MUST_QUESTION_KEYS =
  buildArchitectureCreationQuestionSelection().requiredMustQuestionKeys;

export type UniversalIntakeMustAnswers = Readonly<Record<string, string>>;

export type UniversalIntakeMustCompletenessInput = {
  readonly answers: UniversalIntakeMustAnswers;
  readonly skippedQuestionKeys: ReadonlySet<string>;
};

export function isQuestionKeySkipped(
  questionKey: string,
  skippedQuestionKeys: ReadonlySet<string>,
): boolean {
  return skippedQuestionKeys.has(questionKey);
}

export function isUniversalIntakeMustQuestionSatisfied(
  questionKey: string,
  answers: UniversalIntakeMustAnswers,
  skippedQuestionKeys: ReadonlySet<string>,
): boolean {
  const answer = answers[questionKey]?.trim() ?? "";

  if (answer.length > 0) {
    return true;
  }

  return isQuestionKeySkipped(questionKey, skippedQuestionKeys);
}

export function evaluateUniversalIntakeMustMissingKeys(
  input: UniversalIntakeMustCompletenessInput,
): readonly string[] {
  return UNIVERSAL_INTAKE_MUST_QUESTION_KEYS.filter(
    (questionKey) => !isUniversalIntakeMustQuestionSatisfied(questionKey, input.answers, input.skippedQuestionKeys),
  );
}

export function isUniversalIntakeMustComplete(input: UniversalIntakeMustCompletenessInput): boolean {
  return evaluateUniversalIntakeMustMissingKeys(input).length === 0;
}

const QUESTION_PROMPT_BY_KEY = new Map(
  ARCHITECTURE_CREATION_UNIVERSAL_QUESTIONS.map((question) => [question.questionKey, question.prompt]),
);

export type UniversalIntakeMustGapOptions = {
  /** Working intake: cite which engine measurements stay absent (PC-02). */
  readonly measurementHonesty?: boolean;
};

export function describeUniversalIntakeMustGap(
  input: UniversalIntakeMustCompletenessInput,
  options?: UniversalIntakeMustGapOptions,
): string | null {
  const missingKeys = evaluateUniversalIntakeMustMissingKeys(input);

  if (missingKeys.length === 0) {
    return null;
  }

  if (missingKeys.length === 1) {
    const questionKey = missingKeys[0] ?? "";

    if (options?.measurementHonesty === true) {
      const measurementHint = resolveUniversalIntakeMustEngineFieldHint(questionKey);

      if (measurementHint !== null) {
        return measurementHint;
      }
    }

    const prompt = QUESTION_PROMPT_BY_KEY.get(questionKey);

    if (prompt !== undefined) {
      return `Answer the required clarification: ${prompt}`;
    }
  }

  if (options?.measurementHonesty === true) {
    return `Answer or mark unknown each required clarification (${missingKeys.length} remaining) — skipped MUST answers leave related engine measurements absent on seal.`;
  }

  return `Answer or mark unknown each required clarification (${missingKeys.length} remaining).`;
}

export function buildIntakeTransparencyTrail(skippedQuestionKeys: ReadonlySet<string>): TransparencyTrail {
  return {
    asserted: [],
    inferred: [],
    skipped: [...skippedQuestionKeys].map((questionKey) => ({
      questionKey,
      tier: "Must",
    })),
  };
}

export function buildIntakeQuestionAnswersForSubmit(
  answers: UniversalIntakeMustAnswers,
  skippedQuestionKeys: ReadonlySet<string>,
): Record<string, string> {
  const payload: Record<string, string> = {};

  for (const questionKey of UNIVERSAL_INTAKE_MUST_QUESTION_KEYS) {
    const trimmedAnswer = answers[questionKey]?.trim() ?? "";

    if (trimmedAnswer.length > 0) {
      payload[questionKey] = trimmedAnswer;

      continue;
    }

    if (skippedQuestionKeys.has(questionKey)) {
      payload[questionKey] = ARCHITECTURE_DRAFT_UNKNOWN_CONFIRM_LABEL;
    }
  }

  return payload;
}
