import { describe, expect, it } from "vitest";

import {
  EVIDENCE_EXTRACTION_NO_TEXT_SUMMARY,
  formatEvidenceExtractionCompletionSummary,
} from "@/lib/evidence/evidence-extraction-progress-copy";

describe("formatEvidenceExtractionCompletionSummary", () => {
  it("formats plural counts", () => {
    expect(
      formatEvidenceExtractionCompletionSummary({
        extractedCharacterCount: 6228,
        suggestedAnswerCount: 3,
      }),
    ).toBe("6,228 characters extracted · 3 clarification answers suggested");
  });

  it("formats singular clarification answer", () => {
    expect(
      formatEvidenceExtractionCompletionSummary({
        extractedCharacterCount: 120,
        suggestedAnswerCount: 1,
      }),
    ).toBe("120 characters extracted · 1 clarification answer suggested");
  });

  it("formats zero suggested answers", () => {
    expect(
      formatEvidenceExtractionCompletionSummary({
        extractedCharacterCount: 500,
        suggestedAnswerCount: 0,
      }),
    ).toBe("500 characters extracted · no clarification answers suggested");
  });

  it("returns the no-text summary when no characters were extracted", () => {
    expect(
      formatEvidenceExtractionCompletionSummary({
        extractedCharacterCount: 0,
        suggestedAnswerCount: 0,
      }),
    ).toBe(EVIDENCE_EXTRACTION_NO_TEXT_SUMMARY);
  });
});
