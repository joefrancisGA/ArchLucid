import type { FindingInspectPayload } from "@/types/finding-inspect";

import {
  FINDING_CLASSIFICATION_CHECKLIST_COVERAGE,
  FINDING_CLASSIFICATION_DECISION_GRADE,
} from "@/lib/findings/review-detail-findings-classification-band";

export type FindingInspectExportClassification =
  | typeof FINDING_CLASSIFICATION_DECISION_GRADE
  | typeof FINDING_CLASSIFICATION_CHECKLIST_COVERAGE
  | null;

function readClassificationFromRecord(record: Record<string, unknown>): FindingInspectExportClassification {
  const raw = record.classification;

  if (raw === FINDING_CLASSIFICATION_CHECKLIST_COVERAGE) {
    return FINDING_CLASSIFICATION_CHECKLIST_COVERAGE;
  }

  if (raw === FINDING_CLASSIFICATION_DECISION_GRADE) {
    return FINDING_CLASSIFICATION_DECISION_GRADE;
  }

  return null;
}

/** Reads gate classification from inspect typedPayload when present (DX-12 native create gate). */
export function resolveFindingInspectExportClassification(
  payload: FindingInspectPayload,
): FindingInspectExportClassification {
  const typedPayload = payload.typedPayload;

  if (typedPayload === null || typedPayload === undefined || typeof typedPayload !== "object") {
    return null;
  }

  return readClassificationFromRecord(typedPayload as Record<string, unknown>);
}

export function isChecklistCoverageInspectPayload(payload: FindingInspectPayload): boolean {
  return resolveFindingInspectExportClassification(payload) === FINDING_CLASSIFICATION_CHECKLIST_COVERAGE;
}
