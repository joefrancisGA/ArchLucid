import { formatInstantForLocale } from "@/lib/locale-datetime";
import { listPresenterAssertedAnswerEntries } from "@/lib/reviews/review-presenter-asserted-trail";
import { REVIEW_PRESENTER_ASSERTED_CAPTURE_HEADING } from "@/lib/reviews/review-presenter-elicitation-copy";
import type { AssertedTrailEntry, TransparencyTrail } from "@/types/feasibility-verdict";

/** Print / meeting-packet disclaimer — room capture is not a sealed record (PC-09 optional). */
export const REVIEW_MEETING_CAPTURE_DISCLAIMER =
  "Room answers captured during presenter elicitation. This meeting capture is not a sealed record — use the finalized review board package for decision-grade artifacts.";

export const PACKAGE_PRINT_MEETING_CAPTURE_HEADING = REVIEW_PRESENTER_ASSERTED_CAPTURE_HEADING;

export const PACKAGE_PRINT_MEETING_CAPTURE_SECTION_ID = "package-print-meeting-capture" as const;

export type ReviewMeetingCaptureEntry = {
  readonly questionLabel: string;
  readonly answer: string;
  readonly responderLabel: string | null;
  readonly recordedAtLabel: string | null;
};

/** Strips the presenter answer key prefix (`answer.`) for human-readable export labels. */
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
  return assertedEntries.map((entry) => ({
    questionLabel: presenterAssertedQuestionLabel(entry.key),
    answer: entry.value,
    responderLabel: entry.responderLabel?.trim().length ? entry.responderLabel.trim() : null,
    recordedAtLabel:
      entry.recordedUtc?.trim().length ? formatInstantForLocale(entry.recordedUtc) : null,
  }));
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
    lines.push(`Q: ${entry.questionLabel}`);
    lines.push(`A: ${entry.answer}`);

    const metaParts: string[] = [];

    if (entry.responderLabel !== null) {
      metaParts.push(entry.responderLabel);
    }

    if (entry.recordedAtLabel !== null) {
      metaParts.push(entry.recordedAtLabel);
    }

    if (metaParts.length > 0) {
      lines.push(metaParts.join(" · "));
    }

    lines.push("");
  }

  return lines.join("\n").trimEnd();
}
