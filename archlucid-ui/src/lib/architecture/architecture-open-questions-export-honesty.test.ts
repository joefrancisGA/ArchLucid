import { describe, expect, it } from "vitest";

import {
  demoteOpenQuestionsStructuredSectionProvenance,
  formatOpenQuestionsWorkingDocumentMarkdownSection,
  isOpenQuestionsTransparencyTrailKey,
  OPEN_QUESTIONS_WORKING_DOCUMENT_EXPORT_HEADING,
  OPEN_QUESTIONS_WORKING_DOCUMENT_HONESTY_LABEL,
  sanitizeTransparencyTrailForCareerExport,
} from "@/lib/architecture/architecture-open-questions-export-honesty";
import { finalizeSections, createEmptyDrafts } from "@/lib/architecture/generated-content-section-blocks";

describe("architecture-open-questions-export-honesty (LP-16)", () => {
  it("recognizes open-questions transparency trail keys", () => {
    expect(isOpenQuestionsTransparencyTrailKey("openQuestions")).toBe(true);
    expect(isOpenQuestionsTransparencyTrailKey("open-questions")).toBe(true);
    expect(isOpenQuestionsTransparencyTrailKey("open_questions.followup")).toBe(true);
    expect(isOpenQuestionsTransparencyTrailKey("businessOutcome")).toBe(false);
  });

  it("routes open-questions asserted trail rows to the working-document bucket", () => {
    const sanitized = sanitizeTransparencyTrailForCareerExport({
      asserted: [
        { key: "businessOutcome", value: "Reduce triage time" },
        { key: "openQuestions", value: "Who owns retention policy?" },
      ],
      inferred: [],
      skipped: [],
    });

    expect(sanitized?.asserted).toHaveLength(1);
    expect(sanitized?.asserted[0]?.key).toBe("businessOutcome");
    expect(sanitized?.workingDocumentOpenQuestions).toEqual([
      { key: "openQuestions", value: "Who owns retention policy?" },
    ]);
  });

  it("labels empty-string open-question answers as stored empty", () => {
    const markdown = formatOpenQuestionsWorkingDocumentMarkdownSection([
      { key: "openQuestions", value: "" },
    ]);

    expect(markdown).toContain("Answer was stored empty.");
  });

  it("includes honesty copy when the working-document list is empty", () => {
    const markdown = formatOpenQuestionsWorkingDocumentMarkdownSection([]);

    expect(markdown).toContain(OPEN_QUESTIONS_WORKING_DOCUMENT_EXPORT_HEADING);
    expect(markdown).toContain("No working-document open questions were stored on this trail.");
  });

  it("labels working-document open questions in markdown exports", () => {
    const markdown = formatOpenQuestionsWorkingDocumentMarkdownSection([
      { key: "openQuestions", value: "Who owns retention policy?" },
    ]);

    expect(markdown).toContain(OPEN_QUESTIONS_WORKING_DOCUMENT_EXPORT_HEADING);
    expect(markdown).toContain(OPEN_QUESTIONS_WORKING_DOCUMENT_HONESTY_LABEL);
    expect(markdown).toContain("Who owns retention policy?");
  });

  it("preserves asserted provenance on open-questions sections", () => {
    const section = demoteOpenQuestionsStructuredSectionProvenance({
      key: "open-questions",
      title: "Open questions",
      narrativeMarkdown: "Who approves failover?",
      entities: [{ label: "Retention owner", detail: null, provenance: "asserted" }],
      provenance: "asserted",
    });

    expect(section.provenance).toBe("asserted");
    expect(section.entities?.[0]?.provenance).toBe("asserted");
  });

  it("finalizeSections never promotes open-questions text into asserted arrays", () => {
    const drafts = createEmptyDrafts();
    const openQuestionsDraft = drafts.get("open-questions");

    if (openQuestionsDraft === undefined) {
      throw new Error("open-questions draft missing");
    }

    openQuestionsDraft.narrativeLines.push("Who owns quarterly access reviews?");
    openQuestionsDraft.provenance = "asserted";
    openQuestionsDraft.entities.push({
      label: "Retention owner",
      detail: null,
      provenance: "asserted",
    });

    const sections = finalizeSections(drafts);
    const openQuestions = sections.find((section) => section.key === "open-questions");

    expect(openQuestions?.provenance).toBe("asserted");
    expect(openQuestions?.entities?.every((entity) => entity.provenance === "asserted") ?? false).toBe(true);
  });
});
