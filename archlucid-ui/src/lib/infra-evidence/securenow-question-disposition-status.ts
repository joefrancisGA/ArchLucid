import { secureNowQuestionAnswerLabel } from "@/lib/infra-evidence/securenow-question-answer-label";

export function secureNowQuestionDispositionStatusTrimmed(
  status: string | null | undefined,
): string | null {
  if (status === null || status === undefined) {
    return null;
  }

  const trimmed = status.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function secureNowQuestionDispositionIsOpen(
  status: string | null | undefined,
): boolean {
  return secureNowQuestionDispositionStatusTrimmed(status) === "Open";
}

export function secureNowQuestionDispositionIsAnswered(
  status: string | null | undefined,
): boolean {
  return secureNowQuestionDispositionStatusTrimmed(status) === "Answered";
}

export function secureNowQuestionDispositionIsDismissed(
  status: string | null | undefined,
): boolean {
  const normalized = secureNowQuestionDispositionStatusTrimmed(status);
  return normalized === "Ignored" || normalized === "Dismissed";
}

export function secureNowQuestionDispositionIsClosed(
  status: string | null | undefined,
): boolean {
  const normalized = secureNowQuestionDispositionStatusTrimmed(status);
  return normalized === "Answered"
    || normalized === "Ignored"
    || normalized === "Dismissed";
}

export function secureNowQuestionReviewerClosedAnswerCodeLine(
  answerCode: string | null | undefined,
): string {
  if (answerCode === null || answerCode === undefined) {
    return "Answer code was not stored.";
  }

  if (answerCode.trim().length === 0) {
    return "Answer code was stored empty.";
  }

  return secureNowQuestionAnswerLabel(answerCode);
}

export function secureNowQuestionReviewerClosedAnswerTextLine(
  answerText: string | null | undefined,
): string {
  if (answerText === null || answerText === undefined) {
    return "Answer text was not stored.";
  }

  const trimmed = answerText.trim();
  if (trimmed.length === 0) {
    return "Answer text was stored empty.";
  }

  return trimmed;
}

export function secureNowQuestionReviewerClosedDispositionReasonLine(
  reason: string | null | undefined,
): string {
  if (reason === null || reason === undefined) {
    return "Disposition reason was not stored.";
  }

  const trimmed = reason.trim();
  if (trimmed.length === 0) {
    return "Disposition reason was stored empty.";
  }

  return trimmed;
}
