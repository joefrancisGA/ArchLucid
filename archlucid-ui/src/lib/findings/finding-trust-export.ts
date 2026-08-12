import {
  deriveFindingTrustPresentation,
  type FindingTrustPresentationInput,
} from "@/lib/findings/finding-trust-presentation";

/** Wire `FindingTrustLabel` + reason for sponsor / ITSM export surfaces (TB-2044). */
export type FindingTrustExportFields = FindingTrustPresentationInput & {
  readonly runExecutionModeDisplayLabel?: string | null;
  readonly runExecutionModeDetail?: string | null;
};

/** Single-line trust label for pasted export bodies; null only when derivation cannot resolve a label. */
export function formatFindingTrustExportLine(fields: FindingTrustExportFields): string | null {
  return deriveFindingTrustPresentation(fields).export.exportLine;
}

/** Optional execution-mode lines for export bodies (TB-971). */
export function formatFindingExecutionModeExportLines(
  fields: FindingTrustExportFields,
): string[] {
  const lines: string[] = [];
  const modeLabel = fields.runExecutionModeDisplayLabel?.trim();

  if (modeLabel !== undefined && modeLabel.length > 0) {
    lines.push(`Run execution mode: ${modeLabel}`);
  }

  const modeDetail = fields.runExecutionModeDetail?.trim();

  if (modeDetail !== undefined && modeDetail.length > 0) {
    lines.push(modeDetail);
  }

  return lines;
}

/** Optional JSON fields — uses the same canonical derived label as inspect and compare delta. */
export function findingTrustExportJsonFields(
  fields: FindingTrustExportFields,
): { trustLabel: string; trustLabelReason?: string } | Record<string, never> {
  return deriveFindingTrustPresentation(fields).export.jsonFields;
}
