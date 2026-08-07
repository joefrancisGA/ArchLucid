/** Wire `FindingTrustLabel` + reason for sponsor / ITSM export surfaces (TB-2044). */
export type FindingTrustExportFields = {
  readonly trustLabel?: string | null;
  readonly trustLabelReason?: string | null;
};

/** Single-line trust label for pasted export bodies; null when the API sent no label. */
export function formatFindingTrustExportLine(fields: FindingTrustExportFields): string | null {
  const label = fields.trustLabel?.trim();

  if (label === undefined || label.length === 0) {
    return null;
  }

  const reason = fields.trustLabelReason?.trim();

  if (reason !== undefined && reason.length > 0) {
    return `${label} — ${reason}`;
  }

  return label;
}

/** Optional JSON fields — omitted when no authoritative label is present. */
export function findingTrustExportJsonFields(
  fields: FindingTrustExportFields,
): { trustLabel: string; trustLabelReason?: string } | Record<string, never> {
  const label = fields.trustLabel?.trim();

  if (label === undefined || label.length === 0) {
    return {};
  }

  const reason = fields.trustLabelReason?.trim();

  if (reason !== undefined && reason.length > 0) {
    return { trustLabel: label, trustLabelReason: reason };
  }

  return { trustLabel: label };
}
