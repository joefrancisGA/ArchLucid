import { secureNowQuestionAnswerLabel } from "@/lib/infra-evidence/securenow-question-answer-label";
import { secureNowQuestionShowsExpired } from "@/lib/infra-evidence/securenow-question-expiration";

export type SecureNowQuestionDispositionChromeFields = {
  readonly status: string | null;
  readonly answerCode: string | null;
  readonly answerText: string | null;
  readonly reason: string | null;
};

export type SecureNowQuestionOpenQueueRowFields = SecureNowQuestionDispositionChromeFields & {
  readonly expirationUtc: string | null;
  readonly isExpired: boolean | null;
};

function secureNowQuestionDispositionFieldWasStored(
  value: string | null | undefined,
): boolean {
  return value !== null && value !== undefined;
}

function secureNowQuestionDispositionStatusAllowsStoredMetadataInference(
  status: string | null | undefined,
): boolean {
  const normalized = secureNowQuestionDispositionStatusTrimmed(status);
  return normalized === null || normalized === "Open";
}

function secureNowQuestionDispositionHasInferredClosedFields(
  question: SecureNowQuestionDispositionChromeFields,
): boolean {
  if (!secureNowQuestionDispositionStatusAllowsStoredMetadataInference(question.status)) {
    return false;
  }

  return secureNowQuestionDispositionFieldWasStored(question.answerCode)
    || secureNowQuestionDispositionFieldWasStored(question.answerText)
    || secureNowQuestionDispositionFieldWasStored(question.reason);
}

export function secureNowQuestionDispositionShowsStoredAnswerMetadata(
  question: SecureNowQuestionDispositionChromeFields,
): boolean {
  return secureNowQuestionDispositionIsClosed(question.status)
    || secureNowQuestionDispositionHasInferredClosedFields(question);
}

export function secureNowQuestionDispositionShowsAnswerActions(
  question: SecureNowQuestionDispositionChromeFields,
): boolean {
  return secureNowQuestionDispositionIsOpen(question.status)
    && !secureNowQuestionDispositionShowsStoredAnswerMetadata(question);
}

export function secureNowQuestionCountsAsOpenQueueRow(
  question: SecureNowQuestionOpenQueueRowFields,
): boolean {
  return !secureNowQuestionDispositionIsAnswered(question.status)
    && !secureNowQuestionDispositionIsDismissed(question.status)
    && !secureNowQuestionShowsExpired(question.expirationUtc, question.isExpired)
    && !secureNowQuestionDispositionShowsStoredAnswerMetadata(question);
}

export function secureNowQuestionCountsAsAnsweredFilterRow(
  question: SecureNowQuestionDispositionChromeFields,
): boolean {
  if (secureNowQuestionDispositionIsAnswered(question.status)) {
    return true;
  }

  if (!secureNowQuestionDispositionStatusAllowsStoredMetadataInference(question.status)) {
    return false;
  }

  return secureNowQuestionDispositionFieldWasStored(question.answerCode)
    || secureNowQuestionDispositionFieldWasStored(question.answerText);
}

export function secureNowQuestionDispositionReviewerStatusLabel(
  question: SecureNowQuestionDispositionChromeFields,
): string {
  const normalized = secureNowQuestionDispositionStatusTrimmed(question.status);
  if (normalized === null) {
    if (secureNowQuestionCountsAsAnsweredFilterRow(question)) {
      return "Answered";
    }

    if (secureNowQuestionCountsAsDismissedFilterRow(question)) {
      return "Dismissed";
    }

    return "Question status was not stored";
  }

  if (normalized === "Answered") {
    return "Answered";
  }

  if (normalized === "Ignored" || normalized === "Dismissed") {
    return "Dismissed";
  }

  if (normalized === "Open") {
    if (secureNowQuestionCountsAsAnsweredFilterRow(question)) {
      return "Answered";
    }

    if (secureNowQuestionCountsAsDismissedFilterRow(question)) {
      return "Dismissed";
    }
  }

  return `Question status "${normalized}" has no reviewer label.`;
}

export function secureNowQuestionCountsAsDismissedFilterRow(
  question: SecureNowQuestionDispositionChromeFields,
): boolean {
  if (secureNowQuestionDispositionIsDismissed(question.status)) {
    return true;
  }

  if (!secureNowQuestionDispositionStatusAllowsStoredMetadataInference(question.status)) {
    return false;
  }

  const hasAnswerMetadata = secureNowQuestionDispositionFieldWasStored(question.answerCode)
    || secureNowQuestionDispositionFieldWasStored(question.answerText);

  return secureNowQuestionDispositionFieldWasStored(question.reason) && !hasAnswerMetadata;
}

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
  const normalized = secureNowQuestionDispositionStatusTrimmed(status);
  if (normalized === null) {
    // List JSON may omit status on actionable open rows while they still appear in the Open filter.
    return true;
  }

  return normalized === "Open";
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

export function secureNowQuestionReviewerReasonTextLine(reasonText: string): string {
  const trimmed = reasonText.trim();
  return trimmed.length > 0 ? trimmed : "Reason was not stored";
}

export function secureNowQuestionReviewerSourceLine(sourceLine: string): string {
  const trimmed = sourceLine.trim();
  return trimmed.length > 0 ? trimmed : "Source line was not stored";
}
