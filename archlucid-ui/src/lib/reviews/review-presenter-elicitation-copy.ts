export const REVIEW_PRESENTER_RECORDED_ASSERTED_LABEL = "Recorded as asserted." as const;

export const REVIEW_PRESENTER_ASSERTED_CAPTURE_HEADING = "Room answers on record" as const;

function elicitationPart(value: string, notStoredLabel: string): string {
  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : notStoredLabel;
}

export const reviewPresenterAssertedCaptureLine = (
  questionKey: string,
  answer: string,
  responderLabel: string,
): string => {
  const responder = elicitationPart(responderLabel, "Responder was not stored.");
  const key = elicitationPart(questionKey, "Question key was not stored.");
  const response = elicitationPart(answer, "Answer was not stored.");

  return `${responder} answered ${key}: ${response}`;
};
