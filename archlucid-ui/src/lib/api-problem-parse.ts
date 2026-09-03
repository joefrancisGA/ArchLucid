import {
  readExtensions,
  readOptionalNumber,
  readStringArray,
  readTrimmedString,
  type ApiProblemDetails,
} from "@/lib/api-problem-extensions";
import { flattenValidationFieldErrors, parseAspNetValidationFieldErrors } from "@/lib/api-validation-problem-field-errors";

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
  const blockingFindingIds =
    readStringArray(record.blockingFindingIds) ?? fromExt.blockingFindingIds;
  const policyPackId = readTrimmedString(record, "policyPackId") ?? fromExt.policyPackId;
  const minimumBlockingSeverity =
    readOptionalNumber(record, "minimumBlockingSeverity") ?? fromExt.minimumBlockingSeverity;
  const failureKind = readTrimmedString(record, "failureKind") ?? fromExt.failureKind;
  const fieldErrorsFromBody = parseAspNetValidationFieldErrors(record.errors);
  const flatFieldErrors = flattenValidationFieldErrors(fieldErrorsFromBody);
  const errors = flatFieldErrors.length > 0 ? flatFieldErrors : readStringArray(record.errors) ?? fromExt.errors;
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

  if (blockingFindingIds) {
    problem.blockingFindingIds = blockingFindingIds;
  }

  if (policyPackId) {
    problem.policyPackId = policyPackId;
  }

  if (minimumBlockingSeverity !== undefined) {
    problem.minimumBlockingSeverity = minimumBlockingSeverity;
  }

  if (failureKind) {
    problem.failureKind = failureKind;
  }

  if (errors) {
    problem.errors = errors;
  }

  if (fieldErrorsFromBody.length > 0) {
    problem.fieldErrors = fieldErrorsFromBody;
  }

  return problem;
}

/** Reads RFC 9457 `detail` from a JSON response body when present. */
export function readProblemDetailFromBody(bodyText: string): string | undefined {
  return tryParseApiProblemDetails(bodyText, "application/problem+json")?.detail;
}
