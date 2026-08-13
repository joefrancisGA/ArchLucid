import type { FindingTraceConfidenceDto } from "@/types/explanation";

/** OpenAPI `FindingClassification.ChecklistCoverage` (TB-384). */
export const FINDING_CLASSIFICATION_CHECKLIST_COVERAGE = "ChecklistCoverage";

export function isChecklistCoverageTraceRow(row: FindingTraceConfidenceDto): boolean {
  return row.classification === FINDING_CLASSIFICATION_CHECKLIST_COVERAGE;
}

/** Trace rows suitable for executive prioritized findings (excludes generic checklist coverage). */
export function decisionGradeExecutiveTraceRows(
  traces: readonly FindingTraceConfidenceDto[],
): FindingTraceConfidenceDto[] {
  return traces.filter(
    (row) => (row.findingId ?? "").trim().length > 0 && !isChecklistCoverageTraceRow(row),
  );
}
