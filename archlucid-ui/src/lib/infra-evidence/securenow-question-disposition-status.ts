import { secureNowQuestionAnswerLabel } from "@/lib/infra-evidence/securenow-question-answer-label";
import { secureNowQuestionShowsExpired } from "@/lib/infra-evidence/securenow-question-expiration";

export type SecureNowQuestionDispositionChromeFields = {
  readonly status: string | null;
  readonly answerCode: string | null;
  readonly answerText: string | null;
  readonly reason: string | null | undefined;
};

export type SecureNowQuestionOpenQueueRowFields = SecureNowQuestionDispositionChromeFields & {
  readonly expirationUtc: string | null;
  readonly isExpired: boolean | null;
};

function secureNowQuestionDispositionFieldWasStored(
  value: string | null | undefined,
): value is string {
  return value !== null && value !== undefined;
}

/** Non-empty after trim — whitespace-only disposition fields must not infer answered/dismissed rows. */
function secureNowQuestionDispositionFieldContributesToInference(
  value: string | null | undefined,
): boolean {
  if (!secureNowQuestionDispositionFieldWasStored(value)) {
    return false;
  }

  return value.trim().length > 0;
}

type SecureNowQuestionDispositionStatusCanonical =
  | "missing"
  | "open"
  | "answered"
  | "dismissed"
  | "other";

function secureNowQuestionDispositionStatusCanonical(
  status: string | null | undefined,
): SecureNowQuestionDispositionStatusCanonical {
  const trimmed = secureNowQuestionDispositionStatusTrimmed(status);
  if (trimmed === null) {
    return "missing";
  }

  const lower = trimmed.toLowerCase();
  if (lower === "open") {
    return "open";
  }

  if (lower === "answered") {
    return "answered";
  }

  if (lower === "ignored" || lower === "dismissed") {
    return "dismissed";
  }

  return "other";
}

function secureNowQuestionDispositionStatusAllowsOutcomeFieldInference(
  status: string | null | undefined,
): boolean {
  const canonical = secureNowQuestionDispositionStatusCanonical(status);
  return canonical === "missing" || canonical === "open" || canonical === "other";
}

function secureNowQuestionDispositionHasInferredClosedFields(
  question: SecureNowQuestionDispositionChromeFields,
): boolean {
  if (!secureNowQuestionDispositionStatusAllowsOutcomeFieldInference(question.status)) {
    return false;
  }

  return secureNowQuestionDispositionFieldContributesToInference(question.answerCode)
    || secureNowQuestionDispositionFieldContributesToInference(question.answerText)
    || secureNowQuestionDispositionFieldContributesToInference(question.reason);
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
  return secureNowQuestionDispositionIsOpen(question.status)
    && !secureNowQuestionDispositionIsAnswered(question.status)
    && !secureNowQuestionDispositionIsDismissed(question.status)
    && !secureNowQuestionShowsExpired(question.expirationUtc, question.isExpired)
    && !secureNowQuestionDispositionShowsStoredAnswerMetadata(question);
}

export function secureNowQuestionCountsAsReviewableQueueRow(
  question: SecureNowQuestionOpenQueueRowFields,
): boolean {
  return secureNowQuestionCountsAsOpenQueueRow(question)
    || secureNowQuestionCountsAsAnsweredFilterRow(question)
    || secureNowQuestionCountsAsDismissedFilterRow(question)
    || secureNowQuestionCountsAsMissingStatusFilterRow(question);
}

export type SecureNowQuestionQueueReviewFilter =
  | "Open"
  | "Answered"
  | "Dismissed"
  | "Status not stored";

export function secureNowQuestionQueueInitialReviewFilter(
  questions: readonly SecureNowQuestionOpenQueueRowFields[],
): SecureNowQuestionQueueReviewFilter {
  if (questions.some((question) => secureNowQuestionCountsAsOpenQueueRow(question))) {
    return "Open";
  }

  if (questions.some((question) => secureNowQuestionCountsAsAnsweredFilterRow(question))) {
    return "Answered";
  }

  if (questions.some((question) => secureNowQuestionCountsAsMissingStatusFilterRow(question))) {
    return "Status not stored";
  }

  return "Dismissed";
}

export function secureNowQuestionCountsAsAnsweredFilterRow(
  question: SecureNowQuestionDispositionChromeFields,
): boolean {
  if (secureNowQuestionDispositionIsDismissed(question.status)) {
    return false;
  }

  if (secureNowQuestionDispositionIsAnswered(question.status)) {
    return true;
  }

  return secureNowQuestionDispositionFieldContributesToInference(question.answerCode)
    || secureNowQuestionDispositionFieldContributesToInference(question.answerText);
}

export function secureNowQuestionDispositionReviewerStatusLabel(
  question: SecureNowQuestionDispositionChromeFields,
): string {
  const trimmed = secureNowQuestionDispositionStatusTrimmed(question.status);
  const canonical = secureNowQuestionDispositionStatusCanonical(question.status);

  if (canonical === "missing") {
    if (secureNowQuestionCountsAsAnsweredFilterRow(question)) {
      return "Answered";
    }

    if (secureNowQuestionCountsAsDismissedFilterRow(question)) {
      return "Dismissed";
    }

    return "Question status was not stored";
  }

  if (canonical === "answered") {
    return "Answered";
  }

  if (canonical === "dismissed") {
    return "Dismissed";
  }

  if (canonical === "open" || canonical === "other") {
    if (secureNowQuestionCountsAsAnsweredFilterRow(question)) {
      return "Answered";
    }

    if (secureNowQuestionCountsAsDismissedFilterRow(question)) {
      return "Dismissed";
    }
  }

  return `Question status "${trimmed}" has no reviewer label.`;
}

export function secureNowQuestionCountsAsDismissedFilterRow(
  question: SecureNowQuestionDispositionChromeFields,
): boolean {
  if (secureNowQuestionDispositionIsDismissed(question.status)) {
    return true;
  }

  if (secureNowQuestionDispositionIsAnswered(question.status)) {
    return false;
  }

  const hasAnswerMetadata = secureNowQuestionDispositionFieldContributesToInference(question.answerCode)
    || secureNowQuestionDispositionFieldContributesToInference(question.answerText);

  return secureNowQuestionDispositionFieldContributesToInference(question.reason) && !hasAnswerMetadata;
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

export function secureNowQuestionCountsAsMissingStatusFilterRow(
  question: SecureNowQuestionDispositionChromeFields,
): boolean {
  if (secureNowQuestionDispositionStatusCanonical(question.status) !== "missing") {
    return false;
  }

  return !secureNowQuestionCountsAsAnsweredFilterRow(question)
    && !secureNowQuestionCountsAsDismissedFilterRow(question);
}

export function secureNowQuestionDispositionIsOpen(
  status: string | null | undefined,
): boolean {
  const canonical = secureNowQuestionDispositionStatusCanonical(status);
  if (canonical === "missing") {
    return false;
  }

  return canonical === "open";
}

export function secureNowQuestionDispositionIsAnswered(
  status: string | null | undefined,
): boolean {
  return secureNowQuestionDispositionStatusCanonical(status) === "answered";
}

export function secureNowQuestionDispositionIsDismissed(
  status: string | null | undefined,
): boolean {
  return secureNowQuestionDispositionStatusCanonical(status) === "dismissed";
}

export function secureNowQuestionDispositionIsClosed(
  status: string | null | undefined,
): boolean {
  const canonical = secureNowQuestionDispositionStatusCanonical(status);
  return canonical === "answered" || canonical === "dismissed";
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

export function secureNowQuestionReviewerReasonTextLine(reasonText: string | null | undefined): string {
  if (reasonText === null || reasonText === undefined) {
    return "Reason was not stored.";
  }

  const trimmed = reasonText.trim();
  return trimmed.length > 0 ? trimmed : "Reason was stored empty.";
}

export function secureNowQuestionReviewerSourceLine(sourceLine: string | null | undefined): string {
  if (sourceLine === null || sourceLine === undefined) {
    return "Source line was not stored.";
  }

  const trimmed = sourceLine.trim();
  return trimmed.length > 0 ? trimmed : "Source line was stored empty.";
}
