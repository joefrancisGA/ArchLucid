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

/** Reads gate classification from inspect API fields, then typedPayload when absent (DX-12 native create gate). */
export function resolveFindingInspectExportClassification(
  payload: FindingInspectPayload,
): FindingInspectExportClassification {
  const apiClassification = payload.classification;

  if (apiClassification === "ChecklistCoverage") {
    return FINDING_CLASSIFICATION_CHECKLIST_COVERAGE;
  }

  if (apiClassification === "DecisionGradeFinding") {
    return FINDING_CLASSIFICATION_DECISION_GRADE;
  }

  const typedPayload = payload.typedPayload;

  if (typedPayload === null || typedPayload === undefined || typeof typedPayload !== "object") {
    return null;
  }

  return readClassificationFromRecord(typedPayload as Record<string, unknown>);
}

export function resolveFindingInspectExportTreatment(payload: FindingInspectPayload): number | null {
  const apiTreatment = payload.treatment;

  if (typeof apiTreatment === "number" && Number.isFinite(apiTreatment)) {
    return apiTreatment;
  }

  const typedPayload = payload.typedPayload;

  if (typedPayload === null || typedPayload === undefined || typeof typedPayload !== "object") {
    return null;
  }

  const treatment = (typedPayload as Record<string, unknown>).treatment;

  if (typeof treatment !== "number" || !Number.isFinite(treatment)) {
    return null;
  }

  return treatment;
}

export function isChecklistCoverageInspectPayload(payload: FindingInspectPayload): boolean {
  return resolveFindingInspectExportClassification(payload) === FINDING_CLASSIFICATION_CHECKLIST_COVERAGE;
}
