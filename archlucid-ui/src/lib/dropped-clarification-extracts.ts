import { isReadableInferredClarificationAnswer } from "@/lib/inferred-clarification-answer-quality";

export type DroppedClarificationExtract = {
  readonly questionKey: string;
  readonly reason: string;
};

export const DROPPED_CLARIFICATION_EXTRACT_READABILITY_REASON =
  "An extract was dropped because it did not pass the readability gate." as const;

/** Lists clarification question keys whose corpus extract was rejected by the readability gate. */
export function listDroppedClarificationExtracts(
  candidates: Readonly<Record<string, string>>,
): readonly DroppedClarificationExtract[] {
  const dropped: DroppedClarificationExtract[] = [];

  for (const [questionKey, answer] of Object.entries(candidates)) {
    if (answer.trim().length === 0) {
      continue;
    }

    if (isReadableInferredClarificationAnswer(answer)) {
      continue;
    }

    dropped.push({
      questionKey,
      reason: DROPPED_CLARIFICATION_EXTRACT_READABILITY_REASON,
    });
  }

  return dropped;
}

export function formatDroppedClarificationExtractsSummary(
  extracts: readonly DroppedClarificationExtract[],
): string | null {
  if (extracts.length === 0) {
    return null;
  }

  if (extracts.length === 1) {
    return `${extracts.length} clarification extract was dropped — ${DROPPED_CLARIFICATION_EXTRACT_READABILITY_REASON}`;
  }

  return `${extracts.length} clarification extracts were dropped — ${DROPPED_CLARIFICATION_EXTRACT_READABILITY_REASON}`;
}
