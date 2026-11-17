import { describe, expect, it } from "vitest";

import {
  EVIDENCE_EXTRACTION_DOCUMENT_NAMES_NOT_STORED,
  EVIDENCE_EXTRACTION_DOCUMENT_NAMES_STORED_EMPTY,
  EVIDENCE_EXTRACTION_DURATION_EXPECTATION,
  EVIDENCE_EXTRACTION_SUGGESTIONS_NOT_RETURNED,
  EVIDENCE_EXTRACTION_NO_TEXT_SUMMARY,
  formatEvidenceExtractionCompletionSummary,
  formatEvidenceExtractionDocumentLine,
} from "@/lib/evidence/evidence-extraction-progress-copy";

describe("EVIDENCE_EXTRACTION_DURATION_EXPECTATION", () => {
  it("does not promise a fixed processing duration", () => {
    expect(EVIDENCE_EXTRACTION_DURATION_EXPECTATION).not.toContain("10");
    expect(EVIDENCE_EXTRACTION_DURATION_EXPECTATION).toContain("Duration is not stored");
  });
});

describe("formatEvidenceExtractionDocumentLine", () => {
  it("labels omitted and empty document name lists", () => {
    expect(formatEvidenceExtractionDocumentLine(null)).toBe(EVIDENCE_EXTRACTION_DOCUMENT_NAMES_NOT_STORED);
    expect(formatEvidenceExtractionDocumentLine([])).toBe(EVIDENCE_EXTRACTION_DOCUMENT_NAMES_STORED_EMPTY);
    expect(formatEvidenceExtractionDocumentLine(["  "])).toBe(EVIDENCE_EXTRACTION_DOCUMENT_NAMES_STORED_EMPTY);
    expect(formatEvidenceExtractionDocumentLine(["adr.md", "brief.docx"])).toBe("adr.md, brief.docx");
  });
});

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

  it("labels omitted suggestion counts separately from zero", () => {
    expect(
      formatEvidenceExtractionCompletionSummary({
        extractedCharacterCount: 500,
        suggestedAnswerCount: null,
      }),
    ).toBe(`500 characters extracted · ${EVIDENCE_EXTRACTION_SUGGESTIONS_NOT_RETURNED}`);
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
