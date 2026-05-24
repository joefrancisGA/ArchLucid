/**
 * Subset of RFC 9457 Problem Details (obsoletes RFC 7807) plus ArchLucid API extensions (`errorCode`, `supportHint`).
 * ASP.NET Core typically serializes `ProblemDetails.Extensions` as extra root JSON properties (camelCase).
 */
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
  /** Governance pre-commit block narrative when commit is rejected (HTTP 409). */
  blockExplanation?: string;
};

function readTrimmedString(obj: Record<string, unknown>, key: string): string | undefined {
  const value = obj[key];

  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : undefined;
}

function readExtensions(obj: Record<string, unknown>): {
  errorCode?: string;
  supportHint?: string;
  correlationId?: string;
  blockExplanation?: string;
  failureKind?: string;
  errors?: readonly string[];
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
  };
}

function readStringArray(value: unknown): readonly string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const strings = value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

  return strings.length > 0 ? strings : undefined;
}

function readOptionalNumber(obj: Record<string, unknown>, key: string): number | undefined {
  const value = obj[key];

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  return undefined;
}

/**
 * Parses a response body as Problem Details when JSON shape matches; otherwise returns null.
 */
export function tryParseApiProblemDetails(text: string, contentType: string | null): ApiProblemDetails | null {
  const trimmed = text.trim();

  if (trimmed.length === 0) {
    return null;
  }

  const ct = contentType ?? "";

  const looksJson =
    ct.includes("application/json") ||
    ct.includes("application/problem+json") ||
    (ct.length === 0 && (trimmed.startsWith("{") || trimmed.startsWith("[")));

  if (!looksJson) {
    return null;
  }

  let body: unknown;

  try {
    body = JSON.parse(trimmed) as unknown;
  } catch {
    return null;
  }

  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return null;
  }

  const record = body as Record<string, unknown>;
  const fromExt = readExtensions(record);

  const title = readTrimmedString(record, "title");
  const detail = readTrimmedString(record, "detail");
  const type = readTrimmedString(record, "type");
  const instance = readTrimmedString(record, "instance");
  const errorCode = readTrimmedString(record, "errorCode") ?? fromExt.errorCode;
  const supportHint = readTrimmedString(record, "supportHint") ?? fromExt.supportHint;
  const correlationId =
    readTrimmedString(record, "correlationId") ?? fromExt.correlationId;
  const blockExplanation =
    readTrimmedString(record, "blockExplanation") ?? fromExt.blockExplanation;
  const failureKind = readTrimmedString(record, "failureKind") ?? fromExt.failureKind;
  const errors = readStringArray(record.errors) ?? fromExt.errors;
  const status = readOptionalNumber(record, "status");

  if (!title && !detail && !type && !errorCode) {
    return null;
  }

  const problem: ApiProblemDetails = {};

  if (type) {
    problem.type = type;
  }

  if (title) {
    problem.title = title;
  }

  if (detail) {
    problem.detail = detail;
  }

  if (status !== undefined) {
    problem.status = status;
  }

  if (instance) {
    problem.instance = instance;
  }

  if (errorCode) {
    problem.errorCode = errorCode;
  }

  if (supportHint) {
    problem.supportHint = supportHint;
  }

  if (correlationId) {
    problem.correlationId = correlationId;
  }

  if (blockExplanation) {
    problem.blockExplanation = blockExplanation;
  }

  if (failureKind) {
    problem.failureKind = failureKind;
  }

  if (errors) {
    problem.errors = errors;
  }

  return problem;
}
