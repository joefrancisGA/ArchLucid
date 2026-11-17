/** Shared normalization for values crossing the operator API boundary. */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function recordsOnly<T>(value: unknown): T[] {
  return Array.isArray(value) ? value.filter(isRecord) as T[] : [];
}

export function trimOptionalText(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim() ?? "";

  return trimmed.length > 0 ? trimmed : undefined;
}

export function trimRequiredPathSegment(value: string, fieldName: string): string {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    throw new Error(`${fieldName} is required.`);
  }

  return trimmed;
}

export function encodeRequiredPathSegment(value: string, fieldName: string): string {
  return encodeURIComponent(trimRequiredPathSegment(value, fieldName));
}

/** Trims a required request-body value and rejects a blank one, under the same rule as a path segment. */
export function trimRequiredText(value: string, fieldName: string): string {
  return trimRequiredPathSegment(value, fieldName);
}

/**
 * Trims text while keeping null and undefined as they are.
 * A blank string stays an empty string, because some PATCH bodies use it to clear a field.
 */
export function trimNullableText<T extends string | null | undefined>(value: T): T {
  return (typeof value === "string" ? value.trim() : value) as T;
}

/**
 * Trims the named text fields of a request body.
 * Absent keys stay absent, and null or non-text values pass through unchanged.
 */
export function trimTextFields<T extends object>(body: T, fieldNames: readonly (keyof T & string)[]): T {
  const names: readonly string[] = fieldNames;

  return Object.fromEntries(
    Object.entries(body).map(([key, value]) => [
      key,
      typeof value === "string" && names.includes(key) ? value.trim() : value,
    ]),
  ) as T;
}

export function trimStringList(values: readonly string[] | undefined): string[] {
  return (values ?? [])
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

/** Keeps the text entries of an untyped list, trimmed, and drops blanks and non-text values. */
export function trimmedStringsOnly(value: unknown): string[] {
  return Array.isArray(value)
    ? trimStringList(value.filter((entry): entry is string => typeof entry === "string"))
    : [];
}

/** Trims the keys and values of a text map and drops any pair where either side is blank. */
export function trimStringRecord(values: Readonly<Record<string, string>>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(values)
      .map(([key, value]): [string, string] => [key.trim(), typeof value === "string" ? value.trim() : ""])
      .filter(([key, value]) => key.length > 0 && value.length > 0),
  );
}

/** Returns the value when it is a JSON object, and throws a named error for anything else. */
export function requireRecord<T>(value: unknown, responseName: string): T {
  if (!isRecord(value)) {
    throw new Error(`${responseName} response was not recognized.`);
  }

  return value as T;
}

/** Parses response text as a JSON object. Returns null for invalid JSON or a non-object body. */
export function parseJsonRecord<T = Record<string, unknown>>(text: string): T | null {
  try {
    const parsed: unknown = JSON.parse(text);

    return isRecord(parsed) ? (parsed as T) : null;
  } catch {
    return null;
  }
}

export function positiveIntegerOrDefault(value: number | undefined, fallback: number): number {
  if (value === undefined || !Number.isFinite(value) || value < 1) {
    return fallback;
  }

  return Math.floor(value);
}

export function finiteNumberOrUndefined(value: number | undefined): number | undefined {
  return value !== undefined && Number.isFinite(value) ? value : undefined;
}

export function nonNegativeFiniteOrNull(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : Number(value);

  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

export function nonNegativeFiniteOrDefault(value: unknown, fallback = 0): number {
  return nonNegativeFiniteOrNull(value) ?? fallback;
}

export function normalizeCountFields(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(normalizeCountFields);
  }

  if (!isRecord(value)) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [
      key,
      key.toLowerCase().includes("count") ? nonNegativeFiniteOrDefault(entry) : normalizeCountFields(entry),
    ]),
  );
}
