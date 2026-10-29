import { formatInstantForLocale } from "@/lib/locale-datetime";
import { listPresenterAssertedAnswerEntries } from "@/lib/reviews/review-presenter-asserted-trail";
import { REVIEW_PRESENTER_ASSERTED_CAPTURE_HEADING } from "@/lib/reviews/review-presenter-elicitation-copy";
import type { AssertedTrailEntry, TransparencyTrail } from "@/types/feasibility-verdict";

/** Print / meeting-packet disclaimer — room capture is not a sealed record (PC-09 optional). */
export const REVIEW_MEETING_CAPTURE_DISCLAIMER =
  "Room answers captured during presenter elicitation. This meeting capture is not a sealed record — use the finalized review board package for decision-grade artifacts.";

export const PACKAGE_PRINT_MEETING_CAPTURE_HEADING = REVIEW_PRESENTER_ASSERTED_CAPTURE_HEADING;

export const PACKAGE_PRINT_MEETING_CAPTURE_SECTION_ID = "package-print-meeting-capture" as const;

export const REVIEW_MEETING_CAPTURE_QUESTION_NOT_STORED = "Question was not stored." as const;
export const REVIEW_MEETING_CAPTURE_ANSWER_NOT_STORED = "Answer was not stored." as const;
export const REVIEW_MEETING_CAPTURE_QUESTION_KEY_STORED_EMPTY = "Question key was stored empty." as const;

export function formatReviewMeetingCaptureQuestionLabel(questionLabel: string): string {
  if (questionLabel.length === 0) {
    return REVIEW_MEETING_CAPTURE_QUESTION_KEY_STORED_EMPTY;
  }

  if (questionLabel.trim().length === 0) {
    return REVIEW_MEETING_CAPTURE_QUESTION_KEY_STORED_EMPTY;
  }

  return `Question text was not stored. Key: ${questionLabel.trim()}.`;
}

export function formatReviewMeetingCaptureAnswer(answer: string): string {
  return formatReviewMeetingCaptureAnswerLine(answer);
}

export type ReviewMeetingCaptureEntry = {
  readonly questionLabel: string;
  readonly answer: string;
  /** null when the trail entry omitted responder; "" when stored blank. */
  readonly responderLabel: string | null;
  /** null when recorded time was omitted; "" when stored blank. */
  readonly recordedUtc: string | null;
  readonly recordedAtLabel: string | null;
};

export function buildReviewMeetingCaptureMetaParts(
  entry: ReviewMeetingCaptureEntry,
): readonly string[] {
  const parts: string[] = [];

  if (entry.responderLabel === null) {
    parts.push("Responder was not stored.");
  } else if (entry.responderLabel.length === 0) {
    parts.push("Responder was stored empty.");
  } else {
    parts.push(entry.responderLabel);
  }

  if (entry.recordedUtc === null) {
    parts.push("Answer recorded time was not stored.");
  } else if (entry.recordedUtc.trim().length === 0) {
    parts.push("Answer recorded time was stored empty.");
  } else if (entry.recordedAtLabel !== null) {
    parts.push(entry.recordedAtLabel);
  }

  return parts;
}

/** Strips the presenter answer key prefix (`answer.`) for human-readable export labels. */
export function formatReviewMeetingCaptureQuestionLine(questionLabel: string): string {
  if (questionLabel.length === 0 || questionLabel.trim().length === 0) {
    return REVIEW_MEETING_CAPTURE_QUESTION_KEY_STORED_EMPTY;
  }

  const key = presenterAssertedQuestionLabel(questionLabel);

  if (key.length === 0) {
    return REVIEW_MEETING_CAPTURE_QUESTION_KEY_STORED_EMPTY;
  }

  return `Question text was not stored. Key: ${key}.`;
}

export function formatReviewMeetingCaptureAnswerLine(answer: string): string {
  if (answer.length === 0) {
    return "Answer was stored empty.";
  }

  if (answer.trim().length === 0) {
    return "Answer was stored empty.";
  }

  return answer;
}

export function presenterAssertedQuestionLabel(key: string): string {
  const trimmed = key.trim();

  if (trimmed.startsWith("answer.")) {
    return trimmed.slice("answer.".length);
  }

  return trimmed;
}

export function buildReviewMeetingCaptureEntries(
  assertedEntries: readonly AssertedTrailEntry[],
): readonly ReviewMeetingCaptureEntry[] {
  return assertedEntries.map((entry) => {
    const responderLabel =
      entry.responderLabel === undefined || entry.responderLabel === null ? null : entry.responderLabel;
    const recordedUtc =
      entry.recordedUtc === undefined || entry.recordedUtc === null ? null : entry.recordedUtc;
    const recordedAtLabel =
      recordedUtc === null
        ? null
        : recordedUtc.trim().length > 0
          ? formatInstantForLocale(recordedUtc)
          : null;

    return {
      questionLabel: presenterAssertedQuestionLabel(entry.key),
      answer: entry.value,
      responderLabel,
      recordedUtc,
      recordedAtLabel,
    };
  });
}

export function resolveReviewMeetingCaptureEntries(
  trail: TransparencyTrail | null | undefined,
): readonly ReviewMeetingCaptureEntry[] {
  return buildReviewMeetingCaptureEntries(listPresenterAssertedAnswerEntries(trail));
}

export function hasReviewMeetingCapture(entries: readonly ReviewMeetingCaptureEntry[]): boolean {
  return entries.length > 0;
}

export function formatReviewMeetingCapturePlainText(
  entries: readonly ReviewMeetingCaptureEntry[],
): string {
  if (entries.length === 0) {
    return "";
  }

  const lines: string[] = [REVIEW_MEETING_CAPTURE_DISCLAIMER, ""];

  for (const entry of entries) {
    lines.push(`Q: ${formatReviewMeetingCaptureQuestionLine(entry.questionLabel)}`);
    lines.push(`A: ${formatReviewMeetingCaptureAnswer(entry.answer)}`);

    const metaParts = buildReviewMeetingCaptureMetaParts(entry);

    if (metaParts.length > 0) {
      lines.push(metaParts.join(" · "));
    }

    lines.push("");
  }

  return lines.join("\n").trimEnd();
}
