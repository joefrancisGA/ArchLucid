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

export function trimStringList(values: readonly string[] | undefined): string[] {
  return (values ?? [])
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
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
