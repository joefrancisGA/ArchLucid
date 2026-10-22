/** ADR 0063 dedupe key format — mirrors `CrossReviewFindingCorrelationResult.DedupeKeyFormat`. */
export const COMPARE_FINDING_CORRELATION_DEDUPE_KEY_FORMAT =
  "{policyRuleId}:{normalizedFindingFingerprint}";

export type CompareFindingCorrelationMetadata = {
  readonly primaryCorrelationMethod: string;
  readonly honestyNote: string;
  readonly policyRuleMatchCount: number;
  readonly fuzzyMatchCount: number;
  readonly unmatchedLeftCount: number;
  readonly unmatchedRightCount: number;
};

export const COMPARE_FINDING_CORRELATION_EXPORT_PARITY_NOTE =
  "Same finding correlation metadata appears in comparison Markdown and HTML exports.";

function readNonNegativeInt(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.trunc(value));
}

function readString(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

/** Coerces API `findingCorrelation` wire JSON into a typed view model; returns null when absent or unusable. */
export function coerceCompareFindingCorrelationMetadata(
  raw: unknown,
): CompareFindingCorrelationMetadata | null {
  if (raw === null || raw === undefined || typeof raw !== "object") {
    return null;
  }

  const record = raw as Record<string, unknown>;
  const primaryCorrelationMethod = readString(record.primaryCorrelationMethod);

  if (primaryCorrelationMethod.length === 0) {
    return null;
  }

  return {
    primaryCorrelationMethod,
    honestyNote: readString(record.honestyNote),
    policyRuleMatchCount: readNonNegativeInt(record.policyRuleMatchCount),
    fuzzyMatchCount: readNonNegativeInt(record.fuzzyMatchCount),
    unmatchedLeftCount: readNonNegativeInt(record.unmatchedLeftCount),
    unmatchedRightCount: readNonNegativeInt(record.unmatchedRightCount),
  };
}

/** Human-readable label for export correlation method codes (parity with backend export headers). */
export function compareFindingCorrelationMethodLabel(method: string): string {
  switch (method) {
    case "PolicyRuleAndFingerprint":
      return "Policy rule + fingerprint";
    case "MessageCategoryFuzzy":
      return "Category + message (possible match)";
    case "Mixed":
      return "Mixed (policy rule + fuzzy)";
    default:
      return method;
  }
}

export type CompareFindingCorrelationCountRow = {
  readonly label: string;
  readonly value: number;
};

/** Count rows in export order for panel and tests. */
export function buildCompareFindingCorrelationCountRows(
  metadata: CompareFindingCorrelationMetadata,
): readonly CompareFindingCorrelationCountRow[] {
  return [
    { label: "Policy-rule matches", value: metadata.policyRuleMatchCount },
    { label: "Fuzzy (possible) matches", value: metadata.fuzzyMatchCount },
    { label: "Unmatched baseline findings", value: metadata.unmatchedLeftCount },
    { label: "Unmatched updated findings", value: metadata.unmatchedRightCount },
  ];
}
