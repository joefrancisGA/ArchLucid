export const REVIEW_PRESENTER_RECORDED_ASSERTED_LABEL = "Recorded as asserted." as const;

export const REVIEW_PRESENTER_ASSERTED_CAPTURE_HEADING = "Room answers on record" as const;

export const reviewPresenterAssertedCaptureLine = (
  questionKey: string,
  answer: string,
  responderLabel: string,
): string => `${responderLabel} answered ${questionKey}: ${answer}`;
