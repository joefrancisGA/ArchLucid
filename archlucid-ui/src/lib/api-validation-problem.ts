import type { ApiProblemDetails } from "@/lib/api-problem";

/** One API model-state / FluentValidation field and its messages. */
export type ApiValidationFieldError = {
  readonly field: string;
  readonly messages: readonly string[];
};

const GENERIC_VALIDATION_TITLE = "one or more validation errors occurred";

/**
 * Removes server stack traces and exception dumps from text shown to operators.
 * Technical API validation messages are kept; .NET `at …` frames are not.
 */
export function sanitizeOperatorFacingText(text: string): string {
  const trimmed = text.trim();

  if (trimmed.length === 0) {
    return trimmed;
  }

  const lines = trimmed.split(/\r?\n/u);
  const kept: string[] = [];
  let skippingStack = false;

  for (const line of lines) {
    const stackLine = /^\s*at\s+/u.test(line);
    const stackDelimiter = /^\s*---\s/u.test(line);
    const stackHeader = /stack trace:/iu.test(line);

    if (stackHeader || stackLine || stackDelimiter) {
      skippingStack = true;

      continue;
    }

    if (skippingStack && line.trim().length === 0) {
      continue;
    }

    skippingStack = false;
    kept.push(line);
  }

  let result = kept.join("\n").trim();

  const typedException = /^([A-Za-z0-9_.]+Exception):\s*([\s\S]+)/u.exec(result);

  if (typedException !== null) {
    const messageOnly = typedException[2].split("\n")[0]?.trim() ?? "";

    if (messageOnly.length > 0) {
      result = messageOnly;
    }
  }

  if (result.length > 2000) {
    return `${result.slice(0, 1997)}…`;
  }

  return result;
}

/** Parses ASP.NET `ValidationProblemDetails.errors` (`field → string[]`). */
export function parseAspNetValidationFieldErrors(value: unknown): readonly ApiValidationFieldError[] {
  if (value === null || value === undefined || typeof value !== "object" || Array.isArray(value)) {
    return [];
  }

  const fields: ApiValidationFieldError[] = [];

  for (const [rawField, rawMessages] of Object.entries(value as Record<string, unknown>)) {
    const messages = readValidationMessages(rawMessages).map(sanitizeOperatorFacingText).filter(Boolean);

    if (messages.length === 0) {
      continue;
    }

    fields.push({
      field: rawField,
      messages,
    });
  }

  return fields;
}

function readValidationMessages(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .filter((entry): entry is string => typeof entry === "string")
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    return trimmed.length > 0 ? [trimmed] : [];
  }

  return [];
}

/** Operator-facing field label (camelCase, strips `request.` prefix). */
export function formatValidationFieldKey(rawField: string): string {
  const field = rawField.trim();

  if (field.length === 0 || field === "$" || field.toLowerCase() === "request") {
    return "request body";
  }

  const withoutPrefix = field.replace(/^request\./iu, "");

  if (withoutPrefix.length === 0) {
    return "request body";
  }

  return withoutPrefix.charAt(0).toLowerCase() + withoutPrefix.slice(1);
}

export function flattenValidationFieldErrors(
  fieldErrors: readonly ApiValidationFieldError[],
): readonly string[] {
  const lines: string[] = [];

  for (const entry of fieldErrors) {
    const label = formatValidationFieldKey(entry.field);

    for (const message of entry.messages) {
      lines.push(`${label}: ${message}`);
    }
  }

  return lines;
}

export function isGenericValidationTitle(title: string | undefined): boolean {
  const normalized = title?.trim().toLowerCase() ?? "";

  return normalized.length > 0 && normalized.includes(GENERIC_VALIDATION_TITLE);
}

/** True for HTTP 400 Problem Details from model binding / FluentValidation. */
export function isHttpRequestValidationFailure(
  httpStatus: number | null | undefined,
  problem: ApiProblemDetails | null | undefined,
): boolean {
  if (httpStatus !== 400) {
    return false;
  }

  const fieldCount = problem?.fieldErrors?.length ?? 0;
  const flatCount = problem?.errors?.length ?? 0;
  const code = problem?.errorCode?.trim();

  if (fieldCount > 0 || flatCount > 0) {
    return true;
  }

  if (code === "VALIDATION_FAILED") {
    return true;
  }

  return isGenericValidationTitle(problem?.title);
}

export type ValidationProblemDisplayCopy = {
  readonly heading: string;
  readonly endpointLine: string | null;
  readonly fieldErrors: readonly ApiValidationFieldError[];
  readonly hint: string;
};

/**
 * Builds unmistakable validation copy for IT operators — field-scoped messages, HTTP 400, optional route.
 */
export function buildValidationProblemDisplayCopy(
  problem: ApiProblemDetails | null | undefined,
  options?: {
    readonly httpStatus?: number | null;
    readonly fallbackEndpoint?: string | null;
  },
): ValidationProblemDisplayCopy {
  const httpStatus = options?.httpStatus ?? problem?.status ?? 400;
  const fieldErrors =
    problem?.fieldErrors && problem.fieldErrors.length > 0
      ? problem.fieldErrors
      : inferFieldErrorsFromFlatMessages(problem?.errors);

  const endpoint =
    problem?.instance?.trim() ||
    options?.fallbackEndpoint?.trim() ||
    null;

  const endpointLine =
    endpoint !== null && endpoint.length > 0
      ? `POST ${endpoint} returned HTTP ${httpStatus} — correct the fields below and retry.`
      : `The API rejected the request with HTTP ${httpStatus} — correct the fields below and retry.`;

  return {
    heading: `Request validation failed (HTTP ${httpStatus})`,
    endpointLine,
    fieldErrors,
    hint: "Fix each field listed below, then submit again. If the error persists, copy the correlation ID and check API logs — do not paste server stack traces into tickets.",
  };
}

function inferFieldErrorsFromFlatMessages(
  messages: readonly string[] | undefined,
): readonly ApiValidationFieldError[] {
  if (messages === undefined || messages.length === 0) {
    return [];
  }

  return [
    {
      field: "",
      messages: messages.map(sanitizeOperatorFacingText).filter((message) => message.length > 0),
    },
  ];
}

/** Single-line summary for logs / legacy `Error.message`. */
export function formatValidationFailureSummary(
  problem: ApiProblemDetails | null | undefined,
  httpStatus: number | null | undefined,
): string {
  const copy = buildValidationProblemDisplayCopy(problem, { httpStatus });
  const fieldLines = flattenValidationFieldErrors(copy.fieldErrors);

  if (fieldLines.length === 0) {
    const detail = sanitizeOperatorFacingText(problem?.detail?.trim() ?? "");

    if (detail.length > 0) {
      return `${copy.heading}: ${detail}`;
    }

    const title = sanitizeOperatorFacingText(problem?.title?.trim() ?? "");

    if (title.length > 0 && !isGenericValidationTitle(title)) {
      return `${copy.heading}: ${title}`;
    }

    return copy.heading;
  }

  return `${copy.heading}: ${fieldLines.join("; ")}`;
}
