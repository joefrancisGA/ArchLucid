import { orderedStageIndex } from "@/lib/progress/ordered-stage-index";

/**
 * Stages the intake page can actually observe while it turns attached evidence into
 * suggested clarification answers. Every id maps to a real step in
 * {@link import("@/lib/evidence-readable-text").buildArchitectureIntakeInferenceCorpus} or the
 * inference pass that follows it — none of them are simulated filler.
 */
export type EvidenceExtractionStageId =
  | "reading-evidence"
  | "extracting-document-text"
  | "identifying-architecture-content"
  | "drafting-clarification-answers";

export type EvidenceExtractionStageDefinition = {
  readonly id: EvidenceExtractionStageId;
  readonly label: string;
};

export const EVIDENCE_EXTRACTION_STAGE_READING_EVIDENCE: EvidenceExtractionStageDefinition = {
  id: "reading-evidence",
  label: "Reading attached evidence",
};

export const EVIDENCE_EXTRACTION_STAGE_EXTRACTING_DOCUMENT_TEXT: EvidenceExtractionStageDefinition = {
  id: "extracting-document-text",
  label: "Extracting document text",
};

export const EVIDENCE_EXTRACTION_STAGE_IDENTIFYING_ARCHITECTURE_CONTENT: EvidenceExtractionStageDefinition = {
  id: "identifying-architecture-content",
  label: "Identifying architecture content",
};

export const EVIDENCE_EXTRACTION_STAGE_DRAFTING_CLARIFICATION_ANSWERS: EvidenceExtractionStageDefinition = {
  id: "drafting-clarification-answers",
  label: "Drafting clarification answers",
};

export type EvidenceExtractionStagePlan = {
  /** PDF and DOCX attachments need the server-side text extraction round trip. */
  readonly hasBinaryDocuments: boolean;
  /** The advisory rephrase pass only runs when LLM execution is available. */
  readonly canDraftClarificationAnswers: boolean;
};

/** Only lists stages this particular run will really perform — an unreachable step reads as a stall. */
export function resolveEvidenceExtractionStages(
  plan: EvidenceExtractionStagePlan,
): readonly EvidenceExtractionStageDefinition[] {
  const stages: EvidenceExtractionStageDefinition[] = [EVIDENCE_EXTRACTION_STAGE_READING_EVIDENCE];

  if (plan.hasBinaryDocuments) {
    stages.push(EVIDENCE_EXTRACTION_STAGE_EXTRACTING_DOCUMENT_TEXT);
  }

  stages.push(EVIDENCE_EXTRACTION_STAGE_IDENTIFYING_ARCHITECTURE_CONTENT);

  if (plan.canDraftClarificationAnswers) {
    stages.push(EVIDENCE_EXTRACTION_STAGE_DRAFTING_CLARIFICATION_ANSWERS);
  }

  return stages;
}

export function evidenceExtractionStageIndex(
  stages: readonly EvidenceExtractionStageDefinition[],
  activeStageId: EvidenceExtractionStageId | null,
): number {
  return orderedStageIndex(stages, activeStageId);
}

export function firstEvidenceExtractionStageId(
  stages: readonly EvidenceExtractionStageDefinition[],
): EvidenceExtractionStageId | null {
  return stages[0]?.id ?? null;
}
