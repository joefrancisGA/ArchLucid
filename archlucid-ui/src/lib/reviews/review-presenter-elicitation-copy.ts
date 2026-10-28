export const REVIEW_PRESENTER_RECORDED_ASSERTED_LABEL = "Recorded as asserted." as const;

export const REVIEW_PRESENTER_ASSERTED_CAPTURE_HEADING = "Room answers on record" as const;

function elicitationPart(value: string | null | undefined, notStoredLabel: string, storedEmptyLabel: string): string {
  if (value === null || value === undefined) {
    return notStoredLabel;
  }

  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return storedEmptyLabel;
  }

  return trimmed;
}

export const reviewPresenterAssertedCaptureLine = (
  questionKey: string | null | undefined,
  answer: string | null | undefined,
  responderLabel: string | null | undefined,
): string => {
  const responder = elicitationPart(responderLabel, "Responder was not stored.", "Responder was stored empty.");
  const key = elicitationPart(questionKey, "Question key was not stored.", "Question key was stored empty.");
  const response = elicitationPart(answer, "Answer was not stored.", "Answer was stored empty.");

  return `${responder} answered ${key}: ${response}`;
};
