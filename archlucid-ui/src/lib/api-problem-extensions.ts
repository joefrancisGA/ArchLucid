/**
 * Subset of RFC 9457 Problem Details (obsoletes RFC 7807) plus ArchLucid API extensions (`errorCode`, `supportHint`).
 * ASP.NET Core typically serializes `ProblemDetails.Extensions` as extra root JSON properties (camelCase).
 */

/** One API model-state / FluentValidation field and its messages. */
export type ApiValidationFieldError = {
  readonly field: string;
  readonly messages: readonly string[];
};

export type ApiProblemDetails = {
  type?: string;
  title?: string;
  detail?: string;
  status?: number;
  instance?: string;
  errorCode?: string;
  supportHint?: string;
  /** Echoes API **X-Correlation-ID** / proxy **correlationId** when present in JSON (RFC 9457 extension promoted to root). */
  correlationId?: string;
  /** Azure extractor upload failures include a coarse validation bucket. */
  failureKind?: string;
  /** Structured validation messages when returned by the API Problem Details extensions. */
  errors?: readonly string[];
  /** ASP.NET model-state / FluentValidation field → messages (preserves field names). */
  fieldErrors?: readonly ApiValidationFieldError[];
  /** Governance pre-commit block narrative when commit is rejected (HTTP 409). */
  blockExplanation?: string;
  /** Finding identifiers that triggered the pre-commit approval gate (Problem Details extension). */
  blockingFindingIds?: readonly string[];
  /** Policy pack that enforced the pre-commit gate when applicable. */
  policyPackId?: string;
  /** Minimum severity ordinal (`FindingSeverity`) that triggered the block when applicable. */
  minimumBlockingSeverity?: number;
};

export function readTrimmedString(obj: Record<string, unknown>, key: string): string | undefined {
  const value = obj[key];

  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : undefined;
}

export function readStringArray(value: unknown): readonly string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const strings = value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

  return strings.length > 0 ? strings : undefined;
}

export function readOptionalNumber(obj: Record<string, unknown>, key: string): number | undefined {
  const value = obj[key];

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  return undefined;
}

export function readExtensions(obj: Record<string, unknown>): {
  errorCode?: string;
  supportHint?: string;
  correlationId?: string;
  blockExplanation?: string;
  failureKind?: string;
  errors?: readonly string[];
  blockingFindingIds?: readonly string[];
  policyPackId?: string;
  minimumBlockingSeverity?: number;
} {
  const extensions = obj.extensions;

  if (extensions === null || extensions === undefined || typeof extensions !== "object") {
    return {};
  }

  if (Array.isArray(extensions)) {
    return {};
  }

  const ext = extensions as Record<string, unknown>;

  return {
    errorCode: readTrimmedString(ext, "errorCode"),
    supportHint: readTrimmedString(ext, "supportHint"),
    correlationId: readTrimmedString(ext, "correlationId"),
    blockExplanation: readTrimmedString(ext, "blockExplanation"),
    failureKind: readTrimmedString(ext, "failureKind"),
    errors: readStringArray(ext.errors),
    blockingFindingIds: readStringArray(ext.blockingFindingIds),
    policyPackId: readTrimmedString(ext, "policyPackId"),
    minimumBlockingSeverity: readOptionalNumber(ext, "minimumBlockingSeverity"),
  };
}
