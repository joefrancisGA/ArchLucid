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
