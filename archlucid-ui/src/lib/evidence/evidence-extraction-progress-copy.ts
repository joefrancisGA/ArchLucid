export const EVIDENCE_EXTRACTION_PROCESSING_HEADLINE = "Processing attached evidence";

export const EVIDENCE_EXTRACTION_COMPLETE_HEADLINE = "Evidence processed";

/**
 * Elapsed-time framing rather than a percentage: the extraction API reports no measurable
 * progress, and a frozen fake percentage reads worse than an honest indeterminate bar.
 */
export const EVIDENCE_EXTRACTION_DURATION_EXPECTATION = "This usually takes 10–30 seconds.";

export const EVIDENCE_EXTRACTION_CONTINUE_EDITING_NOTE =
  "You can continue editing while ArchLucid processes this evidence.";

export const EVIDENCE_EXTRACTION_PROGRESS_BAR_LABEL = "Evidence processing progress";

export const EVIDENCE_EXTRACTION_STICKY_PROCESSING_LABEL = "Processing evidence…";

export const EVIDENCE_EXTRACTION_STICKY_READY_LABEL = "Evidence ready";

export const EVIDENCE_EXTRACTION_STICKY_JUMP_HINT = "Jump to evidence processing";

export const EVIDENCE_EXTRACTION_AWAITING_CLARIFICATIONS_LABEL =
  "Reading your document before suggesting clarification answers…";

export const EVIDENCE_EXTRACTION_NO_TEXT_SUMMARY = "No readable text was found in the attached evidence.";

export function formatEvidenceExtractionDocumentLine(documentNames: readonly string[]): string {
  return documentNames.join(", ");
}

function formatExtractedCharacterCount(characterCount: number): string {
  return `${characterCount.toLocaleString("en-US")} characters extracted`;
}

function formatSuggestedAnswerCount(suggestedAnswerCount: number): string {
  if (suggestedAnswerCount === 0) {
    return "no clarification answers suggested";
  }

  const noun = suggestedAnswerCount === 1 ? "clarification answer" : "clarification answers";

  return `${suggestedAnswerCount} ${noun} suggested`;
}

/** Ties the completion state back to what the extraction actually produced — never a rounded claim. */
export function formatEvidenceExtractionCompletionSummary(input: {
  readonly extractedCharacterCount: number;
  readonly suggestedAnswerCount: number;
}): string {
  if (input.extractedCharacterCount <= 0) {
    return EVIDENCE_EXTRACTION_NO_TEXT_SUMMARY;
  }

  return [
    formatExtractedCharacterCount(input.extractedCharacterCount),
    formatSuggestedAnswerCount(input.suggestedAnswerCount),
  ].join(" · ");
}
