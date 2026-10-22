import type { ArchitectureIntelligenceFramingQuestion } from "@/lib/architecture/architecture-intelligence-framing-interview";
import type { FramingSuggestContext } from "@/lib/architecture/framing-suggest-corpus";
import { acceptSuggestedAnswer, inferFramingAnswer } from "@/lib/architecture/framing-suggest-infer";

export type { FramingSuggestContext } from "@/lib/architecture/framing-suggest-corpus";

/** Deterministic framing suggestions from overview text — mirrors server inference (no LLM spend). */
export function suggestFramingAnswersFromOverview(
  questions: readonly ArchitectureIntelligenceFramingQuestion[],
  context: FramingSuggestContext,
): Record<string, string> {
  const suggestions: Record<string, string> = {};

  for (const question of questions) {
    const inferred = acceptSuggestedAnswer(inferFramingAnswer(question, context));
    const confirmed = question.confirmedAnswer?.trim() ?? "";

    if (inferred !== null) {
      suggestions[question.questionId] = inferred;
      continue;
    }

    if (confirmed.length > 0) {
      suggestions[question.questionId] = confirmed;
    }
  }

  return suggestions;
}

export function countFramingSuggestionsApplied(
  questions: readonly ArchitectureIntelligenceFramingQuestion[],
  previousAnswers: Readonly<Record<string, string>>,
  nextAnswers: Readonly<Record<string, string>>,
): number {
  let count = 0;

  for (const question of questions) {
    const previous = previousAnswers[question.questionId]?.trim() ?? "";
    const next = nextAnswers[question.questionId]?.trim() ?? "";

    if (next.length > 0 && next !== previous) {
      count += 1;
    }
  }

  return count;
}
