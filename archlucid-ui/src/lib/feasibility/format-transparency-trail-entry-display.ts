import type { AssertedTrailEntry, SkippedQuestionTrailEntry } from "@/types/feasibility-verdict";

export const ASSERTION_VALUE_NOT_STORED = "Assertion value was not stored." as const;
export const ASSERTION_VALUE_STORED_EMPTY = "Assertion value was stored empty." as const;
export const SKIPPED_QUESTION_KEY_NOT_STORED = "Question key was not stored." as const;

export function formatAssertedTrailValue(value: string | null | undefined): string {
  if (value === null || value === undefined) {
    return ASSERTION_VALUE_NOT_STORED;
  }

  if (value.trim().length === 0) {
    return ASSERTION_VALUE_STORED_EMPTY;
  }

  return value;
}

export function formatSkippedTrailQuestionKey(questionKey: string | null | undefined): string {
  const trimmed = questionKey?.trim() ?? "";

  return trimmed.length > 0 ? trimmed : SKIPPED_QUESTION_KEY_NOT_STORED;
}

export function formatAssertedTrailLine(entry: AssertedTrailEntry): string {
  const key =
    entry.key === null || entry.key === undefined
      ? "Assertion key was not stored."
      : entry.key.trim().length > 0
        ? entry.key
        : "Assertion key was stored empty.";

  return `${key}: ${formatAssertedTrailValue(entry.value)}`;
}

export const QUESTION_TIER_STORED_EMPTY = "Question tier was stored empty." as const;

export function formatSkippedTrailExportLine(entry: SkippedQuestionTrailEntry): string {
  const tier =
    entry.tier === null || entry.tier === undefined
      ? "Question tier was not stored."
      : entry.tier.trim().length === 0
        ? QUESTION_TIER_STORED_EMPTY
        : entry.tier;

  return `${formatSkippedTrailQuestionKey(entry.questionKey)} (${tier})`;
}
