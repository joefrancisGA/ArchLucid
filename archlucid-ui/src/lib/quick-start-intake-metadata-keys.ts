/** Reserved intake answer keys for Quick start metadata (not L0 MUST questions). */
export const QUICK_START_INTAKE_PENDING_EVIDENCE_FILE_NAMES_KEY =
  "intake.pending-evidence-file-names" as const;

export const QUICK_START_INTAKE_LIMITED_EVIDENCE_ANALYSIS_ACK_KEY =
  "intake.limited-evidence-analysis-acknowledged" as const;

export const QUICK_START_INTAKE_OPERATOR_BRIEF_CHARACTER_COUNT_KEY =
  "intake.operator-brief-character-count" as const;

export const QUICK_START_LIMITED_EVIDENCE_ANALYSIS_ACK_VALUE = "confirmed" as const;

export const QUICK_START_PENDING_EVIDENCE_FILE_NAME_DELIMITER = "\n" as const;

export function encodeQuickStartPendingEvidenceFileNames(fileNames: readonly string[]): string {
  return fileNames.join(QUICK_START_PENDING_EVIDENCE_FILE_NAME_DELIMITER);
}

export function decodeQuickStartPendingEvidenceFileNames(encoded: string | undefined): readonly string[] {
  if (encoded === undefined || encoded.trim().length === 0) {
    return [];
  }

  return encoded
    .split(QUICK_START_PENDING_EVIDENCE_FILE_NAME_DELIMITER)
    .map((name) => name.trim())
    .filter((name) => name.length > 0);
}
