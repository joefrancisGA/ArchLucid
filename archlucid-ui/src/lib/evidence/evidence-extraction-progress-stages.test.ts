import { describe, expect, it } from "vitest";

import {
  resolveEvidenceExtractionStages,
} from "@/lib/evidence/evidence-extraction-progress-stages";

describe("resolveEvidenceExtractionStages", () => {
  it("omits binary extraction when there are no PDF or DOCX attachments", () => {
    const stages = resolveEvidenceExtractionStages({
      hasBinaryDocuments: false,
      canDraftClarificationAnswers: true,
    });

    expect(stages.map((stage) => stage.id)).toEqual([
      "reading-evidence",
      "identifying-architecture-content",
      "drafting-clarification-answers",
    ]);
  });

  it("includes binary extraction and omits drafting when rephrase is blocked", () => {
    const stages = resolveEvidenceExtractionStages({
      hasBinaryDocuments: true,
      canDraftClarificationAnswers: false,
    });

    expect(stages.map((stage) => stage.id)).toEqual([
      "reading-evidence",
      "extracting-document-text",
      "identifying-architecture-content",
    ]);
  });
});
